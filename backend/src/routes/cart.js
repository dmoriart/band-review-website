const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const db = require('../database/db');
const auth = require('../middleware/auth');

// Validation middleware
const validateCartItem = [
  body('product_id').isUUID().withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
  body('variant_selection').optional().isJSON().withMessage('Variant selection must be valid JSON')
];

const validateCartUpdate = [
  body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
  body('variant_selection').optional().isJSON().withMessage('Variant selection must be valid JSON')
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

// Helper function to calculate cart totals
async function calculateCartTotals(cartItems) {
  let subtotal = 0;
  let totalItems = 0;
  const bandTotals = {};

  for (const item of cartItems) {
    const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
    subtotal += itemTotal;
    totalItems += parseInt(item.quantity);

    // Group by band for multi-vendor calculation
    if (!bandTotals[item.band_id]) {
      bandTotals[item.band_id] = {
        band_id: item.band_id,
        subtotal: 0,
        items: []
      };
    }
    bandTotals[item.band_id].subtotal += itemTotal;
    bandTotals[item.band_id].items.push(item);
  }

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalItems,
    bandTotals: Object.values(bandTotals)
  };
}

// GET /api/cart - Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.uid;

    const query = `
      SELECT 
        ci.*,
        p.title,
        p.price,
        p.band_id,
        p.category,
        p.images,
        p.inventory_count,
        p.is_active,
        pc.name as category_name,
        CASE WHEN p.inventory_count > 0 OR p.category = 'digital' THEN true ELSE false END as in_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_categories pc ON p.category = pc.id
      WHERE ci.user_id = $1 AND p.is_active = true
      ORDER BY ci.created_at DESC
    `;

    const result = await db.query(query, [userId]);
    const cartItems = result.rows;

    // Calculate totals
    const totals = await calculateCartTotals(cartItems);

    res.json({
      success: true,
      data: {
        items: cartItems,
        ...totals
      }
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/cart/add - Add item to cart
router.post('/add', auth, validateCartItem, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { product_id, quantity, variant_selection = '{}' } = req.body;

    // Check if product exists and is active
    const productQuery = 'SELECT * FROM products WHERE id = $1 AND is_active = true';
    const productResult = await db.query(productQuery, [product_id]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or inactive'
      });
    }

    const product = productResult.rows[0];

    // Check inventory for physical products
    if (product.category !== 'digital' && product.inventory_count < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient inventory',
        available: product.inventory_count
      });
    }

    // Check if item already exists in cart with same variant
    const existingItemQuery = `
      SELECT * FROM cart_items 
      WHERE user_id = $1 AND product_id = $2 AND variant_selection = $3
    `;
    const existingItemResult = await db.query(existingItemQuery, [userId, product_id, variant_selection]);

    let cartItem;

    if (existingItemResult.rows.length > 0) {
      // Update existing item quantity
      const existingItem = existingItemResult.rows[0];
      const newQuantity = existingItem.quantity + quantity;

      // Check inventory again for new total quantity
      if (product.category !== 'digital' && product.inventory_count < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient inventory for requested quantity',
          available: product.inventory_count,
          currentInCart: existingItem.quantity
        });
      }

      const updateQuery = `
        UPDATE cart_items 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING *
      `;
      const updateResult = await db.query(updateQuery, [newQuantity, existingItem.id]);
      cartItem = updateResult.rows[0];

    } else {
      // Insert new cart item
      const insertQuery = `
        INSERT INTO cart_items (user_id, product_id, variant_selection, quantity)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const insertResult = await db.query(insertQuery, [userId, product_id, variant_selection, quantity]);
      cartItem = insertResult.rows[0];
    }

    // Get updated cart item with product details
    const cartItemQuery = `
      SELECT 
        ci.*,
        p.title,
        p.price,
        p.band_id,
        p.category,
        p.images,
        pc.name as category_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_categories pc ON p.category = pc.id
      WHERE ci.id = $1
    `;
    const cartItemResult = await db.query(cartItemQuery, [cartItem.id]);

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cartItemResult.rows[0]
    });

  } catch (error) {
    console.error('Error adding item to cart:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'Item with this variant already exists in cart'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/cart/:id - Update cart item
router.put('/:id', auth, param('id').isUUID(), validateCartUpdate, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const { quantity, variant_selection } = req.body;

    // Check if cart item exists and belongs to user
    const existingItemQuery = `
      SELECT ci.*, p.inventory_count, p.category 
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = $1 AND ci.user_id = $2
    `;
    const existingItemResult = await db.query(existingItemQuery, [id, userId]);

    if (existingItemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    const existingItem = existingItemResult.rows[0];

    // Check inventory for physical products
    if (existingItem.category !== 'digital' && existingItem.inventory_count < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient inventory',
        available: existingItem.inventory_count
      });
    }

    // Update cart item
    const updateQuery = `
      UPDATE cart_items 
      SET quantity = $1, variant_selection = COALESCE($2, variant_selection), updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [quantity, variant_selection, id, userId]);

    // Get updated cart item with product details
    const cartItemQuery = `
      SELECT 
        ci.*,
        p.title,
        p.price,
        p.band_id,
        p.category,
        p.images,
        pc.name as category_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_categories pc ON p.category = pc.id
      WHERE ci.id = $1
    `;
    const cartItemResult = await db.query(cartItemQuery, [id]);

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: cartItemResult.rows[0]
    });

  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/cart/:id - Remove item from cart
