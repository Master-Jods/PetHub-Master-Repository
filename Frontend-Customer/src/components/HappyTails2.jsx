import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HappyTails2.css';
import { useAuth } from "../backend/context/AuthContext";

const HappyTails2 = () => {
  const navigate = useNavigate();

  // ✅ Auth (from AuthContext)
  const { user, profile, login, signup, logout } = useAuth();
  const [authError, setAuthError] = useState('');

  // Login/Signup dropdown state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoginForm, setIsLoginForm] = useState(true);

  // Services dropdown state
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs for click outside detection
  const loginDropdownRef = useRef(null);
  const servicesDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Form states (Login)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup form states
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close login dropdown
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target)) {
        setIsLoginOpen(false);
      }

      // Close services dropdown
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target)) {
        setIsServicesDropdownOpen(false);
      }

      // Close mobile menu
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('.ht2-mobile-toggle')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdowns when pressing Escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsLoginOpen(false);
        setIsServicesDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleLoginDropdown = () => {
    setIsLoginOpen(!isLoginOpen);
    setAuthError('');

    // Reset to login form when opening
    if (!isLoginOpen) {
      setIsLoginForm(true);
    }
  };

  const toggleServicesDropdown = () => {
    setIsServicesDropdownOpen(!isServicesDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close dropdowns when opening mobile menu
    if (!isMobileMenuOpen) {
      setIsServicesDropdownOpen(false);
      setIsLoginOpen(false);
    }
  };

  const switchToLogin = () => {
    setIsLoginForm(true);
    setAuthError('');
  };

  const switchToSignup = () => {
    setIsLoginForm(false);
    setAuthError('');
  };

  const clearLoginFields = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRememberMe(false);
  };

  const clearSignupFields = () => {
    setSignupFirstName('');
    setSignupLastName('');
    setSignupPhone('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setShowSignupPassword(false);
    setShowConfirmPassword(false);
  };

  // ✅ REAL login (API)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      await login(email, password, rememberMe);
      setIsLoginOpen(false);
      setIsMobileMenuOpen(false);
      clearLoginFields();
      // Optional: navigate to profile after login
      // navigate("/profile");
    } catch (err) {
      setAuthError(err?.message || 'Login failed.');
    }
  };

  // ✅ REAL signup (API)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Password confirmation validation
    if (signupPassword !== signupConfirmPassword) {
      setAuthError('Passwords do not match!');
      return;
    }

    try {
      await signup(
        {
          firstName: signupFirstName,
          lastName: signupLastName,
          phone: signupPhone,
          email: signupEmail,
          password: signupPassword,
        },
        rememberMe
      );

      // After signup: return to login (or keep logged in if backend returns token)
      setIsLoginForm(true);
      clearSignupFields();
      setAuthError('');
    } catch (err) {
      setAuthError(err?.message || 'Sign up failed.');
    }
  };
  const handleLogout = async () => {
    setAuthError('');

    try {
      await logout();
    } catch (e) {
      setAuthError(e?.message || 'Logout failed. Please try again.');
    } finally {
      setIsLoginOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false);
    setIsServicesDropdownOpen(false);
    setIsLoginOpen(false);
  };

  const handleForgotPassword = () => {
    setIsLoginOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/forgot-password');
  };

  const handleDropdownItemClick = (path) => {
    setIsServicesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleSignupPasswordVisibility = () => {
    setShowSignupPassword(!showSignupPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <>
      {/* Main Header with Logo and Navigation - Using ht2- prefix */}
      <header className="ht2-main-header">
        <div className="ht2-header-container">
          {/* Logo Area with Image on LEFT and Text on RIGHT */}
          <div className="ht2-logo-area">
            <Link to="/" className="ht2-logo-placeholder" onClick={handleNavLinkClick}>
              {/* Logo Image on LEFT side */}
              <img
                src="/src/assets/logo.png"
                alt="HappyTails Logo"
                className="ht2-logo-image"
              />
              {/* Text Title on RIGHT side of image */}
              <div className="ht2-logo-title">
                <span className="ht2-logo-happy">Happy</span>
                <span className="ht2-logo-tails">Tails</span>
              </div>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className={`ht2-mobile-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className="ht2-toggle-bar"></span>
            <span className="ht2-toggle-bar"></span>
            <span className="ht2-toggle-bar"></span>
          </button>

          {/* Navigation Links - Pushed to the right */}
          <nav
            className={`ht2-main-navigation ${isMobileMenuOpen ? 'active' : ''}`}
            ref={mobileMenuRef}
          >
            <Link to="/" className="ht2-nav-item" onClick={handleNavLinkClick}>
              Home
            </Link>

            {/* Services Dropdown */}
            <div
              className={`ht2-nav-item ht2-dropdown ${isServicesDropdownOpen ? 'active' : ''}`}
              ref={servicesDropdownRef}
            >
              <button
                className="ht2-dropdown-toggle"
                onClick={toggleServicesDropdown}
                aria-expanded={isServicesDropdownOpen}
                aria-haspopup="true"
              >
                Services{' '}
                <span className={`ht2-dropdown-icon ${isServicesDropdownOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Dropdown Content */}
              <div className={`ht2-dropdown-content ${isServicesDropdownOpen ? 'show' : ''}`}>
                <Link
                  to="/grooming"
                  className="ht2-dropdown-item"
                  onClick={() => handleDropdownItemClick('/grooming')}
                >
                  Pet Grooming
                </Link>
                <Link
                  to="/boarding"
                  className="ht2-dropdown-item"
                  onClick={() => handleDropdownItemClick('/boarding')}
                >
                  Boarding
                </Link>
                <Link
                  to="/bdaypawty"
                  className="ht2-dropdown-item"
                  onClick={() => handleDropdownItemClick('/bdaypawty')}
                >
                  Bday Pawty
                </Link>
              </div>
            </div>

            {/* Shop Button */}
            <Link to="/shop" className="ht2-nav-item" onClick={handleNavLinkClick}>
              Shop
            </Link>

            {/* Pet Menu */}
            <Link to="/petcafe" className="ht2-nav-item" onClick={handleNavLinkClick}>
              Pet Menu
            </Link>

            {/* Login/Signup Dropdown */}
            <div className="ht2-nav-item ht2-login-dropdown-container" ref={loginDropdownRef}>
              <div className="ht2-login-signup-box">
                <button
                  className="ht2-login-signup-btn"
                  onClick={toggleLoginDropdown}
                  aria-expanded={isLoginOpen}
                >
                 {user ? `Hi, ${profile?.first_name || user.email}` : 'Login/Sign up'}{' '}
                  <span className={`ht2-dropdown-icon ${isLoginOpen ? 'open' : ''}`}>▼</span>
                </button>

                <div className={`ht2-login-dropdown ${isLoginOpen ? 'show' : ''}`}>
                  <div className="ht2-login-content">

                    {/* ✅ Error area */}
                    {authError && (
                      <div style={{ color: "#b00020", marginBottom: "10px", fontSize: "0.9rem" }}>
                        {authError}
                      </div>
                    )}

                    {/* ✅ If logged in, show logout button */}
                    {user ? (
                      <div className="ht2-login-form">
                        <h3 className="ht2-form-title">Account</h3>
                        <p className="ht2-account-email">
                          Logged in as <strong>{user.email}</strong>
                        </p>
                        <button
                          type="button"
                          className="ht2-submit-btn ht2-login-submit"
                          onClick={handleLogout}
                        >
                          Logout
                        </button>
                      </div>
                    ) : (
                      <>
                        {isLoginForm ? (
                          <form className="ht2-login-form" onSubmit={handleLoginSubmit}>
                            <h3 className="ht2-form-title">Login</h3>

                            <div className="ht2-form-group">
                              <label htmlFor="ht2-email" className="ht2-form-label">
                                <i className="bi bi-envelope" style={{ marginRight: '8px' }}></i> Email
                              </label>
                              <input
                                type="email"
                                id="ht2-email"
                                className="ht2-form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                              />
                            </div>

                            <div className="ht2-form-group">
                              <label htmlFor="ht2-password" className="ht2-form-label">
                                <i className="bi bi-lock" style={{ marginRight: '8px' }}></i> Password
                              </label>
                              <div className="ht2-password-input-container">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  id="ht2-password"
                                  className="ht2-form-input"
                                  placeholder="Enter your password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  required
                                />
                                <button
                                  type="button"
                                  className="ht2-password-toggle"
                                  onClick={togglePasswordVisibility}
                                  tabIndex="-1"
                                >
                                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                              </div>
                            </div>

                            <div className="ht2-remember-forgot">
                              <label className="ht2-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={rememberMe}
                                  onChange={(e) => setRememberMe(e.target.checked)}
                                  className="ht2-checkbox"
                                />
                                Remember me
                              </label>
                              <button
                                type="button"
                                className="ht2-forgot-password-btn"
                                onClick={handleForgotPassword}
                              >
                                Forgot password?
                              </button>
                            </div>

                            <button type="submit" className="ht2-submit-btn ht2-login-submit">
                              Login
                            </button>

                            <div className="ht2-signup-prompt">
                              <p>
                                Don't have an account?{' '}
                                <button
                                  type="button"
                                  className="ht2-switch-to-signup-btn"
                                  onClick={switchToSignup}
                                >
                                  Create Account
                                </button>
                              </p>
                            </div>
                          </form>
                        ) : (
                          <form className="ht2-signup-form" onSubmit={handleSignupSubmit}>
                            <h3 className="ht2-form-title">Create Account</h3>

                            <div className="ht2-form-group ht2-name-group">
                              <div className="ht2-name-row">
                                <div className="ht2-name-field">
                                  <label htmlFor="ht2-first-name" className="ht2-form-label">
                                    First Name
                                  </label>
                                  <input
                                    type="text"
                                    id="ht2-first-name"
                                    className="ht2-form-input"
                                    placeholder="First name"
                                    value={signupFirstName}
                                    onChange={(e) => setSignupFirstName(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="ht2-name-field">
                                  <label htmlFor="ht2-last-name" className="ht2-form-label">
                                    Last Name
                                  </label>
                                  <input
                                    type="text"
                                    id="ht2-last-name"
                                    className="ht2-form-input"
                                    placeholder="Last name"
                                    value={signupLastName}
                                    onChange={(e) => setSignupLastName(e.target.value)}
                                    required
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="ht2-form-group">
                              <label htmlFor="ht2-signup-phone" className="ht2-form-label">
                                <i className="bi bi-telephone" style={{ marginRight: '8px' }}></i> Phone Number
                              </label>
                              <input
                                type="tel"
                                id="ht2-signup-phone"
                                className="ht2-form-input"
                                placeholder="Enter your phone number"
                                value={signupPhone}
                                onChange={(e) => setSignupPhone(e.target.value)}
                                required
                              />
                            </div>

                            <div className="ht2-form-group">
                              <label htmlFor="ht2-signup-email" className="ht2-form-label">
                                <i className="bi bi-envelope" style={{ marginRight: '8px' }}></i> Email
                              </label>
                              <input
                                type="email"
                                id="ht2-signup-email"
                                className="ht2-form-input"
                                placeholder="Enter your email"
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                                required
                              />
                            </div>

                            <div className="ht2-form-group">
                              <label htmlFor="ht2-signup-password" className="ht2-form-label">
                                <i className="bi bi-lock" style={{ marginRight: '8px' }}></i> Password
                              </label>
                              <div className="ht2-password-input-container">
                                <input
                                  type={showSignupPassword ? "text" : "password"}
                                  id="ht2-signup-password"
                                  className="ht2-form-input"
                                  placeholder="Create a password"
                                  value={signupPassword}
                                  onChange={(e) => setSignupPassword(e.target.value)}
                                  required
                                />
                                <button
                                  type="button"
                                  className="ht2-password-toggle"
                                  onClick={toggleSignupPasswordVisibility}
                                  tabIndex="-1"
                                >
                                  <i className={`bi ${showSignupPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                              </div>
                            </div>

                            <div className="ht2-form-group">
                              <label htmlFor="ht2-confirm-password" className="ht2-form-label">
                                <i className="bi bi-lock-fill" style={{ marginRight: '8px' }}></i> Confirm Password
                              </label>
                              <div className="ht2-password-input-container">
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  id="ht2-confirm-password"
                                  className="ht2-form-input"
                                  placeholder="Confirm your password"
                                  value={signupConfirmPassword}
                                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                  required
                                />
                                <button
                                  type="button"
                                  className="ht2-password-toggle"
                                  onClick={toggleConfirmPasswordVisibility}
                                  tabIndex="-1"
                                >
                                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                              </div>
                            </div>

                            <button type="submit" className="ht2-submit-btn ht2-signup-submit">
                              Sign Up
                            </button>

                            <div className="ht2-login-prompt">
                              <p>
                                Already have an account?{' '}
                                <button
                                  type="button"
                                  className="ht2-switch-to-login-btn"
                                  onClick={switchToLogin}
                                >
                                  Login
                                </button>
                              </p>
                            </div>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Moving Banner */}
        <div className="ht2-moving-banner">
          <div className="ht2-banner-scroll">
            <div className="ht2-banner-content">
              <span className="ht2-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="ht2-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="ht2-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="ht2-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="ht2-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="ht2-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="ht2-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="ht2-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
              <span className="ht2-banner-item">EVERY WEEKDAYS 🎁 5% OFF ON ALL GROOMING SERVICES</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default HappyTails2;
