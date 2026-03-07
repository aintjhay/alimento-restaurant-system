import React, { useRef } from 'react';
import './ReceiptModal.css';
import logoImg from '../../assets/images/logo/alimentologo.png';
import { FaTimes, FaPrint } from 'react-icons/fa';

function ReceiptModal({ isOpen, onClose, cartItems, subtotal, tax, total, paymentMethod, tableNumber, orderType, customerName }) {
  const receiptRef = useRef();

  if (!isOpen) return null;

  const currentDate = new Date();
  const orderNumber = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  const formattedDate = currentDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=900,width=500');
    const receiptHTML = generateReceiptHTML();
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const generateReceiptHTML = () => {
    const itemsHTML = cartItems.map((item) => {
      const itemTotal = ((item.price || 0) * item.quantity).toFixed(2);
      return `
        <div class="receipt-item">
          <div class="receipt-item-info">
            <div class="receipt-item-name">${item.quantity} x ${item.name}</div>
            <div class="receipt-item-meta">₱${(item.price || 0).toFixed(2)} each</div>
          </div>
          <div class="receipt-item-total">₱${itemTotal}</div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: white;
            padding: 20px;
          }
          .receipt-container {
            width: 4in;
            margin: 0 auto;
            background: white;
            padding: 25px;
            border: 1px solid #ddd;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 15px;
          }
          .receipt-logo {
            width: 70px;
            height: 70px;
            margin: 0 auto 10px;
          }
          .receipt-logo img {
            width: 100%;
            height: auto;
          }
          .receipt-restaurant-name {
            font-size: 22px;
            font-weight: 700;
            color: #333;
            margin-bottom: 5px;
          }
          .receipt-address {
            font-size: 11px;
            color: #666;
            line-height: 1.5;
          }
          .receipt-order-info {
            background: #f9f9f9;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 12px;
          }
          .receipt-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .receipt-info-row:last-child {
            margin-bottom: 0;
          }
          .receipt-info-label {
            font-weight: 600;
            color: #333;
          }
          .receipt-info-value {
            color: #666;
          }
          .receipt-items {
            margin: 20px 0;
          }
          .receipt-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 12px;
          }
          .receipt-item:last-child {
            border-bottom: none;
          }
          .receipt-item-info {
            flex: 1;
          }
          .receipt-item-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 3px;
          }
          .receipt-item-meta {
            font-size: 11px;
            color: #999;
          }
          .receipt-item-total {
            font-weight: 600;
            color: #333;
            min-width: 60px;
            text-align: right;
          }
          .receipt-summary {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #ddd;
          }
          .receipt-summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
          }
          .receipt-summary-row.total {
            font-size: 16px;
            font-weight: 700;
            color: #333;
            border-top: 1px solid #ddd;
            padding-top: 8px;
            margin-top: 8px;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 2px solid #f0f0f0;
            font-size: 11px;
            color: #999;
          }
          .receipt-thank-you {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
            font-size: 13px;
          }
          .receipt-timestamp {
            font-size: 10px;
            color: #ccc;
            margin-top: 10px;
          }
          @media print {
            body { width: 4in; margin: 0; padding: 0; }
            .receipt-container { width: 4in; margin: 0; padding: 20px; border: none; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <div class="receipt-logo">
              <img src="${logoImg}" alt="Alimento">
            </div>
            <div class="receipt-restaurant-name">ALIMENTO</div>
            <div class="receipt-address">
              GF, JYC Bldg., CL Ledesma Ave.<br>
              National Highway, San Carlos City
            </div>
          </div>

          <div class="receipt-order-info">
            <div class="receipt-info-row">
              <span class="receipt-info-label">Order #</span>
              <span class="receipt-info-value">${orderNumber}</span>
            </div>
            <div class="receipt-info-row">
              <span class="receipt-info-label">Date</span>
              <span class="receipt-info-value">${formattedDate}</span>
            </div>
            <div class="receipt-info-row">
              <span class="receipt-info-label">Time</span>
              <span class="receipt-info-value">${formattedTime}</span>
            </div>
            <div class="receipt-info-row">
              <span class="receipt-info-label">Type</span>
              <span class="receipt-info-value">${orderType}${tableNumber ? ` - Table #${tableNumber}` : ''}</span>
            </div>
            ${customerName ? `
            <div class="receipt-info-row">
              <span class="receipt-info-label">Customer</span>
              <span class="receipt-info-value">${customerName}</span>
            </div>
            ` : ''}
          </div>

          <div class="receipt-items">
            ${itemsHTML}
          </div>

          <div class="receipt-summary">
            <div class="receipt-summary-row">
              <span>Subtotal</span>
              <span>₱${subtotal.toFixed(2)}</span>
            </div>
            <div class="receipt-summary-row">
              <span>Tax (12%)</span>
              <span>₱${tax.toFixed(2)}</span>
            </div>
            <div class="receipt-summary-row total">
              <span>Total</span>
              <span>₱${total.toFixed(2)}</span>
            </div>
            <div class="receipt-summary-row">
              <span>Payment</span>
              <span>${paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          <div class="receipt-footer">
            <div class="receipt-thank-you">Thank You!</div>
            <div>Come back soon</div>
            <div class="receipt-timestamp">${currentDate.toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-modal-header">
          <h2>Receipt Preview</h2>
          <button className="receipt-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="receipt-modal-body" ref={receiptRef}>
          <div className="receipt-container">
            <div className="receipt-header">
              <div className="receipt-logo">
                <img src={logoImg} alt="Alimento" />
              </div>
              <div className="receipt-restaurant-name">ALIMENTO</div>
              <div className="receipt-address">
                GF, JYC Bldg., CL Ledesma Ave.<br/>
                National Highway, San Carlos City
              </div>
            </div>

            <div className="receipt-order-info">
              <div className="receipt-info-row">
                <span className="receipt-info-label">Order #</span>
                <span className="receipt-info-value">{orderNumber}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-info-label">Date</span>
                <span className="receipt-info-value">{formattedDate}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-info-label">Time</span>
                <span className="receipt-info-value">{formattedTime}</span>
              </div>
              <div className="receipt-info-row">
                <span className="receipt-info-label">Type</span>
                <span className="receipt-info-value">{orderType}{tableNumber ? ` - Table #${tableNumber}` : ''}</span>
              </div>
              {customerName && (
                <div className="receipt-info-row">
                  <span className="receipt-info-label">Customer</span>
                  <span className="receipt-info-value">{customerName}</span>
                </div>
              )}
            </div>

            <div className="receipt-items">
              {cartItems.map((item, index) => {
                const itemTotal = ((item.price || 0) * item.quantity).toFixed(2);
                return (
                  <div key={index} className="receipt-item">
                    <div className="receipt-item-info">
                      <div className="receipt-item-name">{item.quantity} x {item.name}</div>
                      <div className="receipt-item-meta">₱{(item.price || 0).toFixed(2)} each</div>
                    </div>
                    <div className="receipt-item-total">₱{itemTotal}</div>
                  </div>
                );
              })}
            </div>

            <div className="receipt-summary">
              <div className="receipt-summary-row">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="receipt-summary-row">
                <span>Tax (12%)</span>
                <span>₱{tax.toFixed(2)}</span>
              </div>
              <div className="receipt-summary-row total">
                <span>Total</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
              <div className="receipt-summary-row">
                <span>Payment</span>
                <span>{paymentMethod.toUpperCase()}</span>
              </div>
            </div>

            <div className="receipt-footer">
              <div className="receipt-thank-you">Thank You!</div>
              <div>Come back soon</div>
              <div className="receipt-timestamp">{currentDate.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="receipt-modal-footer">
          <button className="receipt-print-btn" onClick={handlePrint}>
            <FaPrint /> Print Receipt
          </button>
          <button className="receipt-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