router.delete('/:id', auth, param('id').isUUID(), handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    // Check if cart item exists and belongs to user
    const existingItemQuery = 'SELECT * FROM cart_items WHERE id = $1 AND user_id = $2';
    const existingItemResult = await db.query(existingItemQuery, [id, userId]);

    if (existingItemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Delete cart item
    const deleteQuery = 'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *';
    const deleteResult = await db.query(deleteQuery, [id, userId]);

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: deleteResult.rows[0]
    });

  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove cart item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', auth, async (req, res) => {
  try {
    const userId = req.user.uid;

    const deleteQuery = 'DELETE FROM cart_items WHERE user_id = $1 RETURNING *';
    const deleteResult = await db.query(deleteQuery, [userId]);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        removedItems: deleteResult.rows.length
      }
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/cart/count - Get cart item count
router.get('/count', auth, async (req, res) => {
  try {
    const userId = req.user.uid;

    const query = `
      SELECT 
        COUNT(ci.id) as item_count,
        COALESCE(SUM(ci.quantity), 0) as total_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1 AND p.is_active = true
    `;

    const result = await db.query(query, [userId]);
    const counts = result.rows[0];

    res.json({
      success: true,
      data: {
        itemCount: parseInt(counts.item_count),
        totalQuantity: parseInt(counts.total_quantity)
      }
    });

  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/cart/validate - Validate cart items (check inventory, prices, etc.)
router.post('/validate', auth, async (req, res) => {
  try {
    const userId = req.user.uid;

    const query = `
      SELECT 
        ci.*,
        p.title,
        p.price,
        p.band_id,
        p.category,
        p.inventory_count,
        p.is_active,
        CASE WHEN p.inventory_count > 0 OR p.category = 'digital' THEN true ELSE false END as in_stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `;

    const result = await db.query(query, [userId]);
    const cartItems = result.rows;

    const validationResults = {
      valid: [],
      invalid: [],
      warnings: []
    };

    for (const item of cartItems) {
      const issues = [];

      // Check if product is still active
      if (!item.is_active) {
        issues.push('Product is no longer available');
      }

      // Check inventory for physical products
      if (item.category !== 'digital' && item.inventory_count < item.quantity) {
        if (item.inventory_count === 0) {
          issues.push('Product is out of stock');
        } else {
          issues.push(`Only ${item.inventory_count} items available (you have ${item.quantity} in cart)`);
        }
      }

      if (issues.length > 0) {
        validationResults.invalid.push({
          ...item,
          issues
        });
      } else {
        validationResults.valid.push(item);
      }
    }

    // Calculate totals for valid items only
    const totals = await calculateCartTotals(validationResults.valid);

    res.json({
      success: true,
      data: {
        ...validationResults,
        totals,
        hasIssues: validationResults.invalid.length > 0 || validationResults.warnings.length > 0
      }
    });

  } catch (error) {
    console.error('Error validating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/cart/merge - Merge guest cart with user cart (for login scenarios)
router.post('/merge', auth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { guestCartItems = [] } = req.body;

    if (!Array.isArray(guestCartItems) || guestCartItems.length === 0) {
      return res.json({
        success: true,
        message: 'No guest cart items to merge',
        data: { mergedItems: 0 }
      });
    }

    let mergedCount = 0;
    const errors = [];

    for (const guestItem of guestCartItems) {
      try {
        const { product_id, quantity, variant_selection = '{}' } = guestItem;

        // Validate product exists
        const productQuery = 'SELECT * FROM products WHERE id = $1 AND is_active = true';
        const productResult = await db.query(productQuery, [product_id]);

        if (productResult.rows.length === 0) {
          errors.push(`Product ${product_id} not found`);
          continue;
        }

        // Check if item already exists in user's cart
        const existingItemQuery = `
          SELECT * FROM cart_items 
          WHERE user_id = $1 AND product_id = $2 AND variant_selection = $3
        `;
        const existingItemResult = await db.query(existingItemQuery, [userId, product_id, variant_selection]);

        if (existingItemResult.rows.length > 0) {
          // Update existing item quantity
          const existingItem = existingItemResult.rows[0];
          const newQuantity = existingItem.quantity + quantity;

          const updateQuery = `
            UPDATE cart_items 
            SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2
          `;
          await db.query(updateQuery, [newQuantity, existingItem.id]);
        } else {
          // Insert new cart item
          const insertQuery = `
            INSERT INTO cart_items (user_id, product_id, variant_selection, quantity)
            VALUES ($1, $2, $3, $4)
          `;
          await db.query(insertQuery, [userId, product_id, variant_selection, quantity]);
        }

        mergedCount++;

      } catch (itemError) {
        console.error('Error merging cart item:', itemError);
        errors.push(`Failed to merge item: ${itemError.message}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully merged ${mergedCount} items`,
      data: {
        mergedItems: mergedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Error merging cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to merge cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
