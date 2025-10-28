// Backend API configuration
// Use production API if deployed, otherwise use localhost for development
// Check if we're NOT on localhost (production environment)
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Use localStorage for bookings when in production (client-side only)
// Use mock API for bookings when in development
const USE_CLIENT_STORAGE = isProduction; // Use localStorage in production
const USE_MOCK_BOOKINGS = !isProduction; // Use mock API in development

const API_BASE = isProduction 
  ? 'https://kina-resort-main-production.up.railway.app/api'
  : 'http://localhost:3000/api';

const MOCK_API_BASE = 'http://localhost:3000/mock';

// Log which API is being used
console.log('🌐 API Configuration:');
console.log('  Location:', window.location.href);
console.log('  Hostname:', window.location.hostname);
console.log('  Is Production:', isProduction);
console.log('  Using Client Storage:', USE_CLIENT_STORAGE);
console.log('  Using Mock Bookings:', USE_MOCK_BOOKINGS);
console.log('  API_BASE:', API_BASE);
console.log('  MOCK_API_BASE:', MOCK_API_BASE);

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const fullUrl = `${API_BASE}${endpoint}`;
  console.log('📡 API Request:', fullUrl);

  try {
    const response = await fetch(fullUrl, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    
    // Detect connection refused errors
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Cannot connect to server. Please ensure the backend server is running on http://localhost:3000');
    }
    
    throw error;
  }
}

// Weather API (keeping mock for now)
export async function fetchWeatherSummary() {
  await new Promise(res => setTimeout(res, 300));
    return {
      location: 'Kina Resort',
      current: { tempC: 31, condition: 'Sunny', icon: '☀️' },
      nextDays: [
        { d: 'Mon', t: 30, c: 'Sunny' },
        { d: 'Tue', t: 29, c: 'Cloudy' },
        { d: 'Wed', t: 31, c: 'Sunny' },
        { d: 'Thu', t: 31, c: 'Sunny' },
        { d: 'Fri', t: 29, c: 'Partly Cloudy' },
        { d: 'Sat', t: 30, c: 'Sunny' },
        { d: 'Sun', t: 28, c: 'Showers' },
      ],
      suggestion: 'Best time to visit: sunny Fri–Mon afternoons.'
    };
  }

// Authentication API
export async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  // Store token
  if (data.token) {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  }
  
  return data;
}

export async function register(userData) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName
    })
  });
  
  // Store token
  if (data.token) {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  }
  
  return data;
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST'
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}

export async function resetPassword(email) {
  return await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function getCurrentUser() {
  try {
    const data = await apiRequest('/auth/me');
    return data.user;
  } catch (error) {
    // If not authenticated, return null
    return null;
  }
}

// Packages API
export async function fetchPackages(category = '') {
  // Use localStorage in production
  if (USE_CLIENT_STORAGE) {
    const { getAllPackages, getPackagesByCategory } = await import('./localStorage.js');
    const packages = category ? getPackagesByCategory(category) : getAllPackages();
    return packages;
  }
  
  const endpoint = category ? `/packages?category=${category}` : '/packages';
  const data = await apiRequest(endpoint);
  return data.data || [];
}

export async function fetchPackage(id) {
  // Use localStorage in production
  if (USE_CLIENT_STORAGE) {
    const { getPackageById } = await import('./localStorage.js');
    return getPackageById(id);
  }
  
  const data = await apiRequest(`/packages/${id}`);
  return data.data;
}

export async function fetchPackageAvailability(packageId, startDate, endDate) {
  const data = await apiRequest(
    `/packages/${packageId}/availability?start=${startDate}&end=${endDate}`
  );
  return data.data;
}

// Check booking availability (conditionally routed)
export async function checkAvailability(packageId, checkIn, checkOut, category = null) {
  // Use localStorage in production
  if (USE_CLIENT_STORAGE) {
    console.log('[ClientStorage] Checking availability via localStorage...');
    const { checkAvailability: checkStorageAvailability } = await import('./localStorage.js');
    return checkStorageAvailability(packageId, checkIn, checkOut, category);
  }
  
  // Use mock API in development mode
  if (USE_MOCK_BOOKINGS) {
    console.log('[MockDB] Checking availability via mock API...');
    const url = `/bookings/availability/${packageId}?checkIn=${checkIn}&checkOut=${checkOut}${category ? `&category=${category}` : ''}`;
    const data = await mockApiRequest(url, { method: 'GET' });
    return data;
  } else {
    const url = `/bookings/availability/${packageId}?checkIn=${checkIn}&checkOut=${checkOut}${category ? `&category=${category}` : ''}`;
    const data = await apiRequest(url, { method: 'GET' });
    return data;
  }
}

// Bookings API - use mock API (no auth required)
async function mockApiRequest(endpoint, options = {}) {
  const fullUrl = `${MOCK_API_BASE}${endpoint}`;
  console.log('📡 Mock API Request:', fullUrl);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Mock API request failed');
    }

    return data;
  } catch (error) {
    console.error('Mock API request error:', error);
    throw error;
  }
}

