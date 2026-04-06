import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import './BoardingAppointmentConfirmed.css';

const BoardingAppointmentConfirmed = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleBackToBoarding = () => {
    navigate('/boarding');
  };

  return (
    <div className="ht-boarding-appt-confirmed">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={6} md={8} sm={10}>
            <Card className="ht-boarding-appt-confirmed-card text-center">
              <Card.Body>
                {/* Success Icon */}
                <div className="ht-boarding-appt-confirmed-icon">
                  <svg 
                    width="80" 
                    height="80" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="11" fill="#4CAF50"/>
                    <path 
                      d="M7 12.5L10 15.5L17 8.5" 
                      stroke="white" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Main Title */}
                <h1 className="ht-boarding-appt-confirmed-title">
                  Boarding Booking Confirmed!
                </h1>

                {/* Message */}
                <p className="ht-boarding-appt-confirmed-message">
                  Your pet's boarding stay has been successfully scheduled at Happy Tails.
                  <br />
                  Our team will contact you shortly to confirm availability and details.
                </p>

                {/* Button Container */}
                <div className="ht-boarding-appt-confirmed-button-container">
                  <Button 
                    variant="outline-primary" 
                    onClick={handleBackToBoarding}
                    className="ht-boarding-appt-confirmed-back-btn"
                  >
                    Back to Boarding
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleBackToHome}
                    className="ht-boarding-appt-confirmed-home-btn"
                  >
                    Back to Home
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default BoardingAppointmentConfirmed;