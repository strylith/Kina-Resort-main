import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/settings/:key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Setting not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data.value
    });
  } catch (error) {
    console.error('Fetch setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch setting'
    });
  }
});

export default router;