// Bookings API
export async function fetchUserBookings() {
  // Use localStorage in production
  if (USE_CLIENT_STORAGE) {
    console.log('[ClientStorage] Fetching user bookings from localStorage...');
    const { getAllBookings, getBookingsByUserId } = await import('./localStorage.js');
    const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const allBookings = getAllBookings();
    // Filter by current user if logged in, otherwise return all (for demo)
    const userBookings = currentUser.id 
      ? getBookingsByUserId(currentUser.id)
      : allBookings;
    return { success: true, data: userBookings };
  }
  
  if (USE_MOCK_BOOKINGS) {
    console.log('[MockDB] Fetching user bookings from mock API...');
    const data = await mockApiRequest('/bookings');
    return data.data || [];
  } else {
    const data = await apiRequest('/bookings');
    return data.data || [];
  }
}

export async function createBooking(bookingData) {
  // Use localStorage in production
  if (USE_CLIENT_STORAGE) {
    console.log('[ClientStorage] Creating booking in localStorage...');
    const { createBooking: createStorageBooking } = await import('./localStorage.js');
    const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const booking = createStorageBooking({
      ...bookingData,
      userId: currentUser.id || 'guest-' + Date.now()
    });
    return { success: true, data: booking };
  }
  
  const data = await apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      packageId: bookingData.packageId,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: bookingData.guests
    })
  });
  return data.data;
}

export async function updateBooking(bookingId, updates) {
  // Use localStorage in production
  if (USE_CLIENT_STORAGE) {
    console.log('[ClientStorage] Updating booking in localStorage...');
    const { updateBooking: updateStorageBooking } = await import('./localStorage.js');
    const updated = updateStorageBooking(bookingId, updates);
    return { success: true, data: updated };
  }
  
  if (USE_MOCK_BOOKINGS) {
    console.log('[MockDB] Updating booking via mock API...');
    const data = await mockApiRequest(`/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return data.data;
  } else {
    const data = await apiRequest(`/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return data.data;
  }
}

export async function cancelBooking(bookingId) {
  // Use localStorage in production
  if (USE_CLIENT_STORAGE) {
    console.log('[ClientStorage] Cancelling booking in localStorage...');
    const { cancelBooking: cancelStorageBooking } = await import('./localStorage.js');
    cancelStorageBooking(bookingId);
    return { success: true, message: 'Booking cancelled successfully' };
  }
  
  if (USE_MOCK_BOOKINGS) {
    console.log('[MockDB] Cancelling booking via mock API...');
    const data = await mockApiRequest(`/bookings/${bookingId}`, {
      method: 'DELETE'
    });
    return data;
  } else {
    const data = await apiRequest(`/bookings/${bookingId}`, {
      method: 'DELETE'
    });
    return data;
  }
}

export async function getBooking(bookingId) {
  const data = await apiRequest(`/bookings/${bookingId}`);
  return data.data;
}

// Users API
export async function fetchUserProfile() {
  const data = await apiRequest('/users/profile');
  return data.data;
}

export async function updateUserProfile(profileData) {
  const data = await apiRequest('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData)
  });
  return data.data;
}


