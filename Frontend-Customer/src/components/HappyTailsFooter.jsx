import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './HappyTailsFooter.css';

const HappyTailsFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="happy-tails-footer-section">
      <Container>
        <Row>
          <Col md={4}>
            <div className="footer-brand">
              <h3>
                <span className="footer-happy">Happy</span>
                <span className="footer-tails">Tails</span>
              </h3>
              <p>Your pet's paradise since 2015</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="footer-hours">
              <h4>Operating Hours</h4>
              <p>Monday - Friday: 8:00 AM - 7:30 PM</p>
              <p>Saturday - Sunday: 8:00 AM - 8:00 PM</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="footer-contact">
              <h4>Contact Us</h4>
              <p>FB: Happy Tails Pet Cafe - Lucena</p>
              <p>IG: @happytailspetcafelc</p>
              <p>Phone: 0917 520 9713</p>
              <p>Email: happytailspetcafe@gmail.com</p>
              <p className="footer-address">
                AMCJ Commercial Building, Bonifacio Drive, Pleasantville Subdivision, 
                Phase 1, Ilayang Iyam, Lucena, Philippines, 4301
              </p>
            </div>
          </Col>
        </Row>
        <div className="footer-bottom">
          <p>© {currentYear} HappyTails. All rights reserved.</p>
          <p>Pet Shop, Grooming, Boarding & Cafe Services</p>
        </div>
      </Container>
    </footer>
  );
};

export default HappyTailsFooter;