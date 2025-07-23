-- Sample data for Band Venue Review Website
-- This file populates the database with realistic test data for development

-- Sample users (synced with Firebase Auth)
INSERT INTO users (firebase_uid, email, display_name, user_type, is_verified) VALUES
('firebase_uid_1', 'john.murphy@email.com', 'John Murphy', 'band', true),
('firebase_uid_2', 'sarah.oconnor@email.com', 'Sarah O''Connor', 'fan', false),
('firebase_uid_3', 'mike.kelly@email.com', 'Mike Kelly', 'venue', true),
('firebase_uid_4', 'emma.walsh@email.com', 'Emma Walsh', 'band', true),
('firebase_uid_5', 'david.ryan@email.com', 'David Ryan', 'promoter', true),
('firebase_uid_6', 'lisa.mccarthy@email.com', 'Lisa McCarthy', 'fan', false),
('firebase_uid_7', 'paul.obrient@email.com', 'Paul O''Brien', 'band', false),
('firebase_uid_8', 'mary.fitzgerald@email.com', 'Mary Fitzgerald', 'fan', false);

-- Sample venues
INSERT INTO venues (name, address, city, county, country, phone, email, website, capacity, venue_type, description, facilities, latitude, longitude, social_links, is_verified) VALUES
('The Crane Bar', 'Sea Road', 'Galway', 'Galway', 'Ireland', '+353 91 587419', 'info@thecranebar.com', 'https://thecranebar.com', 150, 'pub', 'Traditional Irish pub with live music nightly', ARRAY['sound_system', 'stage', 'parking'], 53.2707, -9.0568, '{"facebook": "https://facebook.com/thecranebar", "instagram": "https://instagram.com/thecranebar"}', true),
('Vicar Street', '58-59 Thomas Street', 'Dublin', 'Dublin', 'Ireland', '+353 1 775 5800', 'info@vicarstreet.ie', 'https://vicarstreet.ie', 1000, 'concert_hall', 'Premier live music venue in Dublin city center', ARRAY['sound_system', 'lighting', 'bar', 'merchandise'], 53.3436, -6.2756, '{"website": "https://vicarstreet.ie", "twitter": "https://twitter.com/VicarStreetVen"}', true),
('Róisín Dubh', 'Upper Dominick Street', 'Galway', 'Galway', 'Ireland', '+353 91 586540', 'info@roisindubh.net', 'https://roisindubh.net', 300, 'club', 'Alternative music venue and club', ARRAY['sound_system', 'stage', 'bar', 'late_license'], 53.2743, -9.0514, '{"facebook": "https://facebook.com/roisindubh"}', true),
('The Button Factory', 'Curved Street, Temple Bar', 'Dublin', 'Dublin', 'Ireland', '+353 1 670 9202', 'info@buttonfactory.ie', 'https://buttonfactory.ie', 400, 'club', 'Contemporary live music and club venue', ARRAY['sound_system', 'lighting', 'bar', 'vip_area'], 53.3456, -6.2625, '{"facebook": "https://facebook.com/buttonfactory"}', true),
('De Barras Folk Club', 'Pearse Street', 'Clonakilty', 'Cork', 'Ireland', '+353 23 883 3381', 'info@debarras.ie', 'https://debarras.ie', 80, 'pub', 'Intimate folk music venue', ARRAY['sound_system', 'stage'], 51.6234, -8.8707, '{"website": "https://debarras.ie"}', true);

