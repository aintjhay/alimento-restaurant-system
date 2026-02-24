/**
 * StatusSettings - Admin page to customize order and payment statuses
 * Change labels, colors, and other properties through UI
 */

import React, { useState, useEffect } from 'react';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '../../config/statusConfig';
import { 
  saveCustomStatuses, 
  getCustomOrderStatuses, 
  getCustomPaymentStatuses,
  resetStatusConfigs 
} from '../../services/statusConfigService';
import './StatusSettings.css';

const StatusSettings = () => {
  const [orderStatuses, setOrderStatuses] = useState(ORDER_STATUS_CONFIG);
  const [paymentStatuses, setPaymentStatuses] = useState(PAYMENT_STATUS_CONFIG);
  const [activeTab, setActiveTab] = useState('order');
  const [savedMessage, setSavedMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Load saved custom configs on mount
  useEffect(() => {
    setOrderStatuses(getCustomOrderStatuses());
    setPaymentStatuses(getCustomPaymentStatuses());
  }, []);

  // Handle order status change
  const handleOrderStatusChange = (key, property, value) => {
    setOrderStatuses(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [property]: value
      }
    }));
    setIsDirty(true);
    setSavedMessage('');
  };

  // Handle payment status change
  const handlePaymentStatusChange = (key, property, value) => {
    setPaymentStatuses(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [property]: value
      }
    }));
    setIsDirty(true);
    setSavedMessage('');
  };

  // Save changes
  const handleSave = () => {
    saveCustomStatuses(orderStatuses, paymentStatuses);
    setIsDirty(false);
    setSavedMessage('✅ Status configurations saved!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm('Are you sure? This will reset all status customizations to defaults.')) {
      resetStatusConfigs();
      setOrderStatuses(ORDER_STATUS_CONFIG);
      setPaymentStatuses(PAYMENT_STATUS_CONFIG);
      setIsDirty(false);
      setSavedMessage('✅ Restored to default configurations');
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  // Render status config form
  const renderStatusForm = (statuses, handleChange, prefix) => {
    return (
      <div className="status-config-list">
        {Object.entries(statuses).map(([key, config]) => (
          <div key={key} className="status-config-item">
            <div className="status-header">
              <h3>
                <span className="status-key">{key}</span>
              </h3>
              <div 
                className="color-preview"
                style={{ 
                  backgroundColor: config.bgColor,
                  borderColor: config.borderColor,
                  color: config.color
                }}
              >
                {config.label}
              </div>
            </div>

            <div className="status-fields">
              {/* Label */}
              <div className="form-group">
                <label>Display Label</label>
                <input
                  type="text"
                  value={config.label}
                  onChange={(e) => handleChange(key, 'label', e.target.value)}
                  placeholder="e.g., Pending, Waiting, In Progress"
                />
              </div>

              {/* Text Color */}
              <div className="form-group">
                <label>Text/Icon Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={config.color}
                    onChange={(e) => handleChange(key, 'color', e.target.value)}
                  />
                  <input
                    type="text"
                    value={config.color}
                    onChange={(e) => handleChange(key, 'color', e.target.value)}
                    className="color-text"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="form-group">
                <label>Background Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={config.bgColor}
                    onChange={(e) => handleChange(key, 'bgColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={config.bgColor}
                    onChange={(e) => handleChange(key, 'bgColor', e.target.value)}
                    className="color-text"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Border Color */}
              <div className="form-group">
                <label>Border Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={config.borderColor}
                    onChange={(e) => handleChange(key, 'borderColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={config.borderColor}
                    onChange={(e) => handleChange(key, 'borderColor', e.target.value)}
                    className="color-text"
                    placeholder="#cccccc"
                  />
                </div>
              </div>

              {/* Severity */}
              <div className="form-group">
                <label>Severity Level</label>
                <select
                  value={config.severity}
                  onChange={(e) => handleChange(key, 'severity', e.target.value)}
                >
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Orange)</option>
                  <option value="success">Success (Green)</option>
                  <option value="error">Error (Red)</option>
                  <option value="default">Default (Gray)</option>
                </select>
              </div>

              {/* Description/Tooltip */}
              <div className="form-group full-width">
                <label>Description (Tooltip)</label>
                <textarea
                  value={config.description}
                  onChange={(e) => handleChange(key, 'description', e.target.value)}
                  rows="2"
                  placeholder="Hover text shown to users"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="status-settings-container">
      <div className="settings-header">
        <h1>📋 Status Management</h1>
        <p>Customize order and payment statuses that appear throughout the system</p>
      </div>

      {/* Alert Message */}
      {savedMessage && <div className="alert-message">{savedMessage}</div>}

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'order' ? 'active' : ''}`}
          onClick={() => setActiveTab('order')}
        >
          📦 Order Statuses
        </button>
        <button
          className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment')}
        >
          💳 Payment Statuses
        </button>
      </div>

      {/* Content */}
      <div className="settings-content">
        {activeTab === 'order' && (
          <div className="tab-content">
            <h2>Order Statuses</h2>
            <p className="tab-description">
              Customize how order statuses appear in your dashboard
            </p>
            {renderStatusForm(orderStatuses, handleOrderStatusChange, 'order')}
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="tab-content">
            <h2>Payment Statuses</h2>
            <p className="tab-description">
              Customize how payment statuses appear in your dashboard
            </p>
            {renderStatusForm(paymentStatuses, handlePaymentStatusChange, 'payment')}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <button 
          className="btn-reset"
          onClick={handleReset}
          title="Reset all customizations to defaults"
        >
          ↺ Reset to Defaults
        </button>
        <button
          className={`btn-save ${isDirty ? 'active' : 'disabled'}`}
          onClick={handleSave}
          disabled={!isDirty}
        >
          {isDirty ? '💾 Save Changes' : '✓ All Saved'}
        </button>
      </div>

      {/* Help Section */}
      <div className="settings-help">
        <h3>💡 Tips</h3>
        <ul>
          <li><strong>Label:</strong> The text shown in badges (e.g., "Pending", "Waiting", "In Progress")</li>
          <li><strong>Colors:</strong> Use the color picker or enter hex codes (e.g., #1565c0)</li>
          <li><strong>Severity:</strong> Changes the visual weight of the status</li>
          <li><strong>Description:</strong> Tooltip text shown when users hover over a status</li>
          <li><strong>Changes apply instantly</strong> after clicking "Save Changes"</li>
        </ul>
      </div>
    </div>
  );
};

export default StatusSettings;
