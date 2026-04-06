import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Grooming.css';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../backend/context/AuthContext';
import groomingPic from '../assets/groomingpic.jpg';

const Grooming = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentCatSlide, setCurrentCatSlide] = useState(0);
  const [currentPremiumSlide, setCurrentPremiumSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const bookingPath = '/booking';

  const handleBookAppointment = () => {
    if (user) {
      navigate(bookingPath);
    } else {
      setShowAuth(true);
    }
  };

  const handleLearnMore = () => {
    console.log('✅ Learn More button clicked!');
    const servicesSection = document.querySelector('.grooming-services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => 
      prevSlide === 1 ? 0 : prevSlide + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => 
      prevSlide === 0 ? 1 : prevSlide - 1
    );
  };

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

  const nextPremiumSlide = () => {
    setCurrentPremiumSlide((prevSlide) => 
      prevSlide === 1 ? 0 : prevSlide + 1
    );
  };

  const prevPremiumSlide = () => {
    setCurrentPremiumSlide((prevSlide) => 
      prevSlide === 0 ? 1 : prevSlide - 1
    );
  };

  return (
    <>
    <div className="grooming-page">
      <section className="grooming-hero">
        <div className="grooming-hero-background">
          <div className="grooming-background-overlay"></div>
          <div 
            className="grooming-background-image"
            style={{ backgroundImage: `url(${groomingPic})` }}
          ></div>
        </div>

        <div className="grooming-hero-content">
          <div className="grooming-hero-container">
            <div className="grooming-hero-text-section">
              <h1 className="grooming-hero-title">GROOMING</h1>
              
              <p className="grooming-hero-description">
                Give your pets the ultimate grooming experience with our<br />
                skilled and caring professional groomers.
              </p>
              
              <div className="grooming-hero-buttons">
                <button 
                  className="grooming-hero-btn grooming-book-btn"
                  onClick={handleBookAppointment}
                >
                  Book Now
                </button>
                <button 
                  className="grooming-hero-btn grooming-learn-btn"
                  onClick={handleLearnMore}
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grooming-services">
        <div className="grooming-container">
          <h2 className="grooming-services-title">OUR GROOMING PACKAGES</h2>
          
          <div className="grooming-packages-grid">
            {/* Cat Grooming Package */}
            <div className="grooming-package-card">
              <div className="grooming-card-header">
                <img 
                  src="/src/assets/cat-grooming.jpg" 
                  alt="Cat Grooming" 
                  className="grooming-card-image"
                />
              </div>
              <div className="grooming-package-content">
                <h3 className="grooming-package-title">Cat Grooming</h3>
                <div className="grooming-price-spacer"></div>
                <p className="grooming-package-price">₱499.00</p>
                <ul className="grooming-package-features">
                  <li>Haircut</li>
                  <li>Bath & dry</li>
                  <li>Ear cleaning with hair pull</li>
                  <li>Nail trim with nail file</li>
                  <li>Teeth brushing</li>
                  <li>Cologne spray</li>
                  <li>FREE cat stick tuna snack</li>
                </ul>
              </div>
            </div>
            
            {/* Dog Grooming - Deluxe */}
            <div className="grooming-package-card grooming-featured">
              <div className="grooming-most-popular-badge">MOST POPULAR</div>
              <div className="grooming-card-header">
                <img 
                  src="/src/assets/dog-deluxe.jpg" 
                  alt="Dog Grooming Deluxe" 
                  className="grooming-card-image"
                />
              </div>
              <div className="grooming-package-content">
                <h3 className="grooming-package-title">Dog Grooming - Premium</h3>
                <div className="grooming-price-container">
                  <span className="grooming-starts-at-label">Starts at:</span>
                  <p className="grooming-package-price">₱499.00</p>
                </div>
                <ul className="grooming-package-features">
                  <li>Haircut</li>
                  <li>Bath & dry</li>
                  <li>Anal sac drain</li>
                  <li>Ear cleaning with hair pull</li>
                  <li>Nail trim with nail file</li>
                  <li>Teeth brushing</li>
                  <li>Cologne spray</li>
                  <li>FREE doggie biscuit</li>
                </ul>
              </div>
            </div>
            
            {/* Dog Grooming - Premium */}
            <div className="grooming-package-card">
              <div className="grooming-card-header">
                <img 
                  src="/src/assets/dog-premium.jpg" 
                  alt="Dog Grooming Premium" 
                  className="grooming-card-image"
                />
              </div>
              <div className="grooming-package-content">
                <h3 className="grooming-package-title">Dog Grooming - Deluxe</h3>
                <div className="grooming-price-container">
                  <span className="grooming-starts-at-label">Starts at:</span>
                  <p className="grooming-package-price">₱359.00</p>
                </div>
                <ul className="grooming-package-features">
                  <li>Sanitary Haircut</li>
                  <li>Bath & dry</li>
                  <li>Ear cleaning with hair pull</li>
                  <li>Nail trim with nail file</li>
                  <li>Teeth brushing</li>
                  <li>Cologne spray</li>
                  <li>FREE mini dog stick treat</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* À La Carte Services Section */}
      <section className="grooming-ala-carte-services">
        <div className="grooming-container">
          <div className="grooming-services-header">
            <h2>À LA CARTE SERVICES</h2>
            <p className="grooming-services-subtitle">Customize your pet's grooming experience with our individual services.</p>
          </div>
          
          <div className="grooming-ala-carte-grid">
            {/* Bath & Blow dry */}
            <div className="grooming-service-card">
              <h3 className="grooming-service-card-title">Bath & Blow Dry</h3>
              <div className="grooming-price-list">
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Small</span>
                    <span className="grooming-size-weight">Below 5kg</span>
                  </div>
                  <span className="grooming-price-value">₱200.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Medium</span>
                    <span className="grooming-size-weight">6-10kg</span>
                  </div>
                  <span className="grooming-price-value">₱250.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Large</span>
                    <span className="grooming-size-weight">11-30kg</span>
                  </div>
                  <span className="grooming-price-value">₱300.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Extra Large</span>
                    <span className="grooming-size-weight">31kg & up</span>
                  </div>
                  <span className="grooming-price-value">₱350.00</span>
                </div>
              </div>
            </div>

            {/* Nail clip with nail file */}
            <div className="grooming-service-card">
              <h3 className="grooming-service-card-title">Nail Clip with Nail File</h3>
              <div className="grooming-price-list">
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Small</span>
                    <span className="grooming-size-weight">Below 5kg</span>
                  </div>
                  <span className="grooming-price-value">₱80.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Medium</span>
                    <span className="grooming-size-weight">6-10kg</span>
                  </div>
                  <span className="grooming-price-value">₱100.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Large</span>
                    <span className="grooming-size-weight">11-30kg</span>
                  </div>
                  <span className="grooming-price-value">₱120.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Extra Large</span>
                    <span className="grooming-size-weight">31kg & up</span>
                  </div>
                  <span className="grooming-price-value">₱150.00</span>
                </div>
              </div>
            </div>

            {/* Face trim / Paw trim */}
            <div className="grooming-service-card">
              <h3 className="grooming-service-card-title">Face Trim / Paw Trim</h3>
              <div className="grooming-price-list">
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Small</span>
                    <span className="grooming-size-weight">Below 5kg</span>
                  </div>
                  <span className="grooming-price-value">₱150.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Medium</span>
                    <span className="grooming-size-weight">6-10kg</span>
                  </div>
                  <span className="grooming-price-value">₱150.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Large</span>
                    <span className="grooming-size-weight">11-30kg</span>
                  </div>
                  <span className="grooming-price-value">₱200.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Extra Large</span>
                    <span className="grooming-size-weight">31kg & up</span>
                  </div>
                  <span className="grooming-price-value">₱200.00</span>
                </div>
              </div>
            </div>

            {/* Dematting */}
            <div className="grooming-service-card">
              <h3 className="grooming-service-card-title">Dematting</h3>
              <div className="grooming-price-list">
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Small</span>
                    <span className="grooming-size-weight">Below 5kg</span>
                  </div>
                  <span className="grooming-price-value">₱250.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Medium</span>
                    <span className="grooming-size-weight">6-10kg</span>
                  </div>
                  <span className="grooming-price-value">₱250.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Large</span>
                    <span className="grooming-size-weight">11-30kg</span>
                  </div>
                  <span className="grooming-price-value">₱350.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Extra Large</span>
                    <span className="grooming-size-weight">31kg & up</span>
                  </div>
                  <span className="grooming-price-value">₱450.00</span>
                </div>
              </div>
            </div>

            {/* Doggy Spa */}
            <div className="grooming-service-card">
              <h3 className="grooming-service-card-title">Doggy Spa</h3>
              <div className="grooming-price-list">
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Small</span>
                    <span className="grooming-size-weight">Below 5kg</span>
                  </div>
                  <span className="grooming-price-value">₱250.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Medium</span>
                    <span className="grooming-size-weight">6-10kg</span>
                  </div>
                  <span className="grooming-price-value">₱250.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Large</span>
                    <span className="grooming-size-weight">11-30kg</span>
                  </div>
                  <span className="grooming-price-value">₱350.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Extra Large</span>
                    <span className="grooming-size-weight">31kg & up</span>
                  </div>
                  <span className="grooming-price-value">₱380.00</span>
                </div>
              </div>
            </div>

            {/* Pet Hair Color */}
            <div className="grooming-service-card">
              <h3 className="grooming-service-card-title">Pet Hair Color</h3>
              <div className="grooming-price-list">
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Small</span>
                    <span className="grooming-size-weight">Below 5kg</span>
                  </div>
                  <span className="grooming-price-value">₱100.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Medium</span>
                    <span className="grooming-size-weight">6-10kg</span>
                  </div>
                  <span className="grooming-price-value">₱120.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Large</span>
                    <span className="grooming-size-weight">11-30kg</span>
                  </div>
                  <span className="grooming-price-value">₱150.00</span>
                </div>
                <div className="grooming-price-item">
                  <div className="grooming-size-info">
                    <span className="grooming-size-name">Extra Large</span>
                    <span className="grooming-size-weight">31kg & up</span>
                  </div>
                  <span className="grooming-price-value">₱180.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cat Grooming Section */}
      <section className="grooming-cat-section">
        <div className="grooming-container">
          <div className="grooming-deluxe-header">
            <h2 className="grooming-deluxe-main-title">Cat Grooming</h2>
            <button 
              className="grooming-book-now-button"
              onClick={handleBookAppointment}
            >
              Book Now
            </button>
          </div>
          
          <div className="grooming-deluxe-content">
            <p className="grooming-deluxe-description">
              Includes a haircut, bath and dry, ear cleaning, nail trimming, teeth brushing, a cologne spray, and a free cat tuna snack.
            </p>
            
            <div className="grooming-simple-price-list">
              <div className="grooming-price-line">
                <span className="grooming-price-amount">₱499.00</span>
              </div>
            </div>
          </div>
          
          <div className="grooming-section-divider"></div>
          
          <div className="grooming-gallery-section">
            <div className="grooming-gallery-header">
              <h3 className="grooming-gallery-title">Gallery</h3>
            </div>
            
            <div className="grooming-three-photo-gallery-container">
              <button className="grooming-gallery-arrow grooming-prev-arrow" onClick={prevCatSlide}>
                ←
              </button>
              
              <div className="grooming-gallery-three-photos">
                <div 
                  className="grooming-gallery-three-wrapper"
                  style={{ transform: `translateX(-${currentCatSlide * 100}%)` }}
                >
                  <div className="grooming-photo-group">
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/leigh.jpg" 
                          alt="Leigh" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=LEIGH';
                            e.target.alt = 'Leigh Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">LEIGH</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/milo.jpg" 
                          alt="Milo" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=MILO';
                            e.target.alt = 'Milo Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">MILO</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/snowy.jpg" 
                          alt="Snowy" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=SNOWY';
                            e.target.alt = 'Snowy Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">SNOWY</div>
                    </div>
                  </div>
                  
                  <div className="grooming-photo-group">
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/coco.jpg" 
                          alt="Coco" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=COCO';
                            e.target.alt = 'Coco Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">COCO</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/piero.jpg" 
                          alt="Piero" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=PIERO';
                            e.target.alt = 'Piero Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">PIERO</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/shadow.jpg" 
                          alt="Shadow" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=SHADOW';
                            e.target.alt = 'Shadow Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">SHADOW</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="grooming-gallery-arrow grooming-next-arrow" onClick={nextCatSlide}>
                →
              </button>
            </div>
            
            <div className="grooming-gallery-indicators">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  className={`grooming-gallery-indicator ${index === currentCatSlide ? 'grooming-active' : ''}`}
                  onClick={() => setCurrentCatSlide(index)}
                />
              ))}
            </div>
          </div>
          
          <div className="grooming-section-divider"></div>
        </div>
      </section>

      {/* Dog Grooming-Deluxe Section */}
      <section className="grooming-dog-deluxe-section">
        <div className="grooming-container">
          <div className="grooming-deluxe-header">
            <h2 className="grooming-deluxe-main-title">Dog Grooming - Deluxe</h2>
            <button 
              className="grooming-book-now-button"
              onClick={handleBookAppointment}
            >
              Book Now
            </button>
          </div>
          
          <div className="grooming-deluxe-content">
            <p className="grooming-deluxe-description">
              Includes a haircut, bath and dry, ear cleaning, nail trimming, teeth brushing, a cologne spray, and a free cat tuna snack.
            </p>
            
            <div className="grooming-simple-price-list">
              <div className="grooming-price-line">
                <span className="grooming-price-amount">₱359.00</span>
                <span className="grooming-price-size">Small (under 5kg)</span>
              </div>
              <div className="grooming-price-line">
                <span className="grooming-price-amount">₱409.00</span>
                <span className="grooming-price-size">Medium (6-10kg)</span>
              </div>
              <div className="grooming-price-line">
                <span className="grooming-price-amount">₱709.00</span>
                <span className="grooming-price-size">Large (11-30kg)</span>
              </div>
              <div className="grooming-price-line">
                <span className="grooming-price-amount">₱949.00</span>
                <span className="grooming-price-size">Extra Large (31kg & up)</span>
              </div>
            </div>
          </div>
          
          <div className="grooming-section-divider"></div>
          
          <div className="grooming-gallery-section">
            <div className="grooming-gallery-header">
              <h3 className="grooming-gallery-title">Gallery</h3>
            </div>
            
            <div className="grooming-three-photo-gallery-container">
              <button className="grooming-gallery-arrow grooming-prev-arrow" onClick={prevSlide}>
                ←
              </button>
              
              <div className="grooming-gallery-three-photos">
                <div 
                  className="grooming-gallery-three-wrapper"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  <div className="grooming-photo-group">
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/bella.jpg" 
                          alt="Bella" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=BELLA';
                            e.target.alt = 'Bella Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">BELLA</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/chloe.jpg" 
                          alt="Chloe" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=CHLOE';
                            e.target.alt = 'Chloe Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">CHLOE</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/fifteen.jpg" 
                          alt="Fifteen" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=FIFTEEN';
                            e.target.alt = 'Fifteen Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">FIFTEEN</div>
                    </div>
                  </div>
                  
                  <div className="grooming-photo-group">
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/ranne.jpg" 
                          alt="Ranne" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=RANNE';
                            e.target.alt = 'Ranne Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">RANNE</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/sissy.jpg" 
                          alt="Sissy" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=SISSY';
                            e.target.alt = 'Sissy Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">SISSY</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/louis.jpg" 
                          alt="Louis" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=LOUIS';
                            e.target.alt = 'Louis Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">LOUIS</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="grooming-gallery-arrow grooming-next-arrow" onClick={nextSlide}>
                →
              </button>
            </div>
            
            <div className="grooming-gallery-indicators">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  className={`grooming-gallery-indicator ${index === currentSlide ? 'grooming-active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
          
          <div className="grooming-section-divider"></div>
        </div>
      </section>

      {/* Dog Grooming-Premium Section */}
      <section className="grooming-dog-premium-section">
        <div className="grooming-container">
          <div className="grooming-deluxe-header">
            <h2 className="grooming-deluxe-main-title">Dog Grooming - Premium</h2>
            <button 
              className="grooming-book-now-button"
              onClick={handleBookAppointment}
            >
              Book Now
            </button>
          </div>
          
          <div className="grooming-deluxe-content">
            <p className="grooming-deluxe-description">
              Includes a haircut, bath and dry, anal sac draining, ear cleaning, nail trim, teeth brushing, dematting, cologne spray, and a free puppuccino.
            </p>
            
            <div className="grooming-simple-price-list">
              <div className="grooming-price-line">
                <span className="grooming-price-amount">₱499.00</span>
                <span className="grooming-price-size">Small (under 5kg)</span>
              </div>
              <div className="grooming-price-line">
                <span className="grooming-price-amount">₱599.00</span>
                <span className="grooming-price-size">Medium (6-10kg)</span>
              </div>
              <div className="grooming-price-line">
                <span className="grooming-price-amount">₱849.00</span>
                <span className="grooming-price-size">Large (11-30kg)</span>
              </div>
              <div className="grooming-price-line">
                <span className="grooming-price-amount">₱1,049.00</span>
                <span className="grooming-price-size">Extra Large (31kg & up)</span>
              </div>
            </div>
          </div>
          
          <div className="grooming-section-divider"></div>
          
          <div className="grooming-gallery-section">
            <div className="grooming-gallery-header">
              <h3 className="grooming-gallery-title">Gallery</h3>
            </div>
            
            <div className="grooming-three-photo-gallery-container">
              <button className="grooming-gallery-arrow grooming-prev-arrow" onClick={prevPremiumSlide}>
                ←
              </button>
              
              <div className="grooming-gallery-three-photos">
                <div 
                  className="grooming-gallery-three-wrapper"
                  style={{ transform: `translateX(-${currentPremiumSlide * 100}%)` }}
                >
                  <div className="grooming-photo-group">
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/charm.jpg" 
                          alt="Charm" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=CHARM';
                            e.target.alt = 'Charm Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">CHARM</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/choco.jpg" 
                          alt="Choco" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=CHOCO';
                            e.target.alt = 'Choco Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">CHOCO</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/ekko.jpg" 
                          alt="Ekko" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=EKKO';
                            e.target.alt = 'Ekko Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">EKKO</div>
                    </div>
                  </div>
                  
                  <div className="grooming-photo-group">
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/miller.jpg" 
                          alt="Miller" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=MILLER';
                            e.target.alt = 'Miller Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">MILLER</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/pinky.jpg" 
                          alt="Pinky" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=PINKY';
                            e.target.alt = 'Pinky Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">PINKY</div>
                    </div>
                    
                    <div className="grooming-photo-card">
                      <div className="grooming-photo-square">
                        <img 
                          src="/src/assets/totie.jpg" 
                          alt="Totie" 
                          className="grooming-gallery-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300/fff2fa/f53799?text=TOTIE';
                            e.target.alt = 'Totie Placeholder';
                          }}
                        />
                      </div>
                      <div className="grooming-photo-name">TOTIE</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="grooming-gallery-arrow grooming-next-arrow" onClick={nextPremiumSlide}>
                →
              </button>
            </div>
            
            <div className="grooming-gallery-indicators">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  className={`grooming-gallery-indicator ${index === currentPremiumSlide ? 'grooming-active' : ''}`}
                  onClick={() => setCurrentPremiumSlide(index)}
                />
              ))}
            </div>
          </div>
          
          <div className="grooming-section-divider"></div>
        </div>
      </section>
    </div>
    <AuthModal
      show={showAuth}
      onClose={() => setShowAuth(false)}
      onSuccess={() => {
        setShowAuth(false);
        navigate(bookingPath);
      }}
    />
    </>
  );
};

export default Grooming;

