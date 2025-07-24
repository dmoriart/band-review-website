const express = require('express');
const Joi = require('joi');
const { query, getClient } = require('../database/db-adapter');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const submitClaimSchema = Joi.object({
  venue_id: Joi.number().integer().required(),
  claim_type: Joi.string().valid('ownership', 'management').required(),
  verification_data: Joi.object({
    phone: Joi.string().pattern(/^[+]?[1-9][\d\s\-()]{7,15}$/),
    website: Joi.string().uri(),
    social_facebook: Joi.string().uri(),
    social_instagram: Joi.string()
  }),
  business_documents: Joi.array().items(Joi.string().uri()),
  additional_notes: Joi.string().max(1000)
});

const reviewClaimSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject', 'require_verification').required(),
  admin_notes: Joi.string().max(500),
  granted_role: Joi.string().valid('owner', 'manager', 'editor'),
  granted_permissions: Joi.array().items(
    Joi.string().valid('edit', 'respond_to_reviews', 'manage_staff', 'view_analytics', 'manage_events', 'upload_images')
  ),
  rejection_reason: Joi.string().max(500)
});

// POST /api/claims/submit
router.post('/submit', authenticateUser, async (req, res) => {
  const client = await getClient();
  
  try {
    const { error, value } = submitClaimSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation error',
          details: error.details.map(d => d.message)
        }
      });
    }
    
    await client.query('BEGIN');
    
    // Check if venue exists
    const venueResult = await client.query(
      'SELECT id, name FROM venues WHERE id = $1',
      [value.venue_id]
    );
    
    if (venueResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { message: 'Venue not found' }
      });
    }
    
    // Check if user already has pending claim for this venue
    const existingClaimResult = await client.query(
      'SELECT id FROM venue_claims WHERE user_id = $1 AND venue_id = $2 AND status IN ($3, $4)',
      [req.user.id, value.venue_id, 'pending', 'requires_verification']
    );
    
    if (existingClaimResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: { message: 'You already have a pending claim for this venue' }
      });
    }
    
    // Check if venue already has an owner
    const ownerResult = await client.query(
      'SELECT id FROM venue_owners WHERE venue_id = $1 AND role = $2',
      [value.venue_id, 'owner']
    );
    
    if (ownerResult.rows.length > 0 && value.claim_type === 'ownership') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: { message: 'This venue already has an owner' }
      });
    }
    
    // Create the claim
    const claimResult = await client.query(`
      INSERT INTO venue_claims (
        user_id, venue_id, venue_name, claim_type, verification_data,
        business_documents, additional_notes, status, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      req.user.id,
      value.venue_id,
      venueResult.rows[0].name,
      value.claim_type,
      JSON.stringify(value.verification_data),
      JSON.stringify(value.business_documents || []),
      value.additional_notes
    ]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      data: { claim: claimResult.rows[0] }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting claim:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to submit claim' }
    });
  } finally {
    client.release();
  }
});

// GET /api/claims/user
router.get('/user', authenticateUser, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        vc.*,
        u.display_name as user_display_name,
        u.email as user_email
      FROM venue_claims vc
      JOIN users u ON vc.user_id = u.id
      WHERE vc.user_id = $1
      ORDER BY vc.submitted_at DESC
    `, [req.user.id]);
    
    res.json({
      success: true,
      data: { claims: result.rows }
    });
    
  } catch (error) {
    console.error('Error fetching user claims:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch claims' }
    });
  }
});

// GET /api/claims/pending (Admin only)
router.get('/pending', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    let queryText = `
      SELECT 
        vc.*,
        u.display_name as user_display_name,
        u.email as user_email
      FROM venue_claims vc
      JOIN users u ON vc.user_id = u.id
    `;
    
    let params = [];
    
    if (status !== 'all') {
      queryText += ' WHERE vc.status = $1';
      params.push(status);
    }
    
    queryText += ' ORDER BY vc.submitted_at DESC';
    
    const result = await query(queryText, params);
    
    res.json({
      success: true,
      data: { claims: result.rows }
    });
    
  } catch (error) {
    console.error('Error fetching pending claims:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch pending claims' }
    });
  }
});

// PUT /api/claims/:id/review (Admin only)
router.put('/:id/review', authenticateUser, requireAdmin, async (req, res) => {
  const client = await getClient();
  
  try {
    const { id } = req.params;
    const { error, value } = reviewClaimSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation error',
          details: error.details.map(d => d.message)
        }
      });
    }
    
    await client.query('BEGIN');
    
    // Get the claim
    const claimResult = await client.query(
      'SELECT * FROM venue_claims WHERE id = $1',
      [id]
    );
    
    if (claimResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { message: 'Claim not found' }
      });
    }
    
    const claim = claimResult.rows[0];
    
    if (value.action === 'approve') {
      // Create venue ownership
      await client.query(`
        INSERT INTO venue_owners (
          user_id, venue_id, role, permissions, granted_at, granted_by
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
      `, [
        claim.user_id,
        claim.venue_id,
        value.granted_role || 'owner',
        JSON.stringify(value.granted_permissions || ['edit', 'respond_to_reviews']),
        req.user.id
      ]);
      
      // Update claim status
      await client.query(`
        UPDATE venue_claims SET 
          status = 'approved',
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = $1,
          admin_notes = $2
        WHERE id = $3
      `, [req.user.id, value.admin_notes, id]);
      
    } else if (value.action === 'reject') {
      // Update claim status
      await client.query(`
        UPDATE venue_claims SET 
          status = 'rejected',
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = $1,
          admin_notes = $2,
          rejection_reason = $3
        WHERE id = $4
      `, [req.user.id, value.admin_notes, value.rejection_reason, id]);
      
    } else if (value.action === 'require_verification') {
      // Update claim status
      await client.query(`
        UPDATE venue_claims SET 
          status = 'requires_verification',
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = $1,
          admin_notes = $2
        WHERE id = $3
      `, [req.user.id, value.admin_notes, id]);
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      data: { message: 'Claim reviewed successfully' }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reviewing claim:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to review claim' }
    });
  } finally {
    client.release();
  }
});

module.exports = router;
