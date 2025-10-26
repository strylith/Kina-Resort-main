# Kina Resort Backend API

Node.js/Express backend server for Kina Resort reservation system with Supabase integration.

## Prerequisites

- Node.js 18+ installed
- Supabase account with project created
- Supabase Service Role Key (not anon key)

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
SUPABASE_URL=https://djownnqrmeeytnzofuex.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=3000
JWT_SECRET=your_very_long_and_random_secret_key_here
NODE_ENV=development
```

**Important:** 
- Get your Service Role Key from Supabase Dashboard → Settings → API
- Generate a secure JWT_SECRET (use a random string generator)

### 3. Setup Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the SQL script to create tables and policies

### 4. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/reset-password` - Send password reset email
- `GET /api/auth/me` - Get current user (requires auth)

### Packages
- `GET /api/packages` - Get all packages
- `GET /api/packages?category=rooms` - Get packages by category
- `GET /api/packages/:id` - Get single package
- `GET /api/packages/:id/availability?start=date&end=date` - Check availability

### Bookings (Protected)
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Users (Protected)
- `GET /api/users/profile` - Get user profile with stats
- `PATCH /api/users/profile` - Update user profile

## Frontend Integration

Update your frontend `assets/js/utils/api.js` with:
```javascript
const API_BASE = 'http://localhost:3000/api';
```

## Security Notes

- Service Role Key should never be exposed to frontend
- JWT tokens expire after 7 days
- RLS policies in Supabase provide additional security
- CORS is configured to allow specific origins only

## Troubleshooting

**Database connection errors:**
- Check your Supabase URL and Service Role Key in `.env`
- Verify tables were created successfully in Supabase

**Authentication errors:**
- Ensure JWT_SECRET is set in `.env`
- Check token expiration (default: 7 days)

**CORS errors:**
- Update CORS origins in `server.js` to match your frontend URL
