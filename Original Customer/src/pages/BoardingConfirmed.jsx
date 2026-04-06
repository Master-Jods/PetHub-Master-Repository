import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../backend/context/AuthContext';
import { createProfileBooking } from '../backend/services/profileDataService';
import './BoardingConfirmed.css';

const BoardingConfirmed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const [activeStep, setActiveStep] = useState(3);
  const steps = ['Information', 'Service Details', 'Confirmation'];
  const [isConfirming, setIsConfirming] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    pets: [],
    serviceType: '',
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    contact: '',
    totalPrice: 0
  });

  useEffect(() => {
    if (location.state) {
      const { selectedPets, serviceType, checkInDate, checkInTime, checkOutDate, checkOutTime } = location.state;
      
      // Calculate price based on service type and pet
      const totalPrice = calculateTotalPrice(selectedPets, serviceType);
      
      // Get contact info from first pet
      const contact = selectedPets?.[0]?.parentPhone || '';

      setBookingData({
        pets: selectedPets || [],
        serviceType: serviceType || '',
        checkInDate: checkInDate || '',
        checkInTime: checkInTime || '',
        checkOutDate: checkOutDate || '',
        checkOutTime: checkOutTime || '',
        contact: contact,
        totalPrice: totalPrice
      });
    }
  }, [location.state]);

  const calculateTotalPrice = (pets, serviceType) => {
    if (!pets || pets.length === 0 || !serviceType) return 0;
    
    // Simplified pricing - in real app, you'd have more complex logic
    let basePrice = serviceType === 'DAYCARE' ? 409.00 : 409.00; // Same base for demo
    return basePrice * pets.length;
  };

  const handleStepClick = (stepNumber) => {
    console.log('Step clicked:', stepNumber);
    
    switch(stepNumber) {
      case 1:
        navigate('/boarding/book', { state: location.state });
        break;
      case 2:
        navigate('/boarding/book', { state: { ...location.state, step: 2 } });
        break;
      case 3:
        setActiveStep(3);
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    navigate('/boarding/book', { state: { ...location.state, step: 2 } });
  };

  const handleConfirmBooking = async (e) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!authUser?.id) {
      alert('Please log in first to complete this booking.');
      return;
    }

    setIsConfirming(true);

    try {
      const firstPet = bookingData.pets?.[0] || null;
      const timeForSchedule = bookingData.checkInTime || location.state?.checkInTime || '';

      await createProfileBooking(authUser.id, {
        service: bookingData.serviceType === 'OVERNIGHT' ? 'Pet Boarding (Overnight)' : 'Pet Boarding (Daycare)',
        serviceType: 'boarding',
        petName: firstPet?.name || null,
        petBreed: firstPet?.breed || null,
        petType: firstPet?.type || null,
        petBirthday: firstPet?.birthday || null,
        date: bookingData.checkInDate,
        time: timeForSchedule,
        status: 'Processing',
        priceLabel: `PHP ${Number(bookingData.totalPrice || 0).toFixed(2)}`,
        note: bookingData.serviceType === 'OVERNIGHT' ? '24-hour stay' : '3-hour daycare stay',
        metadata: {
          serviceType: bookingData.serviceType,
          pets: bookingData.pets,
          checkInDate: bookingData.checkInDate,
          checkInTime: timeForSchedule,
          checkOutDate: bookingData.checkOutDate,
          checkOutTime: bookingData.checkOutTime,
          contact: bookingData.contact,
        },
      });
    } catch (error) {
      alert(error?.message || 'Unable to save booking right now. Please try again.');
      setIsConfirming(false);
      return;
    }
    
    // Navigate to appointment confirmed page
    navigate('/boarding-appointment-confirmed', { 
      state: { bookingData: bookingData } 
    });
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return 'Not specified';
    
    try {
      // Assuming time is in HH:MM format
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  return (
    <div className="ht-boarding-confirmation">
      <Container className="ht-boarding-confirmation-container">
        <Row className="ht-boarding-confirmation-title-row">
          <Col>
            <h1 className="ht-boarding-confirmation-main-title">Review Your Boarding Booking</h1>
            <p className="ht-boarding-confirmation-subtitle">
              Please confirm the details below.
            </p>
          </Col>
        </Row>

        <Row className="ht-boarding-confirmation-progress-row">
          <Col>
            <div className="ht-boarding-confirmation-progress-steps">
              <ProgressBar now={100} className="ht-boarding-confirmation-progress-bar" />
              <div className="ht-boarding-confirmation-step-indicators">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isClickable = stepNumber <= 3;
                  
                  return (
                    <div 
                      key={index} 
                      className={`ht-boarding-confirmation-step ${stepNumber === activeStep ? 'ht-boarding-confirmation-step-active' : ''} ${isClickable ? 'ht-boarding-confirmation-step-clickable' : ''}`}
                      onClick={() => isClickable && handleStepClick(stepNumber)}
                    >
                      <div className="ht-boarding-confirmation-step-circle">
                        <span>{stepNumber}</span>
                      </div>
                      <span className="ht-boarding-confirmation-step-label">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Col>
        </Row>

        <Row className="ht-boarding-confirmation-content-row">
          <Col lg={10} xl={8} className="mx-auto">
            <Card className="ht-boarding-confirmation-card">
              <Card.Body className="ht-boarding-confirmation-card-body">
                
                <div className="ht-boarding-confirmation-header">
                  <h2 className="ht-boarding-confirmation-header-title">Boarding Summary</h2>
                  <p className="ht-boarding-confirmation-header-subtitle">All your pet's boarding details in one place</p>
                </div>

                <div className="ht-boarding-confirmation-summary-grid">
                  {/* Left Column - Booking Details */}
                  <div className="ht-boarding-confirmation-details-column">
                    <div className="ht-boarding-confirmation-detail-section">
                      <h3 className="ht-boarding-confirmation-detail-title">
                        <span className="ht-boarding-confirmation-detail-badge">Pet Info</span>
                      </h3>
                      <div className="ht-boarding-confirmation-detail-content">
                        {bookingData.pets.map((pet, index) => (
                          <div key={index} className="ht-boarding-confirmation-pet-item">
                            <div className={`ht-boarding-confirmation-pet-avatar ht-boarding-confirmation-pet-${pet.type.toLowerCase()}`}>
                              {pet.type.charAt(0)}
                            </div>
                            <div className="ht-boarding-confirmation-pet-details">
                              <div className="ht-boarding-confirmation-pet-name">{pet.name}</div>
                              <div className="ht-boarding-confirmation-pet-info">{pet.breed} • {pet.size} Size • {pet.age}</div>
                            </div>
                          </div>
                        ))}
                        
                        {bookingData.pets.length === 0 && (
                          <div className="ht-boarding-confirmation-detail-item">
                            <span className="ht-boarding-confirmation-detail-label">No pets selected</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ht-boarding-confirmation-detail-section">
                      <h3 className="ht-boarding-confirmation-detail-title">
                        <span className="ht-boarding-confirmation-detail-badge">Dates & Time</span>
                      </h3>
                      <div className="ht-boarding-confirmation-detail-content">
                        <div className="ht-boarding-confirmation-detail-item">
                          <span className="ht-boarding-confirmation-detail-label">Check-in:</span>
                          <span className="ht-boarding-confirmation-detail-value">
                            {formatDateForDisplay(bookingData.checkInDate)}
                          </span>
                        </div>
                        <div className="ht-boarding-confirmation-detail-item">
                          <span className="ht-boarding-confirmation-detail-label">Check-out:</span>
                          <span className="ht-boarding-confirmation-detail-value">
                            {formatDateForDisplay(bookingData.checkOutDate)}
                          </span>
                        </div>
                        <div className="ht-boarding-confirmation-detail-item">
                          <span className="ht-boarding-confirmation-detail-label">Check-out Time:</span>
                          <span className="ht-boarding-confirmation-detail-value">
                            {formatTimeForDisplay(bookingData.checkOutTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ht-boarding-confirmation-detail-section">
                      <h3 className="ht-boarding-confirmation-detail-title">
                        <span className="ht-boarding-confirmation-detail-badge">Contact Info</span>
                      </h3>
                      <div className="ht-boarding-confirmation-detail-content">
                        <div className="ht-boarding-confirmation-detail-item">
                          <span className="ht-boarding-confirmation-detail-label">Phone:</span>
                          <span className="ht-boarding-confirmation-detail-value">{bookingData.contact || 'Not provided'}</span>
                        </div>
                        <div className="ht-boarding-confirmation-detail-item">
                          <span className="ht-boarding-confirmation-detail-label">Owner:</span>
                          <span className="ht-boarding-confirmation-detail-value">
                            {bookingData.pets[0]?.parentName || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Services & Total */}
                  <div className="ht-boarding-confirmation-services-column">
                    <div className="ht-boarding-confirmation-services-section">
                      <h3 className="ht-boarding-confirmation-detail-title">
                        <span className="ht-boarding-confirmation-detail-badge">Service Details</span>
                      </h3>
                      <div className="ht-boarding-confirmation-services-list-compact">
                        <div className="ht-boarding-confirmation-service-item-compact">
                          <div className="ht-boarding-confirmation-service-info">
                            <span className="ht-boarding-confirmation-service-name-compact">
                              {bookingData.serviceType || 'No service selected'}
                              {bookingData.serviceType === 'DAYCARE' && (
                                <span className="ht-boarding-confirmation-service-variant-compact">
                                  {' '}(3 hours)
                                </span>
                              )}
                              {bookingData.serviceType === 'OVERNIGHT' && (
                                <span className="ht-boarding-confirmation-service-variant-compact">
                                  {' '}(24 hours)
                                </span>
                              )}
                            </span>
                            {bookingData.serviceType && (
                              <div className="ht-boarding-confirmation-service-description-compact">
                                {bookingData.serviceType === 'DAYCARE' 
                                  ? 'Includes water, supervised playtime, and photo/video updates'
                                  : 'Includes 24/7 pet attendant, water, and photo/video updates'}
                              </div>
                            )}
                          </div>
                          <div className="ht-boarding-confirmation-service-price-compact">
                            {bookingData.serviceType ? '₱ 409 • Medium' : '-'}
                          </div>
                        </div>
                        
                        {bookingData.pets.length > 1 && (
                          <div className="ht-boarding-confirmation-service-item-compact">
                            <div className="ht-boarding-confirmation-service-info">
                              <span className="ht-boarding-confirmation-service-name-compact">
                                Additional Pets
                                <span className="ht-boarding-confirmation-service-variant-compact">
                                  {' '}({bookingData.pets.length - 1} pets)
                                </span>
                              </span>
                            </div>
                            <div className="ht-boarding-confirmation-service-price-compact">
                              + ₱ {409 * (bookingData.pets.length - 1)}
                            </div>
                          </div>
                        )}
                        
                        {!bookingData.serviceType && (
                          <p className="ht-boarding-confirmation-no-services">No service selected</p>
                        )}
                      </div>
                    </div>

                    <div className="ht-boarding-confirmation-total-section">
                      <div className="ht-boarding-confirmation-total-row ht-boarding-confirmation-final-total">
                        <span className="ht-boarding-confirmation-total-label">Total Price:</span>
                        <span className="ht-boarding-confirmation-total-price">₱ {bookingData.totalPrice}</span>
                      </div>
                      <div className="ht-boarding-confirmation-price-note">
                        *P50.00 per hour for every succeeding hour
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ht-boarding-confirmation-divider-main"></div>

                <div className="ht-boarding-confirmation-reminders-section">
                  <div className="ht-boarding-confirmation-reminders-header">
                    <h3 className="ht-boarding-confirmation-reminders-title">Important Reminders</h3>
                    <p className="ht-boarding-confirmation-reminders-description">
                      Please review these important details about your boarding booking:
                    </p>
                  </div>
                  
                  <div className="ht-boarding-confirmation-reminders-list">
                    <div className="ht-boarding-confirmation-reminder-group">
                      <h4 className="ht-boarding-confirmation-reminder-group-title">Confirmation & Communication</h4>
                      <ul className="ht-boarding-confirmation-reminder-items">
                        <li className="ht-boarding-confirmation-reminder-item">
                          You will receive a confirmation call or message within 2 hours after booking.
                        </li>
                        <li className="ht-boarding-confirmation-reminder-item">
                          Please ensure your phone is accessible for the confirmation call.
                        </li>
                      </ul>
                    </div>

                    <div className="ht-boarding-confirmation-reminder-group">
                      <h4 className="ht-boarding-confirmation-reminder-group-title">Check-in Requirements</h4>
                      <ul className="ht-boarding-confirmation-reminder-items">
                        <li className="ht-boarding-confirmation-reminder-item">
                          Please present your pet's vaccination card upon check-in.
                        </li>
                        <li className="ht-boarding-confirmation-reminder-item">
                          Bring your pet's regular food and feeding instructions.
                        </li>
                        <li className="ht-boarding-confirmation-reminder-item">
                          Check-in is available during business hours only.
                        </li>
                      </ul>
                    </div>

                    <div className="ht-boarding-confirmation-reminder-group">
                      <h4 className="ht-boarding-confirmation-reminder-group-title">Payment & Pricing</h4>
                      <ul className="ht-boarding-confirmation-reminder-items">
                        <li className="ht-boarding-confirmation-reminder-item">
                          Payment is made after the boarding stay is completed.
                        </li>
                        <li className="ht-boarding-confirmation-reminder-item">
                          Additional charges apply for extended hours.
                        </li>
                        <li className="ht-boarding-confirmation-reminder-item">
                          Free treats, bath, and drying service for stays of 3 days or longer.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="ht-boarding-confirmation-button-container">
                  <div className="ht-boarding-confirmation-buttons">
                    <Button 
                      variant="outline-secondary" 
                      onClick={handleBack}
                      className="ht-boarding-confirmation-back-btn"
                      type="button"
                    >
                      Back
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleConfirmBooking}
                      className="ht-boarding-confirmation-confirm-btn"
                      type="button"
                      disabled={isConfirming}
                    >
                      {isConfirming ? 'Confirming...' : 'Confirm Booking'}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default BoardingConfirmed;
