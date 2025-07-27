-- Band Merchandise Store Database Schema
-- Run this SQL script in your Supabase SQL editor or via psql

-- Product categories lookup table
CREATE TABLE IF NOT EXISTS product_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default product categories
INSERT INTO product_categories (id, name, description, sort_order) VALUES
('cd', 'CDs', 'Compact Discs and Albums', 1),
('vinyl', 'Vinyl Records', 'LP Records and Singles', 2),
('tshirt', 'T-Shirts', 'Band T-Shirts and Merchandise', 3),
('hoodie', 'Hoodies', 'Hooded Sweatshirts and Jumpers', 4),
('poster', 'Posters', 'Band Posters and Artwork', 5),
('sticker', 'Stickers', 'Band Stickers and Decals', 6),
('digital', 'Digital Downloads', 'Digital Music and Content', 7),
('other', 'Other Merchandise', 'Miscellaneous Band Items', 8)
ON CONFLICT (id) DO NOTHING;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id VARCHAR(255) NOT NULL, -- References Sanity band _id
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(50) NOT NULL REFERENCES product_categories(id),
    inventory_count INTEGER DEFAULT 0 CHECK (inventory_count >= 0),
    images JSONB DEFAULT '[]', -- Array of image URLs
    variants JSONB DEFAULT '{}', -- Size/format options: {"sizes": ["S", "M", "L"], "colors": ["black", "white"]}
    digital_file_url VARCHAR(500), -- For digital products
    digital_file_size INTEGER, -- File size in bytes
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    weight_grams INTEGER DEFAULT 0, -- For shipping calculations
    dimensions JSONB DEFAULT '{}', -- {"length": 10, "width": 15, "height": 2} in cm
    tags JSONB DEFAULT '[]', -- Search tags
    seo_slug VARCHAR(255), -- URL-friendly slug
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for performance
    CONSTRAINT unique_band_slug UNIQUE (band_id, seo_slug)
);

-- Create indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_band_id ON products(band_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Shopping cart items
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Firebase UID
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_selection JSONB DEFAULT '{}', -- Selected size, color, etc.
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicate cart items for same user/product/variant combination
    CONSTRAINT unique_cart_item UNIQUE (user_id, product_id, variant_selection)
);

-- Create indexes for cart_items table
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable order number
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    user_id VARCHAR(255), -- Firebase UID (null for guest orders)

    -- Shipping information
    shipping_address JSONB NOT NULL, -- {"name": "", "line1": "", "line2": "", "city": "", "county": "", "eircode": "", "country": "IE"}
    billing_address JSONB, -- If different from shipping

    -- Order totals
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    shipping_cost DECIMAL(10,2) DEFAULT 0 CHECK (shipping_cost >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    platform_fee DECIMAL(10,2) NOT NULL CHECK (platform_fee >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),

    -- Payment information
    stripe_payment_intent_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'

    -- Order status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
    tracking_number VARCHAR(255),
    shipping_carrier VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP
);

-- Create indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order items (for multi-band orders)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    band_id VARCHAR(255) NOT NULL, -- Denormalized for easier queries
    product_title VARCHAR(255) NOT NULL, -- Snapshot at time of order
    product_category VARCHAR(50) NOT NULL,
    variant_selection JSONB DEFAULT '{}',
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    band_payout DECIMAL(10,2) NOT NULL CHECK (band_payout >= 0), -- Amount paid to band after commission
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_band_id ON order_items(band_id);

-- Band Stripe Connect accounts
CREATE TABLE IF NOT EXISTS band_stripe_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id VARCHAR(255) UNIQUE NOT NULL, -- Sanity band _id
    stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
    onboarding_complete BOOLEAN DEFAULT false,
    charges_enabled BOOLEAN DEFAULT false,
    payouts_enabled BOOLEAN DEFAULT false,
    commission_rate DECIMAL(5,2) DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100), -- Platform commission %

    -- Account details
    country VARCHAR(2) DEFAULT 'IE',
    currency VARCHAR(3) DEFAULT 'EUR',
    business_type VARCHAR(50), -- 'individual' or 'company'

    -- Status tracking
    requirements_due JSONB DEFAULT '[]', -- Array of required fields
    requirements_past_due JSONB DEFAULT '[]',
    requirements_currently_due JSONB DEFAULT '[]',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for band_stripe_accounts table
