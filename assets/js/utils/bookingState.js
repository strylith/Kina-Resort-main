// Booking Flow State Management
// Manages dates, selected rooms, guest counts, and cottage selections

export const bookingState = {
  dates: { checkin: null, checkout: null },
  selectedRooms: [],
  guestCounts: {}, // { roomId: { adults: 1, children: 0 } }
  selectedCottages: [],
  availableRooms: [],
  availableCottages: [],
  
  // Mock availability data (consistent with calendar modal)
  mockReservationData: {
    'Room A1': 8,
    'Room A2': 12,
    'Room A3': 6,
    'Room A4': 15,
    'Standard Cottage': 6,
    'Garden Cottage': 4,
    'Family Cottage': 7
  },
  
  // Room types
  allRooms: ['Room A1', 'Room A2', 'Room A3', 'Room A4'],
  
  // Cottage types
  allCottages: ['Standard Cottage', 'Garden Cottage', 'Family Cottage'],
  
  setDates(checkin, checkout) {
    this.dates.checkin = checkin;
    this.dates.checkout = checkout;
    // Update available rooms and cottages when dates change
    this.updateAvailability();
  },
  
  toggleRoom(roomId) {
    const index = this.selectedRooms.indexOf(roomId);
    if (index > -1) {
      this.selectedRooms.splice(index, 1);
      delete this.guestCounts[roomId];
    } else {
      this.selectedRooms.push(roomId);
      // Initialize default guest counts
      if (!this.guestCounts[roomId]) {
        this.guestCounts[roomId] = { adults: 1, children: 0 };
      }
    }
  },
  
  setGuestCount(roomId, adults, children) {
    if (this.guestCounts[roomId]) {
      this.guestCounts[roomId].adults = adults;
      this.guestCounts[roomId].children = children;
    }
  },
  
  addCottage(cottageId) {
    if (!this.selectedCottages.includes(cottageId)) {
      this.selectedCottages.push(cottageId);
    }
  },
  
  removeCottage(cottageId) {
    const index = this.selectedCottages.indexOf(cottageId);
    if (index > -1) {
      this.selectedCottages.splice(index, 1);
    }
  },
  
  reset() {
    this.dates = { checkin: null, checkout: null };
    this.selectedRooms = [];
    this.guestCounts = {};
    this.selectedCottages = [];
    this.availableRooms = [];
    this.availableCottages = [];
  },
  
  // Check room availability for a specific date
  isRoomAvailableOnDate(roomId, date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Past dates
    if (date < today) {
      return false;
    }
    
    // Deterministic availability check
    const dateString = date.toISOString().split('T')[0];
    const seed = dateString.split('-').join('') + roomId.length;
    const deterministicRandom = (parseInt(seed) % 100) / 100;
    
    const reservationCount = this.mockReservationData[roomId] || 10;
    const bookedThreshold = 0.3 + (reservationCount / 100);
    
    if (deterministicRandom < 0.1) {
      return false; // Maintenance
    } else if (deterministicRandom < bookedThreshold) {
      return false; // Booked
    }
    
    return true; // Available
  },
  
  // Check if room is available for entire date range
  isRoomAvailable(roomId, checkin, checkout) {
    if (!checkin || !checkout) return false;
    
    const startDate = new Date(checkin);
    const endDate = new Date(checkout);
    let currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      if (!this.isRoomAvailableOnDate(roomId, currentDate)) {
        return false;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return true;
  },
  
  // Get available rooms for date range (now fetches from database)
  async getAvailableRooms(checkin, checkout) {
    if (!checkin || !checkout) return [];
    
    console.log(`[BookingState] Getting available rooms for ${checkin} to ${checkout}`);
    
    try {
      // Call backend API to get real-time availability
      const { checkAvailability } = await import('./api.js');
      // Pass 'rooms' category to only get room bookings
      const result = await checkAvailability(1, checkin, checkout, 'rooms');
      
      console.log('[BookingState] Availability result:', result);
      
      // Extract available rooms from the result
      if (result && result.dateAvailability) {
        // Get availability for the first date in range
        const firstDate = checkin;
        const dateData = result.dateAvailability[firstDate];
        
        if (dateData && dateData.availableRooms) {
          console.log(`[BookingState] Available rooms: ${dateData.availableRooms.join(', ')}`);
          return dateData.availableRooms;
        }
      }
      
      // Fallback: return all rooms if no booking data
      console.log('[BookingState] No booking data found, returning all rooms');
      return this.allRooms;
    } catch (error) {
      console.error('[BookingState] Error fetching available rooms:', error);
      
      // Show warning if backend is unavailable
      if (error.message.includes('backend server') || error.message === 'Failed to fetch') {
        console.warn('[BookingState] Backend unavailable - showing all rooms as available');
      }
      
      // Fallback to all rooms on error
      return this.allRooms;
    }
  },
  
  // Check cottage availability for a specific date
  isCottageAvailableOnDate(cottageId, date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Past dates
    if (date < today) {
      return false;
    }
    
    // Deterministic availability check
    const dateString = date.toISOString().split('T')[0];
    const seed = dateString.split('-').join('') + cottageId.length;
    const deterministicRandom = (parseInt(seed) % 100) / 100;
    
    const reservationCount = this.mockReservationData[cottageId] || 10;
    const bookedThreshold = 0.3 + (reservationCount / 100);
    
    if (deterministicRandom < 0.15) {
      return false; // Maintenance
    } else if (deterministicRandom < bookedThreshold) {
      return false; // Booked
    }
    
    return true; // Available
  },
  
  // Check if cottage is available for entire date range
  isCottageAvailable(cottageId, checkin, checkout) {
    if (!checkin || !checkout) return false;
    
    const startDate = new Date(checkin);
    const endDate = new Date(checkout);
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (!this.isCottageAvailableOnDate(cottageId, currentDate)) {
        return false;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return true;
  },
  
  // Get available cottages for date range
  getAvailableCottages(checkin, checkout) {
    if (!checkin || !checkout) return [];
    
    return this.allCottages.filter(cottageId => 
      this.isCottageAvailable(cottageId, checkin, checkout)
    );
  },
  
  // Check if dates are available for all selected rooms
  areDatesAvailableForRooms(checkin, checkout, roomIds) {
    if (!checkin || !checkout || !roomIds || roomIds.length === 0) return true;
    
    return roomIds.every(roomId => 
      this.isRoomAvailable(roomId, checkin, checkout)
    );
  },
  
  // Update availability based on current dates
  updateAvailability() {
    if (this.dates.checkin && this.dates.checkout) {
      this.availableRooms = this.getAvailableRooms(this.dates.checkin, this.dates.checkout);
      this.availableCottages = this.getAvailableCottages(this.dates.checkin, this.dates.checkout);
      
      // Remove selected rooms that are no longer available
      this.selectedRooms = this.selectedRooms.filter(roomId => 
        this.availableRooms.includes(roomId)
      );
      
      // Remove selected cottages that are no longer available
      this.selectedCottages = this.selectedCottages.filter(cottageId => 
        this.availableCottages.includes(cottageId)
      );
    } else {
      this.availableRooms = [];
      this.availableCottages = [];
    }
  },
  
  // Get total guest counts across all rooms
  getTotalGuests() {
    let totalAdults = 0;
    let totalChildren = 0;
    
    Object.values(this.guestCounts).forEach(counts => {
      totalAdults += counts.adults || 0;
      totalChildren += counts.children || 0;
    });
    
    return { adults: totalAdults, children: totalChildren };
  }
};

export default bookingState;

