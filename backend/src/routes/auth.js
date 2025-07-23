const express = require('express');
const { verifyFirebaseToken } = require('../middleware/auth');
const { query } = require('../database/db');

const router = express.Router();

/**
 * POST /api/auth/verify
 * Verify Firebase token and sync user data
 */
router.post('/verify', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name } = req.user;

    // Upsert user in database
    const userQuery = `
      INSERT INTO users (id, email, display_name, last_login)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        last_login = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await query(userQuery, [uid, email, name]);
    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        isAdmin: user.is_admin,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('❌ Auth verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify authentication'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const userQuery = `
      SELECT id, email, display_name, is_admin, created_at, last_login
      FROM users 
      WHERE id = $1
    `;

    const result = await query(userQuery, [req.user.uid]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        isAdmin: user.is_admin,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

module.exports = router;
