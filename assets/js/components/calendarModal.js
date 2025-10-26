// Calendar Modal Component for Package Availability and Date Selection
// No external libraries needed - using vanilla JavaScript

let currentModal = null;
let calendarState = {
  packageCategory: 'rooms',
  packageTitle: '',
  selectedCheckin: null,
  selectedCheckout: null,
  selectionStep: 1, // 1 = selecting check-in, 2 = selecting check-out
  modifyingDate: null, // 'checkin', 'checkout', or null for normal flow
  undoStack: [] // Stack to track previous states for undo functionality
};

// Mock data for demonstration - in real app this would come from API
// Availability patterns:
// - Weekdays: Mostly available (good for testing)
// - Weekends: Mostly booked (realistic demand)
// - Holidays: Booked periods (Christmas week, summer peak)
// - Maintenance: Random 5% of dates
// - Most other dates: Available for testing
const mockReservationData = {
  'Standard Room': 15,
  'Ocean View Room': 12,
  'Deluxe Suite': 18,
  'Premium King': 20,
  'Beachfront Cottage': 8,
  'Garden View Cottage': 10,
  'Family Cottage': 14,
  'Grand Function Hall': 5,
  'Intimate Function Hall': 7
};

// Cache for availability data to avoid excessive API calls
let availabilityCache = new Map();

// Track which months have been fully loaded to prevent re-fetching
let loadedMonths = new Set();

// Debounce timer for month navigation to prevent rapid API calls
let monthNavigationTimer = null;

// Get availability status for dates (now integrated with database)
async function getDateStatus(date, packageId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Past dates
  if (date < today) {
    return { status: 'past', availableCount: 0 };
  }
  
  // Today is always marked as "today"
  if (date.toDateString() === today.toDateString()) {
    return { status: 'today', availableCount: 4 };
  }
  
  // Check cache first
  const dateString = formatDateForInput(date);
  const cacheKey = `${packageId}-${dateString}`;
  
  if (availabilityCache.has(cacheKey)) {
    console.log(`[Calendar] Cache hit for ${dateString}`);
    return availabilityCache.get(cacheKey);
  }
  
  try {
    // Fetch availability data from backend
    const { checkAvailability } = await import('../utils/api.js');
    
    // Get availability for a date range that includes this date
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    const checkInStr = startDate.toISOString().split('T')[0];
    const checkOutStr = endDate.toISOString().split('T')[0];
    
    console.log(`[Calendar] Fetching availability for ${dateString} (package ${packageId}, category: ${calendarState.packageCategory})`);
    
    // Pass category to get correct bookings
    const result = await checkAvailability(packageId, checkInStr, checkOutStr, calendarState.packageCategory);
    
    if (result && result.dateAvailability && result.dateAvailability[dateString]) {
      const dateData = result.dateAvailability[dateString];
      
      if (packageId === 1) {
        // Room package - return availability count
        const availableCount = dateData.availableCount || 0;
        const bookedCount = dateData.bookedCount || 0;
        
        console.log(`[Calendar] ${dateString}: ${availableCount} available, ${bookedCount} booked`);
        
        const status = {
          status: availableCount === 0 ? 'booked-all' : 
                  availableCount === 4 ? 'available-all' : 
                  `available-${availableCount}`,
          availableCount: availableCount,
          bookedCount: bookedCount,
          availableRooms: dateData.availableRooms || [],
          bookedRooms: dateData.bookedRooms || []
        };
        
        availabilityCache.set(cacheKey, status);
        return status;
      } else {
        // Cottage or function hall
        const isBooked = dateData.isBooked || false;
        const status = {
          status: isBooked ? 'cottage-booked' : 'cottage-available',
          isBooked: isBooked,
          availableCottages: dateData.availableCottages || [],
          bookedCottages: dateData.bookedCottages || []
        };
        
        availabilityCache.set(cacheKey, status);
        return status;
      }
    }
    
    // Default to available if no data returned
    console.log(`[Calendar] No data for ${dateString}, defaulting to available`);
    const defaultStatus = packageId === 1 ? 
      { status: 'available-all', availableCount: 4, bookedCount: 0 } :
      { status: 'cottage-available', isBooked: false };
    
    availabilityCache.set(cacheKey, defaultStatus);
    return defaultStatus;
    
  } catch (error) {
    console.error(`[Calendar] Error fetching availability for ${dateString}:`, error);
    console.error(`[Calendar] Error details:`, error.message);
    
    // Default to available on error, but log the issue
    const defaultStatus = packageId === 1 ? 
      { status: 'available-all', availableCount: 4, bookedCount: 0 } :
      { status: 'cottage-available', isBooked: false };
    
    availabilityCache.set(cacheKey, defaultStatus);
    
    // Show user-friendly message if backend is unavailable
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('fetch'))) {
      console.warn('[Calendar] Backend server may be unavailable. Calendar showing default availability.');
    }
    
    return defaultStatus;
  }
}

