import React, { useEffect, useRef, useState } from 'react';
import { FaCheck, FaChevronDown } from 'react-icons/fa';

export default function OrdersStatusFilter({ tab, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const optionsRef = useRef([]);
  const options = [
    { value: '', text: tab === 'active' ? 'All active' : 'All history' },
    ...(tab === 'active'
      ? ['pending', 'preparing', 'ready', 'served', 'out_for_delivery']
      : ['completed', 'cancelled']).map(status => ({
      value: status,
      text: status === 'out_for_delivery' ? 'Out for delivery' : status.charAt(0).toUpperCase() + status.slice(1)
    }))
  ];
  const selected = Math.max(0, options.findIndex(option => option.value === value));

  useEffect(() => {
    if (!open) return;
    optionsRef.current[focused]?.focus();
  }, [open, focused]);

  useEffect(() => {
    if (!open) return;
    const dismiss = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  const close = () => { setOpen(false); trigger.current?.focus(); };
  const show = () => { setFocused(selected); setOpen(true); };

  return (
    <div className="pos-orders-status" ref={root}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <span id="pos-orders-status-label" className="pos-orders-status-label">Status</span>
      <button ref={trigger} type="button" className="pos-orders-status-trigger"
        aria-labelledby="pos-orders-status-label pos-orders-status-value" aria-haspopup="listbox"
        aria-expanded={open} aria-controls={open ? 'pos-orders-status-options' : undefined}
        onClick={() => open ? close() : show()}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); }
        }}>
        <span id="pos-orders-status-value">{options[selected].text}</span>
        <FaChevronDown aria-hidden="true" />
      </button>
      {open && <div id="pos-orders-status-options" className="pos-orders-status-options"
        role="listbox" aria-labelledby="pos-orders-status-label"
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
          else if (event.key === 'ArrowDown') { event.preventDefault(); setFocused(index => (index + 1) % options.length); }
          else if (event.key === 'ArrowUp') { event.preventDefault(); setFocused(index => (index - 1 + options.length) % options.length); }
          else if (event.key === 'Home') { event.preventDefault(); setFocused(0); }
          else if (event.key === 'End') { event.preventDefault(); setFocused(options.length - 1); }
        }}>
        {options.map((option, index) => <button key={option.value} type="button" role="option"
          ref={element => { optionsRef.current[index] = element; }}
          aria-selected={value === option.value} tabIndex={focused === index ? 0 : -1}
          onFocus={() => setFocused(index)}
          onClick={() => { onChange(option.value); close(); }}>
          <span>{option.text}</span>{value === option.value && <FaCheck aria-hidden="true" />}
        </button>)}
      </div>}
    </div>
  );
}
