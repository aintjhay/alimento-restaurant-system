# Visual Component Reference - Preview Guide

## 📺 Component Previews & Style Guide

### 1. Dashboard Statistics Cards

#### Visual Preview:
```
┌─────────────────────────────────────┐
│ 📦                                  │
│ TOTAL ORDERS                        │
│ 147                                 │
│ ↑ 12% this week                     │  (Green text, hover: raise 6px)
└─────────────────────────────────────┘

Grid: 4 columns on desktop, responsive down to 1 column on mobile
Each card is white with border-radius: 16px
Top border animates on hover: gradient from moss-green to peach
Shadow elevates from 8px to 16px on hover
```

#### CSS Structure:
```css
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.75rem;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: none;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0,0,0, 0.12);
}
```

---

### 2. Order Filter Buttons

#### Visual Preview:
```
┌─────────────────────────────────────────────────────────┐
│ [All Orders] [Pending] [Preparing] [Ready] [Completed] │
│                                                          │
│ State: Default                                          │
│ - Light border (e5e7eb)                                │
│ - Transparent background                               │
│ - font-size: 0.95rem                                   │
│ - padding: 0.85rem 1.5rem                              │
│                                                          │
│ State: Hover                                            │
│ - Slightly raised (translateY -2px)                    │
│ - Background color lightens                             │
│ - Shadow appears: 0 4px 8px                            │
│                                                          │
│ State: Active                                           │
│ - Background: gradient(135deg, #2f6f6a, #26625e)      │
│ - Color: white                                          │
│ - Shadow: 0 6px 16px rgba(47,111,106, 0.3)            │
└─────────────────────────────────────────────────────────┘
```

#### Animation Preview:
```
Default → Hover (300ms):
  opacity: 1 → 0.9
  transform: none → translateY(-2px)
  background: transparent → rgba(47,111,106, 0.05)
  
Default → Active (300ms):
  background: white → gradient(moss to dark-moss)
  color: #1f2937 → white
  shadow: 2px → 16px blur
```

---

### 3. Order Card (Collapsed State)

#### Visual Preview:
```
┌────────────────────────────────────────────────────────────────┐
│ ORD-00024 │ 3 items • ₱1,250.50 │ PENDING ⏳ │ Est. 35 min │ 🔻│
│            │                                                    │
│ Order Date & Time Info  │ Status Details │ Actions            │
└────────────────────────────────────────────────────────────────┘

Left Section:
- Order number badge: 56x56px, gradient background, moss-green border
- Quick info: Customer name, items count, total amount
- Date/Time: Gray text, smaller font

Right Section:
- Status badge: Color-coded (Pending=orange, Preparing=blue, etc.)
- Estimated time: Orange background with left border
- Expand icon: Rotates 180° on click

Border: 4px left border in status color
Shadow: 2px on default, 16px on hover
Border-radius: 14px
```

#### Expanded State Preview:
```
┌────────────────────────────────────────────────────────────────┐
│ ORD-00024 │ 3 items • ₱1,250.50 │ PENDING │ Est. 35 min │ 🔼│
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ STATUS TIMELINE                                                │
│ ⏳ Pending ——— ✓ Confirmed ——— 👨‍🍳 Preparing ——— ✅ Completed │
│ 10:30 AM      10:35 AM           (in progress)  Unknown       │
│                                                                 │
│ ORDER ITEMS                                                    │
│ ┌─ Fried Chicken (2) ...................... ₱1,000.00 ─┐      │
│ │ Special: Extra crispy, no skin                         │      │
│ │ [+ Garlic Sauce] [+ Chili Powder]                      │      │
│ └──────────────────────────────────────────────────────┘      │
│                                                                 │
│ ORDER SUMMARY                                                  │
│ Subtotal ..................... ₱1,200.00                      │
│ Delivery Fee ................. ₱50.00                         │
│ ────────────────────────────────                              │
│ Total Amount ................. ₱1,250.00 ✅                   │
│                                                                 │
│ ORDER DETAILS                                                  │
│ Payment Status: PAID ✓ | Method: GCash | Delivery: Yes      │
│ Address: 123 Main St, Makati, Metro Manila                   │
│                                                                 │
│ [REORDER] [VIEW DETAILS]                                      │
└────────────────────────────────────────────────────────────────┘

Expanded background: #fafafa (very light gray)
Smooth slide-down animation (0.3s)
Items have individual hover: border changes, background lightens
Timeline takes up full width with visual progression
```

---

### 4. Status Timeline Component

#### Visual Preview:
```
Mobile View (480px):           Desktop View (1200px+):

⏳ Pending                      ⏳ Pending ——— ✓ Confirmed ——— 👨‍🍳 Preparing ——— ✅
2024-01-15 10:30 AM          │ 10:30 AM  │ 10:35 AM      │ 10:45 AM

✓ Confirmed                    Progress bar fills as steps complete
2024-01-15 10:35 AM          Each step is 25% (4 steps = 100%)
                              
👨‍🍳 Preparing                    Colors:
2024-01-15 10:45 AM          - Completed steps: Green
(Currently here)              - Current step: Orange (pulsing)
                              - Future steps: Gray
✅ Completed
(Unknown)

Timeline Text:
- Step name: 300 weight, uppercase
- Timestamp: 0.85rem, gray text
- Current step highlighted in orange
- Completed steps checkmark (✓)
```

