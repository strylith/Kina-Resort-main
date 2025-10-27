// Comprehensive Booking Modal Component
// Handles Room, Cottage, and Function Hall reservations

import { bookingState } from '../utils/bookingState.js';

let currentBookingModal = null;
let bookingFormState = {
  reservationType: 'room',
  addCottageToRoom: false,
  addRoomToCottage: false,
  formData: {},
  errors: {},
  savedFormData: {},
  returningFromCottage: false // Track if we're returning from cottage selection
};

// Room types for selection
const roomTypes = ['Room A1', 'Room A2', 'Room A3', 'Room A4'];
const cottageTypes = ['Beachfront Cottage', 'Garden View Cottage', 'Family Cottage'];
const functionHallTypes = ['Grand Function Hall', 'Intimate Function Hall'];

// Mock reservation data for consistent availability
const mockReservationData = {
  'Room A1': 8,
  'Room A2': 12,
  'Room A3': 6,
  'Room A4': 15,
  'Grand Function Hall': 5,
  'Intimate Function Hall': 7
};

// Mock booking database for availability checking
const mockBookings = {
  'Room A1': [],
  'Room A2': [],
  'Room A3': [],
  'Room A4': []
};

// Check if room is available for given dates (using database)
async function isRoomAvailable(roomId, checkinDate, checkoutDate) {
  try {
    const { checkAvailability } = await import('../utils/api.js');
    
    // Check availability for the entire date range
    const result = await checkAvailability(1, checkinDate, checkoutDate);
    
    // If not available, check if there are conflicts
    if (!result.available) {
      // Check specific dates in the range
  let currentDate = new Date(checkinDate);
  const endDate = new Date(checkoutDate);
  
  while (currentDate < endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Check if this date is in booked dates
        const isBooked = result.bookedDates?.some(booking => {
          const bookingCheckin = new Date(booking.check_in);
          const bookingCheckout = new Date(booking.check_out);
          return dateString >= bookingCheckin.toISOString().split('T')[0] &&
                 dateString < bookingCheckout.toISOString().split('T')[0];
        });
        
        if (isBooked) {
      return false;
    }
        
    currentDate.setDate(currentDate.getDate() + 1);
  }
    }
    
    return result.available;
  } catch (error) {
    console.error('Error checking room availability:', error);
    // Fallback to true on error to allow booking
    return true;
  }
}


// Open booking modal with optional pre-selection and pre-filled dates
export function openBookingModal(initialType = 'room', packageTitle = '', preFillData = null) {
  closeBookingModal();
  
  bookingFormState.reservationType = initialType;
  bookingFormState.addCottageToRoom = false;
  bookingFormState.addRoomToCottage = false;
  bookingFormState.formData = {};
  bookingFormState.errors = {};
  
  // Handle pre-fill data (dates, selected rooms, etc.)
  if (preFillData) {
    if (preFillData.fromDateSelection) {
      // Coming from date selection flow
      bookingFormState.preFillDates = {
        checkin: preFillData.checkin,
        checkout: preFillData.checkout
      };
      bookingFormState.selectedRoomsFromFlow = preFillData.selectedRooms || [];
    } else {
      // Legacy preFillDates format
      bookingFormState.preFillDates = preFillData;
      bookingFormState.selectedRoomsFromFlow = [];
    }
  } else {
    bookingFormState.preFillDates = null;
    bookingFormState.selectedRoomsFromFlow = [];
  }
  
  const modalHTML = `
    <div class="booking-modal-overlay" id="booking-modal-overlay">
      <div class="booking-modal">
        <button class="booking-modal-close" onclick="closeBookingModal()" aria-label="Close booking modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div class="booking-modal-header">
          <h2>Make a Reservation</h2>
          <p class="booking-subtitle">Complete your booking details below</p>
          
          <div class="reservation-type-selector" ${bookingFormState.selectedRoomsFromFlow?.length > 0 ? 'style="display: none;"' : ''}>
            <button class="type-tab ${initialType === 'room' ? 'active' : ''}" data-type="room" onclick="changeReservationType('room')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9,22 9,12 15,12 15,22"></polyline>
              </svg>
              Room Stay
            </button>
            <button class="type-tab ${initialType === 'cottage' ? 'active' : ''}" data-type="cottage" onclick="changeReservationType('cottage')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Cottage
            </button>
            <button class="type-tab ${initialType === 'function-hall' ? 'active' : ''}" data-type="function-hall" onclick="changeReservationType('function-hall')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Function Hall
            </button>
          </div>
        </div>
        
        <form class="booking-form" id="booking-form" onsubmit="submitBooking(event)">
          <div class="booking-form-content">
            ${renderFormFields(initialType)}
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  currentBookingModal = document.getElementById('booking-modal-overlay');
  
  // Add event listeners
  currentBookingModal.addEventListener('click', (e) => {
    if (e.target === currentBookingModal) {
      closeBookingModal();
    }
  });
  
  // Prevent background scrolling when modal is open
  document.body.style.overflow = 'hidden';
  document.body.classList.add('modal-open');
  
  // Disable Lenis smooth scrolling when modal is open
  const lenisInstance = window.lenisInstance || document.querySelector('.lenis')?.lenis;
  if (lenisInstance) {
    lenisInstance.stop();
  }
  
  // Prevent scroll events from bubbling to background
  currentBookingModal.addEventListener('wheel', (e) => {
    e.stopPropagation();
  }, { passive: false });
  
  // Prevent middle mouse scroll from affecting background
  currentBookingModal.addEventListener('mousedown', (e) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
    }
  });
  
  document.addEventListener('keydown', handleEscapeKey);
  
  // Initialize form
  initializeForm();
  
  // Animate modal in
  setTimeout(() => {
    currentBookingModal.classList.add('show');
  }, 10);
}

// Close booking modal
export function closeBookingModal() {
  if (currentBookingModal) {
    currentBookingModal.classList.remove('show');
    
    // Restore background scrolling
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    
    // Re-enable Lenis smooth scrolling when modal is closed
    const lenisInstance = window.lenisInstance || document.querySelector('.lenis')?.lenis;
    if (lenisInstance) {
      lenisInstance.start();
    }
    
    setTimeout(() => {
      if (currentBookingModal && currentBookingModal.parentNode) {
        currentBookingModal.parentNode.removeChild(currentBookingModal);
      }
      currentBookingModal = null;
    }, 300);
    
    document.removeEventListener('keydown', handleEscapeKey);
    
    // Remove floating continue button if exists
    const floatingBtn = document.getElementById('floating-continue-btn');
    if (floatingBtn) {
      floatingBtn.remove();
    }
  }
}

// Change reservation type
function changeReservationType(type) {
  bookingFormState.reservationType = type;
  bookingFormState.addCottageToRoom = false;
  bookingFormState.addRoomToCottage = false;
  
  // Update active tab
  document.querySelectorAll('.type-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-type="${type}"]`).classList.add('active');
  
  // Re-render form
  const formContent = document.querySelector('.booking-form-content');
  formContent.innerHTML = renderFormFields(type);
  
  // Re-initialize form
  initializeForm();
}

// Render form fields based on reservation type
function renderFormFields(type) {
  const baseFields = `
    <div class="form-section">
      <h3>Main Booker Information</h3>
      <p class="section-description">Person making the reservation and responsible for payment</p>
      <div class="form-field">
        <label for="guest-name" class="form-label">Full Name *</label>
        <input type="text" id="guest-name" name="guestName" class="form-input" required>
        <div class="form-error" id="guest-name-error"></div>
      </div>
      
      <div class="form-field">
        <label for="email" class="form-label">Email Address *</label>
        <input type="email" id="email" name="email" class="form-input" required>
        <div class="form-error" id="email-error"></div>
      </div>
      
      <div class="form-field">
        <label for="contact" class="form-label">Contact Number *</label>
        <input type="tel" id="contact" name="contact" class="form-input" required>
        <div class="form-error" id="contact-error"></div>
      </div>
    </div>
  `;
  
  if (type === 'room') {
    return baseFields + renderRoomFields();
  } else if (type === 'cottage') {
    return baseFields + renderCottageFields();
  } else if (type === 'function-hall') {
    return baseFields + renderFunctionHallFields();
  }
}

