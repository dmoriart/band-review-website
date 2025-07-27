import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './StorePage.css';

// Types
interface Product {
  id: string;
  band_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  inventory_count: number;
  images: string[];
  variants: {
    sizes?: string[];
    colors?: string[];
    formats?: string[];
  };
  digital_file_url?: string;
  is_active: boolean;
  is_featured: boolean;
  weight_grams: number;
  tags: string[];
  seo_slug: string;
  created_at: string;
  category_name?: string;
  average_rating?: number;
  review_count?: number;
  in_stock?: boolean;
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  sort_order: number;
}

interface CartItem {
  id: string;
  product_id: string;
  variant_selection: Record<string, string>;
  quantity: number;
  product?: Product;
}

interface StorePageProps {
  onProductClick: (product: Product) => void;
  onCartClick: () => void;
  cartItemCount: number;
}

const StorePage: React.FC<StorePageProps> = ({ onProductClick, onCartClick, cartItemCount }) => {
  const { user } = useAuth();
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // API base URL - using merchandise server
  const API_BASE_URL = 'http://localhost:5000/api';

  /**
   * Fetch products from API
   */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);
      if (priceRange) {
        const [min, max] = priceRange.split('-');
        if (min) params.append('min_price', min);
        if (max) params.append('max_price', max);
      }
      if (showFeaturedOnly) params.append('featured', 'true');

      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Make sure the merchandise server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch product categories
   */
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, priceRange, showFeaturedOnly]);

  /**
   * Add product to cart
   */
  const addToCart = async (product: Product, variantSelection: Record<string, string> = {}) => {
    if (!user) {
      alert('Please sign in to add items to your cart');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
          variant_selection: variantSelection
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      alert('Added to cart!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    }
  };

  /**
   * Format price in EUR
   */
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  /**
   * Get category icon
   */
  const getCategoryIcon = (categoryId: string) => {
    const icons: Record<string, string> = {
      'cd': '💿',
      'vinyl': '📀',
      'tshirt': '👕',
      'hoodie': '🧥',
      'poster': '🖼️',
      'sticker': '🏷️',
      'digital': '💾',
      'other': '🎁'
    };
    return icons[categoryId] || '🛍️';
  };

  /**
   * Render product card
   */
  const renderProductCard = (product: Product) => (
    <div key={product.id} className="product-card">
      <div className="product-image-container">
        {product.images && product.images.length > 0 ? (
          <img 
            src={product.images[0]} 
            alt={product.title}
            className="product-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.png';
            }}
          />
        ) : (
          <div className="product-image-placeholder">
            {getCategoryIcon(product.category)}
          </div>
        )}
        
        {product.is_featured && (
          <div className="featured-badge">⭐ Featured</div>
        )}
        
        {!product.in_stock && product.category !== 'digital' && (
          <div className="out-of-stock-badge">Out of Stock</div>
        )}
      </div>

      <div className="product-info">
        <div className="product-category">
          {getCategoryIcon(product.category)} {product.category_name || product.category}
        </div>
        
        <h3 className="product-title">{product.title}</h3>
        
        <p className="product-description">
          {product.description?.substring(0, 100)}
          {product.description && product.description.length > 100 && '...'}
        </p>
        
        <div className="product-price">
          {formatPrice(product.price)}
        </div>

        {product.average_rating && product.review_count ? (
          <div className="product-rating">
            {'⭐'.repeat(Math.floor(product.average_rating))} 
            ({product.review_count} reviews)
          </div>
        ) : (
          <div className="product-rating">No reviews yet</div>
        )}

        {product.variants && (Object.keys(product.variants).length > 0) && (
          <div className="product-variants">
            {product.variants.sizes && (
              <span className="variant-info">Sizes: {product.variants.sizes.join(', ')}</span>
            )}
            {product.variants.colors && (
              <span className="variant-info">Colors: {product.variants.colors.join(', ')}</span>
            )}
          </div>
        )}

        <div className="product-actions">
          <button 
            className="btn btn-primary view-product"
            onClick={() => onProductClick(product)}
          >
            View Details
          </button>
          
          {(product.in_stock || product.category === 'digital') && (
            <button 
              className="btn btn-secondary add-to-cart"
              onClick={() => addToCart(product)}
              disabled={!user}
            >
              {user ? 'Add to Cart' : 'Sign In to Buy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="store-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page">
      {/* Store Header */}
      <div className="store-header">
        <div className="store-title-section">
          <h1>🛍️ Band Merchandise Store</h1>
          <p>Support Irish bands by buying their merchandise directly</p>
        </div>
        
        <div className="cart-summary">
          <button className="cart-button" onClick={onCartClick}>
            🛒 Cart ({cartItemCount})
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
          <div className="error-help">
            <p>To fix this:</p>
            <ol>
              <li>Make sure you've set up the database using the SQL script</li>
              <li>Start the merchandise server: <code>cd backend && node src/server-merchandise.js</code></li>
              <li>Server should be running on <a href="http://localhost:5000" target="_blank" rel="noopener noreferrer">http://localhost:5000</a></li>
            </ol>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="store-filters">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {getCategoryIcon(category.id)} {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
            aria-label="Sort products"
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
          </select>

          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="filter-select"
            aria-label="Filter by price range"
          >
            <option value="">All Prices</option>
            <option value="0-10">€0 - €10</option>
            <option value="10-25">€10 - €25</option>
            <option value="25-50">€25 - €50</option>
            <option value="50-100">€50 - €100</option>
            <option value="100-">€100+</option>
          </select>

          <label className="featured-filter">
            <input
              type="checkbox"
              checked={showFeaturedOnly}
              onChange={(e) => setShowFeaturedOnly(e.target.checked)}
            />
            Featured Only
          </label>
        </div>

        {/* Clear Filters */}
        {(selectedCategory || searchQuery || sortBy !== 'newest' || priceRange || showFeaturedOnly) && (
          <button 
            className="clear-filters"
            onClick={() => {
              setSelectedCategory('');
              setSearchQuery('');
              setSortBy('newest');
              setPriceRange('');
              setShowFeaturedOnly(false);
            }}
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Category Quick Links */}
      <div className="category-quick-links">
        <h3>Shop by Category</h3>
        <div className="category-buttons">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
            >
              {getCategoryIcon(category.id)} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-section">
        <div className="products-header">
          <h2>
            {selectedCategory 
              ? `${categories.find(c => c.id === selectedCategory)?.name || 'Products'}`
              : 'All Products'
            }
          </h2>
          <div className="products-count">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {products.length > 0 ? (
          <div className="products-grid">
            {products.map(renderProductCard)}
          </div>
        ) : (
          <div className="no-products">
            <div className="no-products-icon">🛍️</div>
            <h3>No products found</h3>
            <p>
              {error 
                ? 'Unable to load products. Please check the server connection.'
                : searchQuery || selectedCategory || priceRange || showFeaturedOnly
                  ? 'Try adjusting your filters to see more products.'
                  : 'No products are currently available. Check back soon!'
              }
            </p>
            {!error && (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setSelectedCategory('');
                  setSearchQuery('');
                  setSortBy('newest');
                  setPriceRange('');
                  setShowFeaturedOnly(false);
                }}
              >
                View All Products
              </button>
            )}
          </div>
        )}
      </div>

      {/* Store Info */}
      <div className="store-info">
        <div className="info-section">
          <h3>🇮🇪 Supporting Irish Music</h3>
          <p>Every purchase directly supports Irish bands and helps grow our local music scene.</p>
        </div>
        
        <div className="info-section">
          <h3>🚚 Irish Shipping</h3>
          <p>Fast delivery across Ireland with An Post. Free shipping on orders over €50.</p>
        </div>
        
        <div className="info-section">
          <h3>💳 Secure Payments</h3>
          <p>Safe and secure payments powered by Stripe. Your payment information is protected.</p>
        </div>
      </div>
    </div>
  );
};

export default StorePage;
