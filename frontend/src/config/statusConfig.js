/**
 * Order Status Configuration
 * Centralized management of all order statuses with colors, icons, and labels
 * Easy to customize: just update this file to change status appearance app-wide
 */

import {
  PendingIcon,
  PreparingIcon,
  ReadyIcon,
  CompletedIcon,
  ClockIcon,
  ChefHatIcon,
} from '../icons/StatusIcons';

/**
 * Status Configuration Object
 * Each status has:
 * - label: Display text shown to users
 * - color: Primary color for badges (hex)
 * - bgColor: Background color for badges (rgba or hex)
 * - borderColor: Border color
 * - icon: SVG icon component (or null)
 * - severity: 'info' | 'warning' | 'success' | 'error' - for semantic styling
 */
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Finished',
    color: '#1565c0',
    bgColor: '#e3f2fd',
    borderColor: '#90caf9',
    icon: PendingIcon,
    severity: 'info',
    description: 'Order received, waiting to start',
  },
  preparing: {
    label: 'Preparing',
    color: '#e65100',
    bgColor: '#fff3e0',
    borderColor: '#ffb74d',
    icon: PreparingIcon,
    severity: 'warning',
    description: 'Kitchen is preparing the order',
  },
  ready: {
    label: 'Ready',
    color: '#2e7d32',
    bgColor: '#e8f5e9',
    borderColor: '#81c784',
    icon: ReadyIcon,
    severity: 'success',
    description: 'Order ready for pickup',
  },
  completed: {
    label: 'Completed',
    color: '#616161',
    bgColor: '#f5f5f5',
    borderColor: '#bdbdbd',
    icon: CompletedIcon,
    severity: 'default',
    description: 'Order completed and served',
  },
  // NEW: Additional statuses you can enable
  served: {
    label: 'Served',
    color: '#0d47a1',
    bgColor: '#c5cae9',
    borderColor: '#5e35b1',
    icon: ReadyIcon,
    severity: 'success',
    description: 'Order has been served to customer',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#c62828',
    bgColor: '#ffebee',
    borderColor: '#ef9a9a',
    icon: null,
    severity: 'error',
    description: 'Order was cancelled',
  },
};

/**
 * Payment Status Configuration
 * Customize payment statuses the same way
 */
export const PAYMENT_STATUS_CONFIG = {
  paid: {
    label: 'Paid',
    color: '#2e7d32',
    bgColor: '#e8f5e9',
    borderColor: '#81c784',
    icon: CompletedIcon,
    severity: 'success',
    description: 'Payment received',
  },
  unpaid: {
    label: 'Unpaid',
    color: '#c62828',
    bgColor: '#ffebee',
    borderColor: '#ef9a9a',
    icon: null,
    severity: 'error',
    description: 'Payment pending',
  },
  partially_paid: {
    label: 'Partial',
    color: '#f57c00',
    bgColor: '#ffe0b2',
    borderColor: '#ffb74d',
    icon: null,
    severity: 'warning',
    description: 'Partially paid',
  },
  pending_verification: {
    label: 'Verifying',
    color: '#1565c0',
    bgColor: '#e3f2fd',
    borderColor: '#90caf9',
    icon: ClockIcon,
    severity: 'info',
    description: 'Payment verification in progress',
  },
  verified: {
    label: 'Verified',
    color: '#2e7d32',
    bgColor: '#e8f5e9',
    borderColor: '#81c784',
    icon: CompletedIcon,
    severity: 'success',
    description: 'Payment verified',
  },
  refunded: {
    label: 'Refunded',
    color: '#0d47a1',
    bgColor: '#e1f5fe',
    borderColor: '#81d4fa',
    icon: null,
    severity: 'info',
    description: 'Payment refunded',
  },
};

/**
 * Get status config by key
 * Returns default config if status not found
 */
export const getOrderStatusConfig = (status) => {
  const normalizedStatus = String(status).toLowerCase().replace(/ /g, '_');
  return ORDER_STATUS_CONFIG[normalizedStatus] || {
    label: status || 'Unknown',
    color: '#999',
    bgColor: '#f5f5f5',
    borderColor: '#ddd',
    icon: null,
    severity: 'default',
    description: 'Unknown status',
  };
};

export const getPaymentStatusConfig = (status) => {
  const normalizedStatus = String(status).toLowerCase().replace(/ /g, '_');
  return PAYMENT_STATUS_CONFIG[normalizedStatus] || {
    label: status || 'Unknown',
    color: '#999',
    bgColor: '#f5f5f5',
    borderColor: '#ddd',
    icon: null,
    severity: 'default',
    description: 'Unknown status',
  };
};

/**
 * Get all available statuses (useful for filtering/dropdowns)
 */
export const getAvailableOrderStatuses = () => {
  return Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
    ...config,
  }));
};

export const getAvailablePaymentStatuses = () => {
  return Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.label,
    ...config,
  }));
};

/**
 * CUSTOMIZATION GUIDE
 * 
 * To add a new status:
 * 1. Add entry to ORDER_STATUS_CONFIG or PAYMENT_STATUS_CONFIG
 * 2. Choose a color and severity level
 * 3. Pick an icon (or use null for no icon)
 * 4. Components using getOrderStatusConfig() will automatically support it
 * 
 * To change existing status colors:
 * 1. Find the status in the config
 * 2. Update color, bgColor, borderColor
 * 3. Changes apply everywhere the status is used
 * 
 * Example: Change "Pending" to red instead of blue:
 * pending: {
 *   label: 'Pending',
 *   color: '#d32f2f',        ← Change this
 *   bgColor: '#ffebee',      ← Change this
 *   borderColor: '#ef9a9a',  ← Change this
 *   icon: PendingIcon,
 *   severity: 'error',       ← Or change severity
 * }
 */
