import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './HappyTailsNavbar.css';
import { assetUrl } from '../utils/assets';

const HappyTailsNavbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCafeDropdownOpen, setIsCafeDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const cafeDropdownRef = useRef(null);
  const navigate = useNavigate();
  const { getCartCount, setCartVisible } = useCart();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (cafeDropdownRef.current && !cafeDropdownRef.current.contains(event.target)) {
        setIsCafeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when pressing Escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsCafeDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (isCafeDropdownOpen) setIsCafeDropdownOpen(false);
  };

  const handleCafeDropdownToggle = () => {
    setIsCafeDropdownOpen(!isCafeDropdownOpen);
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  const handleDropdownItemClick = (path) => {
    setIsDropdownOpen(false);
    setIsCafeDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isDropdownOpen) setIsDropdownOpen(false);
    if (isCafeDropdownOpen) setIsCafeDropdownOpen(false);
  };

  const handleNavLinkClick = () => {
    setIsDropdownOpen(false);
    setIsCafeDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Main Header with Logo and Navigation */}
      <header className="htn-main-header">
        <div className="htn-header-container">
          {/* Logo Area with Image on LEFT and Text on RIGHT */}
          <div className="htn-logo-area">
            <Link to="/" className="htn-logo-placeholder" onClick={handleNavLinkClick}>
              {/* Logo Image on LEFT side */}
              <img 
                src={assetUrl('logo.png')} 
                alt="HappyTails Logo" 
                className="htn-logo-image"
              />
              {/* Text Title on RIGHT side of image */}
              <div className="htn-logo-title">
                <span className="htn-logo-happy">Happy</span>
                <span className="htn-logo-tails">Tails</span>
              </div>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button 
            className={`htn-mobile-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={handleMobileMenuToggle}
            aria-label="Toggle menu"
          >
            <span className="htn-toggle-bar"></span>
            <span className="htn-toggle-bar"></span>
            <span className="htn-toggle-bar"></span>
          </button>

          {/* Navigation Links - Pushed to the right */}
          <nav className={`htn-main-navigation ${isMobileMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="htn-nav-item" onClick={handleNavLinkClick}>
              Home
            </Link>
            
            {/* Services Dropdown with improved interaction */}
            <div 
              className={`htn-nav-item htn-dropdown ${isDropdownOpen ? 'active' : ''}`}
              ref={dropdownRef}
            >
              <button 
                className="htn-dropdown-toggle"
                onClick={handleDropdownToggle}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                Services <span className={`htn-dropdown-icon ${isDropdownOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {/* Dropdown Content */}
              <div className={`htn-dropdown-content ${isDropdownOpen ? 'show' : ''}`}>
                <Link 
                  to="/grooming" 
                  className="htn-dropdown-item"
                  onClick={() => handleDropdownItemClick('/grooming')}
                >
                  Pet Grooming
                </Link>
                <Link 
                  to="/boarding" 
                  className="htn-dropdown-item"
                  onClick={() => handleDropdownItemClick('/boarding')}
                >
                  Boarding
                </Link>
                <Link 
                  to="/bdaypawty" 
                  className="htn-dropdown-item"
                  onClick={() => handleDropdownItemClick('/bdaypawty')}
                >
                  Bday Pawty
                </Link>
              </div>
            </div>
            
            {/* Shop Button - NO DROPDOWN */}
            <Link to="/shop" className="htn-nav-item" onClick={handleNavLinkClick}>
              Shop
            </Link>
            
            {/* Cafe Dropdown */}
            <div 
              className={`htn-nav-item htn-dropdown ${isCafeDropdownOpen ? 'active' : ''}`}
              ref={cafeDropdownRef}
            >
              <button 
                className="htn-dropdown-toggle"
                onClick={handleCafeDropdownToggle}
                aria-expanded={isCafeDropdownOpen}
                aria-haspopup="true"
              >
                Cafe <span className={`htn-dropdown-icon ${isCafeDropdownOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {/* Dropdown Content */}
              <div className={`htn-dropdown-content ${isCafeDropdownOpen ? 'show' : ''}`}>
                <Link 
                  to="/cafe/menu" 
                  className="htn-dropdown-item"
                  onClick={() => handleDropdownItemClick('/cafe/menu')}
                >
                  Cafe Menu (For Humans)
                </Link>
                <Link 
                  to="/petcafe" 
                  className="htn-dropdown-item"
                  onClick={() => handleDropdownItemClick('/petcafe')}
                >
                  Pet Menu (For Pets)
                </Link>
              </div>
            </div>
            
            {/* Cart Icon */}
            <div className="htn-nav-item htn-cart-container" style={{ marginRight: '10px' }}>
              <div className="htn-user-icon-box">
                <button 
                  className="htn-user-icon-btn"
                  aria-label="Shopping cart"
                  title="Shopping Cart"
                  onClick={() => setCartVisible(true)}
                  style={{ position: 'relative' }}
                >
                  <span className="htn-user-icon">🛒</span>
                  {getCartCount() > 0 && (
                    <span 
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#f53799',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        lineHeight: 1
                      }}
                    >
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* User Icon - Logged in state */}
            <div className="htn-nav-item htn-user-container">
              <div className="htn-user-icon-box">
                <button 
                  className="htn-user-icon-btn"
                  aria-label="User profile"
                  title="User Profile"
                  onClick={() => navigate('/profile')}
                >
                  <span className="htn-user-icon">👤</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Moving Banner at bottom of header - Light Pink */}
        <div className="htn-moving-banner">
          <div className="htn-banner-scroll">
            <div className="htn-banner-content">
              <span className="htn-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="htn-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="htn-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="htn-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="htn-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="htn-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="htn-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="htn-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="htn-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default HappyTailsNavbar;
