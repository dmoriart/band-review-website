# Venue Ownership System - Backend Implementation Guide

This guide provides step-by-step instructions to implement the backend API for the venue ownership system using Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js 16+
- PostgreSQL 12+
- Firebase Admin SDK (for authentication)
- Database schema already created (see `venue-ownership-schema.sql`)

## 1. Project Setup

### Install Dependencies

```bash
npm install express cors helmet morgan
npm install firebase-admin
npm install pg dotenv
npm install bcrypt jsonwebtoken
npm install multer cloudinary  # For file uploads
npm install nodemailer        # For email notifications
npm install joi               # For request validation
```

### Development Dependencies

```bash
npm install --save-dev nodemon jest supertest
```

## 2. Environment Configuration

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/band_review_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=band_review_db
DB_USER=your_username
DB_PASSWORD=your_password

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# API
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application
FRONTEND_URL=http://localhost:3000
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## 3. Core Setup Files

### `src/config/database.js`

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

module.exports = pool;
```

### `src/config/firebase.js`

```javascript
const admin = require('firebase-admin');

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

module.exports = admin;
```

### `src/middleware/auth.js`

```javascript
const admin = require('../config/firebase');
const pool = require('../config/database');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No valid authorization token provided' }
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get or create user in our database
    const user = await getOrCreateUser(decodedToken);
    
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: { message: 'Invalid authentication token' }
    });
  }
};

const getOrCreateUser = async (firebaseUser) => {
  const client = await pool.connect();
  
  try {
    // Check if user exists
    let result = await client.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [firebaseUser.uid]
    );
    
    if (result.rows.length > 0) {
      // Update last login
      await client.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE firebase_uid = $1',
        [firebaseUser.uid]
      );
      
      return result.rows[0];
    }
    
    // Create new user
    result = await client.query(`
      INSERT INTO users (
        firebase_uid, email, display_name, profile_picture_url, 
        created_at, last_login_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      firebaseUser.uid,
      firebaseUser.email,
      firebaseUser.name || firebaseUser.email?.split('@')[0],
      firebaseUser.picture
    ]);
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

const requireAdmin = (req, res, next) => {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      error: { message: 'Admin access required' }
    });
  }
  
  next();
};

module.exports = { authenticateUser, requireAdmin };
```

## 4. User Profile API

### `src/routes/user.js`

```javascript
const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
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
    const client = await pool.connect();
    
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
                'review_count', v.review_count
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
      
      const result = await client.query(userQuery, [req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
      }
      
      const user = result.rows[0];
      
      // Get review count
      const reviewCountResult = await client.query(
        'SELECT COUNT(*) as review_count FROM reviews WHERE user_id = $1',
        [req.user.id]
      );
      
      user.reviews_count = parseInt(reviewCountResult.rows[0].review_count);
      
      res.json({
        success: true,
        data: { user }
      });
      
    } finally {
      client.release();
    }
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
    
    const client = await pool.connect();
    
    try {
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
      
      const result = await client.query(updateQuery, [
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
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user profile' }
    });
  }
});

module.exports = router;
```

## 5. Venue Claims API

### `src/routes/claims.js`

```javascript
const express = require('express');
const Joi = require('joi');
const pool = require('../config/database');
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
    
    const client = await pool.connect();
    
    try {
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
      
      // TODO: Send notification email to admins
      
      res.json({
        success: true,
        data: { claim: claimResult.rows[0] }
      });
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error submitting claim:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to submit claim' }
    });
  }
});

// GET /api/claims/user
router.get('/user', authenticateUser, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
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
      
    } finally {
      client.release();
    }
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
    
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          vc.*,
          u.display_name as user_display_name,
          u.email as user_email
        FROM venue_claims vc
        JOIN users u ON vc.user_id = u.id
      `;
      
      let params = [];
      
      if (status !== 'all') {
        query += ' WHERE vc.status = $1';
        params.push(status);
      }
      
      query += ' ORDER BY vc.submitted_at DESC';
      
      const result = await client.query(query, params);
      
      res.json({
        success: true,
        data: { claims: result.rows }
      });
      
    } finally {
      client.release();
    }
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
    
    const client = await pool.connect();
    
    try {
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
      
      // TODO: Send notification email to user
      
      res.json({
        success: true,
        data: { message: 'Claim reviewed successfully' }
      });
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error reviewing claim:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to review claim' }
    });
  }
});

module.exports = router;
```

## 6. Main Application Setup

### `src/app.js`

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Routes
const userRoutes = require('./routes/user');
const claimsRoutes = require('./routes/claims');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/claims', claimsRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: { message: 'Internal server error' }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found' }
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

### `package.json` scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "db:migrate": "node src/scripts/migrate.js"
  }
}
```

## 7. Testing

### Basic test setup in `tests/claims.test.js`

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Claims API', () => {
  describe('POST /api/claims/submit', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/claims/submit')
        .send({
          venue_id: 1,
          claim_type: 'ownership'
        });
      
      expect(response.status).toBe(401);
    });
  });
});
```

## 8. Deployment Notes

### Production Environment Variables

Ensure all environment variables are properly set in production, especially:

- Database connection strings
- Firebase service account credentials  
- SMTP settings for email notifications
- Cloudinary credentials for file uploads

### Security Considerations

1. Use HTTPS in production
2. Implement rate limiting
3. Add request validation middleware
4. Set up proper CORS policies
5. Use environment-specific Firebase projects
6. Implement proper logging and monitoring

### Database Migrations

Create a migration script to handle database schema updates in production.

This implementation provides a complete backend API for the venue ownership system. The frontend components you created earlier will work seamlessly with these API endpoints.
