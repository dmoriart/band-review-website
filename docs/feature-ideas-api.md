# Feature Ideas API Documentation

## API Endpoints Overview

### Features Endpoints

#### GET /api/features
Get all features with filtering and sorting

**Query Parameters:**
- `type`: 'feature' | 'bug' | 'all' (default: 'all')
- `status`: 'suggested' | 'in_progress' | 'done' | 'rejected' | 'all' (default: 'all')
- `sort`: 'upvotes' | 'recent' | 'oldest' (default: 'upvotes')
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `tags`: comma-separated string of tags

**Example:** `GET /api/features?type=feature&status=suggested&sort=upvotes&page=1&limit=10`

**Response:**
```json
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
        "user_has_voted": true,
        "user_is_subscribed": false,
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-15T10:30:00Z",
        "completed_at": null,
        "completed_by": null
      }
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
      }
    }
  }
}
```

#### POST /api/features
Create a new feature request or bug report (requires authentication)

**Request Body:**
```json
{
  "title": "Feature title",
  "description": "Detailed description",
  "type": "feature",
  "tags": ["mobile", "ui"],
  "priority": "medium"
}
```

#### GET /api/features/:id
Get a specific feature with full details

#### PUT /api/features/:id
Update a feature (admin only)

#### DELETE /api/features/:id
Delete a feature (admin only)

### Voting Endpoints

#### POST /api/features/:id/vote
Vote on a feature (requires authentication)

**Request Body:**
```json
{
  "vote_type": "upvote"
}
```

#### DELETE /api/features/:id/vote
Remove user's vote (requires authentication)

### Comments Endpoints

#### GET /api/features/:id/comments
Get comments for a feature

#### POST /api/features/:id/comments
Add a comment (requires authentication)

**Request Body:**
```json
{
  "content": "This would be really useful for mobile users!"
}
```

### Subscription Endpoints

#### POST /api/features/:id/subscribe
Subscribe to feature updates (requires authentication)

#### DELETE /api/features/:id/subscribe
Unsubscribe from feature updates

### Notification Endpoints

#### GET /api/user/notifications
Get user's notifications (requires authentication)

#### PUT /api/user/notifications/:id/read
Mark notification as read

### Admin Endpoints

#### GET /api/admin/features/stats
Get feature statistics (requires admin authentication)

#### PUT /api/admin/features/:id/status
Update feature status (admin only)

**Request Body:**
```json
{
  "status": "done",
  "admin_notes": "Completed in version 2.1.0",
  "notify_subscribers": true
}
```

## Error Response Format

```json
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
```

## Common Error Codes
- `AUTHENTICATION_REQUIRED`
- `INSUFFICIENT_PERMISSIONS`
- `VALIDATION_ERROR`
- `FEATURE_NOT_FOUND`
- `ALREADY_VOTED`
- `RATE_LIMIT_EXCEEDED`
- `SERVER_ERROR`
