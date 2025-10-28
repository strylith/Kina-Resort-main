import express from 'express';
import { mockClient } from '../db/databaseClient.js';

const router = express.Router();

// Health check for mock API
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Mock API is running',
    routes: ['GET /mock/bookings', 'POST /mock/bookings']
  });
});

// GET /mock/bookings - Get all bookings (no auth required)
router.get('/bookings', (req, res) => {
  try {
    console.log('[MockBookings] GET /bookings called');
    const bookings = Array.from(mockClient.tables.bookings.values());
    console.log('[MockBookings] Found', bookings.length, 'bookings');
    
    // Enrich with booking items and package info
    const enrichedBookings = bookings.map(booking => {
      const items = Array.from(mockClient.tables.booking_items.values())
        .filter(item => item.booking_id === booking.id);
      
      const packageData = mockClient.tables.packages.get(String(booking.package_id));
      
      return {
        ...booking,
        booking_items: items || [],
        packages: packageData || null
      };
    });
    
    console.log('[MockBookings] Returning', enrichedBookings.length, 'enriched bookings');
    res.json({ success: true, data: enrichedBookings });
  } catch (error) {
    console.error('[MockBookings] Fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// POST /mock/bookings - Create new booking (no auth required)
router.post('/bookings', async (req, res) => {
  try {
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

    console.log('[MockBookings] Creating booking:', { packageId, checkIn, checkOut });

    // Verify package exists
    const packageData = mockClient.tables.packages.get(String(packageId));
    if (!packageData) {
      return res.status(404).json({
        success: false,
        error: `Package not found (ID: ${packageId})`
      });
    }

    // Generate booking ID
    const bookingId = Date.now().toString();
    const userId = req.body.userId || 'mock-user-1'; // Default user for mock mode

    // Create booking
    const booking = {
      id: bookingId,
      user_id: userId,
      package_id: packageId,
      check_in: checkIn,
      check_out: checkOut,
      guests: guests,
      total_cost: totalCost,
      payment_mode: paymentMode,
      contact_number: contactNumber,
      special_requests: specialRequests || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    mockClient.tables.bookings.set(bookingId, booking);

    // Create booking items for rooms
    if (perRoomGuests && perRoomGuests.length > 0) {
      perRoomGuests.forEach(room => {
        const itemId = `${bookingId}-${room.roomId}`;
        mockClient.tables.booking_items.set(itemId, {
          id: itemId,
          booking_id: bookingId,
          item_type: 'room',
          item_id: room.roomId,
          guest_name: room.guestName,
          adults: room.adults,
          children: room.children
        });
      });
    }

    // Create booking items for cottages
    if (selectedCottages && selectedCottages.length > 0) {
      selectedCottages.forEach((cottageId, index) => {
        const itemId = `${bookingId}-cottage-${index}`;
        mockClient.tables.booking_items.set(itemId, {
          id: itemId,
          booking_id: bookingId,
          item_type: 'cottage',
          item_id: cottageId
        });
      });
    }

    // Get booking items for response
    const bookingItems = Array.from(mockClient.tables.booking_items.values())
      .filter(item => item.booking_id === bookingId);

    const bookingResponse = {
      ...booking,
      booking_items: bookingItems,
      packages: packageData
    };

    console.log('[MockBookings] Booking created:', bookingId);

    res.status(201).json({
      success: true,
      data: bookingResponse
    });
  } catch (error) {
    console.error('[MockBookings] Create error:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// PATCH /mock/bookings/:id - Update existing booking (no auth required)
router.patch('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('[MockBookings] Updating booking:', id, updates);
    
    // Get existing booking
    const existingBooking = mockClient.tables.bookings.get(id);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        error: `Booking not found (ID: ${id})`
      });
    }
    
    // If package is changing, verify it exists
    if (updates.packageId && updates.packageId !== existingBooking.package_id) {
      const packageData = mockClient.tables.packages.get(String(updates.packageId));
      if (!packageData) {
        return res.status(404).json({
          success: false,
          error: `Package not found (ID: ${updates.packageId})`
        });
      }
    }
    
    // Update booking
    const updatedBooking = {
      ...existingBooking,
      package_id: updates.packageId || existingBooking.package_id,
      check_in: updates.checkIn || existingBooking.check_in,
      check_out: updates.checkOut || existingBooking.check_out,
      guests: updates.guests || existingBooking.guests,
      total_cost: updates.totalCost || existingBooking.total_cost,
      payment_mode: updates.paymentMode || existingBooking.payment_mode,
      contact_number: updates.contactNumber || existingBooking.contact_number,
      special_requests: updates.specialRequests !== undefined ? updates.specialRequests : existingBooking.special_requests,
      updated_at: new Date().toISOString()
    };
    
    mockClient.tables.bookings.set(id, updatedBooking);
    
    // Update booking items if provided
    if (updates.perRoomGuests) {
      // Remove old room items
      Array.from(mockClient.tables.booking_items.values())
        .filter(item => item.booking_id === id && item.item_type === 'room')
        .forEach(item => mockClient.tables.booking_items.delete(item.id));
      
      // Add new room items
      updates.perRoomGuests.forEach(room => {
        const itemId = `${id}-${room.roomId}`;
        mockClient.tables.booking_items.set(itemId, {
          id: itemId,
          booking_id: id,
          item_type: 'room',
          item_id: room.roomId,
          guest_name: room.guestName,
          adults: room.adults,
          children: room.children
        });
      });
    }
    
    // Update cottages if provided
    if (updates.selectedCottages) {
      // Remove old cottage items
      Array.from(mockClient.tables.booking_items.values())
        .filter(item => item.booking_id === id && item.item_type === 'cottage')
        .forEach(item => mockClient.tables.booking_items.delete(item.id));
      
      // Add new cottage items
      updates.selectedCottages.forEach((cottageId, index) => {
        const itemId = `${id}-cottage-${index}`;
        mockClient.tables.booking_items.set(itemId, {
          id: itemId,
          booking_id: id,
          item_type: 'cottage',
          item_id: cottageId
        });
      });
    }
    
    // Get updated booking items
    const bookingItems = Array.from(mockClient.tables.booking_items.values())
      .filter(item => item.booking_id === id);
    
    const packageData = mockClient.tables.packages.get(String(updatedBooking.package_id));
    
    const bookingResponse = {
      ...updatedBooking,
      booking_items: bookingItems,
      packages: packageData
    };
    
    console.log('[MockBookings] Booking updated:', id);
    
    res.json({
      success: true,
      data: bookingResponse
    });
  } catch (error) {
    console.error('[MockBookings] Update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update booking' });
  }
});

// DELETE /mock/bookings/:id - Cancel booking (no auth required)
router.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[MockBookings] Cancelling booking:', id);
    
    const existingBooking = mockClient.tables.bookings.get(id);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        error: `Booking not found (ID: ${id})`
      });
    }
    
    // Update status to cancelled instead of deleting
    const cancelledBooking = {
      ...existingBooking,
      status: 'cancelled',
      updated_at: new Date().toISOString()
    };
    
    mockClient.tables.bookings.set(id, cancelledBooking);
    
    console.log('[MockBookings] Booking cancelled:', id);
    
    res.json({
      success: true,
      data: cancelledBooking,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('[MockBookings] Cancel error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

// GET /mock/bookings/availability/:packageId - Check availability (no auth required)
router.get('/bookings/availability/:packageId', async (req, res) => {
  console.log('[MockAvailability] ⚡ Availability endpoint hit!');
  try {
    const { packageId } = req.params;
    const { checkIn, checkOut, category } = req.query;
    
    console.log(`[MockAvailability] Request for package ${packageId} from ${checkIn} to ${checkOut}, category: ${category || 'all'}`);
    console.log(`[MockAvailability] Full query params:`, req.query);
    console.log(`[MockAvailability] Request URL:`, req.originalUrl);
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Check-in and check-out dates required'
      });
    }
    
    // Determine item type from category
    const itemType = category === 'cottages' ? 'cottage' :
                     category === 'function-halls' ? 'function-hall' : 'room';
    
    console.log(`[MockAvailability] Looking for item_type='${itemType}'`);
    
    // Get all bookings from mock database
    const allBookings = Array.from(mockClient.tables.bookings.values());
    
    // Add debug logging
    console.log(`[MockAvailability] Total bookings in mock DB: ${allBookings.length}`);
    if (allBookings.length > 0) {
      console.log(`[MockAvailability] Sample booking IDs: ${allBookings.slice(0, 3).map(b => b.id).join(', ')}`);
    }
    
    // Filter for relevant bookings (pending/confirmed, matching package, date overlap)
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);
    
    const relevantBookings = allBookings.filter(booking => {
      if (booking.package_id != packageId) return false;
      if (!['pending', 'confirmed'].includes(booking.status)) return false;
      
      const bookingStart = new Date(booking.check_in);
      const bookingEnd = new Date(booking.check_out);
      bookingStart.setHours(0, 0, 0, 0);
      bookingEnd.setHours(0, 0, 0, 0);
      
      // Check date overlap
      return bookingStart <= checkOutDate && bookingEnd >= checkInDate;
    });
    
    console.log(`[MockAvailability] Found ${relevantBookings.length} relevant bookings`);
    
    // Get booking items for these bookings
    const bookedItems = [];
    relevantBookings.forEach(booking => {
      const items = Array.from(mockClient.tables.booking_items.values())
        .filter(item => item.booking_id === booking.id && item.item_type === itemType);
      
      items.forEach(item => {
        bookedItems.push({
          ...item,
          booking: booking
        });
      });
    });
    
    console.log(`[MockAvailability] Found ${bookedItems.length} booked items of type '${itemType}'`);
    
    // Define available items based on type
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
    
    let currentDate = new Date(checkInDate);
    while (currentDate < checkOutDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const bookedIds = [];
      
      // Check each booked item for this date
      bookedItems.forEach(item => {
        const booking = item.booking;
        const bookingCheckIn = new Date(booking.check_in);
        const bookingCheckOut = new Date(booking.check_out);
        bookingCheckIn.setHours(0, 0, 0, 0);
        bookingCheckOut.setHours(0, 0, 0, 0);
        
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
      
      // Calculate availability
      const availableItems = allItems.filter(id => !bookedIds.includes(id));
      
      let status;
      if (itemType === 'room') {
        if (availableItems.length === 0) {
          status = 'booked-all';
        } else if (availableItems.length === 4) {
          status = 'available-all';
        } else {
          status = `available-${availableItems.length}`;
        }
        
        dateAvailability[dateString] = {
          status: status,
          availableCount: availableItems.length,
          bookedCount: bookedIds.length,
          bookedRooms: bookedIds,
          availableRooms: availableItems
        };
      } else {
        dateAvailability[dateString] = {
          status: availableItems.length > 0 ? 'cottage-available' : 'cottage-booked',
          isBooked: bookedIds.length > 0,
          bookedCottages: bookedIds,
          availableCottages: availableItems
        };
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate overall availability
    const allDatesAvailable = Object.values(dateAvailability).every(day => 
      itemType === 'room' ? day.availableCount > 0 : !day.isBooked
    );
    
    const avgAvailability = itemType === 'room' 
      ? Math.round(Object.values(dateAvailability).reduce((sum, day) => sum + day.availableCount, 0) / Object.keys(dateAvailability).length)
      : (allDatesAvailable ? allItems.length : 0);
    
    console.log(`[MockAvailability] Overall availability: ${allDatesAvailable}, avg: ${avgAvailability}`);
    
    res.json({
      success: true,
      available: allDatesAvailable,
      avgRoomAvailability: avgAvailability,
      dateAvailability: dateAvailability,
      bookedDates: bookedDates,
      message: allDatesAvailable ? 'Accommodation available' : 'Fully booked for selected dates'
    });
  } catch (error) {
    console.error('[MockAvailability] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to check availability' });
  }
});

export default router;

