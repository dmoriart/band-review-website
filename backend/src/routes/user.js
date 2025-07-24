const express = require('express');
const Joi = require('joi');
const { query } = require('../database/db-adapter');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  display_name: Joi.string().max(100).allow(''),
  bio: Joi.string().max(500).allow(''),
  location: Joi.string().max(100).allow(''),
  website: Joi.string().uri().allow(''),
  notification_preferences: Joi.object({
    email_venue_updates: Joi.boolean(),
    email_review_responses: Joi.boolean(),
    email_claim_updates: Joi.boolean(),
    email_marketing: Joi.boolean()
  })
});

// GET /api/user/profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    // Get user profile with owned venues and pending claims
    const userQuery = `
      SELECT 
        u.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', vo.venue_id,
              'name', v.name,
              'address', v.address,
              'main_image', v.main_image,
              'user_role', vo.role,
              'review_count', COALESCE(v.review_count, 0)
            )
          ) FILTER (WHERE vo.venue_id IS NOT NULL), 
          '[]'
        ) as owned_venues,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', vc.id,
              'venue_name', vc.venue_name,
              'claim_type', vc.claim_type,
              'status', vc.status,
              'submitted_at', vc.submitted_at
            )
          ) FILTER (WHERE vc.id IS NOT NULL), 
          '[]'
        ) as pending_claims
      FROM users u
      LEFT JOIN venue_owners vo ON u.id = vo.user_id
      LEFT JOIN venues v ON vo.venue_id = v.id
      LEFT JOIN venue_claims vc ON u.id = vc.user_id AND vc.status IN ('pending', 'requires_verification')
      WHERE u.id = $1
      GROUP BY u.id
    `;
    
    const result = await query(userQuery, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    const user = result.rows[0];
    
    // Get review count
    const reviewCountResult = await query(
      'SELECT COUNT(*) as review_count FROM reviews WHERE user_id = $1',
      [req.user.id]
    );
    
    user.reviews_count = parseInt(reviewCountResult.rows[0].review_count);
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user profile' }
    });
  }
});

// PUT /api/user/profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation error',
          details: error.details.map(d => d.message)
        }
      });
    }
    
    const updateQuery = `
      UPDATE users SET 
        display_name = $1,
        bio = $2,
        location = $3,
        website = $4,
        notification_preferences = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    
    const result = await query(updateQuery, [
      value.display_name,
      value.bio,
      value.location,
      value.website,
      JSON.stringify(value.notification_preferences),
      req.user.id
    ]);
    
    res.json({
      success: true,
      data: { user: result.rows[0] }
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user profile' }
    });
  }
});

module.exports = router;
