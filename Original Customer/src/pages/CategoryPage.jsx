import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Dropdown } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import QuickViewModal from './QuickViewModal'; // Import from same folder
import './HappytailsShop.css';

const CategoryPage = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  const categoryData = {
    'nutrition-treats': {
      name: 'Nutrition & Treats',
      description: 'Healthy food and delicious treats for your pets'
    },
    'gears': {
      name: 'Gears',
      description: 'Collars, leashes, and travel accessories'
    },
    'home-comfort': {
      name: 'Home & Comfort',
      description: 'Beds, houses, and cozy essentials'
    },
    'grooming-hygiene': {
      name: 'Grooming & Hygiene',
      description: 'Shampoos, brushes, and cleaning supplies'
    },
    'enrichment': {
      name: 'Enrichment',
      description: 'Toys and puzzles for mental stimulation'
    },
    'all': {
      name: 'All Products',
      description: 'Browse all our products'
    }
  };

  const allProducts = [
    { id: 1, name: 'Premium Dog Food', price: 49.99, category: 'nutrition-treats', petType: 'Dog', image: '' },
    { id: 2, name: 'Cat Treats', price: 12.99, category: 'nutrition-treats', petType: 'Cat', image: '' },
    { id: 3, name: 'Dog Leash', price: 24.99, category: 'gears', petType: 'Dog', image: '' },
    { id: 4, name: 'Cat Collar', price: 14.99, category: 'gears', petType: 'Cat', image: '' },
    { id: 5, name: 'Cozy Pet Bed', price: 89.99, category: 'home-comfort', petType: 'Dog & Cat', image: '' },
    { id: 6, name: 'Pet Shampoo', price: 19.99, category: 'grooming-hygiene', petType: 'Dog & Cat', image: '' },
    { id: 7, name: 'Interactive Toy', price: 29.99, category: 'enrichment', petType: 'Dog', image: '' },
    { id: 8, name: 'Cat Tree', price: 149.99, category: 'home-comfort', petType: 'Cat', image: '' },
  ];

  useEffect(() => {
    let filteredProducts = [...allProducts];
    
    if (category !== 'all') {
      filteredProducts = allProducts.filter(product => product.category === category);
    }

    switch(sortBy) {
      case 'price-low-high':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    setProducts(filteredProducts);
  }, [category, sortBy]);

  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  };

  const handleAddToCart = () => {
    setCartCount(prev => prev + 1);
  };

  const currentCategory = categoryData[category] || categoryData.all;

  return (
    <Container className="ht-shop-container ht-py-5">
      <div className="ht-category-header ht-mb-4">
        <Link to="/happytails-shop" className="ht-back-link">
          <i className="bi bi-arrow-left ht-me-2"></i> Back to Shop
        </Link>
        <h1 className="ht-category-title">{currentCategory.name}</h1>
        <p className="ht-category-description">{currentCategory.description}</p>
        
        <div className="ht-cart-header-container">
          <div className="ht-cart-icon-wrapper">
            <Link to="/happytails-checkout" className="ht-cart-button">
              <i className="bi bi-cart3 ht-cart-icon"></i>
              {cartCount > 0 && (
                <span className="ht-cart-count-badge">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="ht-products-section">
        <div className="ht-sort-container">
          <h2 className="ht-section-title">Products</h2>
          <Dropdown>
            <Dropdown.Toggle variant="outline-danger" id="ht-dropdown-sort" className="ht-sort-toggle">
              <i className="bi bi-funnel ht-me-2"></i> Sort by: {sortBy === 'price-low-high' ? 'Price: Low to High' : 
              sortBy === 'price-high-low' ? 'Price: High to Low' : 'Default'}
            </Dropdown.Toggle>
            <Dropdown.Menu className="ht-dropdown-menu">
              <Dropdown.Item onClick={() => setSortBy('default')} className="ht-dropdown-item">Default</Dropdown.Item>
              <Dropdown.Item onClick={() => setSortBy('price-low-high')} className="ht-dropdown-item">Price: Low to High</Dropdown.Item>
              <Dropdown.Item onClick={() => setSortBy('price-high-low')} className="ht-dropdown-item">Price: High to Low</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <Row>
          {products.length === 0 ? (
            <Col className="ht-text-center ht-py-5">
              <p className="ht-no-products">No products found in this category.</p>
            </Col>
          ) : (
            products.map((product) => (
              <Col key={product.id} lg={3} md={4} sm={6} className="ht-mb-4">
                <Card className="ht-product-card ht-h-100">
                  <div className="ht-product-image-holder">
                    <div className="ht-image-placeholder">
                      <span>Add product photo</span>
                    </div>
                    <div className="ht-product-overlay">
                      <Button 
                        variant="danger" 
                        className="ht-btn-pink ht-me-2"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add to Cart
                      </Button>
                      <Button 
                        variant="outline-light" 
                        className="ht-quick-view-btn"
                        onClick={() => handleQuickView(product)}
                      >
                        <i className="bi bi-eye ht-me-1"></i> Quick View
                      </Button>
                    </div>
                  </div>
                  <Card.Body className="ht-card-body">
                    <Card.Title className="ht-product-title">{product.name}</Card.Title>
                    <Card.Text className="ht-product-info">
                      <span className="ht-price">${product.price.toFixed(2)}</span>
                      <span className="ht-pet-type ht-ms-3">For: {product.petType}</span>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </div>

      <QuickViewModal 
        show={showQuickView}
        handleClose={() => setShowQuickView(false)}
        product={selectedProduct}
        handleAddToCart={handleAddToCart}
      />
    </Container>
  );
};

export default CategoryPage;