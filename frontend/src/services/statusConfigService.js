/**
 * Status Management Service
 * Handles loading and saving custom status configurations
 * Can use localStorage or connect to backend
 */

import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, getOrderStatusConfig, getPaymentStatusConfig } from '../config/statusConfig';

const STORAGE_KEY = 'alimento_status_config';

/**
 * Get saved custom status config or defaults
 */
export const getCustomOrderStatuses = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved).order;
    }
  } catch (error) {
    console.error('Error loading custom status config:', error);
  }
  return ORDER_STATUS_CONFIG;
};

export const getCustomPaymentStatuses = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved).payment;
    }
  } catch (error) {
    console.error('Error loading custom status config:', error);
  }
  return PAYMENT_STATUS_CONFIG;
};

/**
 * Save custom status configurations
 */
export const saveCustomStatuses = (orderStatuses, paymentStatuses) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      order: orderStatuses,
      payment: paymentStatuses,
      lastUpdated: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.error('Error saving status config:', error);
    return false;
  }
};

/**
 * Reset to default configurations
 */
export const resetStatusConfigs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error resetting status config:', error);
    return false;
  }
};

/**
 * Get status with custom overrides
 */
export const getOrderStatusWithCustom = (status) => {
  const custom = getCustomOrderStatuses();
  const key = String(status).toLowerCase().replace(/ /g, '_');
  return custom[key] || getOrderStatusConfig(status);
};

export const getPaymentStatusWithCustom = (status) => {
  const custom = getCustomPaymentStatuses();
  const key = String(status).toLowerCase().replace(/ /g, '_');
  return custom[key] || getPaymentStatusConfig(status);
};
