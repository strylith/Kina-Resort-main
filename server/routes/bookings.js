import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/bookings/availability/:packageId - Check availability for date range (no auth required)
router.get('/availability/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    const { checkIn, checkOut, category } = req.query;

    console.log(`[Availability] Request received for package ${packageId} from ${checkIn} to ${checkOut}, category: ${category || 'all'}`);

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Check-in and check-out dates required'
      });
    }
    
    // Determine item type from category
    const itemType = category === 'cottages' ? 'cottage' :
                     category === 'function-halls' ? 'function-hall' : 'room';
    
    console.log(`[Availability] Querying booking_items for item_type='${itemType}'`);
    
    // Query booking_items with joined booking data
    // This is the single source of truth for all booked items
    const { data: bookedItems, error } = await supabase
      .from('booking_items')
      .select(`
        id,
        item_id,
        item_type,
        guest_name,
        adults,
        children,
        bookings!inner (
          id,
          package_id,
          check_in,
          check_out,
          status
        )
      `)
      .eq('item_type', itemType)
      .eq('bookings.package_id', packageId);
    
    // Filter in JavaScript after fetching (Supabase doesn't support complex OR on nested tables)
    // We'll fetch all items and filter client-side
    console.log(`[Availability] Fetched ${bookedItems?.length || 0} items, filtering for date overlap...`);

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Filter items: only pending/confirmed bookings with date overlap
    const filteredItems = bookedItems?.filter(item => {
      const booking = item.bookings;
      if (!booking) return false;
      
      // Check status
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return false;
      }
      
      // Check date overlap: booking overlaps with requested range
      const bookingStart = new Date(booking.check_in);
      const bookingEnd = new Date(booking.check_out);
      const rangeStart = new Date(checkIn);
      const rangeEnd = new Date(checkOut);
      
      // Overlap exists if: booking starts before range ends AND booking ends after range starts
      return bookingStart <= rangeEnd && bookingEnd >= rangeStart;
    }) || [];
    
    console.log(`[Availability] Found ${filteredItems.length} booked items of type '${itemType}' with date overlap`);
    
    // Use filtered items
    bookedItems.splice(0, bookedItems.length, ...filteredItems);

    // Parse check-in and check-out dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);

    // Define available accommodations based on item type
    let allItems;
    
    if (itemType === 'room') {
      allItems = ['Room A1', 'Room A2', 'Room A3', 'Room A4'];
    } else if (itemType === 'cottage') {
      allItems = ['Standard Cottage', 'Garden Cottage', 'Family Cottage'];
    } else {
      allItems = [];
    }

    // Build date-by-date availability map
    const dateAvailability = {};
    const bookedDates = [];

    // Iterate through each day in the range
    let currentDate = new Date(checkInDate);
    while (currentDate < checkOutDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const bookedIds = [];

      // Check each booked item for conflicts on this date
      if (bookedItems && bookedItems.length > 0) {
        bookedItems.forEach(item => {
          const booking = item.bookings;
          if (!booking) return;
          
          const bookingCheckIn = new Date(booking.check_in);
          const bookingCheckOut = new Date(booking.check_out);
          bookingCheckIn.setHours(0, 0, 0, 0);
          bookingCheckOut.setHours(0, 0, 0, 0);

          // Check if current date falls within booking range
          if (currentDate >= bookingCheckIn && currentDate < bookingCheckOut) {
            if (!bookedIds.includes(item.item_id)) {
              bookedIds.push(item.item_id);
            }
            
            bookedDates.push({
              date: dateString,
              bookingStart: booking.check_in,
              bookingEnd: booking.check_out,
              itemId: item.item_id,
              guestName: item.guest_name,
              adults: item.adults,
              children: item.children
            });
          }
        });
      }

      // Determine available items
      const availableItems = allItems.filter(id => !bookedIds.includes(id));
      
      let status;
      if (itemType === 'room') {
        if (availableItems.length === 0) {
          status = 'booked-all';
        } else if (availableItems.length === 4) {
          status = 'available-all';
        } else {
          status = `room-available-${availableItems.length}`;
        }
      } else if (itemType === 'cottage') {
        status = bookedIds.length > 0 ? 'cottage-booked' : 'cottage-available';
      }
      
      // Return appropriate field names based on item type
      if (itemType === 'room') {
        dateAvailability[dateString] = {
          status: status,
          bookedRooms: bookedIds,  // Use bookedRooms for compatibility
          availableRooms: availableItems,  // Use availableRooms for compatibility
          bookedCount: bookedIds.length,
          availableCount: availableItems.length,
          totalCount: allItems.length,
          isBooked: bookedIds.length === allItems.length
        };
      } else if (itemType === 'cottage') {
        dateAvailability[dateString] = {
          status: status,
          bookedCottages: bookedIds,
          availableCottages: availableItems,
          bookedCount: bookedIds.length,
          availableCount: availableItems.length,
          isBooked: bookedIds.length === allItems.length
        };
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate overall availability
    const totalDates = Object.keys(dateAvailability).length;
    const bookedDatesCount = Object.values(dateAvailability).filter(av => av.isBooked).length;

    console.log(`[Availability] Summary: ${bookedDatesCount}/${totalDates} dates fully booked for ${category || 'all'}`);

    // Calculate average availability
    let overallAvailable = totalDates > 0 && bookedDatesCount < totalDates;
    let avgItemAvailability = itemType === 'room' ? 4 : 0;
    
    if (totalDates > 0) {
      const totalItemsAvailable = Object.values(dateAvailability).reduce((sum, av) => sum + (av.availableCount || 0), 0);
      avgItemAvailability = Math.round(totalItemsAvailable / totalDates);
    }

    res.json({
      success: true,
      available: overallAvailable,
      avgRoomAvailability: itemType === 'room' ? avgItemAvailability : null,
      dateAvailability: dateAvailability,
      bookedDates: bookedDates,
      maintenanceDates: [],
      totalDates: totalDates,
      bookedDatesCount: bookedDatesCount
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check availability'
    });
  }
});

