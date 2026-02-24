# How to Customize Order Statuses

## Overview

The status customization system works in 3 layers:

1. **statusConfig.js** - Central configuration file (colors, icons, labels)
2. **StatusBadge component** - Reusable badge component that reads the config
3. **OrderCard component** - Uses StatusBadge to display statuses

---

## Quick Start: Change Status Colors

### Step 1: Edit `frontend/src/config/statusConfig.js`

Find the status you want to customize in `ORDER_STATUS_CONFIG`:

```javascript
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#1565c0',        // ← Text color
    bgColor: '#e3f2fd',      // ← Background color
    borderColor: '#90caf9',  // ← Border color
    icon: PendingIcon,       // ← Badge icon
    severity: 'info',        // ← Severity level
    description: 'Order received, waiting to start',
  },
  // ... other statuses
};
```

### Step 2: Customize Any Value

**Example 1: Make "Pending" red instead of blue**
```javascript
pending: {
  label: 'Pending',
  color: '#d32f2f',        // Changed to red
  bgColor: '#ffebee',       // Light red background
  borderColor: '#ef9a9a',   // Red border
  icon: PendingIcon,
  severity: 'error',        // Changed to error
  description: 'Order received, waiting to start',
}
```

**Example 2: Change label text**
```javascript
pending: {
  label: 'Waiting to Start',  // ← Changed label
  color: '#1565c0',
  bgColor: '#e3f2fd',
  borderColor: '#90caf9',
  icon: PendingIcon,
  severity: 'info',
  description: 'Order received, waiting to start',
}
```

**Example 3: Remove the icon (null)**
```javascript
pending: {
  label: 'Pending',
  color: '#1565c0',
  bgColor: '#e3f2fd',
  borderColor: '#90caf9',
  icon: null,  // ← No icon
  severity: 'info',
  description: 'Order received, waiting to start',
}
```

---

## Adding New Statuses

### Step 1: Add to statusConfig.js

```javascript
export const ORDER_STATUS_CONFIG = {
  // ... existing statuses ...
  
  // NEW STATUS
  on_hold: {
    label: 'On Hold',
    color: '#f57c00',        // Orange
    bgColor: '#ffe0b2',
    borderColor: '#ffb74d',
    icon: ClockIcon,
    severity: 'warning',
    description: 'Order temporarily paused',
  },
};
```

### Step 2: Use it in your code

```javascript
import StatusBadge from '../components/common/StatusBadge';

// In your component:
<StatusBadge 
  status="on_hold"  // ← Automatically uses new config
  type="order"
  size="medium"
/>
```

---

## Using the StatusBadge Component

### Basic Usage

```javascript
import StatusBadge from '../components/common/StatusBadge';

// Shows: [icon] Pending
<StatusBadge status="pending" type="order" />

// For payment status
<StatusBadge status="paid" type="payment" />
```

### With Options

```javascript
// Small size, no icon
<StatusBadge 
  status="pending" 
  type="order"
  size="small"
  showIcon={false}
/>

// Large size with custom class
<StatusBadge 
  status="preparing" 
  type="order"
  size="large"
  className="custom-styling"
/>

// Label only, no icon
<StatusBadge 
  status="ready" 
  type="order"
  showLabel={true}
  showIcon={false}
/>
```

### Size Options
- `small` - Compact badge (good for tables)
- `medium` - Default size (most common)
- `large` - Prominent badge (headers)

---

## Status Configuration Properties Explained

| Property | Example | Purpose |
|----------|---------|---------|
| `label` | "Pending" | Text displayed in badge |
| `color` | "#1565c0" | Text/icon color (hex) |
| `bgColor` | "#e3f2fd" | Background color (hex or rgba) |
| `borderColor` | "#90caf9" | Border color (hex) |
| `icon` | `PendingIcon` | SVG icon component (or null) |
| `severity` | "info" | Type: info/warning/success/error/default |
| `description` | "..." | Tooltip text on hover |

---

## Predefined Statuses

