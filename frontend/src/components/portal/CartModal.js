import React from 'react';
import XIcon from '../icons/XIcon';
import TrashIcon from '../icons/TrashIcon';
import './CartModal.css';

const CartModal = ({ cart, onClose, onUpdateQuantity, onCheckout }) => {
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  const deliveryFee = 50;
  const cartTotal = cartSubtotal + deliveryFee;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const formatCurrency = (amount) => `₱${amount.toFixed(2)}`;
  const formatProductName = (name = '') => name
    .toLocaleLowerCase()
    .replace(/\b\w/g, letter => letter.toLocaleUpperCase())
    .replace(/\bBbq\b/g, 'BBQ');

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-header">
          <div>
            <h2>Your cart</h2>
            <p>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in your order</p>
          </div>
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
                    <h4>{formatProductName(item.name)}</h4>
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
                    <p className="item-price">{formatCurrency(item.itemPrice * item.quantity)}</p>
                  </div>
                  <div className="cart-modal-actions">
                    <span className="cart-modal-quantity-label">Quantity</span>
                    <div className="cart-modal-quantity">
                      <button className="qty-btn" onClick={() => onUpdateQuantity(index, -1)} aria-label={`Decrease ${item.name} quantity`}>
                        −
                      </button>
                      <span className="qty-display" aria-live="polite">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => onUpdateQuantity(index, 1)} aria-label={`Increase ${item.name} quantity`}>
                        +
                      </button>
                    </div>
                    <button className="cart-modal-remove" onClick={() => onUpdateQuantity(index, -item.quantity)} aria-label={`Remove ${item.name} from cart`} title="Remove item">
                      <TrashIcon size={17} />
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
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery fee <small>Standard delivery</small></span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <strong>{formatCurrency(cartTotal)}</strong>
              </div>
            </div>
            <button 
              className="cart-modal-checkout"
              onClick={onCheckout}
            >
              Proceed to checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;
