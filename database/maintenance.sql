-- Database maintenance and utility scripts for Band Venue Review Website

-- 1. Data cleanup and integrity checks
-- =================================

-- Check for orphaned records
SELECT 'Orphaned band members' as check_type, COUNT(*) as count
FROM band_members bm
LEFT JOIN bands b ON bm.band_id = b.id
WHERE b.id IS NULL

UNION ALL

SELECT 'Orphaned gigs', COUNT(*)
FROM gigs g
LEFT JOIN bands b ON g.band_id = b.id
LEFT JOIN venues v ON g.venue_id = v.id
WHERE b.id IS NULL OR v.id IS NULL

UNION ALL

SELECT 'Orphaned venue reviews', COUNT(*)
FROM venue_reviews_by_bands vr
LEFT JOIN bands b ON vr.band_id = b.id
LEFT JOIN venues v ON vr.venue_id = v.id
WHERE b.id IS NULL OR v.id IS NULL

UNION ALL

SELECT 'Orphaned band reviews', COUNT(*)
FROM band_reviews br
LEFT JOIN bands b ON br.band_id = b.id
LEFT JOIN users u ON br.reviewer_id = u.id
WHERE b.id IS NULL OR u.id IS NULL;

-- 2. Performance monitoring queries
-- ================================

-- Slow query candidates (tables with many rows that might need optimization)
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    CASE 
        WHEN n_live_tup > 0 
        THEN ROUND((n_dead_tup::float / n_live_tup::float) * 100, 2) 
        ELSE 0 
    END as dead_row_percentage
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_tup_read > 0 
        THEN ROUND((idx_tup_fetch::float / idx_tup_read::float) * 100, 2) 
        ELSE 0 
    END as fetch_percentage
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- 3. Data quality checks
-- =====================

-- Bands without any social links (might need attention)
SELECT name, slug, created_at
FROM bands
WHERE social_links IS NULL OR social_links = '{}'::jsonb
ORDER BY created_at DESC;

-- Users who might be duplicate accounts (same email domain and similar names)
SELECT 
    u1.email as email1,
    u2.email as email2,
    u1.display_name as name1,
    u2.display_name as name2,
    SPLIT_PART(u1.email, '@', 2) as domain
FROM users u1
JOIN users u2 ON SPLIT_PART(u1.email, '@', 2) = SPLIT_PART(u2.email, '@', 2)
    AND u1.id < u2.id
    AND SIMILARITY(u1.display_name, u2.display_name) > 0.7
WHERE SPLIT_PART(u1.email, '@', 2) NOT IN ('gmail.com', 'yahoo.com', 'hotmail.com');

-- Venues without location data
SELECT name, city, county, latitude, longitude
FROM venues
WHERE latitude IS NULL OR longitude IS NULL
ORDER BY name;

-- 4. Business intelligence queries
-- ===============================