// Render room booking fields
function renderRoomFields() {
  return `
    <div class="form-section">
      <h3>Room Details</h3>
      
      <div class="date-time-group">
        <div class="form-field">
          <label for="checkin-date" class="form-label">Check-in Date *</label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="date" id="checkin-date" name="checkinDate" class="form-input" required style="flex: 1;" onclick="openCalendarForCheckin()" readonly>
            <button type="button" class="calendar-icon-btn" onclick="openCalendarForCheckin()" title="Select from calendar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </button>
          </div>
          <div class="form-error" id="checkin-date-error"></div>
        </div>
        
        <div class="form-field">
          <label for="checkout-date" class="form-label">Check-out Date *</label>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="date" id="checkout-date" name="checkoutDate" class="form-input" required style="flex: 1;" onclick="openCalendarForCheckout()" readonly>
            <button type="button" class="calendar-icon-btn" onclick="openCalendarForCheckout()" title="Select from calendar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </button>
          </div>
          <div class="form-error" id="checkout-date-error"></div>
        </div>
      </div>
      
      <div class="form-field auto-calculated-field">
        <label class="form-label">Number of Nights</label>
        <div class="calculated-value" id="nights-display">0</div>
      </div>
      
      ${generatePerRoomGuestInputs()}
        
        <div class="form-field">
        <div class="total-guests-display" id="total-guests-display">
          <strong>Total: 0 adults, 0 children across 0 rooms</strong>
        </div>
      </div>
      
      ${generateSelectedRoomsDisplay()}
      
      <div class="add-option-section">
        <button type="button" class="add-option-toggle" onclick="showCottageSelection()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Cottage to Room Booking
        </button>
        
        <div class="form-field" id="cottage-selection-field" style="display: none;">
          <label class="form-label">Cottage Selection</label>
          <div class="checkbox-group">
            ${cottageTypes.map(cottage => `
              <label class="checkbox-item">
                <input type="checkbox" name="selectedCottages" value="${cottage}">
                <span class="checkbox-label">${cottage}</span>
              </label>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    
    ${renderPaymentAndAgreement()}
  `;
}

// Render cottage booking fields
function renderCottageFields() {
  return `
    <div class="form-section">
      <h3>Cottage Details</h3>
      
      <div class="form-field">
        <label for="cottage-date" class="form-label">Date *</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="date" id="cottage-date" name="cottageDate" class="form-input" required style="flex: 1;">
          <button type="button" class="calendar-icon-btn" onclick="openCalendarModal('cottages', 'Cottage Booking')" title="Select from calendar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        </div>
        <div class="form-error" id="cottage-date-error"></div>
      </div>
      
      <div class="form-field">
        <label class="form-label">Time Range *</label>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="flex: 1;">
            <label for="start-time" class="form-label" style="font-size: 0.9em; margin-bottom: 4px;">Start Time</label>
            <input type="time" id="start-time" name="startTime" class="form-input" required>
            <div class="form-error" id="start-time-error"></div>
          </div>
          <div style="flex: 1;">
            <label for="end-time" class="form-label" style="font-size: 0.9em; margin-bottom: 4px;">End Time</label>
            <input type="time" id="end-time" name="endTime" class="form-input" required>
            <div class="form-error" id="end-time-error"></div>
          </div>
        </div>
      </div>
      
      <div class="guests-group">
        <div class="form-field">
          <label for="cottage-adults" class="form-label">Number of Adults *</label>
          <input type="number" id="cottage-adults" name="cottageAdults" class="form-input" min="1" value="1" required>
          <div class="form-error" id="cottage-adults-error"></div>
        </div>
        
        <div class="form-field">
          <label for="cottage-children" class="form-label">Number of Children</label>
          <input type="number" id="cottage-children" name="cottageChildren" class="form-input" min="0" value="0">
        </div>
      </div>
      
      <div class="form-field">
        <label class="form-label">Cottage Selection *</label>
        <div class="checkbox-group">
          ${cottageTypes.map(cottage => `
            <label class="checkbox-item">
              <input type="checkbox" name="selectedCottages" value="${cottage}" required>
              <span class="checkbox-label">${cottage}</span>
            </label>
          `).join('')}
        </div>
        <div class="form-error" id="cottage-selection-error"></div>
      </div>
    </div>
    
    ${renderPaymentAndAgreement()}
  `;
}

// Render function hall booking fields
function renderFunctionHallFields() {
  return `
    <div class="form-section">
      <h3>Event Details</h3>
      
      <div class="form-field">
        <label for="organization" class="form-label">Organization (Optional)</label>
        <input type="text" id="organization" name="organization" class="form-input" placeholder="Company or organization name">
      </div>
      
      <div class="form-field">
        <label for="event-date" class="form-label">Event Date *</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="date" id="event-date" name="eventDate" class="form-input" required style="flex: 1;">
          <button type="button" class="calendar-icon-btn" onclick="openCalendarModal('function-halls', 'Function Hall Booking')" title="Select from calendar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        </div>
        <div class="form-error" id="event-date-error"></div>
      </div>
      
      <div class="form-field">
        <label class="form-label">Event Time Range *</label>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="flex: 1;">
            <label for="event-start" class="form-label" style="font-size: 0.9em; margin-bottom: 4px;">Start Time</label>
            <input type="time" id="event-start" name="eventStart" class="form-input" required>
            <div class="form-error" id="event-start-error"></div>
          </div>
          <div style="flex: 1;">
            <label for="event-end" class="form-label" style="font-size: 0.9em; margin-bottom: 4px;">End Time</label>
            <input type="time" id="event-end" name="eventEnd" class="form-input" required>
            <div class="form-error" id="event-end-error"></div>
          </div>
        </div>
      </div>
      
      <div class="form-field">
        <label for="event-type" class="form-label">Event Type *</label>
        <select id="event-type" name="eventType" class="form-select" required>
          <option value="">Select Event Type</option>
          <option value="wedding">Wedding</option>
          <option value="birthday">Birthday Party</option>
          <option value="conference">Conference</option>
          <option value="meeting">Meeting</option>
          <option value="other">Other</option>
        </select>
        <div class="form-error" id="event-type-error"></div>
      </div>
      
      <div class="form-field">
        <label for="event-guests" class="form-label">Number of Guests *</label>
        <input type="number" id="event-guests" name="eventGuests" class="form-input" min="1" required>
        <div class="form-error" id="event-guests-error"></div>
      </div>
      
      <div class="form-field">
        <label class="form-label">Function Hall Selection *</label>
        <div class="radio-group">
          ${functionHallTypes.map(hall => `
            <label class="radio-item">
              <input type="radio" name="selectedHall" value="${hall}" required>
              <span class="radio-label">${hall}</span>
            </label>
          `).join('')}
        </div>
        <div class="form-error" id="hall-selection-error"></div>
      </div>
      
      <div class="form-field">
        <label for="special-requests" class="form-label">Special Requests</label>
        <textarea id="special-requests" name="specialRequests" class="form-textarea" rows="3" placeholder="Any special requirements or requests..."></textarea>
      </div>
    </div>
    
    ${renderPaymentAndAgreement()}
  `;
}

// Render cost summary
function renderCostSummary() {
  const costs = calculateTotalCost();
  if (!costs || !bookingFormState.selectedRoomsFromFlow?.length) return '';
  
  return `
    <div class="booking-cost-summary">
      <h4>Cost Breakdown</h4>
      <div class="cost-line">
        <span>Rooms (${bookingFormState.selectedRoomsFromFlow?.length || 0} × ₱5,500 × ${costs.nights} nights)</span>
        <span>₱${costs.roomCost.toLocaleString()}</span>
      </div>
      ${bookingState.selectedCottages.length > 0 ? `
        <div class="cost-line">
          <span>Cottages (${bookingState.selectedCottages.length} × ${costs.nights} nights)</span>
          <span>₱${costs.cottageCost.toLocaleString()}</span>
        </div>
      ` : ''}
      <div class="cost-total">
        <span><strong>Total</strong></span>
        <span><strong>₱${costs.total.toLocaleString()}</strong></span>
      </div>
    </div>
  `;
}

// Render payment and agreement section
function renderPaymentAndAgreement() {
  return `
    ${renderCostSummary()}
    
    <div class="form-section">
      <h3>Payment & Agreement</h3>
      
      <div class="form-field">
        <label for="payment-mode" class="form-label">Mode of Payment *</label>
        <select id="payment-mode" name="paymentMode" class="form-select" required>
          <option value="" disabled selected>Select Payment Method</option>
          <option value="bank-transfer">Bank Transfer</option>
          <option value="gcash">GCash</option>
          <option value="credit-card">Credit Card</option>
        </select>
        <div class="form-error" id="payment-mode-error"></div>
      </div>
      
      <div class="agreement-section">
        <div class="terms-container" id="terms-container">
          <div class="terms-header" onclick="toggleTermsExpansion()">
            <h4>Terms & Conditions</h4>
            <button type="button" class="terms-toggle-btn" id="terms-toggle-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
          <div class="terms-content collapsed" id="terms-content">
            <div class="terms-inner" id="terms-inner">
              Loading terms...
            </div>
          </div>
        </div>
        
        <label class="agreement-checkbox">
          <input type="checkbox" id="agreement" name="agreement" required>
          <span class="agreement-text">
            I have read and agree to the above booking and cancellation policy
          </span>
        </label>
        <div class="form-error" id="agreement-error"></div>
      </div>
      
      <button type="submit" class="booking-submit-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4"></path>
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
          <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"></path>
          <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"></path>
        </svg>
        ${getSubmitButtonText()}
      </button>
    </div>
  `;
}

// Get submit button text based on reservation type
function getSubmitButtonText() {
  switch (bookingFormState.reservationType) {
    case 'room':
      return 'Book My Room';
    case 'cottage':
      return 'Book Cottage';
    case 'function-hall':
      return 'Book Function Hall';
    default:
      return 'Complete Booking';
  }
}

// Generate room checkboxes with availability checking
function generateRoomCheckboxes() {
  const checkinDate = document.getElementById('checkin-date')?.value;
  const checkoutDate = document.getElementById('checkout-date')?.value;
  
  return roomTypes.map(room => {
    let isAvailable = true;
    let availabilityClass = '';
    let availabilityLabel = '';
    
    if (checkinDate && checkoutDate) {
      isAvailable = isRoomAvailable(room, checkinDate, checkoutDate);
      if (!isAvailable) {
        availabilityClass = 'unavailable';
        availabilityLabel = '<span class="not-available-label">Not Available</span>';
      }
    }
    
    return `
      <label class="checkbox-item ${availabilityClass}">
        <input type="checkbox" name="selectedRooms" value="${room}" ${!isAvailable ? 'disabled' : ''}>
        <span class="checkbox-label">
          <span class="${!isAvailable ? 'room-name-strike' : ''}">${room}</span>
          ${availabilityLabel}
        </span>
      </label>
    `;
  }).join('');
}

// Generate per-room guest inputs
function generatePerRoomGuestInputs() {
  // Get selected rooms from booking flow or default to empty
  const selectedRooms = bookingFormState.selectedRoomsFromFlow || [];
  
  if (selectedRooms.length === 0) {
    // No pre-selected rooms, show default single set of inputs
    return `
      <div class="guests-group">
        <div class="form-field">
          <label for="adults" class="form-label">Number of Adults *</label>
          <input type="number" id="adults" name="adults" class="form-input" min="1" value="1" required>
          <div class="form-error" id="adults-error"></div>
        </div>
        
        <div class="form-field">
          <label for="children" class="form-label">Number of Children</label>
          <input type="number" id="children" name="children" class="form-input" min="0" value="0">
        </div>
      </div>
    `;
  }
  
  // Generate per-room guest inputs with name field
  let html = '<div class="per-room-guests-section">';
  
  selectedRooms.forEach(roomId => {
    html += `
      <div class="room-guests-card" data-room-id="${roomId}">
        <h5>${roomId}</h5>
        
        <div class="form-field">
          <label for="${roomId}-guest-name" class="form-label">Primary Guest Name (Optional)</label>
          <input type="text" id="${roomId}-guest-name" name="${roomId}-guestName" class="form-input" placeholder="Leave blank if same as main booker">
          <small class="form-hint">The person staying in this room</small>
        </div>
        
        <div class="guests-inputs-row">
          <div class="form-field">
            <label for="${roomId}-adults" class="form-label">Adults *</label>
            <input type="number" id="${roomId}-adults" name="${roomId}-adults" class="form-input" min="1" max="4" value="1" required onchange="updateTotalGuests()">
          </div>
          <div class="form-field">
            <label for="${roomId}-children" class="form-label">Children</label>
            <input type="number" id="${roomId}-children" name="${roomId}-children" class="form-input" min="0" max="3" value="0" onchange="updateTotalGuests()">
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

// Generate selected rooms and cottages display
function generateSelectedRoomsDisplay() {
  const selectedRooms = bookingFormState.selectedRoomsFromFlow || [];
  const selectedCottages = bookingState.selectedCottages || [];
  
  if (selectedRooms.length === 0 && selectedCottages.length === 0) {
    return '';
  }
  
  let html = '<div class="form-section"><h3>Selected Accommodations</h3><div class="selected-items-grid">';
  
  // Add room cards
  selectedRooms.forEach(roomId => {
    html += `
      <div class="selected-item-card">
        <div class="selected-item-icon">🏨</div>
        <div class="selected-item-info">
          <strong>${roomId}</strong>
          <span>Standard Room</span>
        </div>
      </div>
    `;
  });
  
  // Add cottage cards
  selectedCottages.forEach(cottageId => {
    html += `
      <div class="selected-item-card">
        <div class="selected-item-icon">🏡</div>
        <div class="selected-item-info">
          <strong>${cottageId}</strong>
          <span>Cottage</span>
        </div>
      </div>
    `;
  });
  
  html += '</div></div>';
  return html;
}

// Update room availability when dates change
function updateRoomAvailability() {
  const roomCheckboxes = document.getElementById('room-checkboxes');
  if (roomCheckboxes) {
    roomCheckboxes.innerHTML = generateRoomCheckboxes();
  }
}

// Update total guests display
function updateTotalGuests() {
  const selectedRooms = bookingFormState.selectedRoomsFromFlow || [];
  let totalAdults = 0;
  let totalChildren = 0;
  
  selectedRooms.forEach(roomId => {
    const adultsInput = document.getElementById(`${roomId}-adults`);
    const childrenInput = document.getElementById(`${roomId}-children`);
    
    if (adultsInput) totalAdults += parseInt(adultsInput.value) || 0;
    if (childrenInput) totalChildren += parseInt(childrenInput.value) || 0;
  });
  
  const display = document.getElementById('total-guests-display');
  if (display) {
    display.innerHTML = `<strong>Total: ${totalAdults} adults, ${totalChildren} children across ${selectedRooms.length} room${selectedRooms.length > 1 ? 's' : ''}</strong>`;
  }
}

// Make updateTotalGuests globally available
window.updateTotalGuests = updateTotalGuests;

// Calculate total booking cost
function calculateTotalCost() {
  const checkin = bookingFormState.preFillDates?.checkin;
  const checkout = bookingFormState.preFillDates?.checkout;
  
  if (!checkin || !checkout) return null;
  
  const nights = Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24));
  
  // Room costs
  const roomCost = bookingFormState.selectedRoomsFromFlow?.length * 5500 * nights || 0;
  
  // Cottage costs
  const cottageCosts = bookingState.selectedCottages.map(cottageId => {
    const cottageInfo = getCottageInfo(cottageId);
    return parseInt(cottageInfo.price.replace(/[₱,/night]/g, ''));
  }).reduce((sum, price) => sum + (price * nights), 0);
  
  return {
    roomCost,
    cottageCost: cottageCosts,
    nights,
    total: roomCost + cottageCosts
  };
}

