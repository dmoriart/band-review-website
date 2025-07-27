# Band Merchandise Store Implementation Plan

## Project Overview
Transform the existing band review website into a comprehensive multi-vendor merchandise marketplace where bands can sell their products (CDs, vinyl, t-shirts, hoodies, posters, stickers, digital downloads) with Stripe Connect integration for split payments.

## Current Architecture Analysis

### Existing Assets
✅ **Frontend**: React 19 + TypeScript with responsive design
✅ **Backend**: Node.js/Express + Python/Flask hybrid architecture  
✅ **Authentication**: Firebase Auth already implemented
✅ **CMS**: Sanity CMS with band, venue, and gig data
✅ **Database**: SQLite/PostgreSQL with existing schemas
✅ **Deployment**: Netlify (frontend) + Render.com (backend)

### Existing Data Models
- **Bands**: Already in Sanity CMS with profiles, genres, locations
- **Venues**: Comprehensive venue database
- **Users**: Firebase authentication system
- **Admin Panel**: Existing admin interface

## Implementation Phases

### Phase 1: Database Schema Extension (Week 1)
**Extend existing database with merchandise-specific tables:**

```sql
-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id VARCHAR REFERENCES bands(sanity_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'cd', 'vinyl', 'tshirt', 'hoodie', 'poster', 'sticker', 'digital'
    inventory_count INTEGER DEFAULT 0,
    images JSONB, -- Array of image URLs
    variants JSONB, -- Size/format options
    digital_file_url VARCHAR(500), -- For digital products
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Shopping cart
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL, -- Firebase UID
    product_id UUID REFERENCES products(id),
    variant_selection JSONB,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    shipping_address JSONB,
    total_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items (for multi-band orders)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    band_id VARCHAR NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    variant_selection JSONB
);

-- Band Stripe accounts
CREATE TABLE band_stripe_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id VARCHAR UNIQUE NOT NULL, -- Sanity band _id
    stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
    onboarding_complete BOOLEAN DEFAULT false,
    commission_rate DECIMAL(5,2) DEFAULT 15.00, -- Platform commission %
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product categories
CREATE TABLE product_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);
```

### Phase 2: Stripe Connect Integration (Week 2)
**Implement marketplace payment processing:**

1. **Stripe Connect Express Setup**
   - Band onboarding flow with Stripe Express accounts
   - KYC verification handling
   - Webhook endpoints for account status updates

2. **Payment Processing**
   - Split payments between platform and bands
   - Automatic commission calculation
   - Refund and dispute handling

3. **Payout Management**
   - Automatic payouts to band accounts
   - Payout history and reporting
   - Tax document generation

### Phase 3: Product Management System (Week 3)
**Build comprehensive product management:**

1. **Band Dashboard**
   - Product CRUD operations
   - Inventory management
   - Sales analytics
   - Order fulfillment interface

2. **Product Upload System**
   - Multi-image upload with Cloudinary
   - Variant management (sizes, formats)
   - Digital file upload for downloads
   - Bulk product import

3. **Inventory Tracking**
   - Real-time stock updates
   - Low stock alerts
   - Automatic out-of-stock handling

### Phase 4: Shopping Experience (Week 4)
**Create customer-facing store:**

1. **Product Catalog**
   - Grid/list view with filtering
   - Search functionality
   - Category browsing
   - Band-specific storefronts

2. **Shopping Cart**
   - Multi-band cart support
   - Variant selection
   - Quantity management
   - Persistent cart (logged-in users)

3. **Checkout Process**
   - Guest and registered user checkout
   - Shipping calculation
   - Payment processing with Stripe
   - Order confirmation emails

### Phase 5: Advanced Features (Week 5)
**Enhance user experience:**

1. **User Accounts**
   - Order history
   - Wishlist functionality
   - Digital download management
   - Address book

2. **Review System**
   - Product reviews and ratings
   - Photo reviews
   - Review moderation

3. **Search & Filtering**
   - Advanced product search
   - Price range filtering
   - Band filtering
   - Sort options (price, popularity, newest)

### Phase 6: Admin & Analytics (Week 6)
**Build administrative tools:**

1. **Admin Panel Extension**
   - Band application review
   - Product moderation
   - Order management
   - Commission settings

2. **Analytics Dashboard**
   - Sales reporting
   - Popular products
   - Band performance metrics
   - Revenue tracking

3. **Content Management**
   - Featured products
   - Homepage customization
   - Promotional banners

## Technical Implementation Details