-- Most active venues (by number of gigs)
SELECT 
    v.name,
    v.city,
    v.county,
    COUNT(g.id) as total_gigs,
    COUNT(CASE WHEN g.gig_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_gigs,
    AVG(vr.rating) as avg_rating_from_bands
FROM venues v
LEFT JOIN gigs g ON v.id = g.venue_id
LEFT JOIN venue_reviews_by_bands vr ON v.id = vr.venue_id
GROUP BY v.id, v.name, v.city, v.county
ORDER BY total_gigs DESC
LIMIT 20;

-- Most followed bands
SELECT 
    b.name,
    b.hometown,
    b.county,
    b.verification_level,
    COUNT(bf.follower_id) as follower_count,
    COUNT(g.id) as total_gigs,
    AVG(br.rating) as avg_fan_rating
FROM bands b
LEFT JOIN band_followers bf ON b.id = bf.band_id
LEFT JOIN gigs g ON b.id = g.band_id
LEFT JOIN band_reviews br ON b.id = br.band_id
GROUP BY b.id, b.name, b.hometown, b.county, b.verification_level
ORDER BY follower_count DESC
LIMIT 20;

-- Genre popularity analysis
SELECT 
    genre,
    COUNT(*) as band_count,
    COUNT(DISTINCT g.id) as total_gigs,
    AVG(br.rating) as avg_rating
FROM (
    SELECT id, UNNEST(genres) as genre
    FROM bands
) b_genres
JOIN bands b ON b_genres.id = b.id
LEFT JOIN gigs g ON b.id = g.band_id
LEFT JOIN band_reviews br ON b.id = br.band_id
GROUP BY genre
ORDER BY band_count DESC;

-- Monthly gig activity
SELECT 
    DATE_TRUNC('month', gig_date) as month,
    COUNT(*) as total_gigs,
    COUNT(DISTINCT band_id) as unique_bands,
    COUNT(DISTINCT venue_id) as unique_venues,
    AVG(door_price) as avg_ticket_price
FROM gigs
WHERE gig_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', gig_date)
ORDER BY month;

-- 5. Data archival suggestions
-- ============================

-- Old completed gigs that might be candidates for archival
SELECT 
    g.id,
    g.title,
    b.name as band_name,
    v.name as venue_name,
    g.gig_date,
    COUNT(br.id) as fan_reviews,
    COUNT(vr.id) as venue_reviews
FROM gigs g
JOIN bands b ON g.band_id = b.id
JOIN venues v ON g.venue_id = v.id
LEFT JOIN band_reviews br ON g.id = br.gig_id
LEFT JOIN venue_reviews_by_bands vr ON g.id = vr.gig_id
WHERE g.status = 'completed' 
    AND g.gig_date < CURRENT_DATE - INTERVAL '2 years'
GROUP BY g.id, g.title, b.name, v.name, g.gig_date
ORDER BY g.gig_date;

-- Users who haven't been active recently
SELECT 
    u.email,
    u.display_name,
    u.user_type,
    u.created_at,
    u.updated_at,
    COUNT(br.id) as reviews_written,
    COUNT(bf.id) as bands_followed
FROM users u
LEFT JOIN band_reviews br ON u.id = br.reviewer_id
LEFT JOIN band_followers bf ON u.id = bf.follower_id
WHERE u.updated_at < CURRENT_DATE - INTERVAL '6 months'
    AND u.created_at < CURRENT_DATE - INTERVAL '6 months'
GROUP BY u.id, u.email, u.display_name, u.user_type, u.created_at, u.updated_at
HAVING COUNT(br.id) = 0 AND COUNT(bf.id) = 0
ORDER BY u.updated_at;

-- 6. Security and compliance checks
-- =================================

-- Check for potentially suspicious review patterns
SELECT 
    reviewer_id,
    u.email,
    u.display_name,
    COUNT(*) as review_count,
    COUNT(DISTINCT band_id) as bands_reviewed,
    MIN(created_at) as first_review,
    MAX(created_at) as last_review,
    AVG(rating) as avg_rating
FROM band_reviews br
JOIN users u ON br.reviewer_id = u.id
GROUP BY reviewer_id, u.email, u.display_name
HAVING COUNT(*) > 20 
    OR AVG(rating) > 4.8 
    OR AVG(rating) < 1.2
ORDER BY review_count DESC;

-- Check for bands with suspicious social link patterns
SELECT 
    name,
    slug,
    social_links,
    created_at
FROM bands
WHERE social_links::text LIKE '%bit.ly%'
    OR social_links::text LIKE '%tinyurl%'
    OR social_links::text LIKE '%suspicious-domain%'
ORDER BY created_at DESC;

-- 7. Backup verification queries
-- ==============================

-- Record counts for backup verification
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL SELECT 'venues', COUNT(*) FROM venues
UNION ALL SELECT 'bands', COUNT(*) FROM bands
UNION ALL SELECT 'band_members', COUNT(*) FROM band_members
UNION ALL SELECT 'gigs', COUNT(*) FROM gigs
UNION ALL SELECT 'venue_reviews_by_bands', COUNT(*) FROM venue_reviews_by_bands
UNION ALL SELECT 'band_reviews', COUNT(*) FROM band_reviews
UNION ALL SELECT 'band_followers', COUNT(*) FROM band_followers
UNION ALL SELECT 'review_votes', COUNT(*) FROM review_votes
UNION ALL SELECT 'setlists', COUNT(*) FROM setlists
ORDER BY table_name;

-- Data integrity checksums
SELECT 
    'users_checksum' as check_name,
    MD5(STRING_AGG(CONCAT(id, email, firebase_uid), '' ORDER BY id)) as checksum
FROM users
UNION ALL
SELECT 
    'bands_checksum',
    MD5(STRING_AGG(CONCAT(id, name, slug), '' ORDER BY id)) as checksum
FROM bands
UNION ALL
SELECT 
    'venues_checksum',
    MD5(STRING_AGG(CONCAT(id, name, slug), '' ORDER BY id)) as checksum
FROM venues;
