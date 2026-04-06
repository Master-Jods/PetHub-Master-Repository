import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './AppointmentConfirmed.css';

const AppointmentConfirmed = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="appt-confirmed-page">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={6} md={8} sm={10}>
            <Card className="appt-confirmed-card text-center">
              <Card.Body>
                {/* Success Icon */}
                <div className="appt-confirmed-icon">
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
                <h1 className="appt-confirmed-title">
                  Appointment Confirmed!
                </h1>

                {/* Message */}
                <p className="appt-confirmed-message">
                  Your grooming appointment has been successfully scheduled.
                </p>

                {/* Back to Home Button */}
                <Button 
                  variant="primary" 
                  onClick={handleBackToHome}
                  className="appt-confirmed-home-btn"
                >
                  Back to Home
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AppointmentConfirmed;