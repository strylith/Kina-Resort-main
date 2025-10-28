# Mock Database Test Accounts

## Current Status: NO PRE-SEEDED ACCOUNTS ❌

The mock database starts **completely empty**. There are no pre-configured test accounts.

## How to Use Mock Database

Since the mock database is empty, you need to:

1. **Register a new account** through the UI
2. **Or use the registration API** to create accounts programmatically

## Test Accounts Available for Real Supabase

If you're using real Supabase (not mock), these test accounts exist:

### Admin Account
- **Email**: `admin@kinaresort.com`
- **Password**: `admin123`
- **Role**: Admin

### Customer Account 1
- **Email**: `john@example.com`  
- **Password**: `customer123`
- **Name**: John Doe

### Customer Account 2
- **Email**: `jane@example.com`
- **Password**: `customer123`
- **Name**: Jane Smith

**Note**: These accounts only exist in Supabase, NOT in the mock database.

## Option: Seed Mock Database with Test Accounts

If you want to add test accounts to the mock database, you can:

1. Modify `server/db/mockDatabaseClient.js` to seed users on initialization
2. Create a seed script that runs when the server starts with `USE_MOCK_DB=true`
3. Register accounts normally through the UI (recommended)

## Quick Test: Register via API

You can register a test account using curl:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Then login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

## Summary

✅ **Mock Database**: Empty by default - register accounts through the UI  
⚠️ **Real Supabase**: Has 3 test accounts (see above)  
📝 **Recommendation**: Just register a new account through the registration form


