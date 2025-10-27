import jwt from 'jsonwebtoken';
import { getSupabase } from '../config/supabase.js';

// Lazy load supabase to avoid initialization errors at import time
let supabaseInstance = null;
function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = getSupabase();
  }
  return supabaseInstance;
}

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Supabase to ensure they still exist
    const supabase = getSupabaseClient();
    const { data: user, error } = await supabase.auth.admin.getUserById(decoded.userId);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

export default authenticateToken;



