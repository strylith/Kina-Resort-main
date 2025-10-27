// Backend API configuration
// Use production API if deployed, otherwise use localhost for development
const API_BASE = (window.location.hostname === 'strylith.github.io') 
  ? 'https://kina-resort-main-production.up.railway.app/api'
  : 'http://localhost:3000/api';

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

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
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
  const endpoint = category ? `/packages?category=${category}` : '/packages';
  const data = await apiRequest(endpoint);
  return data.data || [];
}

export async function fetchPackage(id) {
  const data = await apiRequest(`/packages/${id}`);
  return data.data;
}

export async function fetchPackageAvailability(packageId, startDate, endDate) {
  const data = await apiRequest(
    `/packages/${packageId}/availability?start=${startDate}&end=${endDate}`
  );
  return data.data;
}

// Check booking availability (no auth required)
export async function checkAvailability(packageId, checkIn, checkOut, category = null) {
  let url = `/bookings/availability/${packageId}?checkIn=${checkIn}&checkOut=${checkOut}`;
  if (category) {
    url += `&category=${category}`;
  }
  
  const data = await apiRequest(url, { method: 'GET' });
  return data;
}

// Bookings API
export async function fetchUserBookings() {
  const data = await apiRequest('/bookings');
  return data.data || [];
}

export async function createBooking(bookingData) {
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
  const data = await apiRequest(`/bookings/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
  return data.data;
}

export async function cancelBooking(bookingId) {
  const data = await apiRequest(`/bookings/${bookingId}`, {
    method: 'DELETE'
  });
  return data;
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


