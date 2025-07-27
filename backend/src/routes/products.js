const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const db = require('../database/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation middleware
const validateProduct = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['cd', 'vinyl', 'tshirt', 'hoodie', 'poster', 'sticker', 'digital', 'other']).withMessage('Invalid category'),
  body('inventory_count').optional().isInt({ min: 0 }).withMessage('Inventory count must be a non-negative integer'),
  body('variants').optional().isJSON().withMessage('Variants must be valid JSON'),
  body('weight_grams').optional().isInt({ min: 0 }).withMessage('Weight must be a non-negative integer'),
  body('dimensions').optional().isJSON().withMessage('Dimensions must be valid JSON'),
  body('tags').optional().isJSON().withMessage('Tags must be valid JSON'),
  body('is_featured').optional().isBoolean().withMessage('is_featured must be a boolean')
];

const validateProductQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['cd', 'vinyl', 'tshirt', 'hoodie', 'poster', 'sticker', 'digital', 'other']).withMessage('Invalid category'),
  query('band_id').optional().trim().isLength({ min: 1 }).withMessage('Band ID cannot be empty'),
  query('min_price').optional().isFloat({ min: 0 }).withMessage('Min price must be non-negative'),
  query('max_price').optional().isFloat({ min: 0 }).withMessage('Max price must be non-negative'),
  query('search').optional().trim().isLength({ max: 255 }).withMessage('Search term too long'),
  query('sort').optional().isIn(['newest', 'oldest', 'price_asc', 'price_desc', 'title_asc', 'title_desc', 'featured']).withMessage('Invalid sort option'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean')
];

// Helper function to generate SEO slug
function generateSlug(title, bandId) {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
  
  return `${baseSlug}-${Date.now()}`;
}

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

