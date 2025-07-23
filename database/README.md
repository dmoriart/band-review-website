# Database Setup Guide

This guide will help you set up the PostgreSQL database for the Band Venue Review website.

## Prerequisites

- PostgreSQL 12+ installed
- Database administration tool (pgAdmin, DBeaver, or psql command line)
- Basic knowledge of SQL and database management

## Database Setup Steps

### 1. Create Database

First, create a new PostgreSQL database:

```sql
CREATE DATABASE band_venue_review;
```

### 2. Connect to Database

Connect to your newly created database:

```bash
psql -U your_username -d band_venue_review
```

Or use your preferred database administration tool.

### 3. Run Schema Creation

Execute the schema creation script:

```bash
psql -U your_username -d band_venue_review -f database/schema.sql
```

This will create:
- All necessary tables with proper relationships
- Indexes for optimal performance
- Triggers for automatic timestamp updates
- Functions for slug generation and review vote counting

### 4. Load Sample Data (Optional)

To populate the database with test data for development:

```bash
psql -U your_username -d band_venue_review -f database/sample_data.sql
```

## Database Structure

### Core Tables

1. **users** - User accounts synced with Firebase Auth
2. **venues** - Venue information (from existing venue review system)
3. **bands** - Band profiles and information
4. **band_members** - Relationship between users and bands
5. **gigs** - Concert/performance events
6. **venue_reviews_by_bands** - Reviews of venues written by bands
7. **band_reviews** - Reviews of bands written by fans
8. **band_followers** - Fans following bands for notifications

### Supporting Tables

- **gig_supporting_bands** - Supporting acts for gigs
- **review_votes** - Helpfulness votes on reviews
- **setlists** - Optional detailed setlist information

## Environment Variables

Add the following to your backend environment configuration:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/band_venue_review
DB_HOST=localhost
DB_PORT=5432
DB_NAME=band_venue_review
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=false  # Set to true for production

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
```

## Security Considerations

### 1. Database User Permissions

Create a dedicated database user for the application:

```sql
-- Create application user
CREATE USER band_app_user WITH PASSWORD 'secure_password_here';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE band_venue_review TO band_app_user;
GRANT USAGE ON SCHEMA public TO band_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO band_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO band_app_user;

-- Grant permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO band_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO band_app_user;
```

### 2. Row Level Security (RLS)

Consider implementing Row Level Security for sensitive operations:

```sql
-- Enable RLS on sensitive tables
ALTER TABLE band_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_reviews_by_bands ENABLE ROW LEVEL SECURITY;

-- Example policy: users can only edit their own reviews
CREATE POLICY band_reviews_user_policy ON band_reviews
FOR ALL TO band_app_user
USING (reviewer_id = current_setting('app.current_user_id')::uuid);
```

### 3. Data Validation

The schema includes comprehensive CHECK constraints for:
- Rating values (1-5 scale)
- Valid user types
- Date ranges
- Email format validation
- Positive numeric values

## Performance Optimization

### Indexes Created

The schema includes optimized indexes for:
- User lookups by Firebase UID and email
- Venue searches by location and slug
- Band searches by genre, location, and verification status
- Gig queries by date, venue, and band
- Review lookups for both bands and venues

### Query Optimization Tips

1. **Use proper indexes**: The schema includes comprehensive indexing
2. **Leverage JSONB**: Social links and notification preferences use JSONB for flexibility
3. **Pagination**: Always use LIMIT and OFFSET for large result sets
4. **Full-text search**: Consider adding GIN indexes for text search on descriptions

## Backup and Maintenance

### Regular Backups

```bash
# Create backup
pg_dump -U your_username -d band_venue_review > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U your_username -d band_venue_review -f backup_file.sql
```

### Maintenance Tasks

```sql
-- Update table statistics
ANALYZE;

-- Vacuum to reclaim space
VACUUM;

-- Full vacuum (use sparingly, locks tables)
VACUUM FULL;
```

## Integration with Existing Systems

### Firebase Authentication Sync

The `users` table is designed to sync with Firebase Authentication:

```javascript
// Example sync function (pseudo-code)
async function syncFirebaseUser(firebaseUser) {
  const query = `
    INSERT INTO users (firebase_uid, email, display_name, photo_url)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (firebase_uid) 
    DO UPDATE SET 
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      photo_url = EXCLUDED.photo_url,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;
  
  return await db.query(query, [
    firebaseUser.uid,
    firebaseUser.email,
    firebaseUser.displayName,
    firebaseUser.photoURL
  ]);
}
```

### Venue System Integration

The schema is designed to work with your existing venue review system. The `venues` table can be populated from your current venue data.

## API Integration

This database schema supports all the endpoints defined in `BANDS_API.md`:

- **GET /api/bands** - List bands with filtering and pagination
- **GET /api/bands/:slug** - Get detailed band information
- **POST /api/bands** - Create new band profiles
- **GET /api/gigs** - List upcoming and past gigs
- **POST /api/reviews/bands** - Submit band reviews
- **POST /api/reviews/venues** - Submit venue reviews by bands

## Monitoring and Analytics

Consider adding these views for analytics:

```sql
-- Popular bands by follower count
CREATE VIEW popular_bands AS
SELECT 
  b.name,
  b.slug,
  COUNT(bf.follower_id) as follower_count,
  AVG(br.rating) as average_rating
FROM bands b
LEFT JOIN band_followers bf ON b.id = bf.band_id
LEFT JOIN band_reviews br ON b.id = br.band_id
GROUP BY b.id, b.name, b.slug
ORDER BY follower_count DESC;

-- Venue performance metrics
CREATE VIEW venue_metrics AS
SELECT 
  v.name,
  v.slug,
  COUNT(g.id) as total_gigs,
  AVG(vr.rating) as average_rating_from_bands,
  COUNT(vr.id) as total_reviews
FROM venues v
LEFT JOIN gigs g ON v.id = g.venue_id
LEFT JOIN venue_reviews_by_bands vr ON v.id = vr.venue_id
GROUP BY v.id, v.name, v.slug;
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Check PostgreSQL service is running
2. **Permission denied**: Verify user permissions and database ownership
3. **Constraint violations**: Check foreign key relationships and data types
4. **Slow queries**: Use EXPLAIN ANALYZE to identify performance bottlenecks

### Useful Queries

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor active connections
SELECT * FROM pg_stat_activity WHERE datname = 'band_venue_review';

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

This database setup provides a solid foundation for your band discovery and review platform, with proper relationships, performance optimization, and security considerations built in.