-- Sample bands
INSERT INTO bands (name, bio, formed_year, genres, hometown, county, country, member_count, contact_email, website, social_links, profile_image_url, is_verified, verification_level, created_by) VALUES
('The Wilde Rovers', 'Traditional Irish folk band with modern influences, performing across Ireland since 2018.', 2018, ARRAY['folk', 'traditional', 'acoustic'], 'Galway', 'Galway', 'Ireland', 4, 'bookings@wilderovers.ie', 'https://wilderovers.ie', '{"spotify": "https://open.spotify.com/artist/wilderovers", "instagram": "https://instagram.com/wilderovers", "facebook": "https://facebook.com/wilderovers"}', 'https://example.com/bands/wilderovers.jpg', true, 'verified', (SELECT id FROM users WHERE email = 'john.murphy@email.com')),
('Electric Storm', 'High-energy rock band bringing classic and modern rock to venues across Dublin.', 2019, ARRAY['rock', 'alternative', 'indie'], 'Dublin', 'Dublin', 'Ireland', 5, 'contact@electricstorm.ie', 'https://electricstorm.ie', '{"spotify": "https://open.spotify.com/artist/electricstorm", "youtube": "https://youtube.com/electricstorm", "instagram": "https://instagram.com/electricstormband"}', 'https://example.com/bands/electricstorm.jpg', true, 'featured', (SELECT id FROM users WHERE email = 'emma.walsh@email.com')),
('Celtic Fusion', 'Contemporary Celtic music with electronic elements.', 2020, ARRAY['celtic', 'electronic', 'world'], 'Cork', 'Cork', 'Ireland', 3, 'info@celticfusion.ie', 'https://celticfusion.ie', '{"spotify": "https://open.spotify.com/artist/celticfusion", "soundcloud": "https://soundcloud.com/celticfusion"}', 'https://example.com/bands/celticfusion.jpg', false, 'basic', (SELECT id FROM users WHERE email = 'paul.obrient@email.com')),
('The Dublin Sessions', 'Acoustic duo performing Irish and international covers.', 2021, ARRAY['acoustic', 'covers', 'folk'], 'Dublin', 'Dublin', 'Ireland', 2, 'bookings@dublinsessions.ie', NULL, '{"instagram": "https://instagram.com/dublinsessions", "facebook": "https://facebook.com/dublinsessions"}', NULL, false, 'none', (SELECT id FROM users WHERE email = 'john.murphy@email.com'));

-- Sample band members
INSERT INTO band_members (band_id, user_id, role, is_primary_contact) VALUES
((SELECT id FROM bands WHERE name = 'The Wilde Rovers'), (SELECT id FROM users WHERE email = 'john.murphy@email.com'), 'Lead Vocals, Guitar', true),
((SELECT id FROM bands WHERE name = 'Electric Storm'), (SELECT id FROM users WHERE email = 'emma.walsh@email.com'), 'Lead Vocals', true),
((SELECT id FROM bands WHERE name = 'Celtic Fusion'), (SELECT id FROM users WHERE email = 'paul.obrient@email.com'), 'Keyboards, Vocals', true);

-- Sample gigs
INSERT INTO gigs (band_id, venue_id, title, description, gig_date, start_time, door_price, ticket_url, status, gig_type, expected_attendance, age_restriction, created_by) VALUES
((SELECT id FROM bands WHERE name = 'The Wilde Rovers'), (SELECT id FROM venues WHERE name = 'The Crane Bar'), 'Traditional Irish Night', 'An evening of traditional Irish folk music', '2024-08-15', '21:00', 15.00, 'https://tickets.example.com/wilderovers-crane', 'confirmed', 'headline', 120, '18+', (SELECT id FROM users WHERE email = 'john.murphy@email.com')),
((SELECT id FROM bands WHERE name = 'Electric Storm'), (SELECT id FROM venues WHERE name = 'Vicar Street'), 'Summer Rock Festival', 'High-energy rock show with special guests', '2024-08-20', '20:00', 25.00, 'https://tickets.example.com/electricstorm-vicar', 'confirmed', 'headline', 800, 'All Ages', (SELECT id FROM users WHERE email = 'emma.walsh@email.com')),
((SELECT id FROM bands WHERE name = 'Celtic Fusion'), (SELECT id FROM venues WHERE name = 'Róisín Dubh'), 'Electronic Celtic Night', 'Modern Celtic music with electronic beats', '2024-08-25', '22:00', 12.00, NULL, 'scheduled', 'headline', 200, '18+', (SELECT id FROM users WHERE email = 'paul.obrient@email.com')),
((SELECT id FROM bands WHERE name = 'The Dublin Sessions'), (SELECT id FROM venues WHERE name = 'De Barras Folk Club'), 'Acoustic Evening', 'Intimate acoustic performance', '2024-09-01', '20:30', 10.00, NULL, 'scheduled', 'headline', 60, 'All Ages', (SELECT id FROM users WHERE email = 'john.murphy@email.com')),
((SELECT id FROM bands WHERE name = 'The Wilde Rovers'), (SELECT id FROM venues WHERE name = 'De Barras Folk Club'), 'Folk Session', 'Traditional folk music session', '2024-07-10', '21:00', 12.00, NULL, 'completed', 'headline', 70, '18+', (SELECT id FROM users WHERE email = 'john.murphy@email.com'));

