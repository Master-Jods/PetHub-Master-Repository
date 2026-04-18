import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Modal, Badge, Toast, ToastContainer, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { fetchCatalogProducts } from '../backend/services/catalogService';
import { SHIPPING_OPTIONS, getShippingFee } from '../constants/fulfillment';
import './Petcafe.css';

const Petcafe = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal, 
    getCartCount,
    checkoutPreferences,
    updateCheckoutPreferences,
    formatPrice,
    showToast,
    toastMessage,
    setShowToast
  } = useCart();
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartVisible, setCartVisible] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState({});
  const shippingFee = getShippingFee(
    checkoutPreferences.fulfillmentMethod,
    checkoutPreferences.shippingOption
  );

  // Helper function to format currency with .00
  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  const menuItems = [
    {
      id: 1,
      name: "Chicken Macarons",
      category: "pet-treats",
      price: "₱230.00",
      basePrice: 230,
      petType: "dog",
      image: "/src/assets/chickenmacarons.jpg"
    },
    {
      id: 2,
      name: "Pav Jell-O Shots",
      category: "frozen-treats",
      price: "₱250.00",
      basePrice: 250,
      petType: "dog",
      image: "/src/assets/jell-o.png"
    },
    {
      id: 3,
      name: "Assorted Paw Skewers",
      category: "pet-treats",
      price: "₱200.00",
      basePrice: 200,
      petType: "dog",
      image: "/src/assets/assortedpawskewers.jpg",
    },
    {
      id: 4,
      name: "Sweet Potato Madeleines",
      category: "pet-treats",
      price: "₱220.00",
      basePrice: 220,
      petType: "dog",
      image: "/src/assets/sweetpotatomadeleines.jpg"
    },
    {
      id: 5,
      name: "Chicken Mini Cookies",
      category: "pet-treats",
      price: "₱250.00",
      basePrice: 250,
      petType: "dog",
      image: "/src/assets/chickenminicookies.jpg"
    },
    {
      id: 6,
      name: "Mackerel Muffins",
      category: "pet-treats",
      price: "₱150.00",
      basePrice: 150,
      petType: "dog",
      image: "/src/assets/mackerelmuffins.jpg"
    },
    {
      id: 7,
      name: "Dog Bento Cake",
      category: "for-dogs",
      price: "₱280.00",
      basePrice: 280,
      petType: "dog",
      image: "/src/assets/dogbento.png"
    },
    {
      id: 8,
      name: "Pupcake",
      category: "for-dogs",
      price: "₱85.00",
      basePrice: 85,
      petType: "dog",
      image: "/src/assets/pupcake.jpg",
      hasVariants: true,
      variants: [
        { id: "carrot-peanut", flavor: "Carrot with Peanut Butter", price: 85.00 },
        { id: "squash-banana", flavor: "Squash with Banana", price: 85.00 }
      ]
    },
    {
      id: 9,
      name: "Puppuccino",
      category: "frozen-treats",
      price: "₱70.00",
      basePrice: 70,
      petType: "dog",
      image: "/src/assets/puppucino.jpg"
    },
    {
      id: 10,
      name: "Pet Dognut",
      category: "for-dogs",
      price: "₱180.00",
      basePrice: 180,
      petType: "dog",
      image: "/src/assets/petdognat.png",
      hasVariants: true,
      variants: [
        { id: "chicken-liver", flavor: "Chicken Liver", price: 180.00 },
        { id: "apple-carrot", flavor: "Apple & Carrot", price: 180.00 },
        { id: "peanut-bacon", flavor: "Peanut Butter & Bacon", price: 180.00 }
      ]
    },
    {
      id: 11,
      name: "Woofle",
      category: "for-dogs",
      price: "₱50.00 - ₱70.00",
      basePrice: 50,
      petType: "dog",
      image: "/src/assets/woofle.jpg",
      hasVariants: true,
      variants: [
        { id: "plain", flavor: "Plain", price: 50.00 },
        { id: "chicken-liver", flavor: "Chicken Liver", price: 70.00 },
        { id: "moringa", flavor: "Moringa", price: 60.00 },
        { id: "pork-liver", flavor: "Pork Liver", price: 70.00 }
      ]
    },
    {
      id: 12,
      name: "Doggie Pizza",
      category: "for-dogs",
      price: "₱120.00 - ₱150.00",
      basePrice: 120,
      petType: "dog",
      image: "/src/assets/pizza.png",
      hasVariants: true,
      variants: [
        { id: "small", flavor: "Small", price: 120.00 },
        { id: "large", flavor: "Large", price: 150.00 }
      ]
    },
    {
      id: 13,
      name: "Cat Bento Cake",
      category: "for-cats",
      price: "₱290.00",
      basePrice: 290,
      petType: "cat",
      image: "/src/assets/catbento.png"
    },
    {
      id: 14,
      name: "Cat Cupcake",
      category: "for-cats",
      price: "₱95.00",
      basePrice: 95,
      petType: "cat",
      image: "/src/assets/catcupcake.jpg"
    },
    {
      id: 15,
      name: "Pet Party Hat",
      category: "all",
      price: "₱35.00",
      basePrice: 35,
      petType: "all",
      image: "/src/assets/partyhat.png"
    },
    {
      id: 16,
      name: "Pet Banner Set",
      category: "all",
      price: "₱250.00",
      basePrice: 250,
      petType: "all",
      image: "/src/assets/banner.png"
    },
    {
      id: 17,
      name: "Colored Candle",
      category: "all",
      price: "₱5.00",
      basePrice: 5,
      petType: "all",
      image: "/src/assets/candle.jpg"
    },
    {
      id: 18,
      name: "Number Candle",
      category: "all",
      price: "₱18.00",
      basePrice: 18,
      petType: "all",
      image: "/src/assets/numbercandle.jpg"
    },
    {
      id: 19,
      name: "Pawgurts Frozen Yogurt",
      category: "frozen-treats",
      price: "₱150.00",
      basePrice: 150,
      petType: "dog",
      image: "/src/assets/pawgurts.png",
      hasVariants: true,
      variants: [
        { id: "mango", flavor: "Mango", price: 150.00 },
        { id: "cucumber", flavor: "Cucumber", price: 150.00 },
        { id: "sweet-potato", flavor: "Sweet Potato", price: 150.00 },
        { id: "apple", flavor: "Apple", price: 150.00 },
        { id: "banana", flavor: "Banana", price: 150.00 },
        { id: "peanut-butter", flavor: "Peanut Butter", price: 150.00 },
        { id: "strawberry", flavor: "Strawberry", price: 150.00 }
      ]
    },
    {
      id: 20,
      name: "Paw Skewers Tofu",
      category: "pet-treats",
      price: "₱200.00",
      basePrice: 200,
      petType: "dog",
      image: "/src/assets/pawskewerstofu.jpg",
    },
    {
      id: 21,
      name: "Paw Skewers Kwek-Kwek",
      category: "pet-treats",
      price: "₱250.00",
      basePrice: 250,
      petType: "dog",
      image: "/src/assets/pawskewerskwekkwek.jpg",
    }
  ];

  const [menuCatalog, setMenuCatalog] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const categories = [
    { id: 'all', name: 'View All' },
    { id: 'for-dogs', name: 'For Dogs' },
    { id: 'for-cats', name: 'For Cats' },
    { id: 'pet-treats', name: 'Pet Treats' },
    { id: 'frozen-treats', name: 'Frozen Treats' }
  ];

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError('');

      try {
        const nextItems = await fetchCatalogProducts('Pet Menu');
        if (!active) return;
        setMenuCatalog(nextItems);
      } catch (_error) {
        if (!active) return;
        setMenuCatalog([]);
        setCatalogError('Hindi namin ma-load ang latest Pet Menu items ngayon. Pakisubukan ulit maya-maya.');
      } finally {
        if (active) {
          setCatalogLoading(false);
        }
      }
    };

    loadCatalog();

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        void loadCatalog();
      }
    };
    const poller = window.setInterval(() => {
      void loadCatalog();
    }, 120000);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      active = false;
      window.clearInterval(poller);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, []);

  useEffect(() => {
    let filtered = [...menuCatalog];
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    if (searchTerm.trim()) {
      const keyword = searchTerm.toLowerCase();
      filtered = filtered.filter(item => item.name.toLowerCase().includes(keyword));
    }
    setFilteredItems(filtered);
  }, [activeCategory, searchTerm, menuCatalog]);

  const handleCategoryClick = (categoryId) => setActiveCategory(categoryId);

  const handleVariantSelect = (itemId, variantId) => {
    setSelectedVariant(prev => ({ ...prev, [itemId]: variantId }));
  };

  const getSelectedVariantName = (item) => {
    if (!item.variants || item.variants.length === 0) return 'Standard';
    const selectedId = selectedVariant[item.id] || item.variants[0].id;
    const v = item.variants.find(x => x.id === selectedId);
    return v ? (v.flavor || v.type || v.color || v.size) : 'Standard';
  };

  const getDisplayPrice = (item) => {
    if (item.price) return item.price;

    if (item.variants?.length) {
      const prices = item.variants.map(v => v.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (minPrice === maxPrice) {
        return `₱${minPrice.toFixed(2)}`;
      }
      return `₱${minPrice.toFixed(2)} - ₱${maxPrice.toFixed(2)}`;
    }

    return `₱${item.basePrice.toFixed(2)}`;
  };

  return (
    <div className="petcafe-container">
      {/* Hero Section */}
      <div className="petcafe-hero">
        <div className="petcafe-hero-background">
          <div
            className="petcafe-background-image"
            style={{ backgroundImage: "url('/src/assets/petcafee.jpg')" }}
          />
          <div className="petcafe-background-overlay"></div>
        </div>

        <div className="petcafe-hero-content">
          <div className="petcafe-hero-container">
            <div className="petcafe-hero-text-section">
              <h1 className="petcafe-hero-title">Pet Menu</h1>
              <p className="petcafe-hero-subtitle">
                More than just a café—it's a paws-itive space where pets can munch, sip,
                and wag their tails in a cozy, feel-good atmosphere.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="petcafe-content-section">
        <Container className="petcafe-menu-container">
          {/* Cart Button */}
          <Button className="petcafe-cart-btn" onClick={() => setCartVisible(true)}>
            <i className="fas fa-shopping-cart"></i> Cart ({getCartCount()})
          </Button>

          {/* Toast */}
          <div className="petcafe-toast-wrapper">
            <ToastContainer position="top-center" className="petcafe-toast-container">
              <Toast
                show={showToast}
                onClose={() => setShowToast(false)}
                delay={3000}
                autohide
                className="petcafe-toast"
              >
                <Toast.Header className="petcafe-toast-header">
                  <strong className="me-auto">Added to Cart</strong>
                </Toast.Header>
                <Toast.Body className="petcafe-toast-body">{toastMessage}</Toast.Body>
              </Toast>
            </ToastContainer>
          </div>

          {/* Search + Filter */}
          <div className="petcafe-categories-container">
            <div className="petcafe-filter-intro">
              <h3>Find your pet's next favorite treat</h3>
              <p>Search by menu name or quickly narrow results using the dropdown filter.</p>
            </div>
            <div className="petcafe-filter-row">
              <div className="petcafe-filter-field">
                <input
                  id="petcafe-search"
                  type="text"
                  className="petcafe-search-input"
                  placeholder="Search pet menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="petcafe-filter-field">
                <select
                  id="petcafe-category"
                  className="petcafe-filter-select"
                  value={activeCategory}
                  onChange={(e) => handleCategoryClick(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {catalogError && (
            <div className="petcafe-no-results">
              <p>{catalogError}</p>
            </div>
          )}

          {/* Items Grid */}
          <div className="petcafe-menu-grid">
            {catalogLoading ? (
              <div className="petcafe-no-results">
                <p>Loading Pet Menu items...</p>
              </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map(item => {
                const displayPrice = getDisplayPrice(item);
                const variantName = getSelectedVariantName(item);
                const isOutOfStock = Number(item.stock || 0) <= 0;

                return (
                  <div key={item.id} className="petcafe-item-col d-flex justify-content-center">
                    <Card className="petcafe-item-card">
                      <div className="petcafe-item-image">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="petcafe-item-img"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80";
                          }}
                        />
                      </div>

                      <Card.Body className="petcafe-item-body">
                        <div className="petcafe-item-badge">
                          <Badge
                            bg={
                              item.petType === 'dog'
                                ? 'primary'
                                : item.petType === 'cat'
                                  ? 'warning'
                                  : 'success'
                            }
                          >
                            {item.petType === 'all' ? 'All Pets' : item.petType === 'dog' ? 'Dog' : item.petType === 'cat' ? 'Cat' : item.petType}
                          </Badge>
                        </div>

                        <h5 className="petcafe-item-name">{item.name}</h5>

                        {/* Variant Selector */}
                        {item.variants?.length > 0 && (
                          <div className="petcafe-variant-selector">
                            <Dropdown className="petcafe-variant-dropdown">
                              <Dropdown.Toggle
                                variant="outline-secondary"
                                className="petcafe-variant-toggle"
                              >
                                {variantName}
                              </Dropdown.Toggle>

                              <Dropdown.Menu>
                                {item.variants.map(variant => (
                                  <Dropdown.Item
                                    key={variant.id}
                                    onClick={() => handleVariantSelect(item.id, variant.id)}
                                    className={selectedVariant[item.id] === variant.id ? 'active' : ''}
                                  >
                                    {(variant.flavor || variant.type || variant.color || variant.size)} - {formatCurrency(variant.price)}
                                  </Dropdown.Item>
                                ))}
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        )}

                        <p className="petcafe-item-price">{displayPrice}</p>
                        <div className="petcafe-item-sold">
                          <i className="fas fa-fire"></i> {Number(item.sold || 0).toLocaleString()} sold
                        </div>

                        <div className="petcafe-item-buttons">
                          <Button
                            className="petcafe-add-cart-btn"
                            disabled={isOutOfStock}
                            onClick={() => addToCart(item, selectedVariant[item.id])}
                          >
                            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                );
              })
            ) : (
              <div className="petcafe-no-results">
                <p>No menu items found. Try another search or filter.</p>
              </div>
            )}
          </div>
        </Container>
      </div>

      {/* Cart Modal */}
      <Modal
        show={cartVisible}
        onHide={() => setCartVisible(false)}
        dialogClassName="petcafe-cart-modal"
      >
        <Modal.Header closeButton className="petcafe-cart-header">
          <Modal.Title>
            <i className="fas fa-shopping-cart"></i> Your Cafe Cart ({getCartCount()})
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="petcafe-cart-body">
          {cart.length === 0 ? (
            <div className="petcafe-empty-cart">
              <div className="petcafe-empty-cart-icon">
                <i className="fas fa-mug-hot"></i>
              </div>
              <p>Your cart is empty</p>
              <p className="petcafe-empty-cart-sub">Add some tasty treats for your pet!</p>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={`${item.id}-${item.variantId}`} className="petcafe-cart-item">
                  <div className="petcafe-cart-item-image">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="petcafe-cart-item-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80";
                      }}
                    />
                  </div>

                  <div className="petcafe-cart-item-details">
                    <h6>{item.name}</h6>

                    {item.variantName && item.variantName !== 'Standard' && (
                      <p className="petcafe-cart-variant">{item.variantName}</p>
                    )}

                    <p className="petcafe-cart-item-price">{formatCurrency(item.price)} each</p>

                    <div className="petcafe-cart-quantity">
                      <Button
                        className="petcafe-cart-quantity-btn"
                        onClick={() => updateQuantity(item.id, item.variantId, -1)}
                      >
                        -
                      </Button>
                      <span className="petcafe-cart-quantity-value">{item.quantity}</span>
                      <Button
                        className="petcafe-cart-quantity-btn"
                        onClick={() => updateQuantity(item.id, item.variantId, 1)}
                        disabled={Number(item.quantity || 0) >= Number(item.stock || 0)}
                      >
                        +
                      </Button>
                    </div>

                    <p className="petcafe-cart-item-total">
                      Total: {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>

                  <div className="petcafe-cart-item-actions">
                    <Button
                      className="petcafe-remove-item-btn"
                      onClick={() => removeFromCart(item.id, item.variantId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <div className="petcafe-cart-total-section">
                <div className="petcafe-cart-fulfillment-box">
                  <p className="petcafe-cart-fulfillment-title">Fulfillment Method</p>
                  <div className="petcafe-cart-fulfillment-options">
                    <label>
                      <input
                        type="radio"
                        name="petcafeFulfillmentMethod"
                        checked={checkoutPreferences.fulfillmentMethod === 'pickup'}
                        onChange={() =>
                          updateCheckoutPreferences({
                            fulfillmentMethod: 'pickup',
                            shippingOption: ''
                          })
                        }
                      />
                      <span>Store Pickup</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="petcafeFulfillmentMethod"
                        checked={checkoutPreferences.fulfillmentMethod === 'delivery'}
                        onChange={() =>
                          updateCheckoutPreferences({
                            fulfillmentMethod: 'delivery'
                          })
                        }
                      />
                      <span>Delivery</span>
                    </label>
                  </div>

                  {checkoutPreferences.fulfillmentMethod === 'delivery' && (
                    <select
                      className="petcafe-cart-shipping-select"
                      value={checkoutPreferences.shippingOption}
                      onChange={(e) =>
                        updateCheckoutPreferences({
                          shippingOption: e.target.value
                        })
                      }
                    >
                      {SHIPPING_OPTIONS.map((option) => (
                        <option key={option.value || 'placeholder'} value={option.value}>
                          {option.label}{option.fee ? ` - ${formatCurrency(option.fee)}` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  <p className="petcafe-cart-shipping-preview">
                    Shipping Fee: {checkoutPreferences.fulfillmentMethod === 'pickup' ? 'Free' : formatCurrency(shippingFee)}
                  </p>
                </div>
                <div className="petcafe-cart-grand-total">
                  <h5>Order Total: {formatCurrency(getCartTotal() + shippingFee)}</h5>
                </div>
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="petcafe-cart-footer">
          <Button
            variant="secondary"
            onClick={() => setCartVisible(false)}
            className="petcafe-continue-shopping"
          >
            Continue Browsing
          </Button>

          {cart.length > 0 && (
            <Button
              className="petcafe-checkout-btn"
              onClick={() => {
                setCartVisible(false);
                navigate('/checkout');
              }}
            >
              Proceed to Checkout ({formatCurrency(getCartTotal() + shippingFee)})
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Petcafe;