// Generate calendar HTML for a given month/year
async function generateCalendarHTML(year, month, packageTitle, packageId) {
  const date = new Date(year, month, 1);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Calculate max year (one year from current date)
  const maxYear = currentYear + 1;
  const maxMonth = currentMonth;
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = date.getDay();
  
  let calendarHTML = `
    <div class="calendar-header">
      <button class="calendar-nav-btn" onclick="navigateMonth(-1)" ${year <= currentYear && month <= currentMonth ? 'disabled' : ''}>
        <span>‹</span>
      </button>
      <div class="calendar-month-year">
        <select class="calendar-month-select" onchange="changeMonth(this.value)">
          ${generateMonthOptions(month)}
        </select>
        <select class="calendar-year-select" onchange="changeYear(this.value)">
          ${generateYearOptions(year, currentYear, maxYear)}
        </select>
      </div>
      <button class="calendar-nav-btn" onclick="navigateMonth(1)" ${year >= maxYear && month >= maxMonth ? 'disabled' : ''}>
        <span>›</span>
      </button>
    </div>
    <div class="calendar-selection-instruction">
      ${getSelectionInstruction()}
    </div>
    <div class="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
  `;
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarHTML += '<div class="calendar-date empty"></div>';
  }
  
  // Batch availability check for the entire month at once
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0); // Last day of month
  const startDateStr = formatDateForInput(firstDate);
  const endDateStr = formatDateForInput(lastDate);
  
  // Performance tracking
  const perfStart = performance.now();
  const perfStats = {
    fetchTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalDates: daysInMonth
  };
  
  const monthKey = `${packageId}-${year}-${month}`;
  
  // Check if this month is already fully loaded
  if (loadedMonths.has(monthKey)) {
    if (localStorage.getItem('DEBUG_CALENDAR') === 'true') {
      console.log(`[Calendar Perf] Month ${year}-${month} already loaded (cache hit)`);
    }
  } else {
    if (localStorage.getItem('DEBUG_CALENDAR') === 'true') {
      console.log(`[Calendar] Fetching availability for entire month: ${startDateStr} to ${endDateStr}`);
    }
    
    // Fetch availability for entire month in one request
    let monthAvailability = {};
    const fetchStart = performance.now();
    try {
      const { checkAvailability } = await import('../utils/api.js');
      // Pass category to filter bookings appropriately
      const result = await checkAvailability(packageId, startDateStr, endDateStr, calendarState.packageCategory);
      perfStats.fetchTime = performance.now() - fetchStart;
      
      if (result && result.dateAvailability) {
        monthAvailability = result.dateAvailability;
        if (localStorage.getItem('DEBUG_CALENDAR') === 'true') {
          console.log(`[Calendar] Retrieved availability for ${Object.keys(monthAvailability).length} dates`);
        }
        
        // Pre-populate cache with all dates
        Object.keys(monthAvailability).forEach(dateStr => {
          const dateData = monthAvailability[dateStr];
          const cacheKey = `${packageId}-${dateStr}`;
          availabilityCache.set(cacheKey, dateData);
        });
        
        // Mark this month as loaded
        loadedMonths.add(monthKey);
      }
    } catch (error) {
      console.error('[Calendar] Error fetching month availability:', error);
      if (localStorage.getItem('DEBUG_CALENDAR') === 'true') {
        console.error('[Calendar] Error details:', error.message, error.stack);
      } else {
        console.warn('[Calendar] Backend server may be unavailable. Check if server is running on http://localhost:3000');
      }
      perfStats.fetchTime = performance.now() - fetchStart;
      // Don't mark month as loaded on error, allow retry
    }
  }
  
  // Now generate status for each day
  const statuses = [];
  const dayData = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dateString = formatDateForInput(currentDate);
    dayData.push({ day, dateString, currentDate });
    
    // Get status from cache or use default
    const cacheKey = `${packageId}-${dateString}`;
    const cachedStatus = availabilityCache.get(cacheKey);
    
    if (cachedStatus) {
      statuses.push(cachedStatus);
    } else {
      // Generate default status
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let defaultStatus;
      if (currentDate < today) {
        defaultStatus = { status: 'past', availableCount: 0 };
      } else if (currentDate.toDateString() === today.toDateString()) {
        defaultStatus = { status: 'today', availableCount: 4 };
      } else {
        defaultStatus = packageId === 1 ? 
          { status: 'available-all', availableCount: 4, bookedCount: 0 } :
          { status: 'cottage-available', isBooked: false };
      }
      statuses.push(defaultStatus);
    }
  }
  
  // Now generate HTML for each day
  for (let i = 0; i < daysInMonth; i++) {
    const { day, dateString, currentDate } = dayData[i];
    const statusData = statuses[i];
    
    // Extract status string and availability count
    const statusType = typeof statusData === 'object' ? statusData.status : statusData;
    const availableCount = typeof statusData === 'object' ? (statusData.availableCount || 0) : 0;
    
    // Determine additional classes for selection state
    let additionalClasses = '';
    
    // Normalize dates for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalizedCurrentDate = new Date(currentDate);
    normalizedCurrentDate.setHours(0, 0, 0, 0);
    const isPast = currentDate < today;
    const isToday = currentDate.toDateString() === today.toDateString();
    
    // Override status for past dates and today
    let finalStatusType = statusType;
    if (isPast) {
      finalStatusType = 'past';
    } else if (isToday) {
      finalStatusType = 'today';
    }
    
    if (calendarState.selectedCheckin) {
      const normalizedCheckin = new Date(calendarState.selectedCheckin);
      normalizedCheckin.setHours(0, 0, 0, 0);
      if (normalizedCurrentDate.getTime() === normalizedCheckin.getTime()) {
        additionalClasses += ' selected-checkin';
      }
    }
    
    if (calendarState.selectedCheckout) {
      const normalizedCheckout = new Date(calendarState.selectedCheckout);
      normalizedCheckout.setHours(0, 0, 0, 0);
      if (normalizedCurrentDate.getTime() === normalizedCheckout.getTime()) {
        additionalClasses += ' selected-checkout';
      }
    }
    
    // For cottage and function-hall single date selection
    if (calendarState.packageCategory === 'cottages' || calendarState.packageCategory === 'function-halls') {
      if (calendarState.selectedCheckin && !calendarState.selectedCheckout) {
        const normalizedCheckin = new Date(calendarState.selectedCheckin);
        normalizedCheckin.setHours(0, 0, 0, 0);
        if (normalizedCurrentDate.getTime() === normalizedCheckin.getTime()) {
          additionalClasses += ' selected-checkin';
        }
      }
    }
    
    if (isDateInRange(currentDate)) {
      additionalClasses += ' in-range';
    }
    
    // Build tooltip text for availability
    let tooltipText = '';
    if (packageId === 1 && availableCount !== undefined && !isPast) {
      tooltipText = `title="${availableCount} of 4 rooms available"`;
    } else if (statusType && statusType.includes('cottage-booked')) {
      tooltipText = `title="Cottage booked on this date"`;
    } else if (statusType && statusType.includes('cottage')) {
      tooltipText = `title="Cottage available on this date"`;
    }
    
    // Build booked rooms label
    let bookedRoomsLabel = '';
    if (packageId === 1 && !isPast && statusData && statusData.bookedRooms && statusData.bookedRooms.length > 0) {
      // Extract room numbers (A1, A2, etc. from "Room A1", "Room A2" or just "A1", "A2")
      const roomNumbers = statusData.bookedRooms.map(room => {
        // Handle both "Room A1" and "A1" formats
        if (room.startsWith('Room ')) {
          return room.replace('Room ', '');
        }
        return room;
      }).join(', ');
      bookedRoomsLabel = `<div class="booked-rooms-label">${roomNumbers}</div>`;
    }
    
    calendarHTML += `
      <div class="calendar-date ${finalStatusType}${additionalClasses}" 
           data-date="${dateString}" 
           data-datestring="${dateString}"
           data-status="${finalStatusType}"
           data-available-count="${availableCount}"
           ${tooltipText}>
        <span class="date-number">${day}</span>
        ${bookedRoomsLabel}
      </div>
    `;
  }
  
  calendarHTML += '</div>';
  
  // Don't generate buttons in calendar HTML - they're handled separately
  
  // Performance summary logging
  const totalTime = performance.now() - perfStart;
  if (localStorage.getItem('DEBUG_CALENDAR') === 'true') {
    console.log(`[Calendar Perf] Month ${year}-${month}: ${totalTime.toFixed(0)}ms total`);
    if (perfStats.fetchTime > 0) {
      console.log(`  - API fetch: ${perfStats.fetchTime.toFixed(0)}ms`);
      console.log(`  - Generation: ${(totalTime - perfStats.fetchTime).toFixed(0)}ms`);
    }
    console.log(`  - Cache hits: ${perfStats.cacheHits}/${perfStats.totalDates}`);
  }
  
  return calendarHTML;
}

