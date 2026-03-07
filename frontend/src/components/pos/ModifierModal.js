import React, { useState } from 'react';
import { getFoodImage } from '../../utils/imageUtils';
import './ModifierModal.css';

function ModifierModal({ item, isOpen, onClose, onAddToCart }) {
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [selectedAddons, setSelectedAddons] = useState([]);
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
    let modifierPrice = null; // For replacement modifiers (Temperature, Size, etc.)
    let modifierExtra = 0;    // For additional modifiers
    
    // Check modifiers
    Object.entries(selectedModifiers).forEach(([modifierName, modValue]) => {
      // Modifiers like Temperature, Size, Quantity replace the base price
      if (['Temperature', 'Size', 'Quantity'].includes(modifierName)) {
        modifierPrice = modValue.extraPrice;
      } else {
        // Other modifiers add to the price
        modifierExtra += modValue.extraPrice;
      }
    });
    
    // Calculate item total (using replacement price or base price)
    const unitPrice = modifierPrice !== null ? modifierPrice : item.price;
    const itemTotal = unitPrice * quantity + modifierExtra;
    
    // Add addon prices (not multiplied by quantity)
    let addonTotal = 0;
    selectedAddons.forEach(addon => {
      addonTotal += addon.price;
    });
    
    return itemTotal + addonTotal;
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
        
        <div className="modifier-modal-body">
          {/* Item Image */}
          {item.image && (
            <div className="item-image-section">
              <img src={getFoodImage(item.image)} alt={item.name} className="item-image" />
            </div>
          )}
          
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

          {/* Price Summary */}
          <div className="price-summary">
            {/* Show base price or selected replacement modifier price */}
            {Object.entries(selectedModifiers).some(([modName]) => 
              ['Temperature', 'Size', 'Quantity'].includes(modName)
            ) ? (
              // If a replacement modifier is selected, show it instead of base price
              <div className="price-row">
                <span>
                  {Object.entries(selectedModifiers)
                    .filter(([modName]) => ['Temperature', 'Size', 'Quantity'].includes(modName))
                    .map(([modName, modValue]) => `${modName} (${modValue.name})`)
                    .join(', ')}:
                </span>
                <span>
                  ₱{(Object.values(selectedModifiers).find(mod => 
                    Object.keys(selectedModifiers).some(k => ['Temperature', 'Size', 'Quantity'].includes(k))
                  )?.extraPrice || item.price).toFixed(2)} × {quantity}
                </span>
              </div>
            ) : (
              // No replacement modifier, show base price
              <div className="price-row">
                <span>Base Price:</span>
                <span>₱{item.price.toFixed(2)} × {quantity}</span>
              </div>
            )}
            
            {/* Show additional modifiers (non-replacement) */}
            {Object.entries(selectedModifiers)
              .filter(([modName]) => !['Temperature', 'Size', 'Quantity'].includes(modName))
              .map(([modName, modValue], index) => (
                <div key={index} className="price-row">
                  <span>{modName} ({modValue.name}):</span>
                  <span>{modValue.extraPrice > 0 ? '+' : ''}₱{modValue.extraPrice.toFixed(2)}</span>
                </div>
              ))}
            
            {/* Show add-ons */}
            {selectedAddons.map((addon, index) => (
              <div key={index} className="price-row">
                <span>{addon.name}:</span>
                <span>+₱{addon.price.toFixed(2)}</span>
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