-- Sample venue reviews by bands
INSERT INTO venue_reviews_by_bands (band_id, venue_id, gig_id, rating, title, review_text, sound_quality_rating, staff_rating, payment_promptness_rating, crowd_response_rating, would_play_again, pros, cons, recommended_for) VALUES
((SELECT id FROM bands WHERE name = 'The Wilde Rovers'), 
 (SELECT id FROM venues WHERE name = 'De Barras Folk Club'), 
 (SELECT id FROM gigs WHERE title = 'Folk Session' AND gig_date = '2024-07-10'),
 5, 
 'Perfect venue for traditional music', 
 'De Barras is exactly what you want from a folk venue - intimate, great sound, and an audience that really listens. The staff were incredibly helpful throughout the evening, and the sound engineer knew exactly how to balance our acoustic instruments. Payment was prompt and the whole experience was professional yet warm. We can''t wait to return.',
 5, 5, 5, 5, true,
 ARRAY['Excellent acoustics', 'Attentive audience', 'Professional staff', 'Great atmosphere', 'Prompt payment'],
 ARRAY['Limited capacity', 'No parking nearby'],
 ARRAY['folk', 'acoustic', 'traditional', 'singer-songwriter']),

((SELECT id FROM bands WHERE name = 'Electric Storm'), 
 (SELECT id FROM venues WHERE name = 'Vicar Street'), 
 (SELECT id FROM gigs WHERE title = 'Summer Rock Festival' AND gig_date = '2024-08-20'),
 4, 
 'Great venue, minor sound issues', 
 'Vicar Street is a fantastic venue with professional staff and great facilities. The stage setup was excellent and the lighting was top-notch. We had a small issue with the monitor mix during soundcheck, but the sound engineer sorted it out quickly. The crowd was energetic and engaged throughout our set. Payment terms were exactly as agreed. Would definitely play here again.',
 4, 5, 5, 5, true,
 ARRAY['Professional staff', 'Great stage and lighting', 'Energetic crowd', 'Good facilities', 'Reliable payment'],
 ARRAY['Initial sound issues', 'Expensive drinks for band'],
 ARRAY['rock', 'alternative', 'indie', 'metal']);

-- Sample band reviews by fans
INSERT INTO band_reviews (band_id, reviewer_id, gig_id, rating, title, review_text, performance_rating, stage_presence_rating, sound_quality_rating, song_variety_rating, would_recommend, tags) VALUES
((SELECT id FROM bands WHERE name = 'The Wilde Rovers'), 
 (SELECT id FROM users WHERE email = 'sarah.oconnor@email.com'),
 (SELECT id FROM gigs WHERE title = 'Folk Session' AND gig_date = '2024-07-10'),
 5, 
 'Absolutely magical evening', 
 'The Wilde Rovers delivered an incredible performance at De Barras. Their blend of traditional Irish music with subtle modern touches was perfect for the intimate venue. The lead singer''s voice was haunting and beautiful, and the instrumental work was flawless. They had the whole room singing along by the end. Definitely one of the best folk acts in Ireland right now.',
 5, 5, 5, 4, true,
 ARRAY['traditional', 'authentic', 'engaging', 'skilled musicians']),

