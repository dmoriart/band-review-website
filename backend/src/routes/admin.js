const express = require('express');
const { param, body, validationResult } = require('express-validator');
const { verifyFirebaseToken } = require('../middleware/auth');
const { query } = require('../database/db');

const router = express.Router();

/**
 * Admin middleware - check if user is admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    const userQuery = `SELECT is_admin FROM users WHERE id = $1`;
    const result = await query(userQuery, [req.user.uid]);
    
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ Admin check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify admin status'
    });
  }
};

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
 * GET /api/admin/claims
 * Get all pending band claims for admin review
 */
router.get('/claims', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', limit = 50, offset = 0 } = req.query;

    const claimsQuery = `
      SELECT 
        bo.id, bo.band_id, bo.band_name, bo.role, bo.status, 
        bo.claim_method, bo.verification_data, bo.requested_at,
        bo.approved_at, bo.rejected_at,
        u.email as user_email, u.display_name as user_name,
        approver.email as approved_by_email,
        rejector.email as rejected_by_email
      FROM band_ownership bo
      JOIN users u ON bo.user_id = u.id
      LEFT JOIN users approver ON bo.approved_by = approver.id
      LEFT JOIN users rejector ON bo.rejected_by = rejector.id
      WHERE bo.status = $1
      ORDER BY bo.requested_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(claimsQuery, [status, limit, offset]);

    res.json({
      success: true,
      claims: result.rows.map(row => ({
        id: row.id,
        bandId: row.band_id,
        bandName: row.band_name,
        role: row.role,
        status: row.status,
        claimMethod: row.claim_method,
        verificationData: row.verification_data,
        requestedAt: row.requested_at,
        approvedAt: row.approved_at,
        rejectedAt: row.rejected_at,
        user: {
          email: row.user_email,
          name: row.user_name
        },
        approvedBy: row.approved_by_email,
        rejectedBy: row.rejected_by_email
      }))
    });

  } catch (error) {
    console.error('❌ Get admin claims error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get claims'
    });
  }
});

/**
 * POST /api/admin/claims/:claimId/approve
 * Approve a band claim
 */
router.post('/claims/:claimId/approve', [
  param('claimId').isInt().withMessage('Invalid claim ID')
], handleValidationErrors, verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { claimId } = req.params;
    const adminId = req.user.uid;

    // Check if claim exists and is pending
    const claimQuery = `
      SELECT * FROM band_ownership 
      WHERE id = $1 AND status = 'pending'
    `;
    const claimResult = await query(claimQuery, [claimId]);

    if (claimResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pending claim not found'
      });
    }

    // Approve the claim
    const approveQuery = `
      UPDATE band_ownership 
      SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(approveQuery, [adminId, claimId]);
    const approvedClaim = result.rows[0];

    res.json({
      success: true,
      message: 'Claim approved successfully',
      claim: {
        id: approvedClaim.id,
        bandId: approvedClaim.band_id,
        bandName: approvedClaim.band_name,
        status: approvedClaim.status,
        approvedAt: approvedClaim.approved_at
      }
    });

  } catch (error) {
    console.error('❌ Approve claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve claim'
    });
  }
});

/**
 * POST /api/admin/claims/:claimId/reject
 * Reject a band claim
 */
router.post('/claims/:claimId/reject', [
  param('claimId').isInt().withMessage('Invalid claim ID'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], handleValidationErrors, verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const { claimId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.uid;

    // Check if claim exists and is pending
    const claimQuery = `
      SELECT * FROM band_ownership 
      WHERE id = $1 AND status = 'pending'
    `;
    const claimResult = await query(claimQuery, [claimId]);

    if (claimResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pending claim not found'
      });
    }

    // Reject the claim
    const rejectQuery = `
      UPDATE band_ownership 
      SET status = 'rejected', rejected_at = CURRENT_TIMESTAMP, rejected_by = $1,
          verification_data = COALESCE(verification_data, '{}') || $2
      WHERE id = $3
      RETURNING *
    `;

    const rejectionData = reason ? JSON.stringify({ rejectionReason: reason }) : '{}';
    const result = await query(rejectQuery, [adminId, rejectionData, claimId]);
    const rejectedClaim = result.rows[0];

    res.json({
      success: true,
      message: 'Claim rejected successfully',
      claim: {
        id: rejectedClaim.id,
        bandId: rejectedClaim.band_id,
        bandName: rejectedClaim.band_name,
        status: rejectedClaim.status,
        rejectedAt: rejectedClaim.rejected_at
      }
    });

  } catch (error) {
    console.error('❌ Reject claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject claim'
    });
  }
});

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    // Get claim statistics
    const statsQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM band_ownership
      GROUP BY status
    `;

    const result = await query(statsQuery);
    const stats = {};
    
    result.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
    });

    // Get total users
    const usersQuery = `SELECT COUNT(*) as count FROM users`;
    const usersResult = await query(usersQuery);
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Get recent claims
    const recentQuery = `
      SELECT COUNT(*) as count 
      FROM band_ownership 
      WHERE requested_at > NOW() - INTERVAL '7 days'
    `;
    const recentResult = await query(recentQuery);
    const recentClaims = parseInt(recentResult.rows[0].count);

    res.json({
      success: true,
      stats: {
        claims: {
          pending: stats.pending || 0,
          approved: stats.approved || 0,
          rejected: stats.rejected || 0,
          total: Object.values(stats).reduce((a, b) => a + b, 0)
        },
        users: {
          total: totalUsers
        },
        recent: {
          claimsThisWeek: recentClaims
        }
      }
    });

  } catch (error) {
    console.error('❌ Get admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

module.exports = router;
