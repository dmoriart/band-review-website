const express = require('express');
const Joi = require('joi');
const { query } = require('../database/db-adapter');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateVenueSchema = Joi.object({
  name: Joi.string().max(200),
  description: Joi.string().max(2000),
  address: Joi.string().max(300),
  phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-()]{7,15}$/),
  website: Joi.string().uri(),
  email: Joi.string().email(),
  capacity: Joi.number().integer().min(1),
  venue_type: Joi.string().max(100),
  equipment_provided: Joi.array().items(Joi.string()),
  social_media: Joi.object({
    facebook: Joi.string().uri(),
    instagram: Joi.string(),
    twitter: Joi.string()
  })
});

// GET /api/venues/owned
router.get('/owned', authenticateUser, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        v.*,
        vo.role,
        vo.permissions,
        vo.granted_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', r.id,
              'rating', r.rating,
              'title', r.title,
              'created_at', r.created_at
            )
          ) FILTER (WHERE r.id IS NOT NULL), 
          '[]'
        ) as recent_reviews
      FROM venues v
      JOIN venue_owners vo ON v.id = vo.venue_id
      LEFT JOIN reviews r ON v.id = r.venue_id
      WHERE vo.user_id = $1
      GROUP BY v.id, vo.role, vo.permissions, vo.granted_at
      ORDER BY vo.granted_at DESC
    `, [req.user.id]);
    
    res.json({
      success: true,
      data: { venues: result.rows }
    });
    
  } catch (error) {
    console.error('Error fetching owned venues:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch owned venues' }
    });
  }
});

// GET /api/venues/:id/ownership
router.get('/:id/ownership', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has ownership/management rights
    const ownershipResult = await query(`
      SELECT vo.*, u.display_name, u.email
      FROM venue_owners vo
      JOIN users u ON vo.user_id = u.id
      WHERE vo.venue_id = $1 AND vo.user_id = $2
    `, [id, req.user.id]);
    
    if (ownershipResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have ownership rights for this venue' }
      });
    }
    
    const ownership = ownershipResult.rows[0];
    
    // Get venue details
    const venueResult = await query('SELECT * FROM venues WHERE id = $1', [id]);
    
    if (venueResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Venue not found' }
      });
    }
    
    res.json({
      success: true,
      data: { 
        venue: venueResult.rows[0],
        ownership
      }
    });
    
  } catch (error) {
    console.error('Error fetching venue ownership:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch venue ownership' }
    });
  }
});

// PUT /api/venues/:id
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateVenueSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation error',
          details: error.details.map(d => d.message)
        }
      });
    }
    
    // Check if user has edit permissions
    const permissionResult = await query(`
      SELECT permissions FROM venue_owners 
      WHERE venue_id = $1 AND user_id = $2
    `, [id, req.user.id]);
    
    if (permissionResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have permission to edit this venue' }
      });
    }
    
    const permissions = permissionResult.rows[0].permissions;
    if (!permissions.includes('edit')) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have edit permissions for this venue' }
      });
    }
    
    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(typeof val === 'object' ? JSON.stringify(val) : val);
        paramCount++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No valid fields to update' }
      });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);
    
    const updateQuery = `
      UPDATE venues SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await query(updateQuery, updateValues);
    
    // Log the edit
    await query(`
      INSERT INTO venue_edits (
        venue_id, user_id, edit_type, changes, created_at
      ) VALUES ($1, $2, 'update', $3, CURRENT_TIMESTAMP)
    `, [id, req.user.id, JSON.stringify(value)]);
    
    res.json({
      success: true,
      data: { venue: result.rows[0] }
    });
    
  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update venue' }
    });
  }
});

// GET /api/venues/:id/reviews
router.get('/:id/reviews', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has ownership rights
    const ownershipResult = await query(`
      SELECT permissions FROM venue_owners 
      WHERE venue_id = $1 AND user_id = $2
    `, [id, req.user.id]);
    
    if (ownershipResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have access to this venue\'s reviews' }
      });
    }
    
    const result = await query(`
      SELECT 
        r.*,
        u.display_name as reviewer_name,
        b.name as band_name,
        CASE 
          WHEN rr.id IS NOT NULL THEN json_build_object(
            'id', rr.id,
            'response', rr.response,
            'created_at', rr.created_at
          )
          ELSE NULL
        END as owner_response
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN bands b ON r.band_id = b.id
      LEFT JOIN review_responses rr ON r.id = rr.review_id
      WHERE r.venue_id = $1
      ORDER BY r.created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: { reviews: result.rows }
    });
    
  } catch (error) {
    console.error('Error fetching venue reviews:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch venue reviews' }
    });
  }
});

// POST /api/venues/:venueId/reviews/:reviewId/respond
router.post('/:venueId/reviews/:reviewId/respond', authenticateUser, async (req, res) => {
  try {
    const { venueId, reviewId } = req.params;
    const { response } = req.body;
    
    if (!response || response.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Response text is required' }
      });
    }
    
    // Check if user has respond permissions
    const permissionResult = await query(`
      SELECT permissions FROM venue_owners 
      WHERE venue_id = $1 AND user_id = $2
    `, [venueId, req.user.id]);
    
    if (permissionResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have permission to respond to reviews for this venue' }
      });
    }
    
    const permissions = permissionResult.rows[0].permissions;
    if (!permissions.includes('respond_to_reviews')) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have permission to respond to reviews' }
      });
    }
    
    // Check if review exists and belongs to the venue
    const reviewResult = await query(
      'SELECT id FROM reviews WHERE id = $1 AND venue_id = $2',
      [reviewId, venueId]
    );
    
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Review not found' }
      });
    }
    
    // Check if response already exists
    const existingResponse = await query(
      'SELECT id FROM review_responses WHERE review_id = $1',
      [reviewId]
    );
    
    if (existingResponse.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'A response to this review already exists' }
      });
    }
    
    // Create the response
    const result = await query(`
      INSERT INTO review_responses (
        review_id, user_id, response, created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `, [reviewId, req.user.id, response.trim()]);
    
    res.json({
      success: true,
      data: { response: result.rows[0] }
    });
    
  } catch (error) {
    console.error('Error responding to review:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to respond to review' }
    });
  }
});

module.exports = router;
