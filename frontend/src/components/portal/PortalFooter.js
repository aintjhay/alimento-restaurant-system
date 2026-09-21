import React, { useEffect, useState } from 'react';
import { getStore } from '../../services/storeService';
import MapPinIcon from '../icons/MapPinIcon';
import ClockIcon from '../icons/ClockIcon';
import PhoneIcon from '../icons/PhoneIcon';
import { FaFacebook, FaInstagram } from 'react-icons/fa';

const PortalFooter = () => {
  const [store, setStore] = useState(null);
  useEffect(() => { getStore().then(setStore).catch(() => {}); }, []);
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
            <address className="footer-info footer-address">
              GF JYC Building, CL Ledesma Ave.<br />
              National Highway, San Carlos City
            </address>
            <a href="https://www.google.com/maps/search/?api=1&query=Alimento%20GF%20JYC%20Building%20CL%20Ledesma%20Ave%20National%20Highway%20San%20Carlos%20City" target="_blank" rel="noopener noreferrer" className="footer-link">
              Get directions <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="footer-section">
            <div className="footer-section-header">
              <ClockIcon size={24} color="currentColor" />
              <h3>Hours</h3>
            </div>
            <p className="footer-info">{store?.openingTime || '11:00'} - {store?.closingTime || '20:00'} (Philippine time)</p>
            <p className="footer-info">{(store?.closedDays || [0]).map(day => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]).join(', ')}{(store?.closedDays || [0]).length ? ' - Closed' : 'Open daily'}</p>
          </div>

          <div className="footer-section">
            <div className="footer-section-header">
              <PhoneIcon size={24} color="currentColor" />
              <h3>Contact</h3>
            </div>
            <a href="tel:+639629702060" className="footer-link">
              0962 970 2060
            </a>
            <a href="mailto:alimento.resto@gmail.com" className="footer-link">
              alimento.resto@gmail.com
            </a>
          </div>

          <div className="footer-section">
            <div className="footer-section-header">
              <h3>Follow Us</h3>
            </div>
            <div className="footer-social-links">
              <a href="https://web.facebook.com/profile.php?id=61573922645951" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <FaFacebook size={18} />
                Facebook
              </a>
              <a href="https://www.instagram.com/alimentoresto.ph/" target="_blank" rel="noopener noreferrer" className="footer-social-link">
                <FaInstagram size={18} />
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="portal-footer-divider"></div>

        <div className="portal-footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} Alimento Restaurant. All rights reserved.
          </p>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} className="footer-link footer-back-to-top">
            Back to top <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default PortalFooter;
