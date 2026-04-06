import React, { useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import HappyTails2 from '../components/HappyTails2';
import { useNavigate } from 'react-router-dom';
import homepagePic from '../assets/homepagepic.jpg';
import logoImage from '../assets/logo.png';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const announcements = [
    {
      id: 1,
      category: 'Breed Meetup',
      tag: 'Community Event',
      meta: 'Small Breeds',
      title: 'Breed Meetup',
      description: 'Meet, play, and socialize',
      note: 'Photo spots • Play time • New friends',
      highlight: 'SATURDAY',
      footer: 'Happy Tails Community Day'
    },
    {
      id: 2,
      category: 'Holiday Promo',
      tag: 'Seasonal Offer',
      meta: 'Limited Time',
      title: 'Holiday Promo',
      description: 'Treats, bundles, and savings',
      note: 'Special deals • Add-ons • Gift picks',
      highlight: 'UP TO 20% OFF',
      footer: 'Valid this holiday weekend'
    },
    {
      id: 3,
      category: 'Shop Announcement',
      tag: 'Store Update',
      meta: 'New Arrivals',
      title: 'Shop Update',
      description: 'Fresh finds now in store',
      note: 'Restocks • New drops • Store reminders',
      highlight: 'NEW THIS WEEK',
      footer: 'Visit Happy Tails Shop'
    }
  ];
  const communityReviews = [
    {
      id: 1,
      name: 'Sarah Chen',
      review: 'Super bait ng staff and very maingat sila sa grooming ni Bella. Babalik kami ulit.',
      service: 'Grooming Service',
      rating: '5.0/5',
      stars: 5
    },
    {
      id: 2,
      name: 'Miguel Santos',
      review: 'Malinis yung boarding area and may updates ako na-receive habang naka-check in si Max.',
      service: 'Pet Boarding',
      rating: '5.0/5',
      stars: 5
    },
    {
      id: 3,
      name: 'Alyssa Rivera',
      review: 'Ang dali mag order sa shop at mabilis dumating. Quality din yung products.',
      service: 'Shop Order',
      rating: '4.9/5',
      stars: 5
    }
  ];

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBookNow = () => {
    navigate('/booking');
    window.scrollTo(0, 0);
  };

  const handleLearnMore = () => {
    navigate('/grooming');
    window.scrollTo(0, 0);
  };

  const handleOrderHere = () => {
    navigate('/shop');
    window.scrollTo(0, 0);
  };

  const handleCatShopClick = () => {
    // Navigate to shop page with cat filter
    navigate('/shop?petType=cat');
    window.scrollTo(0, 0);
  };

  const handleDogShopClick = () => {
    // Navigate to shop page with dog filter
    navigate('/shop?petType=dog');
    window.scrollTo(0, 0);
  };

  const handleBdayPartyClick = () => {
    // Navigate to birthday party page
    navigate('/bdaypawty');
    window.scrollTo(0, 0);
  };

  const handleHotelBooking = () => {
    // Navigate to boarding page
    navigate('/boarding');
    window.scrollTo(0, 0);
  };

  const handleReserveHotel = () => {
    // Navigate to BoardingBook.jsx
    navigate('/boarding/book');
    window.scrollTo(0, 0);
  };

  // Handler for Pet Cafe Menu
  const handlePetCafeMenu = () => {
    // Navigate to Petcafe.jsx
    navigate('/petcafe');
    window.scrollTo(0, 0);
  };

  // Handler for "Have an interest?" button
  const handleInterest = () => {
    // Navigate to bdaypawty.jsx
    navigate('/bdaypawty');
    window.scrollTo(0, 0);
  };

  return (
    <div className="home-main-page">
      {/* Special navbar for Home page */}
      <div className="homepage-navbar-wrapper">
        <HappyTails2 />
      </div>

      {/* Hero Section */}
      <section className="home-hero-section">
        {/* Background with image and overlay */}
        <div className="home-hero-background">
          <div 
            className="home-background-image"
            style={{ backgroundImage: `url(${homepagePic})` }}
          ></div>
          <div className="home-background-overlay"></div>
        </div>

        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <div className="home-hero-content">
                <h1 className="home-hero-title">
                <span className="home-hero-happy">HAPPY</span>
                <span className="home-hero-tails">TAILS</span>
                </h1>
                <div className="home-hero-subtitle-wrapper">
                <p className="home-hero-subtitle">
                  CAFE · GROOMING · HOTEL · SUPPLIES
                </p>
                </div>
              </div>
            </Col>
            <Col lg={6} className="home-hero-right">
              <div className="home-hero-image-placeholder">
                <img
                  src={logoImage}
                  alt="HappyTails Logo"
                  className="home-logo-image"
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Services Section */}
      <section className="home-services-section">
        <Container>
          <h2 className="home-section-title">OUR SERVICES</h2>
          <p className="home-section-subtitle">
            Complete pet care services designed with love for your furry companions.
          </p>
          
          <Row className="home-services-grid">
            <Col lg={4} md={6} className="mb-4">
              <div className="home-service-card">
                <div className="home-service-content">
                  <h3 className="home-service-title">GROOMING</h3>
                  <p className="home-service-description">Professional pet grooming services</p>
                  <Button 
                    className="home-service-btn home-grooming-btn" 
                    onClick={handleLearnMore}
                  >
                    View Services
                  </Button>
                </div>
              </div>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <div className="home-service-card">
                <div className="home-service-content">
                  <h3 className="home-service-title">BOARDING</h3>
                  <p className="home-service-description">Daycare & overnight boarding</p>
                  <Button 
                    className="home-service-btn home-hotel-btn"
                    onClick={handleHotelBooking}
                  >
                    View Booking Services
                  </Button>
                </div>
              </div>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <div className="home-service-card">
                <div className="home-service-content">
                  <h3 className="home-service-title">BDAY PARTY</h3>
                  <p className="home-service-description">Celebrate special moments</p>
                  <Button 
                    className="home-service-btn home-bday-btn"
                    onClick={handleBdayPartyClick}
                  >
                    VIEW PARTY SERVICES
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="home-announcements-section">
        <Container>
          <div className="home-announcements-shell">
            <div className="home-announcements-intro">
              <h2>Events & Announcements</h2>
              <p>
                Join our meetups, holiday specials, and in-store activities.
              </p>
            </div>

            <Row className="g-4">
              {announcements.map((item) => (
                <Col lg={4} md={6} key={item.id}>
                  <article className="home-announcement-event-card">
                    <div className="home-announcement-poster-mark"></div>
                    <div className="home-announcement-pill-row">
                      <span className="home-announcement-category">{item.category}</span>
                    </div>
                    <span className="home-announcement-meta">{item.meta}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="home-announcement-highlight">{item.highlight}</div>
                    <div className="home-announcement-note">{item.note}</div>
                    <div className="home-announcement-footer">{item.footer}</div>
                  </article>
                </Col>
              ))}
            </Row>
          </div>
        </Container>
      </section>

      {/* Pampering Section */}
      <section className="home-pampering-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <div className="home-pampering-image-placeholder">
              <img 
                src="/src/assets/doggg.webp" 
                alt="Happy dog being pampered at Happy Tails" 
                className="home-pampering-image"
              />
              </div>
            </Col>
            <Col lg={6}>
              <div className="home-pampering-content">
                <h2>PAMPERING FROM NOSE TO TAIL</h2>
                <p>
                  Every pet deserves a spa day! At Happy Tails, we specialize in gentle, 
                  professional grooming that leaves your furry friend looking and feeling 
                  their best. Whether it's a simple trim or a full makeover, our experienced 
                  groomers handle your pets with love, patience, and class.
                </p>
                <Button 
                  className="home-book-now-btn" 
                  onClick={handleBookNow}
                >
                  BOOK NOW
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Shop For Section */}
      <section className="home-shop-for-section">
        <Container>
          <h2 className="home-section-title">SHOP FOR</h2>
          <p className="home-section-subtitle">
            Discover the perfect products for your furry friends
          </p>
          
          <Row className="home-shop-categories">
            <Col md={6} className="mb-4">
              {/* Cat Category with shopcat.jpg background */}
              <div 
                className="home-category-card home-cat-card"
                style={{ 
                  backgroundImage: 'url(/src/assets/shopcat.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                onClick={handleCatShopClick}
              >
                <div className="home-cat-overlay">
                  <div className="home-category-content-simple">
                    <h3 className="home-category-title">CAT</h3>
                    <div className="home-shop-now-indicator">
                      Shop Now →
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col md={6} className="mb-4">
              {/* Dog Category with shopdog.jpg background */}
              <div 
                className="home-category-card home-dog-card"
                style={{ 
                  backgroundImage: 'url(/src/assets/shopdog.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                onClick={handleDogShopClick}
              >
                <div className="home-dog-overlay">
                  <div className="home-category-content-simple">
                    <h3 className="home-category-title">DOG</h3>
                    <div className="home-shop-now-indicator">
                      Shop Now →
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Best Selling Products */}
      <section className="home-best-selling-section">
        <Container>
          <h2 className="home-section-title">BEST SELLING</h2>
          <p className="home-section-subtitle">
            Keep them happy and healthy with our most-loved products.
          </p>
          <Row className="home-products-grid">
            <Col lg={4} md={6} className="mb-4">
              <div className="home-product-card">
                <div className="home-product-image home-product-1">
                  <img 
                    src="/src/assets/best1.jpg" 
                    alt="Happy Tails Knott Bone Pet Dental Treats" 
                    className="home-product-actual-image"
                  />
                </div>
                <div className="home-product-info">
                  <h4>Happy Tails Knott Bone Pet Dental Treats</h4>
                  <div className="home-product-price-container">
                    <div className="home-product-price">₱9 - ₱10.00</div>
                    <div className="home-product-sales">1k+ Sold/Month</div>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <div className="home-product-card">
                <div className="home-product-image home-product-2">
                  <img 
                    src="/src/assets/best2.jpg" 
                    alt="Animal Science Worm Rid Tablet" 
                    className="home-product-actual-image"
                  />
                </div>
                <div className="home-product-info">
                  <h4>Animal Science Worm Rid Tablet</h4>
                  <div className="home-product-price-container">
                    <div className="home-product-price">₱43.00</div>
                    <div className="home-product-sales">1k+ Sold/Month</div>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col lg={4} md={6} className="mb-4">
              <div className="home-product-card">
                <div className="home-product-image home-product-3">
                  <img 
                    src="/src/assets/best3.jpg" 
                    alt="Happy Tails Knott Bone Pet Dental Treats (Laser)" 
                    className="home-product-actual-image"
                  />
                </div>
                <div className="home-product-info">
                  <h4>Happy Tails Knott Bone Pet Dental Treats (Laser)</h4>
                  <div className="home-product-price-container">
                    <div className="home-product-price">₱24.00</div>
                    <div className="home-product-sales">402 Sold/Month</div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Pet's Favorite Place */}
      <section className="home-favorite-place-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <div className="home-favorite-content">
                <h2>Your Pet's Favorite Makeover Place</h2>
                <p>
                  We are more than just a pet shop—we are a community. From our cozy Pet Hotel 
                  for overnight stays to our Pet Cafe where you can enjoy refreshments while 
                  your pet plays, we've created the ultimate safe haven. Celebrating a special 
                  day? Ask us about our famous pet birthday parties and custom cakes!
                </p>
                <Button 
                  className="home-interest-btn"
                  onClick={handleInterest}
                >
                  HAVE AN INTEREST?
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <div className="home-favorite-image-placeholder">
                <img 
                  src="/src/assets/bdayhome.jpg" 
                  alt="Pet birthday party celebration at Happy Tails" 
                  className="home-favorite-actual-image"
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Self Service Section */}
      <section className="home-self-service-section">
        <Container>
          <div className="home-self-service-card">
            <h2>SELF SERVICE</h2>
            <p>Quick and easy access to our services</p>
            <Row className="home-self-service-options">
              <Col md={3} sm={6} className="mb-3">
                <div 
                  className="home-self-service-btn-wrapper"
                  onClick={handleOrderHere}
                >
                  <div 
                    className="home-self-service-btn-bg"
                    style={{ backgroundImage: 'url(/src/assets/shophome.jpg)' }}
                  >
                    <div className="home-self-service-btn-overlay"></div>
                    <div className="home-self-service-btn-content">
                      <span className="home-self-service-btn-text">Shop Online</span>
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col md={3} sm={6} className="mb-3">
                <div 
                  className="home-self-service-btn-wrapper"
                  onClick={handleBookNow}
                >
                  <div 
                    className="home-self-service-btn-bg"
                    style={{ backgroundImage: 'url(/src/assets/groominghome.jpg)' }}
                  >
                    <div className="home-self-service-btn-overlay"></div>
                    <div className="home-self-service-btn-content">
                      <span className="home-self-service-btn-text">Book Grooming</span>
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col md={3} sm={6} className="mb-3">
                <div 
                  className="home-self-service-btn-wrapper"
                  onClick={handleReserveHotel}
                >
                  <div 
                    className="home-self-service-btn-bg"
                    style={{ backgroundImage: 'url(/src/assets/hotelhome.jpg)' }}
                  >
                    <div className="home-self-service-btn-overlay"></div>
                    <div className="home-self-service-btn-content">
                      <span className="home-self-service-btn-text">Reserve Hotel</span>
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col md={3} sm={6} className="mb-3">
                <div 
                  className="home-self-service-btn-wrapper"
                  onClick={handlePetCafeMenu}
                >
                  <div 
                    className="home-self-service-btn-bg"
                    style={{ backgroundImage: 'url(/src/assets/cafehome.jpg)' }}
                  >
                    <div className="home-self-service-btn-overlay"></div>
                    <div className="home-self-service-btn-content">
                      <span className="home-self-service-btn-text">Pet Menu</span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      {/* Community Reviews Section */}
      <section className="home-community-reviews-section">
        <Container>
          <div className="home-community-reviews-shell">
            <div className="home-community-reviews-header">
              <h2>Community Reviews</h2>
              <p>Real experiences from Happy Tails customers</p>
            </div>

            <Row className="home-community-stats">
              <Col md={4} className="mb-3 mb-md-0">
                <div className="home-community-stat">
                  <strong>4.9/5</strong>
                  <span>Average Rating</span>
                </div>
              </Col>
              <Col md={4} className="mb-3 mb-md-0">
                <div className="home-community-stat">
                  <strong>1,200+</strong>
                  <span>Customers</span>
                </div>
              </Col>
              <Col md={4}>
                <div className="home-community-stat">
                  <strong>98%</strong>
                  <span>Would Recommend</span>
                </div>
              </Col>
            </Row>
          </div>

          <Row className="mt-4">
            {communityReviews.map((item) => (
              <Col lg={4} md={6} className="mb-4" key={item.id}>
                <div className="home-community-review-card">
                  <div className="home-community-review-top">
                    <div className="home-community-reviewer">
                      <div className="home-community-avatar">{item.name.charAt(0)}</div>
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.service}</p>
                      </div>
                    </div>
                    <span>{item.rating}</span>
                  </div>

                  <div className="home-community-stars">{'★'.repeat(item.stars)}</div>
                  <p className="home-community-review-text">{item.review}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