// Show cottage selection interface
async function showCottageSelection() {
  // Set flag to indicate we're navigating to cottage selection
  bookingFormState.returningFromCottage = false;
  
  // SAVE FORM VALUES FIRST before replacing HTML
  const form = document.getElementById('booking-form');
  if (form) {
    bookingFormState.savedFormData = {
      guestName: document.getElementById('guest-name')?.value || '',
      email: document.getElementById('email')?.value || '',
      contact: document.getElementById('contact')?.value || '',
      paymentMode: document.getElementById('payment-mode')?.value || '',
      agreement: document.getElementById('agreement')?.checked || false
    };
    
    // Save per-room guest info
    const selectedRooms = bookingFormState.selectedRoomsFromFlow || [];
    selectedRooms.forEach(roomId => {
      const guestName = document.getElementById(`${roomId}-guest-name`)?.value;
      const adults = document.getElementById(`${roomId}-adults`)?.value;
      const children = document.getElementById(`${roomId}-children`)?.value;
      
      if (guestName !== undefined) bookingFormState.savedFormData[`${roomId}-guest-name`] = guestName || '';
      if (adults !== undefined) bookingFormState.savedFormData[`${roomId}-adults`] = adults || '1';
      if (children !== undefined) bookingFormState.savedFormData[`${roomId}-children`] = children || '0';
    });
    
    console.log('[showCottageSelection] Saved form values before cottage view:', bookingFormState.savedFormData);
  }
  
  // Get dates from booking state
  const checkin = bookingFormState.preFillDates?.checkin;
  const checkout = bookingFormState.preFillDates?.checkout;
  
  if (!checkin || !checkout) {
    alert('Please select dates first');
    return;
  }
  
  // Get available cottages from database
  console.log('Checking cottage availability for dates:', checkin, 'to', checkout);
  
  // Get available cottages using database checks
  const availableCottages = await getAvailableCottagesFromDatabase(checkin, checkout);
  
  console.log('Available cottages:', availableCottages);
  
  // Replace booking modal content with cottage selection view
  const modalContent = document.querySelector('.booking-form-content');
  if (modalContent) {
    modalContent.innerHTML = generateCottageSelectionView(availableCottages, checkin, checkout);
    initializeCottageSelectionHandlers();
  }
}