---

### 5. Section Header with Icon

#### Visual Preview:
```
┌────────────────────────────────────────────────────────────────┐
│ 📦 Recent Orders                                  [View All]   │
│                                                                 │
│ ▁▂▃▄ (Animated emoji bounce: up/down every 1.5s)             │
│                                                                 │
│ Font Size: 2.8rem (header), 0.9rem (action button)           │
│ Color: Moss green (#2f6f6a)                                   │
│ Border-bottom: 2px solid rgba(colors)                         │
│ Action button: Hover background animates                      │
└────────────────────────────────────────────────────────────────┘

Animation Details:
- Icon bounces: 0.3s ease-out, 0.3s ease-in (continuous)
- Height offset: +8px at peak, -8px at bottom
- Timing: Repeats every 2 seconds
- Smooth curve: cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

### 6. Loading State

#### Visual Preview:
```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          ⟲ Loading...                          │
│                                                                 │
│ Spinner:                                                       │
│ - Size: 56px x 56px                                           │
│ - Border: 4px, #e5e7eb                                        │
│ - Animation: Rotate 360° (1.2s cubic-bezier)                  │
│ - Border-radius: 50% (circle)                                 │
│ - Top border: #2f6f6a (stands out)                            │
│                                                                 │
│ Text: "Loading..." below spinner, 0.95rem, gray              │
└────────────────────────────────────────────────────────────────┘

Animation Path:
0ms:    0deg   ↻
300ms:  90deg  ↻↻
600ms:  180deg ↻↻↻
900ms:  270deg ↻↻↻↻
1200ms: 360deg ↻ (repeats)

