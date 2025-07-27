# 🗄️ Merchandise Database Setup Guide

## Quick Setup (2 minutes)

### Option 1: Supabase SQL Editor (Recommended)

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard
2. **Navigate to your project**: `thoghjwipjpkxcfkkcbx`
3. **Open SQL Editor** (left sidebar)
4. **Copy and paste** the entire contents of `setup-merchandise-database.sql`
5. **Click "Run"** - this will create all 12 tables + sample data

### Option 2: Command Line (if you have psql)

```bash
# First, update your DATABASE_URL in backend/.env with your actual password
# Then run:
psql "postgresql://postgres:YOUR_PASSWORD@db.thoghjwipjpkxcfkkcbx.supabase.co:5432/postgres" -f setup-merchandise-database.sql
```

## What Gets Created

### 📊 Database Tables (12 total)
- ✅ `product_categories` - CD, Vinyl, T-Shirts, etc.
- ✅ `products` - Band merchandise with variants, images, pricing
- ✅ `cart_items` - User shopping carts
- ✅ `orders` - Customer orders with shipping/billing
- ✅ `order_items` - Individual items within orders
- ✅ `band_stripe_accounts` - Stripe Connect integration
- ✅ `wishlists` - User product wishlists
- ✅ `product_reviews` - Customer reviews and ratings
- ✅ `digital_downloads` - Secure digital product delivery
- ✅ `shipping_rates` - Irish shipping costs (An Post)
- ✅ `platform_settings` - Configuration settings

### 🇮🇪 Irish Market Data
- **Product Categories**: CDs, Vinyl, T-Shirts, Hoodies, Posters, Stickers, Digital, Other
- **Shipping Rates**: Standard (€4.50), Express (€8.50), Registered (€7.50)
- **Platform Settings**: 15% commission, EUR currency, 23% VAT
- **Sample Products**: 3 test products for development

### 🔧 Database Features
- **Indexes** for fast queries
- **Triggers** for automatic timestamp updates
- **Views** for common queries (product catalog, order summary, analytics)
- **Functions** for order number generation
- **Constraints** for data integrity

## Verify Setup

After running the SQL script, you should see:
```sql
SELECT 'Merchandise store database setup complete! 🛍️' as status;
```

### Check Tables Were Created
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%product%' OR table_name LIKE '%order%' OR table_name LIKE '%cart%';
```

### Check Sample Data
```sql
SELECT * FROM product_categories;
SELECT * FROM products LIMIT 3;
SELECT * FROM shipping_rates;
```

## Environment Setup

### 1. Update Backend .env
Add these new environment variables to `backend/.env`:

```env
# Stripe Configuration (Required for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend URL (for Stripe redirects)
FRONTEND_URL=http://localhost:3000

# Update your DATABASE_URL with actual password
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.thoghjwipjpkxcfkkcbx.supabase.co:5432/postgres
```

### 2. Install Dependencies
```bash
cd backend
npm install  # This includes the new Stripe dependency
```

### 3. Test the Setup
```bash
# Start the merchandise server
cd backend
node src/server-merchandise.js
```

You should see:
```
🚀 Starting Band Merchandise Store API...
✅ Merchandise tables already exist
🎉 Server running on port 5000
📚 API Documentation: http://localhost:5000/api/docs
🛍️ Store Features: Multi-vendor marketplace with Stripe Connect
```

## API Testing

### Test Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Get product categories
curl http://localhost:5000/api/products/categories

# Get all products
curl http://localhost:5000/api/products

# Get sample products
curl http://localhost:5000/api/products?limit=3
```

### API Documentation
Visit: http://localhost:5000/api/docs

## Troubleshooting

### Database Connection Issues
1. **Check your DATABASE_URL** in `backend/.env`
2. **Verify Supabase project** is active
3. **Test connection**:
   ```bash
   cd backend
   node -e "require('./src/database/db').query('SELECT NOW()').then(r => console.log('✅ Connected:', r.rows[0]))"
   ```

### Missing Tables
If tables weren't created:
1. **Check Supabase logs** in dashboard
2. **Run SQL script again** (it's safe to re-run)
3. **Verify permissions** on your Supabase project

### Stripe Setup
1. **Create Stripe account**: https://stripe.com
2. **Enable Connect**: https://dashboard.stripe.com/connect/overview
3. **Get API keys**: https://dashboard.stripe.com/apikeys
4. **Set up webhooks**: https://dashboard.stripe.com/webhooks

## Next Steps

Once database is set up:

1. **✅ Database Setup** - Complete!
2. **🔄 Stripe Integration** - Add your Stripe keys
3. **🎨 Frontend Components** - Build React store interface
4. **📱 Mobile Optimization** - Responsive design
5. **🚀 Production Deploy** - Launch the store

## Support

If you encounter issues:
1. **Check the logs** in your terminal
2. **Verify environment variables** are set correctly
3. **Test database connection** with the troubleshooting commands above
4. **Review the API documentation** at `/api/docs`

---

**Your Irish band merchandise marketplace database is ready!** 🇮🇪🛍️🎵
