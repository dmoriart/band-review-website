const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const db = require('../database/db');
const auth = require('../middleware/auth');

// Validation middleware
const validateOrderQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  query('payment_status').optional().isIn(['pending', 'paid', 'failed', 'refunded']).withMessage('Invalid payment status'),
  query('band_id').optional().trim().isLength({ min: 1 }).withMessage('Band ID cannot be empty')
];

const validateOrderUpdate = [
  body('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('tracking_number').optional().trim().isLength({ max: 255 }).withMessage('Tracking number too long'),
  body('shipping_carrier').optional().trim().isLength({ max: 100 }).withMessage('Shipping carrier name too long')
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

// GET /api/orders - Get user's orders (requires authentication)
router.get('/', auth, validateOrderQuery, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      page = 1,
      limit = 20,
      status,
      payment_status
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['o.user_id = $1'];
    let queryParams = [userId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`o.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (payment_status) {
      whereConditions.push(`o.payment_status = $${paramIndex++}`);
      queryParams.push(payment_status);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Main query with order summary
    const query = `
      SELECT 
        o.*,
        COUNT(oi.id) as item_count,
        STRING_AGG(DISTINCT oi.band_id, ', ') as band_ids,
        STRING_AGG(DISTINCT oi.product_title, ', ') as product_titles
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(parseInt(limit), offset);

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      ${whereClause}
    `;

    const [ordersResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset params
    ]);

    const orders = ordersResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/orders/:id - Get single order details
router.get('/:id', auth, param('id').isUUID().withMessage('Invalid order ID'), handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    // Get order details
    const orderQuery = `
      SELECT o.*
      FROM orders o
      WHERE o.id = $1 AND (o.user_id = $2 OR o.user_id IS NULL)
    `;

    const orderResult = await db.query(orderQuery, [id, userId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderResult.rows[0];

    // Get order items with product details
    const itemsQuery = `
      SELECT 
        oi.*,
        p.images,
        p.seo_slug,
        pc.name as category_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_categories pc ON oi.product_category = pc.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `;

    const itemsResult = await db.query(itemsQuery, [id]);

    res.json({
      success: true,
      data: {
        ...order,
        items: itemsResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/orders/band/:bandId - Get orders for specific band (requires authentication)
router.get('/band/:bandId', auth, validateOrderQuery, handleValidationErrors, async (req, res) => {
  try {
    const { bandId } = req.params;
    const {
      page = 1,
      limit = 20,
      status,
      payment_status
    } = req.query;

    // TODO: Verify user has permission to view this band's orders

    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['oi.band_id = $1'];
    let queryParams = [bandId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`o.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (payment_status) {
      whereConditions.push(`o.payment_status = $${paramIndex++}`);
      queryParams.push(payment_status);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Main query - get orders containing items from this band
    const query = `
      SELECT DISTINCT
        o.*,
        SUM(oi.band_payout) as band_total_payout,
        COUNT(oi.id) as band_item_count,
        STRING_AGG(oi.product_title, ', ') as band_products
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(parseInt(limit), offset);

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
    `;

    const [ordersResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, queryParams.slice(0, -2))
    ]);

    const orders = ordersResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching band orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch band orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/orders/:id/status - Update order status (band owners only)
router.put('/:id/status', auth, param('id').isUUID(), validateOrderUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number, shipping_carrier } = req.body;

    // TODO: Verify user has permission to update this order
    // This would check if the authenticated user owns/manages any bands in the order

    // Check if order exists
    const existingOrderQuery = 'SELECT * FROM orders WHERE id = $1';
    const existingOrderResult = await db.query(existingOrderQuery, [id]);

    if (existingOrderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const existingOrder = existingOrderResult.rows[0];

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);

      // Set shipped_at timestamp when status changes to shipped
      if (status === 'shipped' && existingOrder.status !== 'shipped') {
        updates.push(`shipped_at = CURRENT_TIMESTAMP`);
      }

      // Set delivered_at timestamp when status changes to delivered
      if (status === 'delivered' && existingOrder.status !== 'delivered') {
        updates.push(`delivered_at = CURRENT_TIMESTAMP`);
      }
    }

    if (tracking_number !== undefined) {
      updates.push(`tracking_number = $${paramIndex++}`);
      values.push(tracking_number);
    }

    if (shipping_carrier !== undefined) {
      updates.push(`shipping_carrier = $${paramIndex++}`);
      values.push(shipping_carrier);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const updateQuery = `
      UPDATE orders SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const updateResult = await db.query(updateQuery, values);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/orders/:id/items - Get order items for specific order
router.get('/:id/items', auth, param('id').isUUID(), handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    // Verify user has access to this order
    const orderQuery = `
      SELECT o.* FROM orders o
      WHERE o.id = $1 AND (o.user_id = $2 OR o.user_id IS NULL)
    `;
    const orderResult = await db.query(orderQuery, [id, userId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items with product details
    const itemsQuery = `
      SELECT 
        oi.*,
        p.images,
        p.seo_slug,
        p.is_active,
        pc.name as category_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_categories pc ON oi.product_category = pc.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `;

    const itemsResult = await db.query(itemsQuery, [id]);

    res.json({
      success: true,
      data: itemsResult.rows
    });

  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/orders/analytics/band/:bandId - Get sales analytics for band
router.get('/analytics/band/:bandId', auth, async (req, res) => {
  try {
    const { bandId } = req.params;

    // TODO: Verify user has permission to view this band's analytics

    // Get overall analytics
    const analyticsQuery = `
      SELECT 
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
      WHERE oi.band_id = $1 AND o.payment_status = 'paid'
    `;

    const analyticsResult = await db.query(analyticsQuery, [bandId]);

    // Get monthly sales data for the last 12 months
    const monthlySalesQuery = `
      SELECT 
        DATE_TRUNC('month', o.created_at) as month,
        COUNT(DISTINCT oi.order_id) as orders,
        SUM(oi.total_price) as revenue,
        SUM(oi.band_payout) as payout,
        SUM(oi.quantity) as items_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.band_id = $1 
        AND o.payment_status = 'paid'
        AND o.created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', o.created_at)
      ORDER BY month DESC
    `;

    const monthlySalesResult = await db.query(monthlySalesQuery, [bandId]);

    // Get top-selling products
    const topProductsQuery = `
      SELECT 
        oi.product_id,
        oi.product_title,
        oi.product_category,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.band_id = $1 AND o.payment_status = 'paid'
      GROUP BY oi.product_id, oi.product_title, oi.product_category
      ORDER BY total_sold DESC
      LIMIT 10
    `;

    const topProductsResult = await db.query(topProductsQuery, [bandId]);

    // Get recent orders
    const recentOrdersQuery = `
      SELECT DISTINCT
        o.id,
        o.order_number,
        o.created_at,
        o.status,
        o.total_amount,
        SUM(oi.band_payout) as band_payout,
        COUNT(oi.id) as band_items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.band_id = $1 AND o.payment_status = 'paid'
      GROUP BY o.id, o.order_number, o.created_at, o.status, o.total_amount
      ORDER BY o.created_at DESC
      LIMIT 10
    `;

    const recentOrdersResult = await db.query(recentOrdersQuery, [bandId]);

    res.json({
      success: true,
      data: {
        overview: analyticsResult.rows[0],
        monthly_sales: monthlySalesResult.rows,
        top_products: topProductsResult.rows,
        recent_orders: recentOrdersResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching band analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch band analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/orders/search - Search orders by order number or customer email
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 3 characters long'
      });
    }

    const searchTerm = q.trim();

    // Search by order number or customer email
    const searchQuery = `
      SELECT 
        o.*,
        COUNT(oi.id) as item_count,
        STRING_AGG(DISTINCT oi.band_id, ', ') as band_ids
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE (
        o.order_number ILIKE $1 
        OR o.customer_email ILIKE $1
        OR o.customer_name ILIKE $1
      )
      AND (o.user_id = $2 OR o.user_id IS NULL)
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 20
    `;

    const searchResult = await db.query(searchQuery, [`%${searchTerm}%`, req.user.uid]);

    res.json({
      success: true,
      data: {
        orders: searchResult.rows,
        search_term: searchTerm
      }
    });

  } catch (error) {
    console.error('Error searching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/orders/:id/cancel - Cancel order (if not yet shipped)
router.post('/:id/cancel', auth, param('id').isUUID(), handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    // Check if order exists and belongs to user
    const orderQuery = `
      SELECT * FROM orders 
      WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
    `;
    const orderResult = await db.query(orderQuery, [id, userId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderResult.rows[0];

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in its current status'
      });
    }

    // Update order status to cancelled
    const updateQuery = `
      UPDATE orders 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [id]);

    // Restore inventory for physical products
    const restoreInventoryQuery = `
      UPDATE products SET 
        inventory_count = inventory_count + oi.quantity,
        updated_at = CURRENT_TIMESTAMP
      FROM order_items oi
      WHERE products.id = oi.product_id 
      AND oi.order_id = $1 
      AND products.category != 'digital'
    `;
    await db.query(restoreInventoryQuery, [id]);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
