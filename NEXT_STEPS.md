# 🚀 Next Steps: Deploy Your Backend Online

## ✅ What You've Done

- ✅ GitHub repository set up: https://github.com/strylith/Kina-Resort-main
- ✅ GitHub Secrets configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)
- ✅ Code pushed to main branch
- ✅ Local backend running successfully

## 🎯 Choose Your Deployment Platform

You have **2 options** to deploy your backend online:

### Option A: Railway (Recommended - Easiest)

**Why Railway?**
- Easiest setup
- Auto-deploys from GitHub
- Free tier available
- Built-in environment variables

**Steps:**

1. **Sign up at [railway.app](https://railway.app)**
   - Click "Login with GitHub"
   - Authorize Railway

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `strylith/Kina-Resort-main`

3. **Configure Backend Service**
   - Railway will auto-detect Node.js
   - Set **Root Directory**: `server`
   - Add environment variables (click "Variables" tab):
     ```
     SUPABASE_URL=https://djownnqrmeeytnzofuex.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
     SUPABASE_ANON_KEY=<your-anon-key>
     JWT_SECRET=<your-jwt-secret>
     PORT=3000
     NODE_ENV=production
     ```
   - Click "Generate Domain"
   - Click "Deploy"

4. **Get Your Backend URL**
   - Railway will give you a URL like: `https://kina-resort-production.up.railway.app`
   - Copy this URL!

---

### Option B: Render (Free Tier Available)

**Why Render?**
- Free tier available
- Simple setup
- Good for learning

**Steps:**

1. **Sign up at [render.com](https://render.com)**
   - Click "Start Free"
   - Sign in with GitHub

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Select your repository: `strylith/Kina-Resort-main`

3. **Configure Settings**
   - **Name**: `kina-resort-backend`
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Add Environment Variables**
   - Scroll to "Environment Variables"
   - Click "Add Environment Variable"
   - Add each one:
     ```
     SUPABASE_URL=https://djownnqrmeeytnzofuex.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
     SUPABASE_ANON_KEY=<your-anon-key>
     JWT_SECRET=<your-jwt-secret>
     PORT=3000
     NODE_ENV=production
     ```

5. **Create & Deploy**
   - Select **Free** plan
   - Click "Create Web Service"
   - Wait for deployment (~5 minutes)
   - Get your backend URL: `https://kina-resort-backend.onrender.com`

---

## 🔗 Update Frontend to Use Live Backend

Once your backend is deployed, update your frontend to point to it.

### If Using Vercel/Netlify:

1. Go to your frontend deployment settings
2. Add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.com` (from Railway/Render)
3. Redeploy frontend

### If Running Locally:

Update `assets/js/utils/api.js`:

```javascript
const API_URL = 'https://your-backend-railway.app'; // Your live backend URL
```

---

## ✅ Testing Your Deployment

Once deployed, test these endpoints:

1. **Health Check**
   ```
   GET https://your-backend-url.com/health
   ```
   Should return: `{"success":true,"message":"Kina Resort Backend API is running"}`

2. **Test Login**
   - Use your frontend
   - Try logging in with test account
   - Check browser console for errors

3. **Test Calendar**
   - Open booking modal
   - Check if dates load correctly
   - Verify API calls work

---

## 🐛 Troubleshooting

### Backend Won't Start

- Check Railway/Render logs for errors
- Verify all environment variables are set
- Make sure `NODE_ENV=production`

### Frontend Can't Connect

- Check backend URL is correct
- Verify CORS is enabled in backend (already configured)
- Check browser console for CORS errors

### Database Connection Fails

- Verify `SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_ROLE_KEY` is valid
- Test connection in Supabase dashboard

---

## 📞 Quick Reference

**Your Current Setup:**
- **Local Backend**: `http://localhost:3000` ✅ Running
- **GitHub**: `https://github.com/strylith/Kina-Resort-main` ✅ Pushed
- **Supabase**: `https://djownnqrmeeytnzofuex.supabase.co` ✅ Active
- **Live Backend**: `Pending deployment` ⏳

**After Deployment:**
- **Live Backend**: `https://your-backend.railway.app` or `.onrender.com`
- **Frontend**: Update to use live backend URL

---

## 🎉 You're Almost There!

Once deployed:
1. ✅ Backend running online
2. ✅ Frontend can connect to live backend
3. ✅ All features working in production
4. ✅ Ready for users!

Need help? Check the logs in Railway/Render dashboard!
