import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../backend/context/AuthContext';
import { SHIPPING_OPTIONS, getShippingFee } from '../constants/fulfillment';

const CartModal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getCartCount,
    checkoutPreferences,
    updateCheckoutPreferences,
    cartVisible,
    setCartVisible
  } = useCart();

  const formatCurrency = (amount) => `₱${Number(amount || 0).toFixed(2)}`;
  const shippingFee = getShippingFee(checkoutPreferences.fulfillmentMethod, checkoutPreferences.shippingOption);

  return (
    <Modal 
      show={cartVisible} 
      onHide={() => setCartVisible(false)}
      dialogClassName="happy-tails-cart-modal"
    >
      <Modal.Header closeButton className="happy-tails-cart-header">
        <Modal.Title>
          <i className="fas fa-shopping-cart"></i> Your Cart ({getCartCount()})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="happy-tails-cart-body">
        {cart.length === 0 ? (
          <div className="happy-tails-empty-cart">
            <div className="happy-tails-empty-cart-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <p>Your cart is empty</p>
            <Button 
              className="happy-tails-start-shopping"
              onClick={() => {
                setCartVisible(false);
                navigate('/shop');
              }}
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            {cart.map(item => (
              <div key={`${item.id}-${item.variantId}`} className="happy-tails-cart-item">
                <div className="happy-tails-cart-item-image">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="happy-tails-cart-item-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/80x80/ffe6f2/f53799?text=Product";
                    }}
                  />
                </div>
                <div className="happy-tails-cart-item-details">
                  <h6>{item.name}</h6>
                  {item.variantName && item.variantName !== 'Standard' && (
                    <p className="happy-tails-cart-variant">{item.variantName}</p>
                  )}
                  <p className="happy-tails-cart-item-price">
                    {formatCurrency(item.price)} each
                  </p>
                  <div className="happy-tails-cart-quantity">
                    <Button 
                      className="happy-tails-cart-quantity-btn"
                      onClick={() => updateQuantity(item.id, item.variantId, -1)}
                    >
                      -
                    </Button>
                    <span className="happy-tails-cart-quantity-value">{item.quantity}</span>
                    <Button 
                      className="happy-tails-cart-quantity-btn"
                      onClick={() => updateQuantity(item.id, item.variantId, 1)}
                      disabled={!item.isCafeItem && Number(item.quantity || 0) >= Number(item.stock || 0)}
                    >
                      +
                    </Button>
                  </div>
                  <p className="happy-tails-cart-item-total">
                    Item Total: {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
                <div className="happy-tails-cart-item-actions">
                  <Button 
                    variant="danger"
                    size="sm"
                    className="happy-tails-remove-item-btn"
                    onClick={() => removeFromCart(item.id, item.variantId)}
                  >
                    Remove
                  </Button>
                  <Button 
                    variant="link"
                    className="happy-tails-remove-item-icon"
                    onClick={() => removeFromCart(item.id, item.variantId)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </div>
            ))}
            <div className="happy-tails-cart-total-section">
              <div className="happy-tails-cart-fulfillment-box">
                <p className="happy-tails-cart-fulfillment-title">Fulfillment Method</p>
                <div className="happy-tails-cart-fulfillment-options">
                  <Form.Check
                    type="radio"
                    id="shop-pickup-option"
                    name="shopFulfillmentMethod"
                    label="Store Pickup"
                    checked={checkoutPreferences.fulfillmentMethod === 'pickup'}
                    onChange={() =>
                      updateCheckoutPreferences({
                        fulfillmentMethod: 'pickup',
                        shippingOption: ''
                      })
                    }
                  />
                  <Form.Check
                    type="radio"
                    id="shop-delivery-option"
                    name="shopFulfillmentMethod"
                    label="Delivery"
                    checked={checkoutPreferences.fulfillmentMethod === 'delivery'}
                    onChange={() =>
                      updateCheckoutPreferences({
                        fulfillmentMethod: 'delivery'
                      })
                    }
                  />
                </div>
                {checkoutPreferences.fulfillmentMethod === 'delivery' && (
                  <Form.Select
                    className="happy-tails-cart-shipping-select"
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
                  </Form.Select>
                )}
                <p className="happy-tails-cart-shipping-preview">
                  Shipping Fee: {checkoutPreferences.fulfillmentMethod === 'pickup' ? 'Free' : formatCurrency(shippingFee)}
                </p>
              </div>
              <div className="happy-tails-cart-grand-total">
                <h5>Total: {formatCurrency(getCartTotal() + shippingFee)}</h5>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="happy-tails-cart-footer">
        <Button 
          variant="secondary" 
          onClick={() => setCartVisible(false)}
          className="happy-tails-continue-shopping"
        >
          Continue Shopping
        </Button>
        {cart.length > 0 && (
          <Button 
            className="happy-tails-checkout-btn"
            onClick={() => {
              setCartVisible(false);
              navigate('/checkout');
            }}
          >
            Checkout
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CartModal;
