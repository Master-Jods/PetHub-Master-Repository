import React, { useState } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import '../pages/HappytailsShop.css';

const QuickViewModal = ({ show, handleClose, product, handleAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleAddToCartClick = () => {
    handleAddToCart(product, quantity);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered className="ht-quick-view-modal">
      <Modal.Header className="ht-modal-header">
        <Modal.Title className="ht-modal-title">Product Details</Modal.Title>
        <Button variant="link" onClick={handleClose} className="ht-close-btn">
          <i className="bi bi-x-lg"></i>
        </Button>
      </Modal.Header>
      <Modal.Body className="ht-modal-body">
        <Row>
          <Col md={6} className="ht-modal-image-col">
            <div className="ht-modal-image-placeholder">
              <span>Product Image Here</span>
            </div>
          </Col>
          <Col md={6} className="ht-modal-details-col">
            <h3 className="ht-product-modal-title">{product.name}</h3>
            <p className="ht-product-modal-description">
              High-quality product for your beloved pet. Made with safe materials.
            </p>
            
            <div className="ht-detail-item">
              <strong className="ht-detail-label">Category:</strong>
              <span className="ht-detail-value"> {product.category.replace('-', ' ')}</span>
            </div>
            
            <div className="ht-detail-item">
              <strong className="ht-detail-label">For:</strong>
              <span className="ht-detail-value"> {product.petType}</span>
            </div>
            
            <div className="ht-detail-item">
              <strong className="ht-detail-label">Price:</strong>
              <span className="ht-price-modal"> ${product.price.toFixed(2)}</span>
            </div>
            
            <div className="ht-quantity-container ht-mt-4">
              <strong className="ht-quantity-label">Quantity:</strong>
              <div className="ht-quantity-controls">
                <Button variant="outline-secondary" onClick={decreaseQuantity} className="ht-quantity-btn">
                  <i className="bi bi-dash"></i>
                </Button>
                <span className="ht-quantity-display">{quantity}</span>
                <Button variant="outline-secondary" onClick={increaseQuantity} className="ht-quantity-btn">
                  <i className="bi bi-plus"></i>
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer className="ht-modal-footer">
        <Button variant="outline-secondary" onClick={handleClose} className="ht-btn-secondary">
          Close
        </Button>
        <Button variant="danger" onClick={handleAddToCartClick} className="ht-btn-pink">
          Add to Cart (${(product.price * quantity).toFixed(2)})
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QuickViewModal;