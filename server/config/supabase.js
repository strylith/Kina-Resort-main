import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Database connection (PostgreSQL or Supabase)
let dbConnection = null;
let connectionType = 'supabase'; // 'supabase' or 'postgres'

// Parse PostgreSQL connection string
function parseDatabaseUrl(url) {
  if (!url) return null;
  
  try {
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) return null;
    
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4]),
      database: match[5],
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  } catch (error) {
    console.error('Error parsing database URL:', error);
    return null;
  }
}

// Initialize database connection
export async function initializeDatabase() {
  const postgresUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (postgresUrl) {
    console.log('🔗 Using direct PostgreSQL connection...');
    connectionType = 'postgres';
    
    const config = parseDatabaseUrl(postgresUrl);
    if (!config) {
      throw new Error('Invalid DATABASE_URL format');
    }
    
    dbConnection = new Pool(config);
    
    try {
      const client = await dbConnection.connect();
      console.log('✅ PostgreSQL connection established');
      client.release();
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      throw error;
    }
    
    return dbConnection;
  } else {
    // Fall back to Supabase JS
    console.log('🔗 Using Supabase JS client...');
    connectionType = 'supabase';
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    
    dbConnection = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    );
    
    console.log('✅ Supabase connection established');
    return dbConnection;
  }
}

// Get the database connection
export function getDbConnection() {
  if (!dbConnection) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbConnection;
}

export function getConnectionType() {
  return connectionType;
}

// Export Supabase clients for backward compatibility
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default supabase;

