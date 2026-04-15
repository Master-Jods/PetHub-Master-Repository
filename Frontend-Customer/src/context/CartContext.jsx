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

  const showCartToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const showAddedToCartToast = (productName, quantity = 1) => {
    const quantityLabel = quantity > 1 ? `${quantity} items` : '1 item';
    showCartToast(`Successfully added ${quantityLabel} of ${productName} to cart!`);
  };

  const showStockLimitToast = (productName, stock) => {
    if (stock <= 0) {
      showCartToast(`${productName} is currently out of stock.`);
      return;
    }

    showCartToast(`Only ${stock} item${stock === 1 ? '' : 's'} left for ${productName}.`);
  };

  const addToCart = (product, variantId = null, requestedQuantity = 1) => {
    const selectedVariantId = variantId || (product.variants && product.variants[0]?.id) || null;
    const variantData = product.variants?.find(v => v.id === selectedVariantId) || null;
    const availableStock = Math.max(0, Number(product.stock ?? 0));
    const price = variantData ? variantData.price : product.basePrice;
    const variantName = variantData 
      ? (variantData.flavor || variantData.scent || variantData.type || variantData.color || variantData.size) 
      : 'Standard';
    const quantityToAdd = Math.max(1, Number(requestedQuantity || 1));

    if (availableStock <= 0) {
      showStockLimitToast(product.name, 0);
      return;
    }

    let didAdd = false;
    let addedQuantity = 0;
    let reachedStockLimit = false;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.id === product.id && item.variantId === selectedVariantId
      );
      const existingQuantity = Number(existingItem?.quantity || 0);
      const remainingStock = Math.max(0, availableStock - existingQuantity);

      if (remainingStock <= 0) {
        reachedStockLimit = true;
        return prevCart;
      }

      const finalQuantityToAdd = Math.min(quantityToAdd, remainingStock);
      didAdd = finalQuantityToAdd > 0;
      addedQuantity = finalQuantityToAdd;
      reachedStockLimit = finalQuantityToAdd < quantityToAdd || remainingStock === finalQuantityToAdd;

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id && item.variantId === selectedVariantId
            ? { ...item, stock: availableStock, quantity: item.quantity + finalQuantityToAdd }
            : item
        );
      } else {
        return [...prevCart, {
          ...product,
          stock: availableStock,
          quantity: finalQuantityToAdd,
          variantId: selectedVariantId,
          variantName,
          price
        }];
      }
    });

    if (didAdd) {
      showAddedToCartToast(product.name, addedQuantity);
      if (reachedStockLimit && addedQuantity < quantityToAdd) {
        showStockLimitToast(product.name, availableStock);
      }
      return;
    }

    showStockLimitToast(product.name, availableStock);
  };

  const updateQuantity = (itemId, variantId, change) => {
    let limitMessage = '';

    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === itemId && item.variantId === variantId) {
          const newQuantity = item.quantity + change;
          const maxStock = Math.max(0, Number(item.stock ?? 0));
          if (newQuantity < 1) return item;
          if (maxStock > 0 && newQuantity > maxStock) {
            limitMessage = `${item.name} only has ${maxStock} item${maxStock === 1 ? '' : 's'} available.`;
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );

    if (limitMessage) {
      showCartToast(limitMessage);
    }
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