CREATE INDEX IF NOT EXISTS idx_band_stripe_accounts_band_id ON band_stripe_accounts(band_id);
CREATE INDEX IF NOT EXISTS idx_band_stripe_accounts_stripe_id ON band_stripe_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_band_stripe_accounts_onboarding ON band_stripe_accounts(onboarding_complete);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Firebase UID
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicate wishlist items
    CONSTRAINT unique_wishlist_item UNIQUE (user_id, product_id)
);

-- Create indexes for wishlists table
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- Product reviews
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- Firebase UID
    order_id UUID REFERENCES orders(id), -- Only verified purchasers can review
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    images JSONB DEFAULT '[]', -- Array of review image URLs
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true, -- For moderation
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- One review per user per product
    CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);

-- Create indexes for product_reviews table
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);

-- Digital downloads tracking
CREATE TABLE IF NOT EXISTS digital_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    user_id VARCHAR(255) NOT NULL, -- Firebase UID
    product_id UUID NOT NULL REFERENCES products(id),
    download_token VARCHAR(255) UNIQUE NOT NULL, -- Secure download token
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 5, -- Limit downloads per purchase
    expires_at TIMESTAMP, -- Download link expiration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_downloaded_at TIMESTAMP
);

-- Create indexes for digital_downloads table
CREATE INDEX IF NOT EXISTS idx_digital_downloads_user_id ON digital_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_token ON digital_downloads(download_token);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_order_item ON digital_downloads(order_item_id);

-- Shipping rates (for Irish market)
CREATE TABLE IF NOT EXISTS shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    country VARCHAR(2) NOT NULL DEFAULT 'IE',
    min_weight_grams INTEGER DEFAULT 0,
    max_weight_grams INTEGER,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0),
    free_shipping_threshold DECIMAL(10,2), -- Free shipping over this amount
    estimated_days_min INTEGER DEFAULT 1,
    estimated_days_max INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default Irish shipping rates
INSERT INTO shipping_rates (name, description, country, max_weight_grams, rate, free_shipping_threshold, estimated_days_min, estimated_days_max) VALUES
('Standard Post', 'An Post Standard Delivery', 'IE', 2000, 4.50, 50.00, 2, 5),
('Express Post', 'An Post Express Delivery', 'IE', 2000, 8.50, 100.00, 1, 2),
('Registered Post', 'An Post Registered Delivery', 'IE', 2000, 7.50, 75.00, 2, 4)
ON CONFLICT DO NOTHING;

-- Create indexes for shipping_rates table
CREATE INDEX IF NOT EXISTS idx_shipping_rates_country ON shipping_rates(country);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_active ON shipping_rates(is_active);

-- Platform settings
CREATE TABLE IF NOT EXISTS platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
('default_commission_rate', '15.00', 'Default commission rate for new bands (percentage)'),
('currency', 'EUR', 'Platform currency'),
('vat_rate', '23.00', 'Irish VAT rate (percentage)'),
('max_file_size_mb', '100', 'Maximum file size for digital downloads (MB)'),
('max_images_per_product', '10', 'Maximum number of images per product'),
('order_number_prefix', 'BVR', 'Prefix for order numbers')
ON CONFLICT (key) DO NOTHING;

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_band_stripe_accounts_updated_at ON band_stripe_accounts;
CREATE TRIGGER update_band_stripe_accounts_updated_at BEFORE UPDATE ON band_stripe_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    counter INTEGER;
    order_num TEXT;
