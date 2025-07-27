const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const db = require('../database/db');
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Validation middleware
const validateStripeOnboarding = [
  body('band_id').trim().isLength({ min: 1 }).withMessage('Band ID is required'),
  body('business_type').optional().isIn(['individual', 'company']).withMessage('Invalid business type'),
  body('country').optional().isLength({ min: 2, max: 2 }).withMessage('Country must be 2-letter code')
];

const validatePaymentIntent = [
  body('cart_items').isArray({ min: 1 }).withMessage('Cart items are required'),
  body('shipping_address').isObject().withMessage('Shipping address is required'),
  body('customer_email').isEmail().withMessage('Valid email is required'),
  body('customer_name').optional().trim().isLength({ min: 1 }).withMessage('Customer name cannot be empty')
];

// Helper function to handle validation errors
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}

// Helper function to calculate platform fee
function calculatePlatformFee(amount, commissionRate = 15) {
  return Math.round(amount * (commissionRate / 100));
}

// Helper function to calculate shipping cost
async function calculateShippingCost(cartItems, shippingAddress) {
  // Simple shipping calculation - in production, integrate with shipping APIs
  const totalWeight = cartItems.reduce((sum, item) => {
    return sum + (item.weight_grams || 0) * item.quantity;
  }, 0);

  // Get shipping rates from database
  const shippingQuery = `
    SELECT * FROM shipping_rates 
    WHERE country = $1 AND is_active = true 
    AND (max_weight_grams IS NULL OR max_weight_grams >= $2)
    ORDER BY rate ASC
    LIMIT 1
  `;
  
  const shippingResult = await db.query(shippingQuery, [
    shippingAddress.country || 'IE',
    totalWeight
  ]);

  if (shippingResult.rows.length === 0) {
    return { rate: 4.50, name: 'Standard Shipping' }; // Default rate
  }

  const shipping = shippingResult.rows[0];
  return {
    rate: parseFloat(shipping.rate),
    name: shipping.name,
    estimatedDays: `${shipping.estimated_days_min}-${shipping.estimated_days_max} days`
  };
}

