const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const bandsRoutes = require('./routes/bands');
const venuesRoutes = require('./routes/venues');
const claimsRoutes = require('./routes/claims');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

// Import new merchandise routes
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const stripeRoutes = require('./routes/stripe');

// Import database initialization
const { runMerchandiseMigrations } = require('./database/init-merchandise');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stripe webhook rate limiting (more restrictive)
const stripeWebhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many webhook requests',
});
app.use('/api/stripe/webhooks', stripeWebhookLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://bandvenuereview.netlify.app',
      'https://band-review-website.onrender.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature']
};

app.use(cors(corsOptions));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Body parsing middleware
// Note: Stripe webhooks need raw body, so we handle that route specially
app.use('/api/stripe/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0-merchandise',
    services: {
      database: 'connected',
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured',
      firebase: process.env.FIREBASE_PROJECT_ID ? 'configured' : 'not configured'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bands', bandsRoutes);
app.use('/api/venues', venuesRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Merchandise routes
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/stripe', stripeRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Band Merchandise Store API',
    version: '2.0.0',
    description: 'Multi-vendor marketplace API for Irish band merchandise',
    endpoints: {
      authentication: {
        'POST /api/auth/login': 'User login',
        'POST /api/auth/logout': 'User logout',
        'GET /api/auth/verify': 'Verify authentication token'
      },
      products: {
        'GET /api/products': 'List products with filtering and pagination',
        'GET /api/products/:id': 'Get single product details',
        'POST /api/products': 'Create new product (auth required)',
        'PUT /api/products/:id': 'Update product (auth required)',
        'DELETE /api/products/:id': 'Delete product (auth required)',
        'GET /api/products/categories': 'Get product categories',
        'GET /api/products/band/:bandId': 'Get products for specific band'
      },
      cart: {
        'GET /api/cart': 'Get user cart (auth required)',
        'POST /api/cart/add': 'Add item to cart (auth required)',
        'PUT /api/cart/:id': 'Update cart item (auth required)',
        'DELETE /api/cart/:id': 'Remove cart item (auth required)',
        'DELETE /api/cart': 'Clear entire cart (auth required)',
        'GET /api/cart/count': 'Get cart item count (auth required)',
        'POST /api/cart/validate': 'Validate cart items (auth required)',
        'POST /api/cart/merge': 'Merge guest cart with user cart (auth required)'
      },
      orders: {
        'GET /api/orders': 'Get user orders (auth required)',
        'GET /api/orders/:id': 'Get single order details (auth required)',
        'GET /api/orders/band/:bandId': 'Get orders for specific band (auth required)',
        'PUT /api/orders/:id/status': 'Update order status (auth required)',
        'GET /api/orders/:id/items': 'Get order items (auth required)',
        'GET /api/orders/analytics/band/:bandId': 'Get band sales analytics (auth required)',
        'GET /api/orders/search': 'Search orders (auth required)',
        'POST /api/orders/:id/cancel': 'Cancel order (auth required)'
      },
      stripe: {
        'POST /api/stripe/connect/onboard': 'Start Stripe Connect onboarding (auth required)',
        'GET /api/stripe/account/:bandId': 'Get Stripe account status (auth required)',
        'POST /api/stripe/payment-intent': 'Create payment intent for order',
        'POST /api/stripe/webhooks': 'Handle Stripe webhooks',
        'GET /api/stripe/dashboard/:bandId': 'Get Stripe dashboard link (auth required)'
      },
      legacy: {
        'GET /api/bands': 'List bands',
        'GET /api/venues': 'List venues',
        'POST /api/claims': 'Submit venue claim',
        'GET /api/admin/*': 'Admin endpoints'
      }
    },
    features: {
      'Multi-vendor marketplace': 'Bands can sell their own products',
      'Stripe Connect integration': 'Split payments between platform and bands',
      'Digital downloads': 'Secure digital product delivery',
      'Inventory management': 'Real-time stock tracking',
      'Irish market focus': 'EUR currency, Irish shipping, VAT handling',
      'Mobile responsive': 'Optimized for all devices',
      'Admin panel': 'Complete platform management'
    }
  });
});

// Catch-all for undefined routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    suggestion: 'Check /api/docs for available endpoints'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Band Merchandise Store API...');
    
    // Run database migrations
    await runMerchandiseMigrations();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🛍️  Store Features: Multi-vendor marketplace with Stripe Connect`);
      console.log(`🇮🇪 Market: Irish bands and customers (EUR currency)`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Development mode - CORS enabled for localhost:3000`);
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        console.warn('⚠️  Warning: STRIPE_SECRET_KEY not configured - payment processing disabled');
      }
      
      if (!process.env.FIREBASE_PROJECT_ID) {
        console.warn('⚠️  Warning: Firebase not configured - authentication may not work');
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