// Get selection instruction based on package type and current state
function getSelectionInstruction() {
  // Check if we're modifying a specific date from booking modal
  if (calendarState.modifyingDate) {
    if (calendarState.modifyingDate === 'checkin') {
      return 'Click a date to select your check-in date';
    } else if (calendarState.modifyingDate === 'checkout') {
      return 'Click a date after check-in to select your check-out date';
    }
  }
  
  // Normal flow for standalone calendar
  if (calendarState.packageCategory === 'rooms') {
    if (calendarState.selectionStep === 1) {
      return 'Click a date to select check-in date';
    } else {
      return 'Click a date after ' + calendarState.selectedCheckin.toLocaleDateString() + ' to select check-out date';
    }
  } else {
    return 'Click a date to select your preferred date';
  }
}

// Check if date is in selected range
function isDateInRange(date) {
  if (!calendarState.selectedCheckin || !calendarState.selectedCheckout) {
    return false;
  }
  
  // Normalize dates to compare only date parts (ignore time)
  const checkinDate = new Date(calendarState.selectedCheckin);
  checkinDate.setHours(0, 0, 0, 0);
  const checkoutDate = new Date(calendarState.selectedCheckout);
  checkoutDate.setHours(0, 0, 0, 0);
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);
  
  // Don't highlight the check-in and check-out dates themselves (they have their own styling)
  return currentDate > checkinDate && currentDate < checkoutDate;
}

