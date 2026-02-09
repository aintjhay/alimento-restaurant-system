import React, { useState } from 'react';
import './ModifierModal.css';

function ModifierModal({ item, isOpen, onClose, onAddToCart }) {
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !item) return null;

  const handleModifierChange = (modifierName, optionName, extraPrice) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [modifierName]: { name: optionName, extraPrice }
    }));
  };

  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.name === addon.name);
      if (exists) {
        return prev.filter(a => a.name !== addon.name);
      } else {
        return [...prev, addon];
      }
    });
  };

  const calculateTotalPrice = () => {
    let total = item.price;
    
    // Add modifier prices
    Object.values(selectedModifiers).forEach(mod => {
      total += mod.extraPrice;
    });
    
    // Add addon prices
    selectedAddons.forEach(addon => {
      total += addon.price;
    });
    
    return total * quantity;
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: item._id || item.id,
      name: item.name,
      basePrice: item.price,
      price: calculateTotalPrice() / quantity, // Price per item
      quantity: quantity,
      modifiers: Object.entries(selectedModifiers).map(([key, value]) => ({
        modifierName: key,
        selectedOption: value.name,
        extraPrice: value.extraPrice
      })),
      addons: selectedAddons,
      specialInstructions: specialInstructions,
      image: item.image,
      category: item.category
    };

    onAddToCart(cartItem);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedModifiers({});
    setSelectedAddons([]);
    setSpecialInstructions('');
    setQuantity(1);
  };

  const hasRequiredModifiers = () => {
    if (!item.modifiers) return true;
    
    const requiredModifiers = item.modifiers.filter(mod => mod.required);
    return requiredModifiers.every(mod => selectedModifiers[mod.name]);
  };

  return (
    <div className="modifier-modal-overlay">
      <div className="modifier-modal">
        <div className="modal-header">
          <h2>{item.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* Quantity Selector */}
          <div className="quantity-selector">
            <label>Quantity:</label>
            <div className="quantity-controls">
              <button 
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="qty-btn"
              >
                −
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                onClick={() => setQuantity(prev => prev + 1)}
                className="qty-btn"
              >
                +
              </button>
            </div>
          </div>

          {/* Modifiers */}
          {item.modifiers && item.modifiers.length > 0 && (
            <div className="modifiers-section">
              <h3>Options</h3>
              {item.modifiers.map((modifier, index) => (
                <div key={index} className="modifier-group">
                  <label className="modifier-label">
                    {modifier.name} {modifier.required && <span className="required">*</span>}
                  </label>
                  <div className="modifier-options">
                    {modifier.options.map((option, optIndex) => (
                      <label key={optIndex} className="option-label">
                        <input
                          type="radio"
                          name={modifier.name}
                          value={option.name}
                          checked={selectedModifiers[modifier.name]?.name === option.name}
                          onChange={() => handleModifierChange(modifier.name, option.name, option.price)}
                          required={modifier.required}
                        />
                        <span className="option-name">{option.name}</span>
                        {option.price > 0 && (
                          <span className="option-price">+₱{option.price}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Addons */}
          {item.addons && item.addons.length > 0 && (
            <div className="addons-section">
              <h3>Add-ons</h3>
              {item.addons.map((addon, index) => (
                <label key={index} className="addon-label">
                  <input
                    type="checkbox"
                    checked={selectedAddons.some(a => a.name === addon.name)}
                    onChange={() => handleAddonToggle(addon)}
                  />
                  <span className="addon-name">{addon.name}</span>
                  <span className="addon-price">+₱{addon.price}</span>
                </label>
              ))}
            </div>
          )}

          {/* Special Instructions */}
          <div className="instructions-section">
            <label>Special Instructions:</label>
            <textarea
              placeholder="E.g., No onions, extra sauce, etc."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows="3"
            />
          </div>

          {/* Price Summary */}
          <div className="price-summary">
            <div className="price-row">
              <span>Base Price:</span>
              <span>₱{item.price.toFixed(2)} × {quantity}</span>
            </div>
            
            {Object.values(selectedModifiers).map((mod, index) => (
              <div key={index} className="price-row">
                <span>{mod.name}:</span>
                <span>+₱{mod.extraPrice} × {quantity}</span>
              </div>
            ))}
            
            {selectedAddons.map((addon, index) => (
              <div key={index} className="price-row">
                <span>{addon.name}:</span>
                <span>+₱{addon.price} × {quantity}</span>
              </div>
            ))}
            
            <div className="price-row total">
              <span>Total:</span>
              <span>₱{calculateTotalPrice().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button 
            onClick={handleAddToCart} 
            className="add-btn"
            disabled={!hasRequiredModifiers()}
          >
            Add to Cart - ₱{calculateTotalPrice().toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModifierModal;