import React, { createContext, useState, useContext, useEffect } from 'react';
import { DEFAULT_FULFILLMENT } from '../constants/fulfillment';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [checkoutPreferences, setCheckoutPreferences] = useState(DEFAULT_FULFILLMENT);

  // Load cart from localStorage on initial mount
  useEffect(() => {
    const savedCart = localStorage.getItem('happyTailsCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    const savedPreferences = localStorage.getItem('happyTailsCheckoutPreferences');
    if (savedPreferences) {
      setCheckoutPreferences({
        ...DEFAULT_FULFILLMENT,
        ...JSON.parse(savedPreferences)
      });
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('happyTailsCart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('happyTailsCheckoutPreferences', JSON.stringify(checkoutPreferences));
  }, [checkoutPreferences]);

  const showAddedToCartToast = (productName) => {
    setToastMessage(`Successfully added ${productName} to cart!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const addToCart = (product, variantId = null) => {
    const selectedVariantId = variantId || (product.variants && product.variants[0]?.id) || null;
    const variantData = product.variants?.find(v => v.id === selectedVariantId) || null;
    
    const price = variantData ? variantData.price : product.basePrice;
    const variantName = variantData 
      ? (variantData.flavor || variantData.scent || variantData.type || variantData.color || variantData.size) 
      : 'Standard';

    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.id === product.id && item.variantId === selectedVariantId
      );

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id && item.variantId === selectedVariantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, {
          ...product,
          quantity: 1,
          variantId: selectedVariantId,
          variantName,
          price
        }];
      }
    });
    
    showAddedToCartToast(product.name);
  };

  const updateQuantity = (itemId, variantId, change) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === itemId && item.variantId === variantId) {
          const newQuantity = item.quantity + change;
          if (newQuantity < 1) return item;
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId, variantId) => {
    setCart(prevCart => 
      prevCart.filter(item => !(item.id === itemId && item.variantId === variantId))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateCheckoutPreferences = (updates) => {
    setCheckoutPreferences((prev) => ({
      ...prev,
      ...updates
    }));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const formatPrice = (price) => {
    return `₱${price}`;
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,
      getCartCount,
      checkoutPreferences,
      updateCheckoutPreferences,
      formatPrice,
      showToast,
      toastMessage,
      setShowToast
    }}>
      {children}
    </CartContext.Provider>
  );
};