((SELECT id FROM bands WHERE name = 'Electric Storm'), 
 (SELECT id FROM users WHERE email = 'lisa.mccarthy@email.com'),
 (SELECT id FROM gigs WHERE title = 'Summer Rock Festival' AND gig_date = '2024-08-20'),
 4, 
 'High energy rock show', 
 'Electric Storm brought incredible energy to Vicar Street. The band was tight, the songs were catchy, and they really knew how to work the crowd. The lead singer has great stage presence and the guitar work was impressive. My only complaint is that some of the songs started to sound similar after a while, but overall it was a great night out.',
 4, 5, 4, 3, true,
 ARRAY['energetic', 'tight band', 'great stage presence', 'catchy songs']);

-- Sample band followers
INSERT INTO band_followers (band_id, follower_id, notification_preferences) VALUES
((SELECT id FROM bands WHERE name = 'The Wilde Rovers'), (SELECT id FROM users WHERE email = 'sarah.oconnor@email.com'), '{"new_gigs": true, "new_releases": true, "band_updates": true}'),
((SELECT id FROM bands WHERE name = 'The Wilde Rovers'), (SELECT id FROM users WHERE email = 'lisa.mccarthy@email.com'), '{"new_gigs": true, "new_releases": false, "band_updates": true}'),
((SELECT id FROM bands WHERE name = 'Electric Storm'), (SELECT id FROM users WHERE email = 'sarah.oconnor@email.com'), '{"new_gigs": true, "new_releases": true, "band_updates": false}'),
((SELECT id FROM bands WHERE name = 'Electric Storm'), (SELECT id FROM users WHERE email = 'mary.fitzgerald@email.com'), '{"new_gigs": true, "new_releases": true, "band_updates": true}'),
((SELECT id FROM bands WHERE name = 'Celtic Fusion'), (SELECT id FROM users WHERE email = 'lisa.mccarthy@email.com'), '{"new_gigs": true, "new_releases": true, "band_updates": true}');

-- Sample review votes
INSERT INTO review_votes (review_id, review_type, voter_id, is_helpful) VALUES
((SELECT id FROM venue_reviews_by_bands WHERE title = 'Perfect venue for traditional music'), 'venue_review', (SELECT id FROM users WHERE email = 'sarah.oconnor@email.com'), true),
((SELECT id FROM venue_reviews_by_bands WHERE title = 'Perfect venue for traditional music'), 'venue_review', (SELECT id FROM users WHERE email = 'lisa.mccarthy@email.com'), true),
((SELECT id FROM band_reviews WHERE title = 'Absolutely magical evening'), 'band_review', (SELECT id FROM users WHERE email = 'mary.fitzgerald@email.com'), true),
((SELECT id FROM band_reviews WHERE title = 'High energy rock show'), 'band_review', (SELECT id FROM users WHERE email = 'david.ryan@email.com'), true);

-- Sample setlist
INSERT INTO setlists (gig_id, band_id, songs, total_duration_minutes, notes, is_complete, created_by) VALUES
((SELECT id FROM gigs WHERE title = 'Folk Session' AND gig_date = '2024-07-10'),
 (SELECT id FROM bands WHERE name = 'The Wilde Rovers'),
 '[
   {"title": "The Wild Mountain Thyme", "order": 1, "duration_minutes": 4},
   {"title": "Black is the Color", "order": 2, "duration_minutes": 5},
   {"title": "The Water is Wide", "order": 3, "duration_minutes": 4},
   {"title": "She Moved Through the Fair", "order": 4, "duration_minutes": 6},
   {"title": "Danny Boy", "order": 5, "duration_minutes": 5},
   {"title": "The Parting Glass", "order": 6, "duration_minutes": 4}
 ]'::jsonb,
 28,
 'Great response from the audience, especially during Danny Boy',
 true,
 (SELECT id FROM users WHERE email = 'john.murphy@email.com'));
