import { showToast } from '../components/toast.js';
import { getAuthState } from '../utils/state.js';
import { fetchUserBookings, cancelBooking as cancelBookingApi } from '../utils/api.js';

export async function MyBookingsPage() {
  // Check authentication
  const authState = getAuthState();
  
  if (!authState.isLoggedIn) {
    location.hash = '#/auth?return=' + encodeURIComponent('#/rooms');
    return '<div class="container"><p>Redirecting to login...</p></div>';
  }

  const userName = `${authState.user?.firstName || ''} ${authState.user?.lastName || ''}`.trim() || 'Guest';

  // Fetch bookings from Supabase
  let allBookings = [];
  try {
    allBookings = await fetchUserBookings();
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    showToast('Failed to load bookings', 'error');
  }
  
  // Separate current and past bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentBookings = allBookings.filter(booking => {
    const checkoutDate = new Date(booking.check_out);
    checkoutDate.setHours(0, 0, 0, 0);
    return checkoutDate >= today && booking.status !== 'cancelled';
  });
  
  const pastBookings = allBookings.filter(booking => {
    const checkoutDate = new Date(booking.check_out);
    checkoutDate.setHours(0, 0, 0, 0);
    return checkoutDate < today || booking.status === 'cancelled';
  });

  // Cancel booking function
  window.kinaCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    try {
      await cancelBookingApi(bookingId);
      
      // Clear calendar cache
      if (window.clearCalendarCache) {
        window.clearCalendarCache();
      }
      
      showToast('Booking cancelled successfully', 'success');
      location.reload();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      showToast('Failed to cancel booking', 'error');
    }
  };

  // Edit booking function
  window.kinaEditBooking = async (bookingId) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) {
      showToast('Booking not found', 'error');
      return;
    }
    
    console.log('[Edit] Preparing to edit booking:', booking);
    
    // Extract booking items
    const bookingItems = booking.booking_items || [];
    const rooms = bookingItems.filter(item => item.item_type === 'room');
    const cottages = bookingItems.filter(item => item.item_type === 'cottage');
    
    // Prepare pre-fill data
    // Extract guest info - check multiple possible fields
    const guestName = booking.guest_name || booking.guests?.name || userName;
    const guestEmail = booking.guest_email || booking.guests?.email || authState.user?.email || '';
    const guestContact = booking.contact_number || booking.contact || '';
    
    const preFillData = {
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      selectedRooms: rooms.map(r => r.item_id),
      selectedCottages: cottages.map(c => c.item_id),
      guestInfo: {
        name: guestName,
        email: guestEmail,
        contact: guestContact
      },
      paymentMode: booking.payment_mode,
      perRoomGuests: rooms.map(r => ({
        roomId: r.item_id,
        guestName: r.guest_name || guestName,
        adults: r.adults || 1,
        children: r.children || 0
      })),
      guests: booking.guests
    };
    
    console.log('[Edit] Pre-fill data:', preFillData);
    
    // Determine reservation type
    let reservationType = 'room';
    if (cottages.length > 0 && rooms.length === 0) {
      reservationType = 'cottage';
    } else if (booking.packages?.category === 'function-halls') {
      reservationType = 'function-hall';
    }
    
    // Open booking modal in edit mode
    if (window.openBookingModal) {
      const { openBookingModal } = await import('../components/bookingModal.js');
      openBookingModal(
        reservationType,
        booking.packages?.title || 'Booking',
        preFillData,
        true,  // editMode
        bookingId
      );
    } else {
      showToast('Booking modal not available', 'error');
    }
  };

  // View booking details function
  window.kinaViewBookingDetails = (bookingId) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const packageName = booking.packages?.title || 'Standard Room';
    const packageType = booking.packages?.category || 'room';
    
    // Parse guests data
    let guestsDisplay = '';
    if (typeof booking.guests === 'object') {
      guestsDisplay = `${booking.guests.adults || 0} Adults, ${booking.guests.children || 0} Children`;
    } else {
      guestsDisplay = booking.guests || 'N/A';
    }
    
    // Extract booking items
    const bookingItems = booking.booking_items || [];
    const rooms = bookingItems.filter(item => item.item_type === 'room');
    const cottages = bookingItems.filter(item => item.item_type === 'cottage');
    const functionHalls = bookingItems.filter(item => item.item_type === 'function-hall');
    
    // Build room details
    let roomDetails = '';
    if (rooms.length > 0) {
      roomDetails = `
        <div class="detail-section">
          <strong>Selected Rooms:</strong>
          <ul class="room-details-list">
            ${rooms.map(room => `
              <li>
                <strong>${room.item_id}</strong><br>
                <small>Guest: ${room.guest_name || 'N/A'}, Adults: ${room.adults}, Children: ${room.children}</small>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }
    
    // Build cottage details
    let cottageDetails = '';
    if (cottages.length > 0) {
      cottageDetails = `
        <div class="detail-section">
          <strong>Selected Cottages:</strong>
          <ul class="cottage-details-list">
            ${cottages.map(cottage => `<li><strong>${cottage.item_id}</strong></li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    // Build function hall details
    let hallDetails = '';
    if (functionHalls.length > 0) {
      hallDetails = `
        <div class="detail-section">
          <strong>Selected Function Halls:</strong>
          <ul class="hall-details-list">
            ${functionHalls.map(hall => `<li><strong>${hall.item_id}</strong></li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    const detailsHTML = `
      <div class="booking-details-modal">
        <h3>Booking Details</h3>
        <div class="booking-details-content">
          <div class="detail-row">
            <strong>Booking ID:</strong> ${booking.id}
          </div>
          <div class="detail-row">
            <strong>Package:</strong> ${packageName}
          </div>
          <div class="detail-row">
            <strong>Type:</strong> ${packageType}
          </div>
          <div class="detail-row">
            <strong>Check-in:</strong> ${new Date(booking.check_in).toLocaleDateString()}
          </div>
          <div class="detail-row">
            <strong>Check-out:</strong> ${new Date(booking.check_out).toLocaleDateString()}
          </div>
          <div class="detail-row">
            <strong>Guests:</strong> ${guestsDisplay}
          </div>
          ${roomDetails}
          ${cottageDetails}
          ${hallDetails}
          <div class="detail-row">
            <strong>Contact:</strong> ${booking.contact_number || 'N/A'}
          </div>
          <div class="detail-row">
            <strong>Total Cost:</strong> ₱${booking.total_cost?.toLocaleString() || 'N/A'}
          </div>
          <div class="detail-row">
            <strong>Payment Mode:</strong> ${booking.payment_mode || 'N/A'}
          </div>
          <div class="detail-row">
            <strong>Status:</strong> <span class="booking-status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
          </div>
          <div class="detail-row">
            <strong>Booked on:</strong> ${new Date(booking.created_at).toLocaleDateString()}
          </div>
          ${booking.special_requests ? `
            <div class="detail-row">
              <strong>Special Requests:</strong>
              <p>${booking.special_requests}</p>
            </div>
          ` : ''}
        </div>
        <div class="modal-actions">
          <button class="btn" onclick="document.querySelector('.modal').remove()">Close</button>
        </div>
      </div>
    `;
    
    // Use existing modal system
    if (window.openModal) {
      window.openModal(detailsHTML);
    }
  };

  // Generate table rows for bookings
  const generateBookingRows = (bookings, showActions = true) => {
    if (bookings.length === 0) {
      return `
        <tr>
          <td colspan="${showActions ? '8' : '7'}" class="empty-state">
            <div class="bookings-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M3 7v6h6"/>
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
              <p>${showActions ? 'No current bookings. Start planning your stay!' : 'No past bookings yet.'}</p>
            </div>
          </td>
        </tr>
      `;
    }

    return bookings.map(booking => {
      const packageName = booking.packages?.title || 'Standard Room';
      const packageType = booking.packages?.category || 'room';
      const statusClass = booking.status === 'confirmed' ? 'confirmed' : 
                         booking.status === 'pending' ? 'pending' : 'cancelled';
      
      // Parse guests
      let guestsDisplay = '';
      if (typeof booking.guests === 'object') {
        guestsDisplay = `${booking.guests.adults || 0}A, ${booking.guests.children || 0}C`;
      } else {
        guestsDisplay = booking.guests || 'N/A';
      }
      
      // Count items from booking_items array
      const bookingItems = booking.booking_items || [];
      const roomCount = bookingItems.filter(item => item.item_type === 'room').length;
      const cottageCount = bookingItems.filter(item => item.item_type === 'cottage').length;
      const hallCount = bookingItems.filter(item => item.item_type === 'function-hall').length;
      
      const itemsDisplay = [
        roomCount > 0 ? `${roomCount} room${roomCount > 1 ? 's' : ''}` : '',
        cottageCount > 0 ? `${cottageCount} cottage${cottageCount > 1 ? 's' : ''}` : '',
        hallCount > 0 ? `${hallCount} hall${hallCount > 1 ? 's' : ''}` : ''
      ].filter(Boolean).join(' + ') || 'N/A';
      
      return `
      <tr>
        <td>${booking.id}</td>
        <td>${packageName}</td>
        <td>${itemsDisplay}</td>
        <td>${new Date(booking.check_in).toLocaleDateString()}</td>
        <td>${new Date(booking.check_out).toLocaleDateString()}</td>
        <td>${guestsDisplay}</td>
        <td><span class="booking-status-badge ${statusClass}">${booking.status}</span></td>
        ${showActions ? `
          <td class="booking-actions">
            ${(booking.status === 'confirmed' || booking.status === 'pending') && new Date(booking.check_in) > new Date() ? 
              `<button class="btn small danger" onclick="kinaCancelBooking('${booking.id}')">Cancel</button>` : ''
            }
            ${(booking.status === 'confirmed' || booking.status === 'pending') && new Date(booking.check_in) > new Date() ? 
              `<button class="btn small btn-edit" onclick="kinaEditBooking('${booking.id}')">Re-Edit</button>` : ''
            }
          </td>
        ` : ''}
      </tr>
    `}).join('');
  };

  return `
    <section class="container my-bookings-page">
      <div class="bookings-header">
        <h2>My Bookings</h2>
        <p class="user-welcome">Welcome back, ${userName}!</p>
        <div class="bookings-controls">
          <button class="btn primary" onclick="location.hash='#/packages'">Make a Booking</button>
        </div>
      </div>

      <!-- Current Bookings Section -->
      <div class="bookings-section">
        <h3>Current Bookings</h3>
        <div class="bookings-table-wrapper">
          <table class="bookings-table" aria-label="Current bookings">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Package Name</th>
                <th>Rooms/Cottages</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${generateBookingRows(currentBookings, true)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Past Bookings Section -->
      <div class="bookings-section">
        <h3>Past Bookings</h3>
        <div class="bookings-table-wrapper">
          <table class="bookings-table" aria-label="Past bookings">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Package Name</th>
                <th>Rooms/Cottages</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${generateBookingRows(pastBookings, false)}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <style>
      .my-bookings-page {
        padding: 40px 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .bookings-header {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 2px solid var(--border);
      }

      .bookings-header h2 {
        margin: 0 0 8px 0;
        color: var(--color-text);
        font-size: 2.5rem;
        font-weight: 700;
      }

      .user-welcome {
        color: var(--color-text-secondary);
        margin: 0 0 20px 0;
        font-size: 1.1rem;
      }

      .bookings-controls {
        margin-top: 20px;
      }

      .bookings-section {
        margin-bottom: 40px;
      }

      .bookings-section h3 {
        color: var(--color-text);
        margin-bottom: 20px;
        font-size: 1.5rem;
        font-weight: 600;
        padding-left: 8px;
        border-left: 4px solid var(--color-accent);
      }

      .bookings-table-wrapper {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        overflow-x: auto;
      }

      .bookings-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 800px;
      }

      .bookings-table th {
        background: var(--color-accent);
        color: white;
        padding: 16px 12px;
        text-align: left;
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .bookings-table td {
        padding: 16px 12px;
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }

      .bookings-table tr:hover {
        background: var(--color-bg);
      }

      .booking-status-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .booking-status-badge.confirmed {
        background: #d4edda;
        color: #155724;
      }

      .booking-status-badge.pending {
        background: #fff3cd;
        color: #856404;
      }

      .booking-status-badge.cancelled {
        background: #f8d7da;
        color: #721c24;
      }

      .booking-status-badge.completed {
        background: #cce5ff;
        color: #004085;
      }

      .booking-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .btn.small {
        padding: 6px 12px;
        font-size: 0.8rem;
        border-radius: 6px;
      }

      .btn.danger {
        background: #dc3545;
        color: white;
        border: none;
      }

      .btn.danger:hover {
        background: #c82333;
      }

      .btn-edit {
        background: #4CAF50;
        color: white;
        border: none;
      }

      .btn-edit:hover {
        background: #45a049;
      }

      .btn-edit:disabled {
        background: #cccccc;
        cursor: not-allowed;
      }

      .bookings-empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--color-text-secondary);
      }

      .bookings-empty-state svg {
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .bookings-empty-state p {
        margin: 0;
        font-size: 1.1rem;
      }

      .empty-state {
        text-align: center;
      }

      /* Booking Details Modal Styles */
      .booking-details-modal h3 {
        margin-top: 0;
        color: var(--color-text);
        border-bottom: 2px solid var(--border);
        padding-bottom: 12px;
      }

      .booking-details-content {
        margin: 20px 0;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--border);
      }

      .detail-row:last-child {
        border-bottom: none;
      }

      .modal-actions {
        text-align: right;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 2px solid var(--border);
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .my-bookings-page {
          padding: 20px 10px;
        }

        .bookings-header h2 {
          font-size: 2rem;
        }

        .bookings-table {
          font-size: 0.9rem;
        }

        .bookings-table th,
        .bookings-table td {
          padding: 12px 8px;
        }

        .booking-actions {
          flex-direction: column;
        }

        .btn.small {
          width: 100%;
          text-align: center;
        }

        .detail-row {
          flex-direction: column;
          gap: 4px;
        }
      }
    </style>
  `;
}

