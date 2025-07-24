// Feature Ideas API Structure for Band Venue Review Website

// ===== FEATURES ENDPOINTS =====

// GET /api/features - Get all features with filtering and sorting
// Query parameters:
// - type: 'feature' | 'bug' | 'all' (default: 'all')
// - status: 'suggested' | 'in_progress' | 'done' | 'rejected' | 'all' (default: 'all')
// - sort: 'upvotes' | 'recent' | 'oldest' (default: 'upvotes')
// - page: number (default: 1)
// - limit: number (default: 20)
// - tags: comma-separated string of tags
// Example: GET /api/features?type=feature&status=suggested&sort=upvotes&page=1&limit=10

// Response example:
/*
{
  "success": true,
  "data": {
    "features": [
      {
        "id": 1,
        "title": "Dark Mode Support",
        "description": "Add a dark mode toggle...",
        "type": "feature",
        "status": "suggested",
        "priority": "medium",
        "tags": ["ui", "accessibility"],
        "author": {
          "id": "firebase-uid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "upvotes_count": 15,
        "comments_count": 3,
        "user_has_voted": true, // only if user is authenticated
        "user_is_subscribed": false, // only if user is authenticated
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-15T10:30:00Z",
        "completed_at": null,
        "completed_by": null
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 87,
      "per_page": 20
    },
    "filters": {
      "available_tags": ["ui", "mobile", "performance", "bug", "enhancement"],
      "status_counts": {
        "suggested": 45,
        "in_progress": 12,
        "done": 28,
        "rejected": 2
*/

// POST /api/features - Create a new feature request or bug report
// Requires authentication
// Body example:
/*
{
  "title": "Feature title",
  "description": "Detailed description",
  "type": "feature", // or "bug"
  "tags": ["mobile", "ui"], // optional
  "priority": "medium" // optional, admins can override
}
*/
// Response example:
/*
{
    "success": true,
    "data": {
      // "feature" should contain the full feature object
      "feature": {},
      "message": "Feature request submitted successfully"
    }
  }
*/
/*

// GET /api/features/:id - Get a specific feature with full details
// Response includes comments and vote history

// PUT /api/features/:id - Update a feature (admin only)
// Body example:
/*
{
  "status": "in_progress",
  "priority": "high",
  "admin_notes": "Working on this for next release"
}
*/

// DELETE /api/features/:id - Delete a feature (admin only)

// ===== VOTING ENDPOINTS =====

// POST /api/features/:id/vote - Vote on a feature
// Requires authentication
// Body example:
/*
{
  "vote_type": "upvote" // or "downvote"
}
*/

// Response example:
/*
{
  "success": true,
  "data": {
    "total_votes": 15,
    "upvotes": 15,
    "downvotes": 0,
    "voters": [
      {
        "user_id": "firebase-uid",
        "user_name": "John Doe",
        "vote_type": "upvote",
        "created_at": "2025-01-15T10:30:00Z"
    ]
    }
  }
}

// ===== COMMENTS ENDPOINTS =====

// GET /api/features/:id/comments - Get comments for a feature
// Query parameters:
// - page: number (default: 1)
// - limit: number (default: 10)

// POST /api/features/:id/comments - Add a comment
// Requires authentication
// Body:
{
  "content": "This would be really useful for mobile users!"
}

// PUT /api/features/:id/comments/:commentId - Update a comment
// DELETE /api/features/:id/comments/:commentId - Delete a comment

// ===== SUBSCRIPTION ENDPOINTS =====

// POST /api/features/:id/subscribe - Subscribe to feature updates
// Requires authentication
// Body:
{
  "notify_email": true,
  "notify_in_app": true
}

// DELETE /api/features/:id/subscribe - Unsubscribe from feature updates

// GET /api/user/subscriptions - Get user's feature subscriptions
// Requires authentication

// ===== NOTIFICATION ENDPOINTS =====

// GET /api/user/notifications - Get user's notifications
// Requires authentication
// Query parameters:
// - unread_only: boolean (default: false)
// - page: number (default: 1)
// - limit: number (default: 20)

// PUT /api/user/notifications/:id/read - Mark notification as read
// Response example:
/*
{
  "success": true,
  "data": {
    "total_features": 87,
    "by_status": {
      "suggested": 45,
      "in_progress": 12,
      "done": 28,
      "rejected": 2
    },
    "by_type": {
      "feature": 73,
      "bug": 14
    },
    "top_requested": [
      {
        "id": 1,
        "title": "Dark Mode Support",
        "upvotes": 31
      }
    ],
    "recent_activity": [
      {
        "type": "new_feature",
        "feature_id": 88,
        "title": "Export Review Data",
        "created_at": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
*/
// The following lines were duplicated and caused a syntax error:
//        "title": "Export Review Data",
//        "created_at": "2025-01-15T10:30:00Z"
//      }
//    ]
//  }
//}

// PUT /api/admin/features/:id/status - Update feature status
// Body:
/*
{
  "status": "done",
  "admin_notes": "Completed in version 2.1.0",
  "notify_subscribers": true
}
*/

// POST /api/admin/notifications/broadcast - Send notification to all users
// Body:

// Standard error response format:
/*
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": {
      "field": "title",
      "value": ""
    }
  }
}
*/

// Common error codes:
// - AUTHENTICATION_REQUIRED
// - INSUFFICIENT_PERMISSIONS
// - VALIDATION_ERROR
// - FEATURE_NOT_FOUND
// - ALREADY_VOTED
// - RATE_LIMIT_EXCEEDED
// - SERVER_ERROR
