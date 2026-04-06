import React, { useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './bdaypawty.css';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../backend/context/AuthContext';

const BdayPawty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const targetPath = '/bookpawty';

  const handleBookPawty = () => {
    if (user) {
      navigate('/bookpawty');
    } else {
      setShowAuth(true);
    }
  };

  const handleBookConsumables = () => {
    if (user) {
      navigate('/bookpawty');
    } else {
      setShowAuth(true);
    }
  };

  const handleLearnMore = () => {
    console.log('✅ Learn More button clicked!');
    const celebrateSection = document.querySelector('.bdaypawty-celebrate-section');
    if (celebrateSection) {
      celebrateSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper function to format currency with .00
  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  return (
    <>
    <div className="bdaypawty-main">
      {/* HERO SECTION */}
      <section className="bdaypawty-hero-section">
        <div className="bdaypawty-hero-background">
          <div 
            className="bdaypawty-background-image"
            style={{ 
              backgroundImage: 'url("src/assets/pawty.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="bdaypawty-photo-placeholder"></div>
          </div>
          <div className="bdaypawty-background-overlay"></div>
        </div>
        
        <Container className="bdaypawty-hero-container">
          <Row className="bdaypawty-hero-row">
            <Col lg={12} className="text-center">
              <div className="bdaypawty-hero-content">
                <h1 className="bdaypawty-hero-title">
                  <span className="bdaypawty-hero-birthday">BIRTHDAY PAWTY</span>
                </h1>
                <div className="bdaypawty-hero-subtitle-wrapper">
                  <p className="bdaypawty-hero-subtitle">
                    Celebrate your pet's special day with themed setups, tasty treats, and paw-some memories to last forever.
                  </p>
                </div>
                <div className="bdaypawty-hero-buttons">
                  <button 
                    className="bdaypawty-hero-book-btn hero-btn book-btn"
                    onClick={handleBookPawty}
                  >
                    Book Now
                  </button>
                  <button 
                    className="bdaypawty-hero-learn-btn hero-btn learn-btn"
                    onClick={handleLearnMore}
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CELEBRATE SECTION */}
      <section className="bdaypawty-celebrate-section">
        <Container>
          <div className="bdaypawty-section-header">
            <h2 className="bdaypawty-section-title">Barkday or Meowday Party!</h2>
            <p className="bdaypawty-section-intro">
              Whether it's a barkday for your dog or a meowday for your cat, we've got the perfect celebration ready!
            </p>
          </div>

          <Row className="bdaypawty-gallery-row">
            <Col md={3} sm={6} className="bdaypawty-gallery-col">
              <div 
                className="bdaypawty-photo-placeholder-gallery"
                style={{ 
                  backgroundImage: 'url("src/assets/pawty1.jpg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
            </Col>
            <Col md={3} sm={6} className="bdaypawty-gallery-col">
              <div 
                className="bdaypawty-photo-placeholder-gallery"
                style={{ 
                  backgroundImage: 'url("src/assets/pawty2.jpg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
            </Col>
            <Col md={3} sm={6} className="bdaypawty-gallery-col">
              <div 
                className="bdaypawty-photo-placeholder-gallery"
                style={{ 
                  backgroundImage: 'url("src/assets/pawty3.jpg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
            </Col>
            <Col md={3} sm={6} className="bdaypawty-gallery-col">
              <div 
                className="bdaypawty-photo-placeholder-gallery"
                style={{ 
                  backgroundImage: 'url("src/assets/pawty4.jpg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
            </Col>
          </Row>

          <div className="bdaypawty-celebrate-text">
            <h3 className="bdaypawty-celebrate-title">CELEBRATE IT WITH US</h3>
            <p className="bdaypawty-celebrate-desc">
              Create unforgettable memories with your furry friend on their special day
            </p>
          </div>
        </Container>
      </section>

      {/* INCLUSIONS SECTION */}
      <section className="bdaypawty-inclusions-section">
        <Container>
          <div className="bdaypawty-section-header">
            <h2 className="bdaypawty-section-title">Barkday or Meowday Pawty Package</h2>
            <div className="bdaypawty-price-tag">
              <span className="bdaypawty-price-currency">₱</span>
              <span className="bdaypawty-price-amount">2,000.00</span>
              <span className="bdaypawty-price-duration">/package</span>
            </div>
          </div>

          <Row className="bdaypawty-package-details">
            {/* INCLUSIONS CARD - Full width */}
            <Col lg={12} className="bdaypawty-inclusions-col">
              <div className="bdaypawty-inclusions-card">
                <h3 className="bdaypawty-inclusions-title">Inclusions:</h3>
                <ul className="bdaypawty-inclusions-list">
                  <li className="bdaypawty-inclusion-item">
                    One (1) dog or cat cake with candle (choice between Squash & banana flavor or Carrot with peanut butter flavor or Tuna flavor for cats)
                  </li>
                  <li className="bdaypawty-inclusion-item">
                    ₱800.00 worth of consumable at the cafe drinks and food menu
                  </li>
                  <li className="bdaypawty-inclusion-item">
                    Party decoration and banner with pet celebrant's name
                  </li>
                  <li className="bdaypawty-inclusion-item">
                    Choice of pasta pan (Baked Mac/Chicken Alfredo) good for 4-5 pax
                  </li>
                  <li className="bdaypawty-inclusion-item">
                    1 birthday party hat for pet (Blue or pink color)
                  </li>
                  <li className="bdaypawty-inclusion-item">
                    Exclusive use of the cafe area for 2 hours
                  </li>
                </ul>
                <button 
                  className="bdaypawty-book-btn hero-btn book-btn"
                  onClick={handleBookPawty}
                >
                  Book Now
                </button>
              </div>
            </Col>

            {/* CONSUMABLES MENU CARD - Full width below inclusions */}
            <Col lg={12} className="bdaypawty-menu-col">
              <div className="bdaypawty-menu-card">
                <h3 className="bdaypawty-menu-title">{'\u20B1'}800 Consumables Menu</h3>
                <div className="bdaypawty-menu-content">
                  <div className="bdaypawty-menu-images">
                    <img
                      src="/src/assets/menu1.jpg"
                      alt="Consumables Menu 1"
                      className="bdaypawty-menu-image"
                    />
                    <img
                      src="/src/assets/menu2.jpg"
                      alt="Consumables Menu 2"
                      className="bdaypawty-menu-image"
                    />
                  </div>
                </div>
                <button 
                  className="bdaypawty-book-btn hero-btn book-btn"
                  onClick={handleBookConsumables}
                >
                  Book Now
                </button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
    <AuthModal
      show={showAuth}
      onClose={() => setShowAuth(false)}
      onSuccess={() => {
        setShowAuth(false);
        navigate(targetPath);
      }}
    />
    </>
  );
};

export default BdayPawty;


