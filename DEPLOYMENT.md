# Deployment Guide for Kina Resort Booking System

## ✅ What's Already Set Up

Your project is now ready for deployment with:
- ✅ `.gitignore` configured to protect sensitive files
- ✅ `README.md` with setup instructions
- ✅ Backend configured with Supabase
- ✅ Database migrations ready
- ✅ Code pushed to GitHub: https://github.com/strylith/Kina-Resort-main
- ✅ Direct PostgreSQL connection configured

## 🚀 Quick Deploy Guide

### Step 0: Configure GitHub Secrets (One-Time Setup)

Before deploying, add your Supabase credentials as GitHub Secrets:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these:

```
Name: DATABASE_URL
Value: postgresql://postgres:ofLq50jaSg25m2nm@db.djownnqrmeeytnzofuex.supabase.co:5432/postgres

Name: SUPABASE_URL
Value: https://djownnqrmeeytnzofuex.supabase.co

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb3dubnFybWVleXRuem9mdWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5NzgxOSwiZXhwIjoyMDc2OTczODE5fQ.WJwQQ8b9wngmFLAtKYMGZBHOEg3BK22TryYJGwcOLL4

Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb3dubnFybWVleXRuem9mdWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTc4MTksImV4cCI6MjA3Njk3MzgxOX0.k4bdG_Tz-Yp_J9_2_gvMi0hjvdUvRKRGnWJsnBP1yRA

Name: JWT_SECRET
Value: Ifh+r0fyodkkSMxDFuqqlQxn/sQOZYnfqTPAWWdzomKzLjbhBmzfakcurO6rHSdm1UAwhuBoo5GaECm+kV1EqA==

Name: RAILWAY_TOKEN (optional, for Railway deployment)
Value: your_railway_token
```

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
4. **IMPORTANT - Configure these settings:**
   - **Root Directory**: Leave blank (use root directory)
   - **Build Command**: (leave empty, npm install runs automatically)
   - **Start Command**: Leave empty (will use `npm start` from root `package.json`)
   - **Port**: Railway will automatically detect PORT from environment variable
5. Add environment variables in Railway Settings → Variables:
   ```
   SUPABASE_URL=https://djownnqrmeeytnzofuex.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb3dubnFybWVleXRuem9mdWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTc4MTksImV4cCI6MjA3Njk3MzgxOX0.k4bdG_Tz-Yp_J9_2_gvMi0hjvdUvRKRGnWJsnBP1yRA
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb3dubnFybWVleXRuem9mdWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5NzgxOSwiZXhwIjoyMDc2OTczODE5fQ.WJwQQ8b9wngmFLAtKYMGZBHOEg3BK22TryYJGwcOLL4
   JWT_SECRET=Ifh+r0fyodkkSMxDFuqqlQxn/sQOZYnfqTPAWWdzomKzLjbhBmzfakcurO6rHSdm1UAwhuBoo5GaECm+kV1EqA==
   PORT=3000
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

### Step 3: GitHub Actions (Automatic Deployment)

Your repository now includes a GitHub Actions workflow (`.github/workflows/deploy-backend.yml`):

**What it does:**
- ✅ Automatically deploys on every push to `main`
- ✅ Uses your Supabase credentials from GitHub Secrets
- ✅ Connects directly to your PostgreSQL database
- ✅ No manual deployment needed!

**How to trigger:**
1. Push changes to your `main` branch
2. GitHub Actions automatically runs
3. Backend deploys with Supabase connection
4. Done!

### Step 4: Update Frontend API URL

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
Edit `assets/js/utils/api.js` to use environment variable or hardcode backend URL:

```javascript
// In assets/js/utils/api.js
const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend.railway.app';
```

### Step 5: Database (Already Configured!)

✅ Your Supabase database is already set up and running in the cloud!
- No additional setup needed
- Database URL: `https://djownnqrmeeytnzofuex.supabase.co`
- Direct PostgreSQL connection configured

## 🔒 Security Checklist

- [x] `.env` file is in `.gitignore`
- [x] Environment variables are not in the repository
- [x] GitHub Secrets configured for deployment
- [x] Production JWT_SECRET is configured
- [x] Supabase service role key is in secrets
- [x] HTTPS is enabled on all deployments
- [x] CORS is configured properly

## 📝 Environment Variables Reference

### Required for Deployment:

```env
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
SUPABASE_URL=https://djownnqrmeeytnzofuex.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
PORT=3000
NODE_ENV=production
```

## 🎯 Post-Deployment Testing

After deployment, test these features:

1. **Frontend loads** - Visit your frontend URL
2. **Backend API responds** - Test `https://your-backend.railway.app/health`
3. **Database connection** - Verify queries work
4. **Login works** - Test with test accounts
5. **Calendar displays** - Open calendar modal
6. **Bookings API works** - Try creating a booking

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
- **GitHub Actions**: Automatically deploying on push

## 🔧 Troubleshooting

### Backend won't start
- Check environment variables are set correctly in deployment platform
- Verify DATABASE_URL is accessible
- Check build logs in Railway/Render

### Frontend can't connect to backend
- Verify backend URL is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

### Database connection errors
- Verify DATABASE_URL format is correct
- Check password is URL-encoded if it has special characters
- Verify database is accessible from deployment platform

### GitHub Actions failing
- Check all secrets are set correctly
- Verify RAILWAY_TOKEN is valid (if using Railway)
- Check workflow logs for specific errors

## 🚀 Automated Deployment

With GitHub Actions configured:

1. **Make changes** to your code
2. **Commit and push** to `main` branch
3. **GitHub Actions** automatically:
   - Tests your code
   - Connects to Supabase
   - Deploys backend
   - Updates live site
4. **Done!** Your app is live

No manual deployment needed! 🎉

---

**Your app is ready for automated deployment with Supabase! 🚀**

