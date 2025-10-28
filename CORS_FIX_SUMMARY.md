# CORS Fix for GitHub Pages Deployment

## Problem
The frontend deployed on GitHub Pages (`https://strylith.github.io/Kina-Resort-main/`) was getting CORS errors when trying to access the Railway backend API:
```
Access to fetch at 'https://kina-resort-main-production.up.railway.app/api/auth/login' 
from origin 'https://strylith.github.io' has been blocked by CORS policy
```

## Solution Applied

### 1. Enhanced CORS Configuration (`server/server.js`)
- Changed from simple array of allowed origins to a function-based approach
- Added regex pattern matching for GitHub Pages: `/^https:\/\/strylith\.github\.io\/.*$/`
- This allows any subpath under `strylith.github.io` to access the API

### 2. Explicit OPTIONS Handler
- Added explicit `app.options('*', ...)` handler for CORS preflight requests
- Ensures preflight requests are properly handled before the actual request

### 3. Enhanced CORS Settings
- Added `exposedHeaders` to expose needed headers
- Added `optionsSuccessStatus: 200` for legacy browser support

## Files Changed
- `server/server.js` - Enhanced CORS middleware and added OPTIONS handler

## Next Steps

### For Railway Deployment
1. The changes have been pushed to GitHub
2. Railway should auto-deploy if connected to the GitHub repo
3. If manual deployment needed:
   - Go to Railway dashboard
   - Trigger a redeploy or wait for auto-deploy
   - Verify logs show CORS updates

### Verification Steps
1. After Railway redeploys, test the GitHub Pages site
2. Open browser console on `https://strylith.github.io/Kina-Resort-main/`
3. Try to login/register
4. Should no longer see CORS errors
5. Check Railway logs for requests from `strylith.github.io`

## Testing Commands

Test CORS locally:
```powershell
# Test preflight request
curl -X OPTIONS http://localhost:3000/api/auth/login `
  -H "Origin: https://strylith.github.io" `
  -H "Access-Control-Request-Method: POST" `
  -v

# Should see: Access-Control-Allow-Origin: https://strylith.github.io
```

## Notes
- The CORS fix applies to both local development and production
- GitHub Pages subpaths are now properly handled via regex
- OPTIONS preflight requests are explicitly handled

