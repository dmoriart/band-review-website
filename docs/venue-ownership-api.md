# Venue Ownership Management API Documentation

## Overview
This API manages venue claiming, ownership verification, and edit permissions for the BandVenueReview.ie platform.

## Authentication
All endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

## Base URL
```
https://api.bandvenuereview.ie/v1
```

---

## User Management

### POST /api/users/sync
Sync user data from Firebase Auth to local database.

**Request Body:**
```json
{
  "firebase_uid": "string",
  "email": "string", 
  "display_name": "string",
  "profile_image_url": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "firebase_uid": "abc123",
      "email": "user@example.com",
      "display_name": "John Doe",
      "role": "user",
      "created_at": "2024-07-24T10:00:00Z"
    }
  }
}
```

### GET /api/users/profile
Get current user's profile and venue ownership information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "owner@venue.com",
      "display_name": "Venue Owner",
      "role": "venue_owner",
      "owned_venues": [
        {
          "venue_id": "the-academy",
          "venue_name": "The Academy",
          "role": "owner",
          "is_primary": true,
          "permissions": ["edit", "manage_staff", "view_analytics"]
        }
      ],
      "pending_claims": [
        {
          "claim_id": 123,
          "venue_id": "vicar-street",
          "venue_name": "Vicar Street", 
          "status": "pending",
          "submitted_at": "2024-07-24T10:00:00Z"
        }
      ]
    }
  }
}
```

---

## Venue Claims

### POST /api/venues/{venue_id}/claim
Submit a claim to own/manage a venue.

**Path Parameters:**
- `venue_id`: Venue slug/ID from CMS

**Request Body:**
```json
{
  "claim_type": "ownership", // or "management"
  "verification_data": {
    "website": "https://venue.com",
    "phone": "+353 1 234 5678",
    "social_facebook": "https://facebook.com/venue",
    "social_instagram": "@venue_handle"
  },
  "additional_notes": "I am the general manager and would like to keep our venue information updated.",
  "business_documents": [
    "https://storage.com/business-license.pdf"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claim": {
      "id": 123,
      "venue_id": "the-academy",
      "status": "pending",
      "submitted_at": "2024-07-24T10:00:00Z",
      "estimated_review_time": "3-5 business days"
    }
  }
}
```

### GET /api/venues/{venue_id}/claims
Get all claims for a venue (admin only).

### PUT /api/claims/{claim_id}/review
Review a venue claim (admin/moderator only).

**Request Body:**
```json
{
  "action": "approve", // or "reject", "require_verification"
  "admin_notes": "Verification successful",
  "granted_role": "owner", // or "manager", "editor"
  "granted_permissions": ["edit", "manage_staff"],
  "rejection_reason": "" // if rejecting
}
```

### GET /api/claims/pending
Get all pending claims (admin/moderator only).

---

## Venue Ownership

### GET /api/venues/{venue_id}/owners
Get ownership information for a venue.

**Response:**
```json
{
  "success": true,
  "data": {
    "owners": [
      {
        "user_id": 1,
        "display_name": "John Doe",
        "email": "john@venue.com",
        "role": "owner",
        "is_primary": true,
        "granted_at": "2024-07-24T10:00:00Z",
        "permissions": ["edit", "manage_staff", "view_analytics"]
      }
    ],
    "total_owners": 1
  }
}
```

### POST /api/venues/{venue_id}/owners
Add a new owner/manager to a venue (primary owner only).

**Request Body:**
```json
{
  "user_email": "newmanager@venue.com",
  "role": "manager",
  "permissions": ["edit", "respond_to_reviews"],
  "expires_at": "2025-12-31T23:59:59Z" // optional
}
```

### DELETE /api/venues/{venue_id}/owners/{user_id}
Remove owner/manager access (primary owner or admin only).

---

## Venue Editing

### GET /api/venues/{venue_id}/edit-permissions
Check if current user can edit this venue.

**Response:**
```json
{
  "success": true,
  "data": {
    "can_edit": true,
    "role": "owner",
    "permissions": ["edit", "manage_staff", "view_analytics"],
    "restrictions": []
  }
}
```

### PUT /api/venues/{venue_id}/edit
Submit venue edits (requires ownership).

**Request Body:**
```json
{
  "changes": [
    {
      "field": "description",
      "old_value": "Old description",
      "new_value": "Updated description"
    },
    {
      "field": "contact.phone",
      "old_value": "+353 1 111 1111",
      "new_value": "+353 1 222 2222"
    }
  ],
  "edit_notes": "Updated phone number and description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "edit_id": 456,
    "status": "approved", // or "pending" if requires approval
    "changes_applied": 2,
    "requires_approval": false
  }
}
```

### GET /api/venues/{venue_id}/edit-history
Get edit history for a venue.

---

## Venue Verification

### POST /api/venues/{venue_id}/verify
Request venue verification badge.

**Request Body:**
```json
{
  "business_license_url": "https://storage.com/license.pdf",
  "tax_registration_url": "https://storage.com/tax.pdf",
  "utility_bill_url": "https://storage.com/utility.pdf",
  "social_media_verification": {
    "facebook_verified": true,
    "instagram_verified": true,
    "website_meta_tag": "venue-verification-abc123"
  }
}
```

### GET /api/verifications/pending
Get pending verification requests (admin only).

---

## Notifications

### GET /api/notifications
Get notifications for current user.

### PUT /api/venues/{venue_id}/notification-preferences
Update notification preferences for a venue.

**Request Body:**
```json
{
  "new_reviews": true,
  "review_responses": true,
  "venue_updates": true,
  "email_notifications": true,
  "sms_notifications": false
}
```

---

## Admin Endpoints

### GET /api/admin/dashboard
Get admin dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "pending_claims": 5,
      "pending_verifications": 3,
      "total_venue_owners": 25,
      "total_claimed_venues": 30
    },
    "recent_activity": [
      {
        "type": "claim_submitted",
        "venue_name": "The Academy",
        "user_email": "owner@academy.com",
        "timestamp": "2024-07-24T10:00:00Z"
      }
    ]
  }
}
```

### GET /api/admin/users
Get user management interface data.

### PUT /api/admin/users/{user_id}/role
Update user role (super admin only).

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You don't have permission to claim this venue",
    "details": {
      "required_permission": "venue_claim",
      "current_role": "user"
    }
  }
}
```

### Common Error Codes:
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks required permissions  
- `VENUE_NOT_FOUND`: Venue doesn't exist
- `ALREADY_CLAIMED`: Venue already claimed by user
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMITED`: Too many requests

---

## Rate Limiting

- Venue claims: 1 per hour per user
- Edit submissions: 10 per hour per venue
- Verification requests: 1 per day per venue

## Webhooks

### Claim Status Updates
```
POST https://your-app.com/webhooks/claim-status
{
  "event": "claim.approved",
  "data": {
    "claim_id": 123,
    "venue_id": "the-academy",
    "user_email": "owner@venue.com",
    "new_status": "approved"
  }
}
```