// Get available cottages from database
async function getAvailableCottagesFromDatabase(checkin, checkout) {
  try {
    // For now, return all cottages (since we don't have booking data yet)
    // This will be filtered once bookings start being created
    const allCottages = ['Standard Cottage', 'Garden Cottage', 'Family Cottage'];
    
    // Check availability for each cottage
    const availableCottages = [];
    
    for (const cottageId of allCottages) {
      // Check if cottage is available for the date range
      const isAvailable = await checkCottageAvailabilityInDatabase(cottageId, checkin, checkout);
      if (isAvailable) {
        availableCottages.push(cottageId);
      }
    }
    
    return availableCottages.length > 0 ? availableCottages : allCottages; // Fallback to all if DB check fails
  } catch (error) {
    console.error('Error getting available cottages:', error);
    // Fallback to showing all cottages
    return ['Standard Cottage', 'Garden Cottage', 'Family Cottage'];
  }
}

// Check if a specific cottage is available in the database
async function checkCottageAvailabilityInDatabase(cottageId, checkin, checkout) {
  try {
    // TODO: Implement actual database check once bookings are being created
    // For now, return true (available)
    return true;
  } catch (error) {
    console.error('Error checking cottage availability:', error);
    // Default to available on error
    return true;
  }
}

// Generate cottage selection view HTML
function generateCottageSelectionView(availableCottages, checkin, checkout) {
  if (availableCottages.length === 0) {
    return `
      <div class="cottage-selection-view">
        <button type="button" class="back-to-booking-btn" onclick="showBookingForm()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
          Back to Booking
        </button>
        
        <div class="no-cottages-available">
          <h3>No Cottages Available</h3>
          <p>No cottages are available for the selected dates (${checkin} to ${checkout}).</p>
          <button type="button" class="btn" onclick="showBookingForm()">Return to Booking</button>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="cottage-selection-view">
      <button type="button" class="back-to-booking-btn" onclick="showBookingForm()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
        Back to Booking
      </button>
      
      <div class="cottage-selection-header">
        <h3>Select Cottages</h3>
        <p>Available for ${checkin} to ${checkout}</p>
      </div>
      
      <div class="cottage-selection-grid">
        ${availableCottages.map(cottageId => {
          const cottageInfo = getCottageInfo(cottageId);
          return `
            <div class="cottage-selection-card ${bookingState.selectedCottages.includes(cottageId) ? 'selected' : ''}" 
                 data-cottage-id="${cottageId}"
                 onclick="toggleCottageSelection('${cottageId}')">
              <div class="cottage-card-image">
                <img src="${cottageInfo.image}" alt="${cottageId}" loading="lazy">
                <div class="cottage-selection-indicator">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </div>
              </div>
              <div class="cottage-card-content">
                <h4>${cottageId}</h4>
                <p class="cottage-price">${cottageInfo.price}</p>
                <p class="cottage-capacity">Up to ${cottageInfo.capacity} guests</p>
                <button class="cottage-select-btn">${bookingState.selectedCottages.includes(cottageId) ? 'Selected' : 'Select Cottage'}</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      ${bookingState.selectedCottages.length > 0 ? `
        <div class="cottage-selection-summary">
          <div>
            <p><strong>${bookingState.selectedCottages.length} cottage${bookingState.selectedCottages.length > 1 ? 's' : ''} selected</strong></p>
            ${(() => {
              const costs = calculateTotalCost();
              if (costs && costs.cottageCost > 0) {
                return `<p class="cost-preview">Additional: ₱${costs.cottageCost.toLocaleString()}</p>`;
              }
              return '';
            })()}
          </div>
          <button type="button" class="btn primary" onclick="addSelectedCottagesToBooking()">
            Add to Booking
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

// Get cottage information
function getCottageInfo(cottageId) {
  const cottageData = {
    'Standard Cottage': {
      image: 'images/cottage_1.JPG',
      price: '₱9,500/night',
      capacity: 6
    },
    'Garden Cottage': {
      image: 'images/cottage_2.JPG',
      price: '₱7,500/night',
      capacity: 4
    },
    'Family Cottage': {
      image: 'images/kina1.jpg',
      price: '₱10,200/night',
      capacity: 7
    }
  };
  
  return cottageData[cottageId] || { image: 'images/kina1.jpg', price: '₱9,500/night', capacity: 6 };
}

// Initialize cottage selection handlers
function initializeCottageSelectionHandlers() {
  // Event handlers are attached via onclick in the generated HTML
}

// Toggle cottage selection
function toggleCottageSelection(cottageId) {
  if (bookingState.selectedCottages.includes(cottageId)) {
    bookingState.removeCottage(cottageId);
  } else {
    bookingState.addCottage(cottageId);
  }
  
  console.log('[toggleCottageSelection] Updated cottages:', bookingState.selectedCottages);
  
  // Update visual state
  const card = document.querySelector(`.cottage-selection-card[data-cottage-id="${cottageId}"]`);
  if (card) {
    if (bookingState.selectedCottages.includes(cottageId)) {
      card.classList.add('selected');
      card.querySelector('.cottage-select-btn').textContent = 'Selected';
    } else {
      card.classList.remove('selected');
      card.querySelector('.cottage-select-btn').textContent = 'Select Cottage';
    }
  }
  
  // Update summary section
  updateCottageSelectionSummary();
}

// Update cottage selection summary
function updateCottageSelectionSummary() {
  const summarySection = document.querySelector('.cottage-selection-summary');
  if (bookingState.selectedCottages.length > 0) {
    if (!summarySection) {
      // Add summary section
      const view = document.querySelector('.cottage-selection-view');
      const summaryHTML = `
        <div class="cottage-selection-summary">
          <p><strong>${bookingState.selectedCottages.length} cottage${bookingState.selectedCottages.length > 1 ? 's' : ''} selected</strong></p>
          <button type="button" class="btn primary" onclick="addSelectedCottagesToBooking()">
            Add to Booking
          </button>
        </div>
      `;
      view.insertAdjacentHTML('beforeend', summaryHTML);
    } else {
      // Update existing summary
      summarySection.querySelector('p strong').textContent = `${bookingState.selectedCottages.length} cottage${bookingState.selectedCottages.length > 1 ? 's' : ''} selected`;
    }
  } else if (summarySection) {
    summarySection.remove();
  }
}

// Add selected cottages to booking and return to form
function addSelectedCottagesToBooking() {
  if (bookingState.selectedCottages.length === 0) {
    alert('Please select at least one cottage');
    return;
  }
  
  // Set flag to indicate we're returning from cottage selection
  bookingFormState.returningFromCottage = true;
  
  // Show booking form again
  showBookingForm();
}

// Show booking form (restore original form)
function showBookingForm() {
  console.warn('[showBookingForm] Called - preserving form state');
  
  const form = document.getElementById('booking-form');
  
  // If returning from cottage, skip saving (use existing savedFormData)
  if (!bookingFormState.returningFromCottage && form) {
    // Save form values to state BEFORE re-rendering
    bookingFormState.savedFormData = {
      guestName: document.getElementById('guest-name')?.value || '',
      email: document.getElementById('email')?.value || '',
      contact: document.getElementById('contact')?.value || '',
      paymentMode: document.getElementById('payment-mode')?.value || '',
      agreement: document.getElementById('agreement')?.checked || false
    };
    
    // Save per-room guest info
    const selectedRooms = bookingFormState.selectedRoomsFromFlow || [];
    selectedRooms.forEach(roomId => {
      const guestName = document.getElementById(`${roomId}-guest-name`)?.value;
      const adults = document.getElementById(`${roomId}-adults`)?.value;
      const children = document.getElementById(`${roomId}-children`)?.value;
      
      if (guestName !== undefined) bookingFormState.savedFormData[`${roomId}-guest-name`] = guestName || '';
      if (adults !== undefined) bookingFormState.savedFormData[`${roomId}-adults`] = adults || '1';
      if (children !== undefined) bookingFormState.savedFormData[`${roomId}-children`] = children || '0';
    });
    
    console.log('[showBookingForm] Saved to state (from form):', bookingFormState.savedFormData);
  } else if (bookingFormState.returningFromCottage) {
    console.log('[showBookingForm] Returning from cottage - using existing saved state:', bookingFormState.savedFormData);
  }
  
  // Re-render form
  const formContent = document.querySelector('.booking-form-content');
  if (formContent && bookingFormState.reservationType) {
    formContent.innerHTML = renderFormFields(bookingFormState.reservationType);
    initializeForm();
    
    // Restore values from state
    if (bookingFormState.savedFormData) {
      Object.entries(bookingFormState.savedFormData).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = value;
          } else {
            input.value = value;
          }
          // Trigger change event
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      console.log('[showBookingForm] Form values restored from state');
    }
    
    // Reset the flag after restoring
    bookingFormState.returningFromCottage = false;
  }
}

// Make functions globally available
window.toggleAddCottage = showCottageSelection;
window.showCottageSelection = showCottageSelection;
window.toggleCottageSelection = toggleCottageSelection;
window.addSelectedCottagesToBooking = addSelectedCottagesToBooking;
window.showBookingForm = showBookingForm;

// Toggle add room to cottage booking
function toggleAddRoom() {
  bookingFormState.addRoomToCottage = !bookingFormState.addRoomToCottage;
  const field = document.getElementById('room-overnight-field');
  const button = document.querySelector('.add-option-toggle');
  
  if (bookingFormState.addRoomToCottage) {
    field.style.display = 'block';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Remove Room from Booking
    `;
  } else {
    field.style.display = 'none';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Add Room for Overnight Stay
    `;
  }
}

// Initialize form with event listeners
function initializeForm() {
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.min = today;
  });
  
  // Pre-fill main booker info from logged-in user
  const authUser = localStorage.getItem('auth_user');
  if (authUser) {
    try {
      const user = JSON.parse(authUser);
      const nameInput = document.getElementById('guest-name');
      const emailInput = document.getElementById('email');
      
      if (nameInput && !nameInput.value && user.firstName && user.lastName) {
        nameInput.value = `${user.firstName} ${user.lastName}`;
      }
      if (emailInput && !emailInput.value && user.email) {
        emailInput.value = user.email;
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
    }
  }
  
  // Pre-fill dates if provided
  if (bookingFormState.preFillDates) {
    if (bookingFormState.preFillDates.checkin && bookingFormState.preFillDates.checkout) {
      // Room booking - pre-fill check-in and check-out
      const checkinInput = document.getElementById('checkin-date');
      const checkoutInput = document.getElementById('checkout-date');
      if (checkinInput) {
        checkinInput.value = bookingFormState.preFillDates.checkin;
        console.log('Pre-filled checkin date:', checkinInput.value);
      }
      if (checkoutInput) {
        checkoutInput.value = bookingFormState.preFillDates.checkout;
        console.log('Pre-filled checkout date:', checkoutInput.value);
      }
    } else if (bookingFormState.preFillDates.date) {
      // Cottage or function hall - pre-fill single date
      const dateInput = document.getElementById('cottage-date') || document.getElementById('event-date');
      if (dateInput) dateInput.value = bookingFormState.preFillDates.date;
    }
  }
  
  // Auto-calculate nights for room booking
  const checkinInput = document.getElementById('checkin-date');
  const checkoutInput = document.getElementById('checkout-date');
  const nightsDisplay = document.getElementById('nights-display');
  
  if (checkinInput && checkoutInput && nightsDisplay) {
    const calculateNights = () => {
      const checkin = new Date(checkinInput.value);
      const checkout = new Date(checkoutInput.value);
      
      if (checkin && checkout && checkout > checkin) {
        const diffTime = Math.abs(checkout - checkin);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        nightsDisplay.textContent = diffDays;
        // Update room availability when dates change
        updateRoomAvailability();
      } else {
        nightsDisplay.textContent = '0';
      }
    };
    
    checkinInput.addEventListener('change', calculateNights);
    checkoutInput.addEventListener('change', calculateNights);
    
    // Calculate nights on initial load if dates are pre-filled
    if (checkinInput.value && checkoutInput.value) {
      calculateNights();
    }
  }
  
  // Handle room selection based on number of rooms
  const numRoomsSelect = document.getElementById('num-rooms');
  
  if (numRoomsSelect) {
    numRoomsSelect.addEventListener('change', (e) => {
      const numRooms = parseInt(e.target.value);
      
      // Show instruction
      const instruction = document.createElement('div');
      instruction.className = 'room-selection-instruction';
      instruction.textContent = `Please select ${numRooms} room${numRooms > 1 ? 's' : ''}`;
      
      const existingInstruction = document.querySelector('.room-selection-instruction');
      if (existingInstruction) {
        existingInstruction.remove();
      }
      
      document.getElementById('room-selection-field').appendChild(instruction);
    });
  }
  
  // Real-time validation
  document.querySelectorAll('.form-input, .form-select').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => clearFieldError(input));
  });
  
  // Update total guests display if coming from room selection flow
  if (bookingFormState.selectedRoomsFromFlow && bookingFormState.selectedRoomsFromFlow.length > 0) {
    updateTotalGuests();
  }
  
  // Load terms and conditions
  loadTermsAndConditions();
}

// Toggle terms expansion
window.toggleTermsExpansion = function() {
  const termsContent = document.getElementById('terms-content');
  const toggleBtn = document.getElementById('terms-toggle-btn');
  
  if (termsContent && toggleBtn) {
    const isCollapsed = termsContent.classList.contains('collapsed');
    
    if (isCollapsed) {
      termsContent.classList.remove('collapsed');
      toggleBtn.classList.add('expanded');
    } else {
      termsContent.classList.add('collapsed');
      toggleBtn.classList.remove('expanded');
    }
  }
};

// Fetch and display terms from Supabase
async function loadTermsAndConditions() {
  try {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const apiBase = isProduction ? 'https://kina-resort-main-production.up.railway.app/api' : 'http://localhost:3000/api';
    const response = await fetch(`${apiBase}/settings/booking_terms`);
    const data = await response.json();
    
    if (data.success && data.data) {
      const termsInner = document.getElementById('terms-inner');
      if (termsInner) {
        termsInner.innerHTML = data.data.content;
      }
    }
  } catch (error) {
    console.error('Failed to load terms:', error);
    const termsInner = document.getElementById('terms-inner');
    if (termsInner) {
      termsInner.innerHTML = '<p>Failed to load terms. Please try again.</p>';
    }
  }
}

// Validate individual field
function validateField(field) {
  const value = field.value.trim();
  const fieldName = field.name;
  let isValid = true;
  let errorMessage = '';
  
  // Special handling for pre-filled readonly date fields
  if (field.hasAttribute('readonly') && 
      (fieldName === 'checkinDate' || fieldName === 'checkoutDate') &&
      bookingFormState.preFillDates) {
    // Dates are pre-filled via state, skip validation if empty since they'll be populated via state
    if (!value && field.hasAttribute('required')) {
      console.warn(`Readonly date field ${fieldName} is required but empty. Checking state...`);
      console.log('bookingFormState.preFillDates:', bookingFormState.preFillDates);
      // Don't mark as invalid if preFillDates exists - the value will be used from state
      return true;
    }
  }
  
  // Required field validation (but not for readonly date fields with preFillDates)
  if (field.hasAttribute('required') && !value) {
    // Skip validation for readonly date fields when preFillDates exists
    const isReadonlyDate = field.hasAttribute('readonly') && 
                           (fieldName === 'checkinDate' || fieldName === 'checkoutDate') &&
                           bookingFormState.preFillDates;
    
    if (!isReadonlyDate) {
    isValid = false;
    errorMessage = 'This field is required';
    }
  }
  
  // Email validation
  if (fieldName === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    }
  }
  
  // Phone validation
  if (fieldName === 'contact' && value) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    }
  }
  
  // Date validation
  if (field.type === 'date' && value) {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      isValid = false;
      errorMessage = 'Date cannot be in the past';
    }
  }
  
  // Check-out date validation
  if (fieldName === 'checkoutDate' && value) {
    const checkinDate = document.getElementById('checkin-date')?.value;
    if (checkinDate && value <= checkinDate) {
      isValid = false;
      errorMessage = 'Check-out date must be after check-in date';
    }
  }
  
  // Time validation
  if (field.type === 'time' && value) {
    const startTime = document.getElementById('start-time')?.value;
    const endTime = document.getElementById('end-time')?.value;
    
    if (fieldName === 'endTime' && startTime && value <= startTime) {
      isValid = false;
      errorMessage = 'End time must be after start time';
    }
  }
  
  // Number validation
  if (field.type === 'number' && value) {
    const min = field.getAttribute('min');
    if (min && parseInt(value) < parseInt(min)) {
      isValid = false;
      errorMessage = `Value must be at least ${min}`;
    }
  }
  
  // Update field appearance and error message
  if (isValid) {
    field.classList.remove('error');
    clearFieldError(field);
  } else {
    field.classList.add('error');
    showFieldError(field, errorMessage);
  }
  
  return isValid;
}

// Show field error
function showFieldError(field, message) {
  // Handle both element and string field names
  let fieldId = typeof field === 'string' ? field : (field?.id || field?.name || 'unknown');
  
  // Convert name to ID format if using name (hyphens instead of camelCase)
  if (fieldId.includes('paymentMode') || fieldId.includes('checkinDate') || fieldId.includes('checkoutDate') || fieldId.includes('endTime') || fieldId.includes('startTime')) {
    // Convert camelCase to kebab-case
    fieldId = fieldId.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  const errorElement = document.getElementById(`${fieldId}-error`);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    console.warn(`Validation error on ${fieldId}: ${message}`);
  } else {
    // Fallback: try to find element by name instead
    console.warn('Error element not found for field:', fieldId, 'Message:', message);
  }
}

// Clear field error
function clearFieldError(field) {
  // Handle both element and string field names
  let fieldId = typeof field === 'string' ? field : (field?.id || field?.name || 'unknown');
  
  // Convert name to ID format if using name (hyphens instead of camelCase)
  if (fieldId.includes('paymentMode') || fieldId.includes('checkinDate') || fieldId.includes('checkoutDate') || fieldId.includes('endTime') || fieldId.includes('startTime')) {
    // Convert camelCase to kebab-case
    fieldId = fieldId.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  const errorElement = document.getElementById(`${fieldId}-error`);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  
  if (field && field.classList) {
  field.classList.remove('error');
  }
}

// Validate entire form
function validateForm() {
  let isValid = true;
  console.log('=== Form Validation Details ===');
  console.log('Reservation type:', bookingFormState.reservationType);
  
  // Validate all input fields
  document.querySelectorAll('.form-input, .form-select').forEach(field => {
    const fieldValid = validateField(field);
    if (!fieldValid) {
      console.error(`Validation failed for field: ${field.id || field.name}`, 
                   `Value: "${field.value}", Required: ${field.required || 'N/A'}`);
      isValid = false;
    } else {
      console.log(`Validation passed: ${field.id || field.name}`);
    }
  });
  
  // Validate checkboxes/radio buttons
  if (bookingFormState.reservationType === 'room') {
    // If rooms selected from flow, skip checkbox validation
    if (bookingFormState.selectedRoomsFromFlow?.length > 0) {
      console.log('Rooms pre-selected from flow:', bookingFormState.selectedRoomsFromFlow);
    } else {
    const selectedRooms = document.querySelectorAll('input[name="selectedRooms"]:checked');
    const numRooms = parseInt(document.getElementById('num-rooms')?.value || '1');
      
      console.log(`Room validation: ${selectedRooms.length} selected, ${numRooms} expected`);
    
    if (selectedRooms.length !== numRooms) {
      isValid = false;
        const numRoomsField = document.getElementById('num-rooms');
        if (numRoomsField) {
          showFieldError('num-rooms', `Please select exactly ${numRooms} room${numRooms > 1 ? 's' : ''}`);
        }
      }
    }
  }
  
  if (bookingFormState.reservationType === 'cottage') {
    const selectedCottages = document.querySelectorAll('input[name="selectedCottages"]:checked');
    if (selectedCottages.length === 0) {
      isValid = false;
      showFieldError('cottage-selection-error', 'Please select at least one cottage');
    }
  }
  
  if (bookingFormState.reservationType === 'function-hall') {
    const selectedHall = document.querySelector('input[name="selectedHall"]:checked');
    if (!selectedHall) {
      isValid = false;
      showFieldError('hall-selection-error', 'Please select a function hall');
    }
  }
  
  // Validate agreement checkbox
  const agreement = document.getElementById('agreement');
  if (!agreement?.checked) {
    isValid = false;
    showFieldError('agreement', 'You must agree to the booking policy');
  }
  
  return isValid;
}

// Save booking to localStorage
async function saveBookingToSupabase(bookingData) {
  console.log('saveBookingToSupabase called with:', bookingData);
  
  try {
    const token = localStorage.getItem('auth_token');
    console.log('Auth token present:', !!token);
    
    if (!token) {
      throw new Error('User not authenticated');
    }

    // Calculate total cost
    const costs = calculateTotalCost();
    const totalCost = costs ? costs.total : 0;
    console.log('Calculated total cost:', totalCost);

    // Prepare booking payload
    const bookingPayload = {
      packageId: 1, // Standard Room package ID
      checkIn: bookingData.dates.checkin,
      checkOut: bookingData.dates.checkout,
      guests: bookingData.guests, // Send the full guests object with adults/children
      totalCost: totalCost,
      paymentMode: bookingData.payment,
      perRoomGuests: bookingData.perRoomGuests || [],
      contactNumber: bookingData.guestInfo.contact,
      specialRequests: bookingData.selections.specialRequests || '',
      selectedCottages: bookingState.selectedCottages || []
    };
    
    console.log('Booking payload:', JSON.stringify(bookingPayload, null, 2));

    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const apiBase = isProduction ? 'https://kina-resort-main-production.up.railway.app/api' : 'http://localhost:3000/api';
    console.log('Sending request to', `${apiBase}/bookings`);
    const response = await fetch(`${apiBase}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookingPayload)
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);

    if (!result.success) {
      throw new Error(result.error || 'Failed to save booking');
    }

    return result.data;
  } catch (error) {
    console.error('Save booking error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide user-friendly error message
    if (error.message.includes('backend server') || error.message === 'Failed to fetch') {
      throw new Error('Backend server is not running. Please start the server with "npm run server" and try again.');
    }
    
    throw error;
  }
}

