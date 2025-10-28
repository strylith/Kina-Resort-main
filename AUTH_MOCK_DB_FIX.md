# Authentication Fix for Mock Database

## Problem
After switching to mock database, booking API returns:
```
POST /api/bookings 401 (Unauthorized)
Error: Invalid or expired token
```

## Root Cause
The authentication middleware was checking for users in the mock database, but:
1. JWT tokens might not have all required user info (email, metadata)
2. Users might not exist in `mockClient.authUsers` after login
3. JWT_SECRET might be missing in development

## Solution Implemented

### 1. Enhanced Auth Middleware (`server/middleware/auth.js`)
- Added detailed logging for debugging
- Added fallback JWT_SECRET for development
- In mock mode, if user doesn't exist but token is valid, create user automatically
- Better error messages

### 2. Enhanced Token Generation (`server/routes/auth.js`)
- Token now includes `email` and `user_metadata` in payload
- Default JWT_SECRET for development: `'test-secret-key-for-tests'`
- Tokens include firstName/lastName in metadata

### 3. Auto-User Creation in Mock Mode
When a valid token is sent but user isn't in mock DB:
- Extract user info from JWT token
- Create mock user in `mockClient.authUsers`
- Attach user to request and continue

## How It Works Now

### Registration Flow:
1. User registers → User created in `mockClient.authUsers`
2. Token generated with userId, email, firstName, lastName
3. Token stored in localStorage

### Login Flow:
1. User logs in → User verified in `mockClient.authUsers`
2. Token generated with full user info
3. Token stored in localStorage

### Booking Flow:
1. Frontend sends token in Authorization header
2. Middleware verifies JWT token
3. Middleware checks for user in `mockClient.authUsers`
4. If not found but in mock mode → Create user from token
5. Continue to booking route

## Testing

### Verify Auth Works:
```bash
# Register a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'

# Should return token - use it for booking:
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"packageId":1,"checkIn":"2025-10-29","checkOut":"2025-10-31","guests":{"adults":2,"children":0},"totalCost":11000}'
```

## Console Logs to Watch

When booking is submitted, you should see:
```
[Auth] Token decoded: { userId: 'xxx', email: 'user@example.com' }
[Auth] User lookup result: { found: true/false, userId: 'xxx' }
[Auth] Mock mode: Creating user from token (if user not found)
[Auth] User authenticated: xxx
[Booking] Package found: Standard Room (ID: 1)
[BookingAPI] Booking created successfully
```

## Still Getting 401?

1. **Check if server is using mock DB:**
   - Look for: `🧪 Using MOCK database` in server startup logs

2. **Check JWT token:**
   - Frontend should send token in localStorage
   - Token format: `Bearer <token>`

3. **Check user exists:**
   - User must be logged in first
   - Register/login through frontend UI

4. **Restart server:**
   ```powershell
   cd server
   $env:USE_MOCK_DB = "true"
   npm start
   ```


