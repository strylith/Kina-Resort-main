# Kina Resort Booking System

A full-stack reservation system for Kina Resort with Supabase backend and modern frontend.

## 🌟 Features

- **Room Booking System**: Book rooms, cottages, and function halls
- **Calendar Availability**: Interactive calendar showing real-time availability
- **User Authentication**: Secure login and registration with JWT
- **Booking Management**: View, track, and manage your bookings
- **Responsive Design**: Beautiful UI that works on all devices
- **Real-time Database**: Powered by Supabase

## 🚀 Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT-based auth
- **Hosting**: Vercel/Netlify (Frontend), Railway/Render (Backend)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Git

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/kina-resort.git
cd kina-resort
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# Get credentials from: https://app.supabase.com -> Your Project -> Settings -> API
```

**Required Environment Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep secret!)
- `JWT_SECRET` - Random secret for JWT signing
- `PORT` - Server port (default: 3000)

### 3. Database Setup

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Run the SQL migrations in this order:

```bash
# Run migrations from server directory
server/supabase-setup.sql          # Main database schema
server/supabase-bookings-setup.sql # Bookings tables
server/create-dev-accounts.sql     # Test accounts
```

Or use the Supabase SQL Editor to run these files.

### 4. Start Backend Server

```bash
cd server
npm start
```

Server will run on `http://localhost:3000`

### 5. Frontend Setup

```bash
# From root directory
# Install dependencies (if any)
npm install

# Serve the application (using a local server)
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server -p 8000

# Option 3: Using VS Code Live Server
# Install "Live Server" extension and click "Go Live"
```

Frontend will be available at `http://localhost:8000`

## 🔑 Test Accounts

After running migrations, you can use these test accounts:

```
Email: john@test.com
Password: password123

Email: jane@test.com
Password: password123
```

## 📁 Project Structure

```
kina-resort/
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── components/     # Reusable components
│       ├── pages/          # Page-specific code
│       ├── utils/          # Utility functions
│       └── config/         # Configuration
├── server/
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── config/            # Server configuration
│   └── *.sql              # Database migrations
├── images/                # Static images
├── index.html             # Main HTML file
└── README.md
```

## 🌐 API Endpoints

### Public Endpoints
- `GET /api/bookings/availability/:packageId` - Check availability

### Protected Endpoints (Requires Authentication)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

## 🔒 Environment Variables

Create a `.env` file in the `server/` directory with these variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

**⚠️ Never commit `.env` files to version control!**

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. Push to GitHub
2. Import project to Vercel/Netlify
3. Set build command: (none, static site)
4. Set output directory: `/` (root)
5. Deploy!

### Backend (Railway/Render)

1. Connect GitHub repository
2. Set root directory: `server`
3. Add environment variables from `.env`
4. Deploy!

### Database (Supabase)

Already hosted - no setup needed! 🎉

## 🧪 Testing

```bash
# Test backend API
cd server
npm test

# Or test manually
curl http://localhost:3000/api/bookings/availability/1?checkIn=2025-12-01&checkOut=2025-12-05
```

## 📝 Database Schema

### Tables
- `users` - User accounts
- `packages` - Available packages (rooms, cottages, halls)
- `bookings` - Booking records
- `booking_items` - Individual items per booking (room/cottage/hall details)
- `admin_settings` - Admin configuration
- `reservations_calendar` - Calendar reservation tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - [GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Supabase for the amazing backend platform
- All contributors who helped improve this project

## 📞 Support

For support, email support@kinaresort.com or open an issue on GitHub.

---

**Made with ❤️ for Kina Resort**
