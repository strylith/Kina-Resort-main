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

# Create .env file with your credentials
# Copy the template below and fill in your actual values
```

**Required Environment Variables:**
Create a `server/.env` file with:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Direct PostgreSQL Connection (Recommended)
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
```

Get credentials from: https://app.supabase.com -> Your Project -> Settings -> API