// Helper functions to extract booking information
function getPackageName(bookingData) {
  if (bookingData.reservationType === 'room') {
    return bookingData.selections.rooms.join(', ') || 'Room Booking';
  } else if (bookingData.reservationType === 'cottage') {
    return bookingData.selections.cottages.join(', ') || 'Cottage Booking';
  } else if (bookingData.reservationType === 'function-hall') {
    return bookingData.selections.hall || 'Function Hall Booking';
  }
  return 'Booking';
}

function getCheckInDate(bookingData) {
  if (bookingData.reservationType === 'room') {
    return bookingData.dates.checkin;
  } else if (bookingData.reservationType === 'cottage') {
    return bookingData.dates.date;
  } else if (bookingData.reservationType === 'function-hall') {
    return bookingData.dates.eventDate;
  }
  return new Date().toISOString().split('T')[0];
}

function getCheckOutDate(bookingData) {
  if (bookingData.reservationType === 'room') {
    return bookingData.dates.checkout;
  } else if (bookingData.reservationType === 'cottage') {
    return bookingData.dates.date; // Same day for cottage
  } else if (bookingData.reservationType === 'function-hall') {
    return bookingData.dates.eventDate; // Same day for function hall
  }
  return new Date().toISOString().split('T')[0];
}

function getTotalGuests(bookingData) {
  if (bookingData.reservationType === 'room') {
    return parseInt(bookingData.guests.adults) + parseInt(bookingData.guests.children);
  } else if (bookingData.reservationType === 'cottage') {
    return parseInt(bookingData.guests.adults) + parseInt(bookingData.guests.children);
  } else if (bookingData.reservationType === 'function-hall') {
    return parseInt(bookingData.guests.total);
  }
  return 1;
}

