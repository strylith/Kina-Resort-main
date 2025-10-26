# Deployment Guide for Kina Resort Booking System

## ✅ What's Already Set Up

Your project is now ready for deployment with:
- ✅ `.gitignore` configured to protect sensitive files
- ✅ `README.md` with setup instructions
- ✅ `.env.example` template for environment variables
- ✅ Backend configured with Supabase
- ✅ Database migrations ready
- ✅ Code pushed to GitHub: https://github.com/strylith/Kina-Resort-main

## 🚀 Quick Deploy Guide

### Step 1: Frontend Deployment (Vercel/Netlify)

#### Option A: Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your repository: `Kina-Resort-main`
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave default)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: Leave empty
5. Click "Deploy"
6. Done! Your frontend is live at `https://your-project.vercel.app`

#### Option B: Netlify

1. Go to [netlify.com](https://netlify.com) and sign in with GitHub
2. Click "New site from Git"
3. Select your repository: `Kina-Resort-main`
4. Configure:
   - **Build command**: (leave empty)
   - **Publish directory**: `./` (root)
5. Click "Deploy site"
6. Done! Your frontend is live at `https://your-project.netlify.app`

### Step 2: Backend Deployment (Railway/Render)

#### Option A: Railway (Recommended)

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" > "Deploy from GitHub repo"
3. Select your repository: `Kina-Resort-main`
4. Configure:
   - **Root Directory**: `server`
   - **Start Command**: `npm start`
5. Add environment variables:
   - Click on your service
   - Go to "Variables" tab
   - Add all variables from your `.env` file:
     ```
     SUPABASE_URL=https://djownnqrmeeytnzofuex.supabase.co
     SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     PORT=3000
     JWT_SECRET=your_jwt_secret
     NODE_ENV=production
     ```
6. Deploy!
7. Get your backend URL: `https://your-app.railway.app`

#### Option B: Render

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click "New" > "Web Service"
3. Connect your repository: `Kina-Resort-main`
4. Configure:
   - **Name**: kina-resort-backend
   - **Environment**: Node
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Click "Create Web Service"
7. Get your backend URL: `https://your-app.onrender.com`

### Step 3: Update Frontend API URL

After deploying backend, update the frontend to point to the new backend URL.

**For Vercel:**
1. Go to your project settings
2. Add environment variable:
   - `VITE_API_URL=https://your-backend-url.com`

**For Netlify:**
1. Go to Site settings > Environment variables
2. Add variable:
   - `API_URL=https://your-backend-url.com`

**Update Frontend Code:**
Edit `assets/js/utils/api.js` or `assets/js/config/aiConfig.js` to use environment variable or hardcode backend URL:

```javascript
// In assets/js/utils/api.js or similar
const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend.railway.app';
```

### Step 4: Database (Already Configured!)

✅ Your Supabase database is already set up and running in the cloud!
- No additional setup needed
- Database URL: `https://djownnqrmeeytnzofuex.supabase.co`

## 🔒 Security Checklist

- [x] `.env` file is in `.gitignore`
- [x] Environment variables are not in the repository
- [x] `.env.example` provided for reference
- [ ] Production JWT_SECRET is strong and unique
- [ ] Supabase service role key is kept secret
- [ ] HTTPS is enabled on all deployments
- [ ] CORS is configured properly

## 📝 Environment Variables

### Required for Backend:

```env
SUPABASE_URL=https://djownnqrmeeytnzofuex.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

### How to Get Supabase Credentials:

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY) ⚠️ Keep this secret!

## 🎯 Post-Deployment Testing

After deployment, test these features:

1. **Frontend loads** - Visit your frontend URL
2. **Login works** - Test with test accounts
3. **Calendar displays** - Open calendar modal
4. **Bookings API works** - Try creating a booking
5. **Database connection** - Verify data is saved

### Test Accounts:
```
Email: john@test.com
Password: password123
```

## 🌐 Your Live URLs

After deployment, you'll have:

- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-backend.railway.app`
- **Database**: Already live on Supabase!

## 🔧 Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Verify Supabase credentials are correct
- Check build logs in Railway/Render

### Frontend can't connect to backend
- Verify backend URL is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

### Database connection errors
- Verify Supabase credentials
- Check if database migrations are run
- Check Supabase project status

## 📞 Support

- GitHub Issues: [Your Repo Link]
- Email: support@your-domain.com

---

**Your app is ready for deployment! 🚀**
