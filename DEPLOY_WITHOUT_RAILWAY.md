# Deploy Without Railway - Options for Mock Database

Since you're using a mock database, here are your options:

## Option 1: Render.com (Free Tier) - Recommended ⭐

Render.com is similar to Railway but free for backend services.

### Steps:

1. **Go to [render.com](https://render.com)** and sign up with GitHub
2. **New → Web Service**
3. **Connect your GitHub repo**: `Kina-Resort-main`
4. **Configure:**
   - **Name**: `kina-resort-mock-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Environment Variables:**
   ```
   USE_MOCK_DB=true
   PORT=3000
   NODE_ENV=production
   ```
6. **Deploy!** You'll get a URL like: `https://kina-resort-mock-api.onrender.com`

### Update Frontend API URL:

Edit `assets/js/utils/api.js`:
```javascript
const API_BASE = isProduction 
  ? 'https://kina-resort-mock-api.onrender.com/api'  // Your Render URL
  : 'http://localhost:3000/api';
```

Then update CORS in `server/server.js` to include your Render URL.

---

## Option 2: Fly.io (Free Tier)

1. **Install flyctl**: https://fly.io/docs/getting-started/installing-flyctl/
2. **Create account**: `flyctl auth signup`
3. **Deploy**: `cd server && flyctl launch`
4. **Set environment**: `flyctl secrets set USE_MOCK_DB=true`
5. **Get URL**: `flyctl status`

---

## Option 3: Completely Client-Side (No Backend) - Easiest! 🎯

Since you're using a mock database anyway, we can make it work entirely in the browser using localStorage/sessionStorage!

### Benefits:
- ✅ No backend server needed
- ✅ Works on GitHub Pages immediately
- ✅ No CORS issues
- ✅ Free forever

### Implementation:

I can refactor the code to:
1. Replace mock API calls with localStorage-based storage
2. Remove dependency on backend for bookings
3. Keep auth working with localStorage sessions
4. Make everything work client-side only

**Would you like me to implement this?** It would take ~30 minutes and make your app truly static (no backend needed).

---

## Option 4: Keep Using Railway (But Free)

Railway does have a free tier with $5 credit per month, which is usually enough for a small mock API. The CORS fix I just implemented will work once Railway redeploys.

---

## Recommendation

**If you just want it to work quickly:** Use Render.com (Option 1) - it's the easiest backend option.

**If you want zero backend costs:** Go fully client-side (Option 3) - I can implement this for you.

Let me know which option you prefer!

