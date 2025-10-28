# Server Restart Instructions - Package Seeding Fix

## Issue
The server is returning "Package not found" because it was started **before** the package seeding code was added. The server needs to be restarted to load the new packages.

## Quick Fix - Restart Server

### Option 1: Using the Restart Script (Recommended)
```powershell
cd server
.\restart-server.ps1
```

### Option 2: Manual Restart
```powershell
# 1. Stop the server (Ctrl+C in the terminal where it's running)
# OR kill all Node processes:
Get-Process node | Where-Object { $_.Path -like "*server*" } | Stop-Process -Force

# 2. Start the server with mock database
cd server
$env:USE_MOCK_DB = "true"
npm start
```

### Option 3: Quick Test
```powershell
# Just restart from the server directory
cd C:\Users\ADZ\Desktop\Kina-Resort-main\server
npm start
```
Make sure `USE_MOCK_DB=true` is set (check `.env` file or set in terminal)

## Verification

After restarting, you should see:
```
🧩 Seeding default packages for mock database...
✅ Default packages seeded
🚀 Kina Resort Backend API running on port 3000
```

### Test Package Availability
```bash
# Check if packages are loaded
curl http://localhost:3000/api/packages/debug
```

Should return:
```json
{
  "success": true,
  "mode": "mock",
  "count": 9,
  "packages": [
    {"id": 1, "title": "Standard Room", ...},
    {"id": 2, "title": "Ocean View Room", ...},
    ...
  ]
}
```

## What Was Fixed

1. ✅ **Package Seeding** - 9 packages now seed automatically
2. ✅ **Booking Terms Route** - `/api/settings/booking_terms` added
3. ✅ **Package IDs** - Backend IDs match frontend expectations
4. ✅ **Manifest File** - Created `manifest.webmanifest`

## After Restart

1. Try booking again - should work now
2. Check console - should see package lookup success
3. Verify My Bookings - booking should appear