### Frontend Architecture
```
src/
├── components/
│   ├── store/
│   │   ├── ProductGrid.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── ShoppingCart.tsx
│   │   ├── Checkout.tsx
│   │   └── BandStorefront.tsx
│   ├── band-dashboard/
│   │   ├── ProductManager.tsx
│   │   ├── OrderManager.tsx
│   │   ├── Analytics.tsx
│   │   └── StripeOnboarding.tsx
│   └── admin/
│       ├── ProductModeration.tsx
│       ├── BandApplications.tsx
│       └── PlatformAnalytics.tsx
├── services/
│   ├── stripeService.ts
│   ├── productService.ts
│   ├── cartService.ts
│   └── orderService.ts
└── pages/
    ├── StorePage.tsx
    ├── BandStorePage.tsx
    ├── CheckoutPage.tsx
    └── BandDashboardPage.tsx
```

### Backend API Endpoints
```
/api/products
├── GET / - List products with filtering
├── POST / - Create product (band auth required)
├── GET /:id - Get product details
├── PUT /:id - Update product (band auth required)
└── DELETE /:id - Delete product (band auth required)

/api/bands/:bandId/products
├── GET / - Get band's products
└── POST / - Create product for band

/api/cart
├── GET / - Get user's cart
├── POST /add - Add item to cart
├── PUT /update - Update cart item
└── DELETE /remove - Remove cart item

/api/orders
├── POST / - Create order
├── GET /:id - Get order details
├── GET /user/:userId - Get user's orders
└── PUT /:id/status - Update order status

/api/stripe
├── POST /connect/onboard - Start band onboarding
├── POST /payment-intent - Create payment intent
├── POST /webhooks - Handle Stripe webhooks
└── GET /account/:bandId - Get account status

/api/admin/merchandise
├── GET /products - All products (admin)
├── GET /orders - All orders (admin)
├── GET /bands - Band applications (admin)
└── PUT /commission - Update commission rates
```

### Stripe Integration Architecture
```javascript
// Split payment example
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmount,
  currency: 'eur',
  application_fee_amount: platformFee,
  transfer_data: {
    destination: bandStripeAccountId,
  },
  metadata: {
    order_id: orderId,
    band_id: bandId
  }
});
```

## Migration Strategy

### Data Migration
1. **Extend existing band data** in Sanity with merchandise flags
2. **Create product categories** with Irish music focus
3. **Import sample products** for existing bands
4. **Set up test Stripe accounts** for development

### User Experience Migration
1. **Add "Store" navigation** to existing site
2. **Integrate with existing band pages** - add "Shop" buttons
3. **Maintain existing functionality** while adding commerce
4. **Gradual rollout** to select bands first

## Irish Market Considerations

### Localization
- **EUR currency** as primary
- **Irish shipping rates** integration
- **VAT handling** for EU sales
- **Irish address validation**

### Band Focus
- **Leverage existing Irish band database**
- **Traditional music merchandise** categories
- **Festival merchandise** integration
- **Local pickup options** for Dublin/Cork/Galway

### Compliance
- **GDPR compliance** for customer data
- **Irish revenue reporting** for bands
- **Consumer protection** regulations
- **Digital services tax** handling

## Success Metrics

### Business Metrics
- **Monthly Recurring Revenue (MRR)**
- **Average Order Value (AOV)**
- **Band adoption rate**
- **Customer retention rate**

### Technical Metrics
- **Page load times** < 2 seconds
- **Checkout conversion rate** > 3%
- **Mobile responsiveness** score > 95
- **API response times** < 500ms

## Risk Mitigation

### Technical Risks
- **Payment processing failures** - Implement retry logic and fallbacks
- **Inventory synchronization** - Real-time updates with conflict resolution
- **Image storage costs** - Optimize with CDN and compression

### Business Risks
- **Low band adoption** - Incentivize early adopters with reduced fees
- **Competition from established platforms** - Focus on Irish market niche
- **Regulatory changes** - Stay updated with Irish/EU commerce laws

## Timeline Summary
- **Week 1**: Database schema and basic API endpoints
- **Week 2**: Stripe Connect integration and payment processing
- **Week 3**: Product management and band dashboard
- **Week 4**: Customer shopping experience
- **Week 5**: Advanced features and user accounts
- **Week 6**: Admin tools and analytics

**Total Development Time**: 6 weeks for MVP
**Additional Time**: 2-4 weeks for testing, deployment, and refinement

This plan leverages your existing infrastructure while adding comprehensive e-commerce capabilities specifically tailored for the Irish music market.
