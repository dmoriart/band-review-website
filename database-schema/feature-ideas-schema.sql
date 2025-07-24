-- Feature Ideas Database Schema for Band Venue Review Website

-- Features table (for feature requests and bug reports)
CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('feature', 'bug') DEFAULT 'feature',
    status ENUM('suggested', 'in_progress', 'done', 'rejected') DEFAULT 'suggested',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    tags JSON, -- Array of tags like ["mobile", "navigation", "performance"]
    author_id VARCHAR(255) NOT NULL, -- Firebase Auth UID
    author_email VARCHAR(255) NOT NULL,
    author_name VARCHAR(100),
    upvotes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    admin_notes TEXT, -- Private notes for admins
    completed_by VARCHAR(255), -- Admin who marked as done
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_author (author_id),
    INDEX idx_upvotes (upvotes_count DESC),
    INDEX idx_created (created_at DESC)
);

-- Votes table (to track user votes and prevent duplicates)
CREATE TABLE feature_votes (
    id SERIAL PRIMARY KEY,
    feature_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL, -- Firebase Auth UID
    user_email VARCHAR(255) NOT NULL,
    vote_type ENUM('upvote', 'downvote') DEFAULT 'upvote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_vote (feature_id, user_id),
    INDEX idx_feature (feature_id),
    INDEX idx_user (user_id)
);

-- Comments table (for feature discussions)
CREATE TABLE feature_comments (
    id SERIAL PRIMARY KEY,
    feature_id INT NOT NULL,
    author_id VARCHAR(255) NOT NULL, -- Firebase Auth UID
    author_email VARCHAR(255) NOT NULL,
    author_name VARCHAR(100),
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
    INDEX idx_feature (feature_id),
    INDEX idx_author (author_id),
    INDEX idx_created (created_at DESC)
);

-- Notifications table (for user updates)
CREATE TABLE feature_notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Firebase Auth UID
    feature_id INT NOT NULL,
    type ENUM('feature_completed', 'status_changed', 'new_comment', 'admin_response') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_unread (user_id, is_read),
    INDEX idx_created (created_at DESC)
);

-- User subscriptions (users can subscribe to feature updates)
CREATE TABLE feature_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Firebase Auth UID
    feature_id INT NOT NULL,
    notify_email BOOLEAN DEFAULT TRUE,
    notify_in_app BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
    UNIQUE KEY unique_subscription (user_id, feature_id),
    INDEX idx_user (user_id),
    INDEX idx_feature (feature_id)
);

-- Sample data for testing
INSERT INTO features (title, description, type, status, tags, author_id, author_email, author_name, upvotes_count) VALUES
('Dark Mode Support', 'Add a dark mode toggle for better night time browsing experience', 'feature', 'suggested', '["ui", "accessibility", "mobile"]', 'sample-user-1', 'user@example.com', 'John Doe', 15),
('Venue Search Filters', 'Add filters for venue capacity, location, and music genres', 'feature', 'in_progress', '["search", "filters", "venues"]', 'sample-user-2', 'user2@example.com', 'Jane Smith', 23),
('Mobile Navigation Bug', 'Hamburger menu not working properly on some Android devices', 'bug', 'suggested', '["mobile", "navigation", "android"]', 'sample-user-3', 'user3@example.com', 'Mike Johnson', 8),
('Venue Photo Gallery', 'Allow venues to upload multiple photos with descriptions', 'feature', 'done', '["venues", "photos", "gallery"]', 'sample-user-4', 'user4@example.com', 'Sarah Wilson', 31);