// Handle date click
// Initialize event delegation for date selection (performance optimization)
function initializeCalendarEvents() {
  const calendarGrid = document.querySelector('.calendar-grid');
  if (calendarGrid) {
    // Remove any existing listener
    const existingListener = calendarGrid._dateClickListener;
    if (existingListener) {
      calendarGrid.removeEventListener('click', existingListener);
    }
    
    // Add single event listener to calendar container
    const listener = (e) => {
      const dateCell = e.target.closest('.calendar-date');
      if (dateCell && !dateCell.classList.contains('past') && !dateCell.classList.contains('maintenance')) {
        const dateString = dateCell.dataset.datestring;
        const status = dateCell.dataset.status;
        if (dateString) {
          handleDateClick(dateString, status);
        }
      }
    };
    
    calendarGrid._dateClickListener = listener;
    calendarGrid.addEventListener('click', listener);
  }
}

function handleDateClick(dateString, status) {
  // Don't allow clicking on past dates or maintenance
  if (status === 'past' || status === 'maintenance') {
    return;
  }
  
  const clickedDate = new Date(dateString);
  clickedDate.setHours(0, 0, 0, 0); // Normalize to start of day
  
  // Save current state before making changes (for undo functionality)
  saveStateForUndo();
  
  // Check if we're modifying a specific date from booking modal
  if (calendarState.modifyingDate) {
    if (calendarState.modifyingDate === 'checkin') {
      calendarState.selectedCheckin = new Date(clickedDate);
      // If checkout exists and is before new checkin, clear it
      if (calendarState.selectedCheckout && clickedDate >= calendarState.selectedCheckout) {
        calendarState.selectedCheckout = null;
      }
    } else if (calendarState.modifyingDate === 'checkout') {
      // Check if checkout is after checkin
      if (calendarState.selectedCheckin && clickedDate <= calendarState.selectedCheckin) {
        alert('Check-out date must be after check-in date');
        return;
      }
      calendarState.selectedCheckout = new Date(clickedDate);
    }
    
    updateSelectionVisuals();
    
    // Don't auto-close - let user confirm with button
    return;
  }
  
  // Normal flow for standalone calendar
  if (calendarState.packageCategory === 'rooms') {
    if (calendarState.selectionStep === 1) {
      // First click - select check-in
      calendarState.selectedCheckin = new Date(clickedDate);
      calendarState.selectionStep = 2;
      updateSelectionVisuals();
    } else {
      // Second click - select check-out
      if (clickedDate > calendarState.selectedCheckin) {
        calendarState.selectedCheckout = new Date(clickedDate);
        updateSelectionVisuals();
        // No automatic confirmation - user will click Confirm button when ready
      } else {
        alert('Check-out date must be after check-in date');
      }
    }
  } else {
    // Cottage or function hall - single date selection
    calendarState.selectedCheckin = new Date(clickedDate);
    updateSelectionVisuals();
    // Show confirmation after a brief delay to show the selection
    setTimeout(() => {
      const packageType = calendarState.packageCategory === 'cottages' ? 'cottage' : 'function hall';
      if (confirm(`Confirm your ${packageType} booking for ${calendarState.selectedCheckin.toLocaleDateString()}?`)) {
        openBookingWithDates();
      } else {
        resetDateSelection();
      }
    }, 100);
  }
}