Easing: cubic-bezier(0.4, 0.2, 0.8, 0.2) - fast-slow-fast
```

---

### 7. Empty State

#### Visual Preview:
```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│                           🍽️                                   │
│                     (Floating animation)                       │
│                                                                 │
│                    No Orders Found                             │
│           Start by placing your first order!                  │
│                                                                 │
│ ┌──────────────────────────────────────────┐                  │
│ │ Consider trying our special deals today  │  (Gradient bg)   │
│ └──────────────────────────────────────────┘                  │
│                                                                 │
│ Background: Gradient (rgba moss → rgba peach)                │
│ Border: 2px dashed (#d1d5db)                                  │
│ Border-radius: 16px                                           │
│ Padding: 3rem                                                  │
│                                                                 │
│ Emoji: 4rem, floating +30px → -30px (3s loop)                │
│ Text: 1.1rem bold, centered, dark color                       │
└────────────────────────────────────────────────────────────────┘

Floating Animation:
- Starts at 0px vertical offset
- Peaks at +30px (upward)
- Bottom at -30px (downward)
- Duration: 3s, ease-in-out
- Repeats infinitely
```

---

### 8. Toast Notification

#### Visual Preview:
```
Success Notification:
┌──────────────────────────────────────────────────┐
│ ✅ Order status updated to "Preparing"           │ ×
└──────────────────────────────────────────────────┘

Warning Notification:
┌──────────────────────────────────────────────────┐
│ ⚠️ Delivery delayed by 10 minutes                │ ×
└──────────────────────────────────────────────────┘

Error Notification:
┌──────────────────────────────────────────────────┐
│ ❌ Payment failed. Please try again.             │ ×
└──────────────────────────────────────────────────┘

Info Notification:
┌──────────────────────────────────────────────────┐
│ ℹ️ New items added to menu                       │ ×
└──────────────────────────────────────────────────┘

Position: Top-right corner, 20px from edge
Width: Auto, max 400px
Slide-in animation: 300ms from right
Auto-dismiss: After 5 seconds (300ms slide-out)
Colors:
- Success: Green background (#d1fae5), green text (#065f46)
- Warning: Amber background, amber text
- Error: Red background (#fee2e2), red text (#991b1b)
- Info: Blue background (#dbeafe), blue text (#0369a1)
```

---

### 9. Order Item (In Card)

#### Visual Preview:
```
┌─────────────────────────────────────────────────────────┐
│ Fried Chicken                        Qty  2    ₱1,000   │
│ Special Instructions: Extra crispy, no skin (purple bg) │
│ [+ Garlic Sauce] [+ Chili] [+ Extra Rice]              │
│                                                          │
│ Light gray background on hover                         │
│ Border changes from light to medium gray               │
│ Smooth transition: 0.2s                                │
└─────────────────────────────────────────────────────────┘

Item Name: 600 weight, 13px, dark text
Quantity Badge: 28x24px, background #f3f4f6, centered
Price: 600 weight, 13px, green (#22863a), right-aligned

Instructions Tag:
- Background: #fdf2f8 (light purple)
- Text: #7c3aed (purple)
- Left border: 2px solid #7c3aed
- Padding: 6px 8px
- Border-radius: 4px

Modifier Tags:
- Background: #dbeafe (light blue)
- Text: #0369a1 (dark blue)
- Border: 0.5px solid #bfdbfe
- Padding: 3px 8px
- Border-radius: 4px
```

---

### 10. Color Reference Visual

#### Palette Grid:
```
Primary Moss          Dark Moss            Peach               Stone
#2f6f6a             #26625e              #f9c9b6             #f0f0ed
████████████████    ████████████████    ████████████████    ████████████████

Cream                Status Colors:
#f9f5f0              Pending             Preparing           Ready
████████████████    #ff9800 (Orange)    #3f51b5 (Blue)      #22c55e (Green)
                    ████████████████    ████████████████    ████████████████

Shadow Colors (for text/borders):
Light Gray          Medium Gray          Dark Gray
#e5e7eb            #9ca3af              #6b7280
████████████████    ████████████████    ████████████████
```

---

### 11. Responsive Breakpoints Visual

#### Desktop (1200px+):
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Dashboard                                                   │
├─────────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│ │ Orders     │ │ Pending    │ │ Revenue    │ │ Avg Value  │    │
│ │ 147        │ │ 8          │ │ ₱150,000   │ │ ₱1,020     │    │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                   │
│ ┌────────────────────────────────┐ ┌────────────────────────┐   │
│ │ Recent Orders                  │ │ Order Status           │   │
│ │ ORD-00024 | PENDING | ₱1,250   │ │ Pending:      8       │   │
│ │ ORD-00023 | READY   | ₱980     │ │ Preparing:    3       │   │
│ │ ORD-00022 | DONE    | ₱1,150   │ │ Ready:        2       │   │
│ └────────────────────────────────┘ │ Completed:    134     │   │
│                                     └────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Tablet (768px):
```
┌────────────────────────────────────────────┐
│  📊 Dashboard                              │
├────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐          │
│ │ Orders       │ │ Pending      │          │
│ │ 147          │ │ 8            │          │
│ └──────────────┘ └──────────────┘          │
│ ┌──────────────┐ ┌──────────────┐          │
│ │ Revenue      │ │ Avg Value    │          │
│ │ ₱150,000     │ │ ₱1,020       │          │
│ └──────────────┘ └──────────────┘          │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ Recent Orders                          │ │
│ │ ORD-00024 | PENDING | ₱1,250          │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

#### Mobile (480px):
```
┌──────────────────────────┐
│  📊 Dashboard            │
├──────────────────────────┤
│ ┌────────────────────┐   │
│ │ Orders             │   │
│ │ 147                │   │
│ └────────────────────┘   │
│ ┌────────────────────┐   │
│ │ Pending            │   │
│ │ 8                  │   │
│ └────────────────────┘   │
│ ┌────────────────────┐   │
│ │ Revenue            │   │
│ │ ₱150,000           │   │
│ └────────────────────┘   │
│ ┌────────────────────┐   │
│ │ Avg Value          │   │
│ │ ₱1,020             │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │ Recent Orders      │   │
│ │ ORD-00024 PENDING  │   │
│ │ ₱1,250             │   │
│ └────────────────────┘   │
└──────────────────────────┘
```

---

### 12. Animation Timeline Examples

#### Filter Button Hover Animation:
```
Timeline:  0ms ──────── 100ms ───────────────── 300ms ────────────── 500ms
          
State:    Default       Halfway                 Hover              Hold
          
Scale:    0.95x        ↓ 1.0x                   1.0x              1.0x
          
Position: y: 0px       y: -1px          y: -2px (peak)      y: -2px
          
Shadow:   2px          ↓ 8px            16px blur            16px blur
          
Opacity:  1.0          1.0              1.0                  1.0

Easing:   cubic-bezier(0.4, 0, 0.2, 1) - Material Design standard
```

#### Order Card Slide Down Expansion:
```
Timeline:  0ms ────────── 150ms ───────────────── 300ms (Complete)
          
Height:    0px          ↓ Content height/2      Full height
          
Opacity:   0.0          ↓ 0.5                   1.0
          
Max Height: 0px         ↓ 1000px/2              2000px
          
Easing:    cubic-bezier(0.4, 0, 0.2, 1) throughout
```

---

## 🎨 Implementation Guide

### Using These Previews

1. **For Design Reference**: Use the ASCII previews to understand component structure
2. **For Animation Timing**: Check the timeline examples for timing information
3. **For Color Reference**: Use the palette grid for exact hex codes
4. **For Responsive Testing**: Test at the breakpoints shown in the grid layouts
5. **For Custom Styling**: Reference the CSS snippets provided

### Common Customizations

```css
/* Change primary color */
:root {
  --portal-moss: #YOUR_NEW_COLOR;
  --dash-primary: #YOUR_NEW_COLOR;
}

/* Adjust animation speed */
.order-filters {
  animation: slideInUp 0.7s ease; /* Change from 0.5s to 0.7s */
}

/* Modify shadow depth */
.stat-card:hover {
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15); /* Deeper shadow */
}

/* Adjust card padding */
.dashboard-section {
  padding: 3rem; /* Changed from 2rem */
}
```

---

*Version: 2.0.0*
*Last Updated: 2026-02-24*
*Component Preview Guide Complete*