// GET /api/products - List products with filtering and pagination
router.get('/', validateProductQuery, handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      band_id,
      min_price,
      max_price,
      search,
      sort = 'newest',
      featured
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['p.is_active = true'];
    let queryParams = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`p.category = $${paramIndex++}`);
      queryParams.push(category);
    }

    if (band_id) {
      whereConditions.push(`p.band_id = $${paramIndex++}`);
      queryParams.push(band_id);
    }

    if (min_price) {
      whereConditions.push(`p.price >= $${paramIndex++}`);
      queryParams.push(parseFloat(min_price));
    }

    if (max_price) {
      whereConditions.push(`p.price <= $${paramIndex++}`);
      queryParams.push(parseFloat(max_price));
    }

    if (search) {
      whereConditions.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.tags::text ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (featured === 'true') {
      whereConditions.push('p.is_featured = true');
    }

    // Build ORDER BY clause
    let orderBy = 'p.created_at DESC';
    switch (sort) {
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'title_asc':
        orderBy = 'p.title ASC';
        break;
      case 'title_desc':
        orderBy = 'p.title DESC';
        break;
      case 'featured':
        orderBy = 'p.is_featured DESC, p.created_at DESC';
        break;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Main query with product catalog view
    const query = `
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
      ${whereClause}
      GROUP BY p.id, pc.name, pc.description
      ORDER BY ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(parseInt(limit), offset);

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN product_categories pc ON p.category = pc.id
      ${whereClause}
    `;

    const [productsResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset params
    ]);

    const products = productsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        products,
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
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', param('id').isUUID().withMessage('Invalid product ID'), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
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
      WHERE p.id = $1 AND p.is_active = true
      GROUP BY p.id, pc.name, pc.description
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = result.rows[0];

    // Get recent reviews
    const reviewsQuery = `
      SELECT 
        pr.*,
        CASE WHEN pr.user_id IS NOT NULL THEN 'Anonymous User' ELSE 'Guest' END as reviewer_name
      FROM product_reviews pr
      WHERE pr.product_id = $1 AND pr.is_approved = true
      ORDER BY pr.created_at DESC
      LIMIT 5
    `;

    const reviewsResult = await db.query(reviewsQuery, [id]);

    res.json({
      success: true,
      data: {
        ...product,
        recent_reviews: reviewsResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/products - Create new product (requires authentication)
router.post('/', auth, upload.array('images', 10), validateProduct, handleValidationErrors, async (req, res) => {
  try {
    const {
      band_id,
      title,
      description,
      price,
      category,
      inventory_count = 0,
      variants = '{}',
      weight_grams = 0,
      dimensions = '{}',
      tags = '[]',
      is_featured = false,
      digital_file_url
    } = req.body;

    // Verify user has permission to create products for this band
    // This would typically check if the authenticated user owns/manages the band
    // For now, we'll assume the band_id is valid

    // Process uploaded images
    const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

    // Generate SEO slug
    const seo_slug = generateSlug(title, band_id);

    // Validate digital file for digital products
    if (category === 'digital' && !digital_file_url) {
      return res.status(400).json({
        success: false,
        message: 'Digital products must have a digital file URL'
      });
    }

    const query = `
      INSERT INTO products (
        band_id, title, description, price, category, inventory_count,
        images, variants, digital_file_url, weight_grams, dimensions,
        tags, seo_slug, is_featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      band_id,
      title,
      description,
      parseFloat(price),
      category,
      parseInt(inventory_count),
      JSON.stringify(images),
      variants,
      digital_file_url,
      parseInt(weight_grams),
      dimensions,
      tags,
      seo_slug,
      is_featured
    ];

    const result = await db.query(query, values);
    const product = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      });
    }

    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'A product with this slug already exists for this band'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/products/:id - Update product (requires authentication)
router.put('/:id', auth, param('id').isUUID(), upload.array('images', 10), validateProduct, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      category,
      inventory_count,
      variants = '{}',
      weight_grams = 0,
      dimensions = '{}',
      tags = '[]',
      is_featured = false,
      digital_file_url,
      existing_images = '[]' // Images to keep from previous upload
    } = req.body;

    // Check if product exists and user has permission
    const existingProduct = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // TODO: Add permission check for band ownership

    // Process images
    let images = [];
    try {
      images = JSON.parse(existing_images);
    } catch (e) {
      images = [];
    }

    // Add new uploaded images
    if (req.files) {
      const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
      images = [...images, ...newImages];
    }

    // Limit to max 10 images
    images = images.slice(0, 10);

    const query = `
      UPDATE products SET
        title = $2,
        description = $3,
        price = $4,
        category = $5,
        inventory_count = $6,
        images = $7,
        variants = $8,
        digital_file_url = $9,
        weight_grams = $10,
        dimensions = $11,
        tags = $12,
        is_featured = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      id,
      title,
      description,
      parseFloat(price),
      category,
      parseInt(inventory_count),
      JSON.stringify(images),
      variants,
      digital_file_url,
      parseInt(weight_grams),
      dimensions,
      tags,
      is_featured
    ];

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/products/:id - Delete product (requires authentication)
router.delete('/:id', auth, param('id').isUUID(), handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists and user has permission
    const existingProduct = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // TODO: Add permission check for band ownership

    // Soft delete by setting is_active to false
    const query = 'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/products/categories - Get product categories
router.get('/categories', async (req, res) => {
  try {
    const query = 'SELECT * FROM product_categories WHERE is_active = true ORDER BY sort_order, name';
    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/products/band/:bandId - Get products for specific band
router.get('/band/:bandId', validateProductQuery, handleValidationErrors, async (req, res) => {
  try {
    const { bandId } = req.params;
    const {
      page = 1,
      limit = 20,
      category,
      sort = 'newest'
    } = req.query;

    const offset = (page - 1) * limit;
    
    let whereConditions = ['p.is_active = true', 'p.band_id = $1'];
    let queryParams = [bandId];
    let paramIndex = 2;

    if (category) {
      whereConditions.push(`p.category = $${paramIndex++}`);
      queryParams.push(category);
    }

    // Build ORDER BY clause
    let orderBy = 'p.created_at DESC';
    switch (sort) {
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'title_asc':
        orderBy = 'p.title ASC';
        break;
      case 'title_desc':
        orderBy = 'p.title DESC';
        break;
      case 'featured':
        orderBy = 'p.is_featured DESC, p.created_at DESC';
        break;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT 
        p.*,
        pc.name as category_name,
        COALESCE(AVG(pr.rating), 0) as average_rating,
        COUNT(pr.id) as review_count,
        CASE WHEN p.inventory_count > 0 OR p.category = 'digital' THEN true ELSE false END as in_stock
      FROM products p
      LEFT JOIN product_categories pc ON p.category = pc.id
      LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = true
      ${whereClause}
      GROUP BY p.id, pc.name
      ORDER BY ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(parseInt(limit), offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;

    const [productsResult, countResult] = await Promise.all([
      db.query(query, queryParams),
      db.query(countQuery, queryParams.slice(0, -2))
    ]);

    const products = productsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        products,
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
    console.error('Error fetching band products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch band products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