// Save current state to undo stack
function saveStateForUndo() {
  const stateSnapshot = {
    selectedCheckin: calendarState.selectedCheckin ? new Date(calendarState.selectedCheckin) : null,
    selectedCheckout: calendarState.selectedCheckout ? new Date(calendarState.selectedCheckout) : null,
    selectionStep: calendarState.selectionStep,
    modifyingDate: calendarState.modifyingDate
  };
  
  // Only save if state actually changed
  const lastState = calendarState.undoStack[calendarState.undoStack.length - 1];
  if (!lastState || 
      lastState.selectedCheckin?.getTime() !== stateSnapshot.selectedCheckin?.getTime() ||
      lastState.selectedCheckout?.getTime() !== stateSnapshot.selectedCheckout?.getTime() ||
      lastState.selectionStep !== stateSnapshot.selectionStep ||
      lastState.modifyingDate !== stateSnapshot.modifyingDate) {
    calendarState.undoStack.push(stateSnapshot);
    
    // Limit undo stack to prevent memory issues
    if (calendarState.undoStack.length > 10) {
      calendarState.undoStack.shift();
    }
  }
}

// Undo last date selection
function undoLastSelection() {
  if (calendarState.undoStack.length === 0) {
    return; // Nothing to undo
  }
  
  const previousState = calendarState.undoStack.pop();
  
  calendarState.selectedCheckin = previousState.selectedCheckin;
  calendarState.selectedCheckout = previousState.selectedCheckout;
  calendarState.selectionStep = previousState.selectionStep;
  calendarState.modifyingDate = previousState.modifyingDate;
  
  updateCalendarDisplay();
}

// Confirm date selection and proceed with booking
function confirmDateSelection() {
  if (!calendarState.selectedCheckin || !calendarState.selectedCheckout) {
    return; // Safety check
  }
  
  // If we're modifying dates from booking modal, update the booking modal directly
  if (calendarState.modifyingDate) {
    openBookingWithDates();
  } else if (calendarState.packageCategory === 'rooms' && calendarState.packageTitle === 'Standard Room') {
    // For Standard Room, show available rooms selection instead of booking modal
    const checkinDate = formatDateForInput(calendarState.selectedCheckin);
    const checkoutDate = formatDateForInput(calendarState.selectedCheckout);
    
    // Close calendar modal
    closeCalendarModal();
    
    // Show available rooms selection
    if (window.showAvailableRooms) {
      window.showAvailableRooms(checkinDate, checkoutDate);
    }
  } else {
    // Normal flow - proceed with booking
    openBookingWithDates();
  }
}

// Reset date selection
function resetDateSelection() {
  calendarState.selectedCheckin = null;
  calendarState.selectedCheckout = null;
  calendarState.selectionStep = 1;
  calendarState.modifyingDate = null;
  calendarState.undoStack = []; // Clear undo stack on reset
  updateCalendarDisplay();
}

