import React from 'react';
import { useNavigate } from 'react-router-dom';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import './Portal.css';

const PortalConfirmation = () => {
  const navigate = useNavigate();
  const lastOrder = JSON.parse(localStorage.getItem('portalLastOrder') || '{}');

  return (
    <div className="portal-page">
      <PortalHeader />
      
      <div className="portal-confirmation">
        <p className="portal-kicker">Order received</p>
        <h1>Thank you for ordering</h1>
        <p>Your payment will be verified. We will update the status in the dashboard.</p>
        <div className="confirmation-card">
          <h3>Order number</h3>
          <strong>{lastOrder.orderNumber || 'Pending'}</strong>
        </div>
        <button className="primary-btn" onClick={() => navigate('/portal')}>
          Back to menu
        </button>
      </div>
      
      <PortalFooter />
    </div>
  );
};

export default PortalConfirmation;
