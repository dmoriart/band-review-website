const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { verifyFirebaseToken, optionalAuth } = require('../middleware/auth');
const { query } = require('../database/db');

const router = express.Router();

/**
 * Validation middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/bands/:bandId/claim
 * Submit a band ownership claim
 */
router.post('/:bandId/claim', [
  param('bandId').notEmpty().withMessage('Band ID is required'),
  body('bandName').notEmpty().withMessage('Band name is required'),
  body('claimMethod').isIn(['email', 'social', 'manual']).withMessage('Invalid claim method'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('socialProof').optional().isObject().withMessage('Social proof must be an object'),
  body('manualData').optional().isObject().withMessage('Manual data must be an object')
], handleValidationErrors, verifyFirebaseToken, async (req, res) => {
  try {
    const { bandId } = req.params;
    const { bandName, claimMethod, email, socialProof, manualData } = req.body;
    const userId = req.user.uid;

    // Check if user already has a claim for this band
    const existingClaimQuery = `
      SELECT * FROM band_ownership 
      WHERE user_id = $1 AND band_id = $2
    `;
    const existing = await query(existingClaimQuery, [userId, bandId]);

    if (existing.rows.length > 0) {
      const existingClaim = existing.rows[0];
      return res.status(400).json({
        success: false,
        error: 'Claim already exists',
        message: `You already have a ${existingClaim.status} claim for this band`
      });
    }

    // Prepare verification data
    const verificationData = {};
    if (email) verificationData.email = email;
    if (socialProof) verificationData.socialProof = socialProof;
    if (manualData) verificationData.manualData = manualData;

    // Insert new claim
    const insertQuery = `
      INSERT INTO band_ownership 
      (user_id, band_id, band_name, role, status, claim_method, verification_data)
      VALUES ($1, $2, $3, 'owner', 'pending', $4, $5)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      userId, 
      bandId, 
      bandName, 
      claimMethod, 
      JSON.stringify(verificationData)
    ]);

    const claim = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Band claim submitted successfully',
      claim: {
        id: claim.id,
        bandId: claim.band_id,
        bandName: claim.band_name,
        status: claim.status,
        claimMethod: claim.claim_method,
        requestedAt: claim.requested_at
      }
    });

  } catch (error) {
    console.error('❌ Band claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit band claim'
    });
  }
});

/**
 * GET /api/bands/:bandId/ownership
 * Check if current user can edit this band
 */
router.get('/:bandId/ownership', [
  param('bandId').notEmpty().withMessage('Band ID is required')
], handleValidationErrors, verifyFirebaseToken, async (req, res) => {
  try {
    const { bandId } = req.params;
    const userId = req.user.uid;

    const ownershipQuery = `
      SELECT * FROM band_ownership 
      WHERE user_id = $1 AND band_id = $2 AND status = 'approved'
    `;

    const result = await query(ownershipQuery, [userId, bandId]);
    const hasOwnership = result.rows.length > 0;

    res.json({
      success: true,
      canEdit: hasOwnership,
      ownership: hasOwnership ? {
        role: result.rows[0].role,
        approvedAt: result.rows[0].approved_at
      } : null
    });

  } catch (error) {
    console.error('❌ Ownership check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check ownership'
    });
  }
});

/**
 * GET /api/bands/my-bands
 * Get bands that the current user can edit
 */
router.get('/my-bands', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const bandsQuery = `
      SELECT band_id, band_name, role, approved_at
      FROM band_ownership 
      WHERE user_id = $1 AND status = 'approved'
      ORDER BY approved_at DESC
    `;

    const result = await query(bandsQuery, [userId]);

    res.json({
      success: true,
      bands: result.rows.map(row => ({
        id: row.band_id,
        name: row.band_name,
        role: row.role,
        approvedAt: row.approved_at
      }))
    });

  } catch (error) {
    console.error('❌ Get user bands error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user bands'
    });
  }
});

/**
 * GET /api/bands/my-claims
 * Get current user's band claims (all statuses)
 */
router.get('/my-claims', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    const claimsQuery = `
      SELECT id, band_id, band_name, role, status, claim_method, 
             requested_at, approved_at, rejected_at
      FROM band_ownership 
      WHERE user_id = $1
      ORDER BY requested_at DESC
    `;

    const result = await query(claimsQuery, [userId]);

    res.json({
      success: true,
      claims: result.rows.map(row => ({
        id: row.id,
        bandId: row.band_id,
        bandName: row.band_name,
        role: row.role,
        status: row.status,
        claimMethod: row.claim_method,
        requestedAt: row.requested_at,
        approvedAt: row.approved_at,
        rejectedAt: row.rejected_at
      }))
    });

  } catch (error) {
    console.error('❌ Get user claims error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user claims'
    });
  }
});

module.exports = router;