// POST /api/stripe/connect/onboard - Start Stripe Connect onboarding for band
router.post('/connect/onboard', auth, validateStripeOnboarding, handleValidationErrors, async (req, res) => {
  try {
    const { band_id, business_type = 'individual', country = 'IE' } = req.body;
    const userId = req.user.uid;

    // TODO: Verify user has permission to onboard this band
    // This would check if the authenticated user owns/manages the band

    // Check if band already has a Stripe account
    const existingAccountQuery = 'SELECT * FROM band_stripe_accounts WHERE band_id = $1';
    const existingAccountResult = await db.query(existingAccountQuery, [band_id]);

    let stripeAccountId;
    let accountExists = false;

    if (existingAccountResult.rows.length > 0) {
      stripeAccountId = existingAccountResult.rows[0].stripe_account_id;
      accountExists = true;
    } else {
      // Create new Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country: country,
        business_type: business_type,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        metadata: {
          band_id: band_id,
          user_id: userId
        }
      });

      stripeAccountId = account.id;

      // Save to database
      const insertQuery = `
        INSERT INTO band_stripe_accounts (
          band_id, stripe_account_id, country, currency, business_type
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      await db.query(insertQuery, [band_id, stripeAccountId, country, 'EUR', business_type]);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL}/band-dashboard?refresh=stripe`,
      return_url: `${process.env.FRONTEND_URL}/band-dashboard?success=stripe`,
      type: 'account_onboarding'
    });

    res.json({
      success: true,
      message: accountExists ? 'Continue Stripe onboarding' : 'Stripe account created successfully',
      data: {
        account_id: stripeAccountId,
        onboarding_url: accountLink.url,
        existing_account: accountExists
      }
    });

  } catch (error) {
    console.error('Error creating Stripe account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Stripe account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/stripe/account/:bandId - Get Stripe account status for band
router.get('/account/:bandId', auth, async (req, res) => {
  try {
    const { bandId } = req.params;

    // Get band's Stripe account from database
    const accountQuery = 'SELECT * FROM band_stripe_accounts WHERE band_id = $1';
    const accountResult = await db.query(accountQuery, [bandId]);

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No Stripe account found for this band'
      });
    }

    const bandAccount = accountResult.rows[0];

    // Get account details from Stripe
    const stripeAccount = await stripe.accounts.retrieve(bandAccount.stripe_account_id);

    // Update database with latest status
    const updateQuery = `
      UPDATE band_stripe_accounts SET
        onboarding_complete = $1,
        charges_enabled = $2,
        payouts_enabled = $3,
        requirements_due = $4,
        requirements_past_due = $5,
        requirements_currently_due = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE band_id = $7
      RETURNING *
    `;

    const updateResult = await db.query(updateQuery, [
      stripeAccount.details_submitted && stripeAccount.charges_enabled,
      stripeAccount.charges_enabled,
      stripeAccount.payouts_enabled,
      JSON.stringify(stripeAccount.requirements?.eventually_due || []),
      JSON.stringify(stripeAccount.requirements?.past_due || []),
      JSON.stringify(stripeAccount.requirements?.currently_due || []),
      bandId
    ]);

    const updatedAccount = updateResult.rows[0];

    res.json({
      success: true,
      data: {
        ...updatedAccount,
        stripe_details: {
          details_submitted: stripeAccount.details_submitted,
          charges_enabled: stripeAccount.charges_enabled,
          payouts_enabled: stripeAccount.payouts_enabled,
          requirements: stripeAccount.requirements
        }
      }
    });

  } catch (error) {
    console.error('Error fetching Stripe account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Stripe account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/stripe/payment-intent - Create payment intent for order
router.post('/payment-intent', validatePaymentIntent, handleValidationErrors, async (req, res) => {
  try {
    const {
      cart_items,
      shipping_address,
      customer_email,
      customer_name,
      user_id = null
    } = req.body;

    // Validate cart items and calculate totals
    let subtotal = 0;
    const bandTotals = {};
    const validatedItems = [];

    for (const item of cart_items) {
      // Get product details from database
      const productQuery = `
        SELECT p.*, bsa.stripe_account_id, bsa.commission_rate, bsa.charges_enabled
        FROM products p
        LEFT JOIN band_stripe_accounts bsa ON p.band_id = bsa.band_id
        WHERE p.id = $1 AND p.is_active = true
      `;
      const productResult = await db.query(productQuery, [item.product_id]);

      if (productResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product_id} not found or inactive`
        });
      }

      const product = productResult.rows[0];

      // Check if band has Stripe account set up
      if (!product.stripe_account_id || !product.charges_enabled) {
        return res.status(400).json({
          success: false,
          message: `Band for product "${product.title}" has not completed Stripe setup`
        });
      }

      // Check inventory for physical products
      if (product.category !== 'digital' && product.inventory_count < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for product "${product.title}"`
        });
      }

      const itemTotal = parseFloat(product.price) * parseInt(item.quantity);
      subtotal += itemTotal;

      // Group by band for split payments
      if (!bandTotals[product.band_id]) {
        bandTotals[product.band_id] = {
          band_id: product.band_id,
          stripe_account_id: product.stripe_account_id,
          commission_rate: product.commission_rate || 15,
          subtotal: 0,
          items: []
        };
      }
      bandTotals[product.band_id].subtotal += itemTotal;
      bandTotals[product.band_id].items.push({
        ...item,
        ...product
      });

      validatedItems.push({
        ...item,
        ...product
      });
    }

    // Calculate shipping
    const shipping = await calculateShippingCost(validatedItems, shipping_address);
    const shippingCost = shipping.rate;

    // Calculate VAT (Irish rate: 23%)
    const vatRate = 0.23;
    const taxAmount = (subtotal + shippingCost) * vatRate;

    // Calculate platform fees
    let totalPlatformFee = 0;
    for (const bandTotal of Object.values(bandTotals)) {
      const bandFee = calculatePlatformFee(bandTotal.subtotal, bandTotal.commission_rate);
      totalPlatformFee += bandFee;
      bandTotal.platform_fee = bandFee;
      bandTotal.band_payout = bandTotal.subtotal - bandFee;
    }

    const totalAmount = Math.round((subtotal + shippingCost + taxAmount) * 100); // Convert to cents

    // Generate order number
    const orderNumberResult = await db.query('SELECT generate_order_number() as order_number');
    const orderNumber = orderNumberResult.rows[0].order_number;

    // Create order in database
    const orderQuery = `
      INSERT INTO orders (
        order_number, customer_email, customer_name, user_id,
        shipping_address, subtotal, shipping_cost, tax_amount,
        platform_fee, total_amount, status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 'pending')
      RETURNING *
    `;

    const orderResult = await db.query(orderQuery, [
      orderNumber,
      customer_email,
      customer_name,
      user_id,
      JSON.stringify(shipping_address),
      subtotal,
      shippingCost,
      taxAmount,
      totalPlatformFee,
      totalAmount / 100 // Store in euros
    ]);

    const order = orderResult.rows[0];

    // Create order items
    for (const item of validatedItems) {
      const bandTotal = bandTotals[item.band_id];
      const itemPlatformFee = calculatePlatformFee(
        parseFloat(item.price) * parseInt(item.quantity),
        bandTotal.commission_rate
      );
      const itemBandPayout = (parseFloat(item.price) * parseInt(item.quantity)) - itemPlatformFee;

      const orderItemQuery = `
        INSERT INTO order_items (
          order_id, product_id, band_id, product_title, product_category,
          variant_selection, quantity, unit_price, total_price, band_payout
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      await db.query(orderItemQuery, [
        order.id,
        item.product_id,
        item.band_id,
        item.title,
        item.category,
        JSON.stringify(item.variant_selection || {}),
        item.quantity,
        item.price,
        parseFloat(item.price) * parseInt(item.quantity),
        itemBandPayout
      ]);
    }

    // Create Stripe Payment Intent
    // For multi-vendor, we'll use a single payment intent and handle transfers
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'eur',
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        customer_email: customer_email
      },
      receipt_email: customer_email,
      description: `Order ${orderNumber} - Band Merchandise`
    });

    // Update order with payment intent ID
    await db.query(
      'UPDATE orders SET stripe_payment_intent_id = $1 WHERE id = $2',
      [paymentIntent.id, order.id]
    );

    res.json({
      success: true,
      data: {
        order_id: order.id,
        order_number: orderNumber,
        client_secret: paymentIntent.client_secret,
        amount: totalAmount,
        currency: 'eur',
        shipping: shipping,
        band_totals: Object.values(bandTotals)
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/stripe/webhooks - Handle Stripe webhooks
router.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Helper function to handle successful payments
async function handlePaymentSucceeded(paymentIntent) {
  const orderId = paymentIntent.metadata.order_id;

  // Update order status
  await db.query(
    'UPDATE orders SET payment_status = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
    ['paid', 'confirmed', orderId]
  );

  // Get order details for transfers
  const orderQuery = `
    SELECT o.*, oi.band_id, oi.band_payout, bsa.stripe_account_id
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN band_stripe_accounts bsa ON oi.band_id = bsa.band_id
    WHERE o.id = $1
  `;
  const orderResult = await db.query(orderQuery, [orderId]);

  // Group payouts by band
  const bandPayouts = {};
  for (const row of orderResult.rows) {
    if (!bandPayouts[row.band_id]) {
      bandPayouts[row.band_id] = {
        stripe_account_id: row.stripe_account_id,
        total_payout: 0
      };
    }
    bandPayouts[row.band_id].total_payout += parseFloat(row.band_payout);
  }

  // Create transfers to band accounts
  for (const [bandId, payout] of Object.entries(bandPayouts)) {
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(payout.total_payout * 100), // Convert to cents
        currency: 'eur',
        destination: payout.stripe_account_id,
        metadata: {
          order_id: orderId,
          band_id: bandId
        }
      });

      console.log(`Transfer created for band ${bandId}:`, transfer.id);
    } catch (transferError) {
      console.error(`Failed to create transfer for band ${bandId}:`, transferError);
    }
  }

  // Update inventory for physical products
  const inventoryQuery = `
    UPDATE products SET 
      inventory_count = inventory_count - oi.quantity,
      updated_at = CURRENT_TIMESTAMP
    FROM order_items oi
    WHERE products.id = oi.product_id 
    AND oi.order_id = $1 
    AND products.category != 'digital'
  `;
  await db.query(inventoryQuery, [orderId]);

  // Clear user's cart if they were logged in
  const order = orderResult.rows[0];
  if (order.user_id) {
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [order.user_id]);
  }

  console.log(`Payment succeeded for order ${orderId}`);
}

// Helper function to handle failed payments
async function handlePaymentFailed(paymentIntent) {
  const orderId = paymentIntent.metadata.order_id;

  await db.query(
    'UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['failed', orderId]
  );

  console.log(`Payment failed for order ${orderId}`);
}

// Helper function to handle account updates
async function handleAccountUpdated(account) {
  const bandId = account.metadata?.band_id;
  if (!bandId) return;

  const updateQuery = `
    UPDATE band_stripe_accounts SET
      onboarding_complete = $1,
      charges_enabled = $2,
      payouts_enabled = $3,
      requirements_due = $4,
      requirements_past_due = $5,
      requirements_currently_due = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE stripe_account_id = $7
  `;

  await db.query(updateQuery, [
    account.details_submitted && account.charges_enabled,
    account.charges_enabled,
    account.payouts_enabled,
    JSON.stringify(account.requirements?.eventually_due || []),
    JSON.stringify(account.requirements?.past_due || []),
    JSON.stringify(account.requirements?.currently_due || []),
    account.id
  ]);

  console.log(`Account updated for band ${bandId}`);
}

// GET /api/stripe/dashboard/:bandId - Get Stripe Express dashboard link
router.get('/dashboard/:bandId', auth, async (req, res) => {
  try {
    const { bandId } = req.params;

    // Get band's Stripe account
    const accountQuery = 'SELECT * FROM band_stripe_accounts WHERE band_id = $1';
    const accountResult = await db.query(accountQuery, [bandId]);

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No Stripe account found for this band'
      });
    }

    const bandAccount = accountResult.rows[0];

    // Create login link for Stripe Express dashboard
    const loginLink = await stripe.accounts.createLoginLink(bandAccount.stripe_account_id);

    res.json({
      success: true,
      data: {
        dashboard_url: loginLink.url
      }
    });

  } catch (error) {
    console.error('Error creating dashboard link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create dashboard link',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
