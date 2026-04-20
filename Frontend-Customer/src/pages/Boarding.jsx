import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HappyTailsNavbar from '../components/HappyTailsNavbar'; // Fixed import path
import './Boarding.css';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../backend/context/AuthContext';
import boardingPic from '../assets/boardingpic.jpg';
import { assetUrl } from '../utils/assets';

const Boarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentCatSlide, setCurrentCatSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [currentDogSlide, setCurrentDogSlide] = useState(0);

  const handleBookAppointment = () => {
    if (user) {
      navigate('/boarding/book');
    } else {
      setShowAuth(true);
    }
  };

  const handleLearnMore = () => {
  console.log('✅ Learn More button clicked!');
  const servicesSection = document.querySelector('.boarding-services');
  if (servicesSection) {
    servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Cat gallery navigation
  const nextCatSlide = () => {
    setCurrentCatSlide((prevSlide) => 
      prevSlide === 1 ? 0 : prevSlide + 1
    );
  };

  const prevCatSlide = () => {
    setCurrentCatSlide((prevSlide) => 
      prevSlide === 0 ? 1 : prevSlide - 1
    );
  };

  // Dog gallery navigation
  const nextDogSlide = () => {
    setCurrentDogSlide((prevSlide) => 
      prevSlide === 1 ? 0 : prevSlide + 1
    );
  };

  const prevDogSlide = () => {
    setCurrentDogSlide((prevSlide) => 
      prevSlide === 0 ? 1 : prevSlide - 1
    );
  };

  return (
    <>
    <div className="boarding-page">
      
      <section className="boarding-hero">
        <div className="hero-background">
          <div className="background-overlay"></div>
          <div 
            className="background-image"
            style={{ backgroundImage: `url(${boardingPic})` }}
          ></div>
        </div>

        <div className="hero-content">
          <div className="hero-container">
            <div className="hero-text-section">
              <h1 className="hero-title">BOARDING</h1>
              
              <p className="hero-description">
                Get your pets ready for a cozy stay at our hotel & daycare,<br />
                where every guest enjoys plenty of care, comfort, and attention.
              </p>
              
              <div className="hero-buttons">
                <button 
                  className="hero-btn book-btn"
                  onClick={handleBookAppointment}
                >
                  Book Now
                </button>
                <button 
                  className="hero-btn learn-btn"
                  onClick={handleLearnMore}
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="boarding-services">
        <div className="container">
          <h2 className="services-title">PET HOTEL & DAYCARE</h2>
          <p className="services-subtitle">Rate starts at ₱299.00/night</p>
          
          <div className="features-grid">
            <div className="feature-item">
              <h3>Daycare/Overnight Stay</h3>
            </div>
            <div className="feature-item">
              <h3>24/7 supervision with CCTV</h3>
            </div>
            <div className="feature-item">
              <h3>Premium & Clean Spots</h3>
            </div>
            <div className="feature-item">
              <h3>Photo/Video updates</h3>
            </div>
            <div className="feature-item">
              <h3>Playtime & free treats</h3>
            </div>
            <div className="feature-item">
              <h3>Fully-airconditioned rooms</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Daycare Packages Section - UPDATED */}
      <section className="daycare-packages">
        <div className="container">
          <h2 className="packages-title">Pet Hotel & Boarding</h2>
          <p className="packages-subtitle">
            Your pet's home away from home with 24/7 care and supervision
          </p>
          
          <div className="packages-grid">
            {/* 3-Hour Daycare Package */}
            <div className="package-card featured">
              <div className="most-popular-badge">DAYCARE</div>
              <div className="card-header">
                <img 
                  src={assetUrl('daycare.jpg')} 
                  alt="Daycare" 
                  className="card-image zoomed-out-image"
                />
              </div>
              <div className="package-content">
                <h3 className="package-title">3 hours with water, photo & video updates (Playtime)</h3>
                
                <div className="pricing-section">
                  <div className="price-item">
                    <span className="animal-type">Cat (All breed)</span>
                    <span className="price">₱169.00</span>
                  </div>
                  <div className="price-item">
                    <span className="animal-type">Dog (Small-Med breed)</span>
                    <span className="price">₱169.00</span>
                  </div>
                  <div className="price-item">
                    <span className="animal-type">Dog (Large Breed)</span>
                    <span className="price">₱199.00</span>
                  </div>
                </div>
                
                <div className="additional-info">
                  <p>₱50 per hour for every succeeding hours</p>
                </div>
              </div>
            </div>
            
            {/* Overnight Package */}
            <div className="package-card">
              <div className="card-header">
                <img 
                  src={assetUrl('overnight.jpg')} 
                  alt="Overnight Boarding" 
                  className="card-image zoomed-out-image"
                />
              </div>
              <div className="package-content">
                <h3 className="package-title">Overnight (24 hours)</h3>
                <p className="package-description">
                  24/7 pet attendant, Water, Photo & video updates, Playtime
                </p>
                
                <div className="pricing-section">
                  <div className="price-item">
                    <span className="animal-type">Small (Below 5kg)</span>
                    <span className="price">₱299.00</span>
                  </div>
                  <div className="price-item">
                    <span className="animal-type">Medium (6-10kg)</span>
                    <span className="price">₱359.00</span>
                  </div>
                  <div className="price-item">
                    <span className="animal-type">Large (11-30kg)</span>
                    <span className="price">₱439.00</span>
                  </div>
                  <div className="price-item">
                    <span className="animal-type">XL (31kg+up)</span>
                    <span className="price">₱599.00</span>
                  </div>
                  <div className="price-item special">
                    <span className="animal-type">Cat (All sizes)</span>
                    <span className="price">₱299.00 / ₱399.00</span>
                  </div>
                </div>
                
                <div className="additional-info">
                  <p>*₱50 per hour for every succeeding hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reminders Section - UPDATED */}
      <section className="reminders-section">
        <div className="container">
          <h2 className="reminders-title">IMPORTANT REMINDERS</h2>
          
          <div className="reminders-list">
            <div className="reminder-item">
              <div className="reminder-bullet"></div>
              <p className="reminder-text">Furparents are required to present their pet's vaccination card for verification upon check-in.</p>
            </div>
            <div className="reminder-item">
              <div className="reminder-bullet"></div>
              <p className="reminder-text">All rooms are fully air-conditioned with 24/7 CCTV surveillance for your pet's safety and comfort.</p>
            </div>
            <div className="reminder-item">
              <div className="reminder-bullet"></div>
              <p className="reminder-text">Pet food is not included in the package. Please bring your pet's regular food and feeding instructions.</p>
            </div>
            <div className="reminder-item">
              <div className="reminder-bullet"></div>
              <p className="reminder-text">Free treats, bath, and drying service are provided for stays of 3 days or longer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section - Cats */}
      <section className="cat-gallery-section">
        <div className="container">
          <div className="deluxe-header">
            <h2 className="deluxe-main-title">Our Happy Cat Guests</h2>
            <button 
              className="deluxe-book-button"
              onClick={handleBookAppointment}
            >
              Book Now
            </button>
          </div>
          
          <div className="gallery-section">
            <div className="three-photo-gallery-container">
              <button className="gallery-arrow prev-arrow" onClick={prevCatSlide}>
                ←
              </button>
              
              <div className="gallery-three-photos">
                <div 
                  className="gallery-three-wrapper"
                  style={{ transform: `translateX(-${currentCatSlide * 100}%)` }}
                >
                  {/* First group of 3 cat photos */}
                  <div className="photo-group">
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('whiskers.jpg')} 
                          alt="Whiskers the cat" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=WHISKERS';
                            e.target.alt = 'Whiskers Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">WHISKERS</div>
                    </div>
                    
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('luna.webp')} 
                          alt="Luna the cat" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=LUNA';
                            e.target.alt = 'Luna Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">LUNA</div>
                    </div>
                    
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('simba.jpg')} 
                          alt="Simba the cat" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=SIMBA';
                            e.target.alt = 'Simba Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">SIMBA</div>
                    </div>
                  </div>
                  
                  {/* Second group of 3 cat photos */}
                  <div className="photo-group">
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('mittens.jpg')} 
                          alt="Mittens the cat" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=MITTENS';
                            e.target.alt = 'Mittens Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">MITTENS</div>
                    </div>
                    
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('oliver.jpg')} 
                          alt="Oliver the cat" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=OLIVER';
                            e.target.alt = 'Oliver Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">OLIVER</div>
                    </div>
                    
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('bellaa.jpg')} 
                          alt="Bella the cat" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=BELLA';
                            e.target.alt = 'Bella Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">BELLA</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="gallery-arrow next-arrow" onClick={nextCatSlide}>
                →
              </button>
            </div>
            
            <div className="gallery-indicators">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  className={`gallery-indicator ${index === currentCatSlide ? 'active' : ''}`}
                  onClick={() => setCurrentCatSlide(index)}
                />
              ))}
            </div>
          </div>
          
          <div className="section-divider"></div>
        </div>
      </section>

      {/* Gallery Section - Dogs */}
      <section className="dog-gallery-section">
        <div className="container">
          <div className="deluxe-header">
            <h2 className="deluxe-main-title">Our Happy Dog Guests</h2>
            <button 
              className="deluxe-book-button"
              onClick={handleBookAppointment}
            >
              Book Now
            </button>
          </div>
          
          <div className="gallery-section">
            <div className="three-photo-gallery-container">
              <button className="gallery-arrow prev-arrow" onClick={prevDogSlide}>
                ←
              </button>
              
              <div className="gallery-three-photos">
                <div 
                  className="gallery-three-wrapper"
                  style={{ transform: `translateX(-${currentDogSlide * 100}%)` }}
                >
                  {/* First group of 3 dog photos */}
                  <div className="photo-group">
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('max.jpg')} 
                          alt="Max the dog" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=MAX';
                            e.target.alt = 'Max Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">MAX</div>
                    </div>
                    
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('charlie.jpg')} 
                          alt="Charlie the dog" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=CHARLIE';
                            e.target.alt = 'Charlie Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">CHARLIE</div>
                    </div>
                    
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('bailey.jpg')} 
                          alt="Bailey the dog" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=BAILEY';
                            e.target.alt = 'Bailey Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">BAILEY</div>
                    </div>
                  </div>
                  
                  {/* Second group of 3 dog photos */}
                  <div className="photo-group">
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('rocky.jpg')} 
                          alt="Rocky the dog" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=ROCKY';
                            e.target.alt = 'Rocky Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">ROCKY</div>
                    </div>
                    
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('daisy.jpg')} 
                          alt="Daisy the dog" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=DAISY';
                            e.target.alt = 'Daisy Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">DAISY</div>
                    </div>
                    
                    <div className="photo-card">
                      <div className="photo-square">
                        <img 
                          src={assetUrl('cooper.jpg')} 
                          alt="Cooper the dog" 
                          className="gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=COOPER';
                            e.target.alt = 'Cooper Placeholder';
                          }}
                        />
                      </div>
                      <div className="photo-name">COOPER</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="gallery-arrow next-arrow" onClick={nextDogSlide}>
                →
              </button>
            </div>
            
            <div className="gallery-indicators">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  className={`gallery-indicator ${index === currentDogSlide ? 'active' : ''}`}
                  onClick={() => setCurrentDogSlide(index)}
                />
              ))}
            </div>
          </div>
          
          <div className="section-divider"></div>
        </div>
      </section>
    </div>
    <AuthModal
      show={showAuth}
      onClose={() => setShowAuth(false)}
      onSuccess={() => {
        setShowAuth(false);
        navigate('/boarding/book');
      }}
    />
    </>
  );
};

export default Boarding;