### Order Statuses
- `pending` - Blue (info) - Waiting to start
- `preparing` - Orange (warning) - In progress
- `ready` - Green (success) - Ready for pickup
- `completed` - Gray (default) - Finished
- `served` - Dark blue (success) - Served to customer
- `cancelled` - Red (error) - Cancelled

### Payment Statuses
- `paid` - Green (success)
- `unpaid` - Red (error)
- `partially_paid` - Orange (warning)
- `pending_verification` - Blue (info)
- `verified` - Green (success)
- `refunded` - Light blue (info)

---

## How Changes Propagate

Once you update `statusConfig.js`, the changes apply **everywhere**:

```
statusConfig.js (source of truth)
    ↓
StatusBadge component (reads config)
    ↓
OrderCard (uses StatusBadge)
    ↓
Dashboard (displays orders)
    ↓
All status badges update automatically ✨
```

No need to edit individual components!

---

## Real-World Customization Examples

### Example 1: Restaurant-specific statuses

```javascript
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Ordering',  // More restaurant-friendly
    color: '#1565c0',
    bgColor: '#e3f2fd',
    borderColor: '#90caf9',
    icon: ClockIcon,
    severity: 'info',
  },
  preparing: {
    label: 'Cooking',   // Kitchen terminology
    color: '#e65100',
    bgColor: '#fff3e0',
    borderColor: '#ffb74d',
    icon: ChefHatIcon,
    severity: 'warning',
  },
  ready: {
    label: 'Pickup Ready',  // Clear action
    color: '#2e7d32',
    bgColor: '#e8f5e9',
    borderColor: '#81c784',
    icon: ReadyIcon,
    severity: 'success',
  },
};
```

### Example 2: Italian Restaurant theme (change colors)

```javascript
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#c41c3b',      // Italian red
    bgColor: '#fce4ec',
    borderColor: '#f48fb1',
    icon: PendingIcon,
    severity: 'warning',
  },
  ready: {
    label: 'Ready',
    color: '#2d5016',      // Italian green
    bgColor: '#e8f5e9',
    borderColor: '#81c784',
    icon: ReadyIcon,
    severity: 'success',
  },
};
```

### Example 3: Add urgency levels

```javascript
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#1565c0',
    bgColor: '#e3f2fd',
    borderColor: '#90caf9',
    icon: PendingIcon,
    severity: 'info',
    urgency: 'low',
  },
  critical: {
    label: 'URGENT',
    color: '#7f0000',       // Dark red
    bgColor: '#ffebee',
    borderColor: '#c62828',
    icon: AlertIcon,
    severity: 'error',
    urgency: 'critical',
  },
};
```

---

## Available Icons

All icons imported in statusConfig.js:

```javascript
import {
  PendingIcon,       // Clock icon
  PreparingIcon,     // Flame/cooking icon
  ReadyIcon,         // Checkmark icon
  CompletedIcon,     // Double checkmark
  ClockIcon,         // Time icon
  ChefHatIcon,       // Chef hat
  AlertIcon,         // Warning triangle
  CheckIcon,         // Single check
  // You can add more from StatusIcons or ForecastIcons
} from '../icons/StatusIcons';
```

---

## Troubleshooting

**Q: Changes to statusConfig.js don't appear**
- Clear browser cache: Ctrl+Shift+Delete (or Cmd+Shift+Delete)
- Restart dev server: npm start

**Q: Status has no icon**
- Set `icon: null` if you want text-only badge
- Or choose a different icon from the imports

**Q: Colors look wrong**
- Hex format must be correct: "#RRGGBB"
- Test color at: https://www.colorhexa.com/

**Q: Status not recognized**
- Check spelling: statusConfig keys are case-sensitive
- Use lowercase with underscores: `pending`, `on_hold`, not `Pending` or `onHold`

---

## Files Modified

- ✅ `frontend/src/config/statusConfig.js` - Central configuration
- ✅ `frontend/src/components/common/StatusBadge.js` - Reusable badge
- ✅ `frontend/src/components/common/StatusBadge.css` - Styling

## Next Steps

1. Update your OrderCard to use `<StatusBadge>` component
2. Customize colors in statusConfig.js
3. Add new statuses as needed
4. Update RecentOrders filter options to match new statuses