BEGIN
    SELECT value INTO prefix FROM platform_settings WHERE key = 'order_number_prefix';

    -- Get next counter value (simple incrementing number)
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
    INTO counter
    FROM orders
    WHERE order_number LIKE prefix || '%';

    order_num := prefix || LPAD(counter::TEXT, 6, '0');

    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Views for common queries

-- Product catalog view with band information
CREATE OR REPLACE VIEW product_catalog AS
SELECT
    p.*,
    pc.name as category_name,
    pc.description as category_description,
    COALESCE(AVG(pr.rating), 0) as average_rating,
    COUNT(pr.id) as review_count,
    CASE WHEN p.inventory_count > 0 OR p.category = 'digital' THEN true ELSE false END as in_stock
FROM products p
LEFT JOIN product_categories pc ON p.category = pc.id
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
WHERE p.is_active = true
GROUP BY p.id, pc.name, pc.description;

-- Order summary view
CREATE OR REPLACE VIEW order_summary AS
SELECT
    o.*,
    COUNT(oi.id) as item_count,
    STRING_AGG(DISTINCT oi.band_id, ', ') as band_ids,
    STRING_AGG(DISTINCT oi.product_title, ', ') as product_titles
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Band sales analytics view
CREATE OR REPLACE VIEW band_sales_analytics AS
SELECT
    oi.band_id,
    COUNT(DISTINCT oi.order_id) as total_orders,
    COUNT(oi.id) as total_items_sold,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.total_price) as total_revenue,
    SUM(oi.band_payout) as total_payout,
    AVG(oi.unit_price) as average_item_price,
    MIN(o.created_at) as first_sale_date,
    MAX(o.created_at) as last_sale_date
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.payment_status = 'paid'
GROUP BY oi.band_id;

-- Add some sample products for testing
INSERT INTO products (
    band_id, title, description, price, category, inventory_count,
    variants, weight_grams, dimensions, tags, is_featured, seo_slug
) VALUES 
(
    'sample-band-1', 
    'Band T-Shirt - Black', 
    'High-quality cotton t-shirt with band logo', 
    25.00, 
    'tshirt', 
    50,
    '{"sizes": ["S", "M", "L", "XL"], "colors": ["black", "white"]}',
    200,
    '{"length": 30, "width": 20, "height": 1}',
    '["merchandise", "clothing", "band-tee"]',
    true,
    'band-t-shirt-black-' || extract(epoch from now())::text
),
(
    'sample-band-1', 
    'Latest Album - CD', 
    'Our latest studio album on compact disc', 
    15.00, 
    'cd', 
    100,
    '{}',
    100,
    '{"length": 14, "width": 12.5, "height": 1}',
    '["music", "album", "cd"]',
    false,
    'latest-album-cd-' || extract(epoch from now())::text
),
(
    'sample-band-1', 
    'Digital Album Download', 
    'High-quality digital download of our latest album', 
    10.00, 
    'digital', 
    0,
    '{}',
    0,
    '{}',
    '["music", "album", "digital", "download"]',
    true,
    'digital-album-download-' || extract(epoch from now())::text
)
ON CONFLICT (band_id, seo_slug) DO NOTHING;

-- Comments
COMMENT ON TABLE products IS 'Band merchandise products';
COMMENT ON TABLE cart_items IS 'User shopping cart items';
COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON TABLE order_items IS 'Individual items within orders';
COMMENT ON TABLE band_stripe_accounts IS 'Stripe Connect accounts for bands';
COMMENT ON TABLE wishlists IS 'User product wishlists';
COMMENT ON TABLE product_reviews IS 'Product reviews and ratings';
COMMENT ON TABLE digital_downloads IS 'Digital download tracking and security';
COMMENT ON TABLE shipping_rates IS 'Shipping cost calculation';
COMMENT ON TABLE platform_settings IS 'Platform configuration settings';

-- Success message
SELECT 'Merchandise store database setup complete! 🛍️' as status;