// Submit booking form
window.submitBooking = async function(event) {
  event.preventDefault();
  
  console.log('=== Booking Submission Started ===');
  console.log('Form validation starting...');
  
  if (!validateForm()) {
    console.error('Form validation failed');
    // Scroll to first error
    const firstError = document.querySelector('.form-input.error, .form-select.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  console.log('Form validation passed');
  console.log('Collecting form data...');
  
  // Collect form data
  const formData = new FormData(event.target);
  const bookingData = {
    reservationType: bookingFormState.reservationType,
    guestInfo: {
      name: formData.get('guestName'),
      email: formData.get('email'),
      contact: formData.get('contact')
    },
    dates: {},
    guests: {},
    selections: {},
    payment: formData.get('paymentMode'),
    agreement: formData.get('agreement') === 'on'
  };
  
  // Add type-specific data
  if (bookingFormState.reservationType === 'room') {
    // Use pre-filled dates if available (from date-first flow), otherwise from form
    const checkIn = bookingFormState.preFillDates?.checkin || formData.get('checkinDate');
    const checkOut = bookingFormState.preFillDates?.checkout || formData.get('checkoutDate');
    
    bookingData.dates = {
      checkin: checkIn,
      checkout: checkOut,
      nights: document.getElementById('nights-display')?.textContent || '0'
    };
    
    // Calculate total guests from per-room guests (or use main guests field if no per-room data)
    let totalAdults = 0;
    let totalChildren = 0;
    
    if (bookingFormState.selectedRoomsFromFlow?.length > 0) {
      // Calculate from per-room guests
      bookingFormState.selectedRoomsFromFlow.forEach(roomId => {
        const adultsInput = document.getElementById(`${roomId}-adults`);
        const childrenInput = document.getElementById(`${roomId}-children`);
        totalAdults += parseInt(adultsInput?.value || 0);
        totalChildren += parseInt(childrenInput?.value || 0);
      });
    } else {
      // Fallback to main form fields
      totalAdults = parseInt(formData.get('adults') || 0);
      totalChildren = parseInt(formData.get('children') || 0);
    }
    
    bookingData.guests = {
      adults: totalAdults,
      children: totalChildren
    };
    // Get selected rooms from flow or form
    const selectedRooms = bookingFormState.selectedRoomsFromFlow || Array.from(formData.getAll('selectedRooms'));
    
    bookingData.selections = {
      rooms: selectedRooms,
      cottages: bookingFormState.addCottageToRoom ? Array.from(formData.getAll('selectedCottages')) : []
    };
    
    // Collect per-room guest details
    const perRoomGuests = [];
    if (bookingFormState.selectedRoomsFromFlow?.length > 0) {
      bookingFormState.selectedRoomsFromFlow.forEach(roomId => {
        const guestNameInput = document.getElementById(`${roomId}-guest-name`);
        const adultsInput = document.getElementById(`${roomId}-adults`);
        const childrenInput = document.getElementById(`${roomId}-children`);
        
        perRoomGuests.push({
          roomId: roomId,
          guestName: guestNameInput?.value || bookingData.guestInfo.name, // Default to main booker
          adults: parseInt(adultsInput?.value || 1),
          children: parseInt(childrenInput?.value || 0)
        });
      });
    }
    
    // Add to booking data
    if (perRoomGuests.length > 0) {
      bookingData.perRoomGuests = perRoomGuests;
    }
  } else if (bookingFormState.reservationType === 'cottage') {
    bookingData.dates = {
      date: formData.get('cottageDate'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime')
    };
    bookingData.guests = {
      adults: formData.get('cottageAdults'),
      children: formData.get('cottageChildren')
    };
    bookingData.selections = {
      cottages: Array.from(formData.getAll('selectedCottages')),
      rooms: bookingFormState.addRoomToCottage ? Array.from(formData.getAll('selectedRooms')) : []
    };
    
    if (bookingFormState.addRoomToCottage) {
      bookingData.dates.roomCheckin = formData.get('roomCheckin');
      bookingData.dates.roomCheckout = formData.get('roomCheckout');
    }
  } else if (bookingFormState.reservationType === 'function-hall') {
    bookingData.dates = {
      eventDate: formData.get('eventDate'),
      startTime: formData.get('eventStart'),
      endTime: formData.get('eventEnd')
    };
    bookingData.selections = {
      hall: formData.get('selectedHall'),
      eventType: formData.get('eventType'),
      specialRequests: formData.get('specialRequests')
    };
    bookingData.guests = {
      total: formData.get('eventGuests')
    };
  }
  
  // Save booking to Supabase
  console.log('=== Attempting to save booking to Supabase ===');
  console.log('Booking data:', JSON.stringify(bookingData, null, 2));
  
  try {
    console.log('Calling saveBookingToSupabase...');
    const savedBooking = await saveBookingToSupabase(bookingData);
    console.log('Booking saved successfully:', savedBooking);
    showBookingSuccess(bookingData, savedBooking);
    console.log('=== Booking Submission Complete ===');
  } catch (error) {
    console.error('Failed to save booking:', error);
    console.error('Error details:', error.message);
    alert(`Failed to complete booking: ${error.message}\n\nPlease try again or contact support.`);
    return;
  }
}

// Show booking success
function showBookingSuccess(bookingData, savedBooking) {
  const packageName = bookingData.reservationType === 'room' ? 'Standard Room' : 
                      bookingData.reservationType === 'cottage' ? 'Cottage' : 'Function Hall';
  
  // Extract selected rooms and cottages
  const selectedRooms = bookingData.selections.rooms || [];
  // Use bookingState for cottages since it's managed there
  const selectedCottages = bookingState.selectedCottages || bookingData.selections.cottages || [];
  
  // Build rooms list
  let roomsList = '';
  if (selectedRooms.length > 0) {
    roomsList = `
      <div class="success-section">
        <h4>Selected Rooms</h4>
        <ul class="booking-items-list">
          ${selectedRooms.map(roomId => {
            const roomGuest = bookingData.perRoomGuests?.find(rg => rg.roomId === roomId);
            return `
              <li>
                <strong>${roomId}</strong>
                ${roomGuest ? `<br><small>Guest: ${roomGuest.guestName}, Adults: ${roomGuest.adults}, Children: ${roomGuest.children}</small>` : ''}
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
  }
  
  // Build cottages list
  let cottagesList = '';
  if (selectedCottages.length > 0) {
    cottagesList = `
      <div class="success-section">
        <h4>Selected Cottages</h4>
        <ul class="booking-items-list">
          ${selectedCottages.map(cottageId => `<li><strong>${cottageId}</strong></li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  const successHTML = `
    <div class="booking-success-modal">
      <div class="success-content">
        <div class="success-icon-outer">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #4caf50;">
            <path d="M9 12l2 2 4-4"></path>
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        </div>
        <h3>Booking Confirmed!</h3>
        <p>Your reservation has been successfully created.</p>
        
        <div class="booking-summary">
          <h4>Booking Summary</h4>
          <div class="summary-details">
            <div class="summary-item">
              <span>Booking ID:</span>
              <strong>#${savedBooking.id}</strong>
            </div>
            <div class="summary-item">
              <span>Package:</span>
              <strong>${packageName}</strong>
            </div>
            ${bookingData.dates.checkin ? `
              <div class="summary-item">
                <span>Check-in:</span>
                <strong>${bookingData.dates.checkin}</strong>
              </div>
              <div class="summary-item">
                <span>Check-out:</span>
                <strong>${bookingData.dates.checkout}</strong>
              </div>
            ` : ''}
            ${bookingData.dates.nights ? `
              <div class="summary-item">
                <span>Nights:</span>
                <strong>${bookingData.dates.nights}</strong>
              </div>
            ` : ''}
            <div class="summary-item">
              <span>Total Guests:</span>
              <strong>${bookingData.guests.adults} Adults, ${bookingData.guests.children} Children</strong>
            </div>
            <div class="summary-item">
              <span>Total Cost:</span>
              <strong>₱${savedBooking.total_cost?.toLocaleString() || 'N/A'}</strong>
            </div>
            <div class="summary-item">
              <span>Payment:</span>
              <strong>${bookingData.payment}</strong>
            </div>
          </div>
          
          ${roomsList}
          ${cottagesList}
        </div>
        
        <div class="success-actions">
          <button class="btn primary" onclick="window.goToMyBookings()">View My Bookings</button>
          <button class="btn" onclick="closeBookingModal()">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', successHTML);
  
  // Remove floating button when showing success
  const floatingBtn = document.getElementById('floating-continue-btn');
  if (floatingBtn) {
    floatingBtn.remove();
  }
  
  // Close main modal
  setTimeout(() => {
    closeBookingModal();
  }, 1000);
}

// Global function for navigating to My Bookings
window.goToMyBookings = function() {
  document.querySelector('.booking-success-modal')?.remove();
  location.hash = '#/my-bookings';
}

// Handle escape key
function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeBookingModal();
  }
}

// Show policy (placeholder)
function showPolicy() {
  alert('Booking and Cancellation Policy:\n\n- Cancellations made 48 hours before check-in: Full refund\n- Cancellations made 24-48 hours before check-in: 50% refund\n- Cancellations made less than 24 hours before check-in: No refund\n- No-shows: No refund\n\nFor more details, please contact our reservations team.');
}

// Calendar integration functions
function openCalendarForCheckin() {
  // Store current booking modal state
  window.bookingModalCalendarMode = 'checkin';
  
  // Only store actual date values, not empty strings
  const checkinValue = document.getElementById('checkin-date')?.value;
  const checkoutValue = document.getElementById('checkout-date')?.value;
  
  window.bookingModalCurrentDates = {
    checkin: checkinValue && checkinValue.trim() !== '' ? checkinValue : null,
    checkout: checkoutValue && checkoutValue.trim() !== '' ? checkoutValue : null
  };
  
  // Open calendar modal for room booking
  if (window.openCalendarModal) {
    window.openCalendarModal('Room Booking', 15, 'rooms');
  }
}

function openCalendarForCheckout() {
  // Store current booking modal state
  window.bookingModalCalendarMode = 'checkout';
  
  // Only store actual date values, not empty strings
  const checkinValue = document.getElementById('checkin-date')?.value;
  const checkoutValue = document.getElementById('checkout-date')?.value;
  
  window.bookingModalCurrentDates = {
    checkin: checkinValue && checkinValue.trim() !== '' ? checkinValue : null,
    checkout: checkoutValue && checkoutValue.trim() !== '' ? checkoutValue : null
  };
  
  // Open calendar modal for room booking
  if (window.openCalendarModal) {
    window.openCalendarModal('Room Booking', 15, 'rooms');
  }
}

function updateBookingDates(checkinDate, checkoutDate) {
  const checkinInput = document.getElementById('checkin-date');
  const checkoutInput = document.getElementById('checkout-date');
  
  if (checkinInput && checkinDate) {
    checkinInput.value = checkinDate;
  }
  
  if (checkoutInput && checkoutDate) {
    checkoutInput.value = checkoutDate;
  }
  
  // Trigger change events to update nights calculation
  if (checkinInput) checkinInput.dispatchEvent(new Event('change'));
  if (checkoutInput) checkoutInput.dispatchEvent(new Event('change'));
}

// Make functions globally available
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.changeReservationType = changeReservationType;
window.toggleAddCottage = toggleAddCottage;
window.submitBooking = submitBooking;
window.showPolicy = showPolicy;

// Calendar integration functions
window.openCalendarForCheckin = openCalendarForCheckin;
window.openCalendarForCheckout = openCalendarForCheckout;
window.updateBookingDates = updateBookingDates;

