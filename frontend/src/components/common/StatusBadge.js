/**
 * StatusBadge - Reusable customizable status badge component
 * Uses centralized status configuration for consistent styling
 */

import React from 'react';
import { getOrderStatusConfig, getPaymentStatusConfig } from '../../config/statusConfig';
import './StatusBadge.css';

const StatusBadge = ({ 
  status, 
  type = 'order', // 'order' or 'payment'
  size = 'medium', // 'small' | 'medium' | 'large'
  showIcon = true,
  showLabel = true,
  className = '',
}) => {
  // Get configuration based on type
  const config = type === 'payment' 
    ? getPaymentStatusConfig(status)
    : getOrderStatusConfig(status);

  const IconComponent = config.icon;

  return (
    <span
      className={`status-badge status-${config.severity} size-${size} ${className}`}
      style={{
        '--status-color': config.color,
        '--status-bg': config.bgColor,
        '--status-border': config.borderColor,
      }}
      title={config.description}
    >
      {showIcon && IconComponent && (
        <IconComponent size={size === 'small' ? 14 : size === 'large' ? 20 : 16} color={config.color} />
      )}
      {showLabel && <span className="badge-label">{config.label}</span>}
    </span>
  );
};

export default StatusBadge;
