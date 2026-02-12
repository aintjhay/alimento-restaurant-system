import React from 'react';
import XIcon from '../icons/XIcon';
import './CartModal.css';

const CartModal = ({ cart, onClose, onUpdateQuantity, onCheckout }) => {
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  const taxAmount = cartSubtotal * 0.12;
  const deliveryFee = 50;
  const cartTotal = cartSubtotal + taxAmount + deliveryFee;

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h2>Order Cart</h2>
          <button className="cart-modal-close" onClick={onClose}>
            <XIcon size={24} color="#1f2937" />
          </button>
        </div>

        <div className="cart-modal-content">
          {cart.length === 0 ? (
            <div className="cart-modal-empty">
              <p>Your cart is empty</p>
              <p className="empty-subtitle">Add items to get started!</p>
            </div>
          ) : (
            <div className="cart-modal-items">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="cart-modal-item">
                  <div className="cart-modal-item-details">
                    <h4>{item.name}</h4>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="item-modifiers">
                        {item.modifiers.map(mod => mod.selectedOption).join(', ')}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="item-instructions">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                    <p className="item-price">₱{(item.itemPrice * item.quantity).toFixed(0)}</p>
                  </div>
                  <div className="cart-modal-quantity">
                    <button 
                      className="qty-btn"
                      onClick={() => onUpdateQuantity(index, -1)}
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => onUpdateQuantity(index, 1)}
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-modal-footer">
            <div className="cart-modal-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₱{cartSubtotal.toFixed(0)}</span>
              </div>
              <div className="summary-row">
                <span>VAT (12%):</span>
                <span>₱{taxAmount.toFixed(0)}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <strong>₱{cartTotal.toFixed(0)}</strong>
              </div>
            </div>
            <button 
              className="cart-modal-checkout"
              onClick={onCheckout}
            >
              🛒 Submit Order - Table 1
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