// Update calendar display
async function updateCalendarDisplay(year = null, month = null) {
  const calendarContainer = document.querySelector('.calendar-container');
  if (calendarContainer) {
    const today = new Date();
    
    // If no year/month provided, try to get current calendar view
    if (year === null || month === null) {
      const monthSelect = document.querySelector('.calendar-month-select');
      const yearSelect = document.querySelector('.calendar-year-select');
      
      if (monthSelect && yearSelect) {
        // Use current calendar view
        year = parseInt(yearSelect.value);
        month = parseInt(monthSelect.value);
      } else {
        // Fallback to current date
        year = today.getFullYear();
        month = today.getMonth();
      }
    }
    
    // Load calendar asynchronously
    calendarContainer.innerHTML = '<div style="text-align: center; padding: 40px;">Loading calendar...</div>';
    try {
      const html = await generateCalendarHTML(year, month, calendarState.packageTitle, 1);
      calendarContainer.innerHTML = html;
      
      // Update button visibility after calendar renders
      updateCalendarButtons();
    } catch (error) {
      console.error('Error generating calendar:', error);
      const errorMessage = error.message.includes('backend server') 
        ? error.message 
        : 'Error loading calendar. Please try again.';
      calendarContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #d32f2f; background: #ffebee; border-radius: 8px; margin: 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3 style="margin: 0 0 8px 0;">Unable to Load Calendar</h3>
          <p style="margin: 0;">${errorMessage}</p>
        </div>
      `;
    }
  }
}

// Open booking modal with selected dates
function openBookingWithDates() {
  let reservationType = 'room';
  let preFillDates = {};
  
  if (calendarState.packageCategory === 'rooms') {
    reservationType = 'room';
    // Format dates as YYYY-MM-DD without timezone issues
    const checkinDate = new Date(calendarState.selectedCheckin);
    const checkoutDate = new Date(calendarState.selectedCheckout);
    
    preFillDates = {
      checkin: formatDateForInput(checkinDate),
      checkout: formatDateForInput(checkoutDate)
    };
  } else if (calendarState.packageCategory === 'cottages') {
    reservationType = 'cottage';
    const selectedDate = new Date(calendarState.selectedCheckin);
    preFillDates = {
      date: formatDateForInput(selectedDate)
    };
  } else if (calendarState.packageCategory === 'function-halls') {
    reservationType = 'function-hall';
    const selectedDate = new Date(calendarState.selectedCheckin);
    preFillDates = {
      date: formatDateForInput(selectedDate)
    };
  }
  
  // Close calendar modal
  closeCalendarModal();
  
  // Check if we're coming from booking modal
  if (window.bookingModalCalendarMode) {
    // Update the booking modal dates directly
    if (window.updateBookingDates && preFillDates.checkin && preFillDates.checkout) {
      window.updateBookingDates(preFillDates.checkin, preFillDates.checkout);
    }
    // Clear the calendar mode
    window.bookingModalCalendarMode = null;
    window.bookingModalCurrentDates = null;
  } else {
    // If Standard Room, show room selection grid instead of opening booking modal directly
    if (calendarState.packageTitle === 'Standard Room' && reservationType === 'room') {
      if (window.showAvailableRooms) {
        window.showAvailableRooms(preFillDates.checkin, preFillDates.checkout);
        return;
      }
    }
    
    // For cottages/halls or if showAvailableRooms is not available
    if (window.openBookingModal) {
      window.openBookingModal(reservationType, calendarState.packageTitle, preFillDates);
    }
  }
}

// Confirm date selection
window.confirmDateSelection = function() {
  openBookingWithDates();
};

// Create and show the calendar modal
export function openCalendarModal(packageTitle, reservationCount, packageCategory = 'rooms') {
  // Close any existing modal
  closeCalendarModal();
  
  // Initialize calendar state
  calendarState.packageCategory = packageCategory;
  calendarState.packageTitle = packageTitle;
  
  // Check if we're coming from booking modal with existing dates
  if (window.bookingModalCalendarMode && window.bookingModalCurrentDates) {
    // Set which date we're modifying
    calendarState.modifyingDate = window.bookingModalCalendarMode;
    
    // Only pre-populate if dates are actually selected (not null or empty)
    const hasCheckin = window.bookingModalCurrentDates.checkin !== null && window.bookingModalCurrentDates.checkin !== '';
    const hasCheckout = window.bookingModalCurrentDates.checkout !== null && window.bookingModalCurrentDates.checkout !== '';
    
    if (hasCheckin) {
      calendarState.selectedCheckin = new Date(window.bookingModalCurrentDates.checkin);
    }
    if (hasCheckout) {
      calendarState.selectedCheckout = new Date(window.bookingModalCurrentDates.checkout);
    }
    
    // Set selection step based on what dates are available
    if (hasCheckin && hasCheckout) {
      calendarState.selectionStep = 2; // Both dates selected
    } else if (hasCheckin) {
      calendarState.selectionStep = 2; // Check-in selected, ready for check-out
    } else {
      calendarState.selectionStep = 1; // Start fresh
    }
  } else {
    calendarState.selectedCheckin = null;
    calendarState.selectedCheckout = null;
    calendarState.selectionStep = 1;
    calendarState.modifyingDate = null;
  }
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  const modalHTML = `
    <div class="calendar-modal-overlay" id="calendar-modal-overlay">
      <div class="calendar-modal">
        <button class="calendar-modal-close" onclick="closeCalendarModal()" aria-label="Close calendar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div class="calendar-modal-header">
          <h3>Select Your Dates</h3>
          <p class="calendar-package-title">${packageTitle}</p>
          <p class="calendar-reservation-count">${reservationCount} total reservations</p>
        </div>
        
        <div class="calendar-container" id="calendar-content">
          Loading calendar...
        </div>
        
        <!-- Action buttons will be dynamically added here -->
        <div class="calendar-actions-dynamic" id="calendar-actions-dynamic" style="display: none; margin: 20px 0; text-align: center; gap: 12px; flex-wrap: wrap; justify-content: center;">
        </div>
        
        <div class="calendar-legend">
          <div class="legend-item">
            <div class="legend-color past"></div>
            <span>Past Dates</span>
          </div>
          <div class="legend-item">
            <div class="legend-color today"></div>
            <span>Today</span>
          </div>
          <div class="legend-item">
            <div class="legend-color available-all"></div>
            <span>Available</span>
          </div>
          <div class="legend-item">
            <div class="legend-color booked-all"></div>
            <span>Fully Booked</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: #ffebee; color: #c62828; font-size: 10px; padding: 4px; line-height: 1;">A1, A2</div>
            <span>Booked Rooms</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  currentModal = document.getElementById('calendar-modal-overlay');
  
  // Prevent background scrolling
  document.body.style.overflow = 'hidden';
  document.body.classList.add('modal-open');
  
  // Disable Lenis smooth scrolling when modal is open
  const lenisInstance = window.lenisInstance || document.querySelector('.lenis')?.lenis;
  if (lenisInstance) {
    lenisInstance.stop();
  }
  
  // Add click outside to close
  currentModal.addEventListener('click', (e) => {
    if (e.target === currentModal) {
      closeCalendarModal();
    }
  });
  
  // Prevent scroll events from bubbling to background
  currentModal.addEventListener('wheel', (e) => {
    e.stopPropagation();
  }, { passive: false });
  
  // Prevent middle mouse scroll from affecting background
  currentModal.addEventListener('mousedown', (e) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
    }
  });
  
  // Additional scroll prevention for the modal content
  const modalContent = currentModal.querySelector('.calendar-modal');
  if (modalContent) {
    modalContent.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: false });
    
    modalContent.addEventListener('mousedown', (e) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
      }
    });
  }
  
  // Load calendar asynchronously after modal is rendered with skeleton
  const calendarContainer = document.getElementById('calendar-content');
  if (calendarContainer) {
    // Show loading skeleton immediately
    calendarContainer.innerHTML = `
      <div class="calendar-loading-skeleton">
        <div class="skeleton-header"></div>
        <div class="skeleton-grid">
          ${Array(35).fill('<div class="skeleton-day"></div>').join('')}
        </div>
      </div>
    `;
    
    // Load calendar asynchronously (non-blocking)
    requestAnimationFrame(() => {
      generateCalendarHTML(currentYear, currentMonth, packageTitle, 1).then(html => {
        if (calendarContainer) {
          calendarContainer.innerHTML = html;
          
          // Update button visibility after calendar renders
          updateCalendarButtons();
          
          // Initialize event delegation for date selection
          initializeCalendarEvents();
        }
      }).catch(error => {
        console.error('Error loading calendar:', error);
        if (calendarContainer) {
          const errorMessage = error.message.includes('backend server') 
            ? error.message 
            : 'Error loading calendar. Please try again.';
          calendarContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #d32f2f; background: #ffebee; border-radius: 8px; margin: 20px;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3 style="margin: 0 0 8px 0;">Unable to Load Calendar</h3>
              <p style="margin: 0;">${errorMessage}</p>
            </div>
          `;
        }
      });
    });
  }
  
  // Add escape key to close
  document.addEventListener('keydown', handleEscapeKey);
  
  // Animate modal in
  setTimeout(() => {
    currentModal.classList.add('show');
  }, 10);
}

// Close the calendar modal
export function closeCalendarModal() {
  if (currentModal) {
    currentModal.classList.remove('show');
    
    // Restore background scrolling
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    
    // Re-enable Lenis smooth scrolling when modal is closed
    const lenisInstance = window.lenisInstance || document.querySelector('.lenis')?.lenis;
    if (lenisInstance) {
      lenisInstance.start();
    }
    
    setTimeout(() => {
      if (currentModal && currentModal.parentNode) {
        currentModal.parentNode.removeChild(currentModal);
      }
      currentModal = null;
    }, 300);
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

// Handle escape key press
function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeCalendarModal();
  }
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate month options for select dropdown
function generateMonthOptions(selectedMonth) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return monthNames.map((month, index) => 
    `<option value="${index}" ${index === selectedMonth ? 'selected' : ''}>${month}</option>`
  ).join('');
}

// Generate year options for select dropdown
function generateYearOptions(selectedYear, minYear, maxYear) {
  let options = '';
  for (let year = minYear; year <= maxYear; year++) {
    options += `<option value="${year}" ${year === selectedYear ? 'selected' : ''}>${year}</option>`;
  }
  return options;
}

// Update only the visual selection state without regenerating entire calendar
function updateSelectionVisuals() {
  document.querySelectorAll('.calendar-date').forEach(el => {
    const dateString = el.dataset.date;
    if (!dateString) return;
    
    const clickedDate = new Date(dateString);
    clickedDate.setHours(0, 0, 0, 0);
    
    // Remove previous selection classes
    el.classList.remove('selected-checkin', 'selected-checkout', 'in-range');
    
    // Add new selection classes if applicable
    if (calendarState.selectedCheckin) {
      const checkin = new Date(calendarState.selectedCheckin);
      checkin.setHours(0, 0, 0, 0);
      if (clickedDate.getTime() === checkin.getTime()) {
        el.classList.add('selected-checkin');
      }
    }
    
    if (calendarState.selectedCheckout) {
      const checkout = new Date(calendarState.selectedCheckout);
      checkout.setHours(0, 0, 0, 0);
      if (clickedDate.getTime() === checkout.getTime()) {
        el.classList.add('selected-checkout');
      }
    }
    
    // Add in-range class
    if (calendarState.selectedCheckin && calendarState.selectedCheckout) {
      const checkin = new Date(calendarState.selectedCheckin);
      const checkout = new Date(calendarState.selectedCheckout);
      if (clickedDate > checkin && clickedDate < checkout) {
        el.classList.add('in-range');
      }
    }
  });
  
  // Update button visibility after visual selection update
  updateCalendarButtons();
}

// Update calendar button visibility
function updateCalendarButtons() {
  const actionsDiv = document.getElementById('calendar-actions-dynamic');
  if (!actionsDiv) return;
  
  const hasUndoActions = calendarState.undoStack.length > 0;
  const hasBothDates = calendarState.selectedCheckin && calendarState.selectedCheckout;
  const isModifyingSingleDate = calendarState.modifyingDate && (calendarState.selectedCheckin || calendarState.selectedCheckout);
  
  const shouldShow = hasUndoActions || hasBothDates || isModifyingSingleDate;
  
  if (shouldShow) {
    // Generate button HTML
    let buttonsHTML = '';
    
    if (hasUndoActions) {
      buttonsHTML += `
        <button class="calendar-undo-btn" onclick="undoLastSelection()" title="Undo last selection">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
          </svg>
          Undo
        </button>
      `;
    }
    
    if (hasBothDates || isModifyingSingleDate) {
      buttonsHTML += `
        <button class="calendar-confirm-btn" onclick="confirmDateSelection()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          Confirm Selection
        </button>
      `;
    }
    
    actionsDiv.innerHTML = buttonsHTML;
    actionsDiv.style.display = 'flex';
    
    if (localStorage.getItem('DEBUG_CALENDAR') === 'true') {
      console.log('[Calendar] Updated buttons:', { hasUndoActions, hasBothDates, isModifyingSingleDate });
    }
  } else {
    actionsDiv.innerHTML = '';
    actionsDiv.style.display = 'none';
  }
}

// Navigate to previous/next month
function navigateMonth(direction) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Get current calendar state
  const calendarContainer = document.querySelector('.calendar-container');
  if (!calendarContainer) return;
  
  // Extract current year and month from the selects
  const monthSelect = document.querySelector('.calendar-month-select');
  const yearSelect = document.querySelector('.calendar-year-select');
  
  if (!monthSelect || !yearSelect) return;
  
  let newMonth = parseInt(monthSelect.value) + direction;
  let newYear = parseInt(yearSelect.value);
  
  // Handle month overflow
  if (newMonth < 0) {
    newMonth = 11;
    newYear--;
  } else if (newMonth > 11) {
    newMonth = 0;
    newYear++;
  }
  
  // Check bounds (one year limit)
  const maxYear = currentYear + 1;
  const maxMonth = currentMonth;
  
  if (newYear < currentYear || (newYear === currentYear && newMonth < currentMonth)) {
    return; // Can't go before current month
  }
  
  if (newYear > maxYear || (newYear === maxYear && newMonth > maxMonth)) {
    return; // Can't go beyond one year
  }
  
  // Show loading indicator
  calendarContainer.classList.add('calendar-transitioning');
  
  // Debounce month navigation to prevent rapid API calls
  if (monthNavigationTimer) {
    clearTimeout(monthNavigationTimer);
  }
  
  monthNavigationTimer = setTimeout(() => {
    updateCalendarDisplay(newYear, newMonth).then(() => {
      calendarContainer.classList.remove('calendar-transitioning');
      // Re-initialize event delegation after calendar update
      initializeCalendarEvents();
    });
    monthNavigationTimer = null;
  }, 150); // 150ms debounce for better UX
}

// Change month via select dropdown
function changeMonth(monthValue) {
  const yearSelect = document.querySelector('.calendar-year-select');
  if (!yearSelect) return;
  
  const newYear = parseInt(yearSelect.value);
  const newMonth = parseInt(monthValue);
  
  updateCalendarDisplay(newYear, newMonth);
}

// Change year via select dropdown
function changeYear(yearValue) {
  const monthSelect = document.querySelector('.calendar-month-select');
  if (!monthSelect) return;
  
  const newYear = parseInt(yearValue);
  const newMonth = parseInt(monthSelect.value);
  
  updateCalendarDisplay(newYear, newMonth);
}

// Make functions globally available for onclick handlers
window.closeCalendarModal = closeCalendarModal;
window.openCalendarModal = openCalendarModal;
window.handleDateClick = handleDateClick;
window.resetDateSelection = resetDateSelection;
window.undoLastSelection = undoLastSelection;
window.confirmDateSelection = confirmDateSelection;
window.navigateMonth = navigateMonth;
window.changeMonth = changeMonth;
window.changeYear = changeYear;