// Apply authentication middleware to all routes below
router.use(authenticateToken);

// GET /api/bookings - Get all bookings for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.user.id;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        packages (
          id,
          title,
          category,
          price,
          image_url
        ),
        booking_items (
          id,
          item_type,
          item_id,
          guest_name,
          adults,
          children
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

// POST /api/bookings - Create new booking
router.post('/', async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { 
      packageId, 
      checkIn, 
      checkOut, 
      guests,
      totalCost,
      paymentMode,
      perRoomGuests,
      contactNumber,
      specialRequests,
      selectedCottages
    } = req.body;

    // Validate required fields
    if (!packageId || !checkIn || !checkOut) {
      console.log('[Booking] Missing required fields:', { packageId, checkIn, checkOut });
      return res.status(400).json({
        success: false,
        error: 'Required booking fields are missing: packageId, checkIn, or checkOut'
      });
    }
    
    if (!guests) {
      console.log('[Booking] Guests field missing or empty');
      return res.status(400).json({
        success: false,
        error: 'Required booking field missing: guests (must be an object with adults/children)'
      });
    }
    
    // Validate guests is an object with expected structure
    if (typeof guests !== 'object') {
      console.log('[Booking] Guests is not an object:', typeof guests, guests);
      return res.status(400).json({
        success: false,
        error: 'Guests must be an object with adults and/or children properties'
      });
    }
    
    // Validate guests has at least one person
    const totalGuests = (guests.adults || 0) + (guests.children || 0);
    if (totalGuests === 0) {
      console.log('[Booking] Total guests is 0');
      return res.status(400).json({
        success: false,
        error: 'At least one guest must be specified'
      });
    }
    
    console.log('[Booking] Received valid booking data:', { 
      packageId, 
      checkIn, 
      checkOut, 
      totalGuests,
      perRoomGuests: perRoomGuests?.length || 0
    });

    // Verify package exists
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }

    // Create main booking record
    // Note: per_room_guests and selected_cottages are stored in booking_items table
    const bookingDataToInsert = {
      user_id: userId,
      package_id: packageId,
      check_in: checkIn,
      check_out: checkOut,
      guests: guests, // Total guests summary
      total_cost: totalCost,
      payment_mode: paymentMode,
      contact_number: contactNumber,
      special_requests: specialRequests,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    console.log('[Booking] Inserting booking data:', JSON.stringify(bookingDataToInsert, null, 2));
    
    // 1. Create the main booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingDataToInsert)
      .select()
      .single();

    if (bookingError) {
      console.error('[Booking] Database error:', bookingError);
      throw bookingError;
    }
    
    console.log('[Booking] Successfully created booking:', booking.id);

    // 2. Create booking_items for rooms
    // All individual items (rooms, cottages, function halls) are stored in booking_items
    // This is the single source of truth - no redundant storage in bookings table
    if (perRoomGuests && Array.isArray(perRoomGuests) && perRoomGuests.length > 0) {
      const roomItems = perRoomGuests.map(room => ({
        booking_id: booking.id,
        item_type: 'room',
        item_id: room.roomId, // e.g., "Room A1"
        guest_name: room.guestName,
        adults: room.adults,
        children: room.children
      }));
      
      console.log('[Booking] Creating room items:', JSON.stringify(roomItems, null, 2));
      
      const { error: roomsError } = await supabase
        .from('booking_items')
        .insert(roomItems);
      
      if (roomsError) {
        console.error('[Booking] Error creating room items:', roomsError);
        throw roomsError;
      }
      
      console.log(`[Booking] Created ${roomItems.length} room items`);
    }
    
    // 3. Create booking_items for cottages
    if (selectedCottages && Array.isArray(selectedCottages) && selectedCottages.length > 0) {
      const cottageItems = selectedCottages.map(cottageId => ({
        booking_id: booking.id,
        item_type: 'cottage',
        item_id: cottageId
      }));
      
      console.log('[Booking] Creating cottage items:', JSON.stringify(cottageItems, null, 2));
      
      const { error: cottagesError } = await supabase
        .from('booking_items')
        .insert(cottageItems);
      
      if (cottagesError) {
        console.error('[Booking] Error creating cottage items:', cottagesError);
        throw cottagesError;
      }
      
      console.log(`[Booking] Created ${cottageItems.length} cottage items`);
    }

    // Update user's total bookings
    await supabase.rpc('increment_user_bookings', { user_uuid: userId });

    // Add to reservations calendar
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      await supabase
        .from('reservations_calendar')
        .upsert({
          package_id: packageId,
          date: dateStr,
          reserved_count: 1
        }, {
          onConflict: 'package_id,date'
        });
    }

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        packages (
          id,
          title,
          category,
          price,
          image_url
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Fetch booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

// PATCH /api/bookings/:id - Update booking
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { id } = req.params;
    const { status, checkIn, checkOut, guests } = req.body;

    // Verify booking belongs to user
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Prepare update object
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) updateData.status = status;
    if (checkIn) updateData.check_in = checkIn;
    if (checkOut) updateData.check_out = checkOut;
    if (guests) updateData.guests = guests;

    // Update booking
    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking'
    });
  }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { id } = req.params;

    // Verify booking belongs to user
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Update status to cancelled instead of deleting
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking'
    });
  }
});

export default router;
