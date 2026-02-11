import React from 'react';
import { useNavigate } from 'react-router-dom';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import './Portal.css';

const PortalCheckoutChoice = () => {
  const navigate = useNavigate();

  const handleGuestCheckout = () => {
    localStorage.setItem('portalCheckoutType', 'guest');
    localStorage.removeItem('portalUser');
    navigate('/portal/checkout');
  };

  const handleLoginCheckout = () => {
    navigate('/portal/login');
  };

  return (
    <div className="portal-page">
      <PortalHeader />
      
      <main className="portal-main">
        <div className="checkout-choice-container">
          <div className="checkout-choice-header">
            <h1>Choose Checkout Method</h1>
            <p>Select how you'd like to proceed with your order</p>
          </div>

          <div className="checkout-choice-grid">
            {/* Guest Checkout */}
            <div 
              className="choice-card guest-card"
              onClick={handleGuestCheckout}
            >
              <div className="choice-icon">👤</div>
              <h2>Guest Checkout</h2>
              <p className="choice-description">One-time order</p>
              <ul className="choice-features">
                <li>✓ No account needed</li>
                <li>✓ Quick checkout</li>
                <li>✓ Enter name, phone, address</li>
              </ul>
              <button className="choice-btn guest-btn">
                Continue as Guest
              </button>
            </div>

            {/* Login/Register */}
            <div 
              className="choice-card login-card"
              onClick={handleLoginCheckout}
            >
              <div className="choice-icon">👨‍💼</div>
              <h2>Login / Register</h2>
              <p className="choice-description">Save your preferences</p>
              <ul className="choice-features">
                <li>✓ Create account</li>
                <li>✓ Save addresses</li>
                <li>✓ Track orders</li>
              </ul>
              <button className="choice-btn login-btn">
                Login or Register
              </button>
            </div>
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
};

export default PortalCheckoutChoice;
