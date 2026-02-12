import React from 'react';
import MapPinIcon from '../icons/MapPinIcon';
import ClockIcon from '../icons/ClockIcon';
import PhoneIcon from '../icons/PhoneIcon';
import EmailIcon from '../icons/EmailIcon';

const PortalFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="portal-footer">
      <div className="portal-footer-content">
        <div className="portal-footer-grid">
          <div className="footer-section">
            <div className="footer-section-header">
              <MapPinIcon size={24} color="currentColor" />
              <h3>Visit Us</h3>
            </div>
            <p className="footer-info">123 Food Street, Barangay Name</p>
            <p className="footer-info">City, Province 0000</p>
          </div>

          <div className="footer-section">
            <div className="footer-section-header">
              <ClockIcon size={24} color="currentColor" />
              <h3>Hours</h3>
            </div>
            <p className="footer-info">Monday - Sunday</p>
            <p className="footer-info">10:00 AM - 9:00 PM</p>
          </div>

          <div className="footer-section">
            <div className="footer-section-header">
              <PhoneIcon size={24} color="currentColor" />
              <h3>Contact</h3>
            </div>
            <a href="tel:+639171234567" className="footer-link">
              (+63) 917-123-4567
            </a>
            <a href="mailto:hello@alimentoresto.com" className="footer-link">
              hello@alimentoresto.com
            </a>
          </div>

          <div className="footer-section">
            <div className="footer-section-header">
              <EmailIcon size={24} color="currentColor" />
              <h3>Quick Ordering</h3>
            </div>
            <p className="footer-info">Browse our menu, customize items, and enjoy fast delivery to your location.</p>
          </div>
        </div>

        <div className="portal-footer-divider"></div>

        <div className="portal-footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} Alimento Restaurant. All rights reserved.
          </p>
          <p className="footer-credit">
            Food Ordering Portal
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PortalFooter;
