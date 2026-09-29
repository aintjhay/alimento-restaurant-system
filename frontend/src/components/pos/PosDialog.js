import React, { useEffect, useRef } from 'react';
import { FaCheck, FaReceipt, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import './PosDialog.css';

export default function PosDialog({ dialog, busy, onClose, onConfirm }) {
  const ref = useRef(null);
  const open = Boolean(dialog);

  useEffect(() => {
    if (!open) return;
    const element = ref.current;
    const previousFocus = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  if (!dialog) return null;
  const Icon = { confirm: FaReceipt, success: FaCheck, clear: FaTrash, error: FaExclamationTriangle }[dialog.type];
  const confirmation = dialog.type === 'confirm' || dialog.type === 'clear';

  return (
    <dialog ref={ref} className={`pos-dialog pos-dialog--${dialog.type}`}
      aria-labelledby="pos-dialog-title" aria-describedby="pos-dialog-description"
      aria-busy={busy} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className="pos-dialog-content">
        <span className="pos-dialog-icon" aria-hidden="true"><Icon /></span>
        <span className="pos-dialog-eyebrow">ALIMENTO POS</span>
        <h2 id="pos-dialog-title">{dialog.title}</h2>
        <p id="pos-dialog-description">{dialog.message}</p>
        {dialog.summary && (
          <dl className="pos-dialog-summary">
            {dialog.summary.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        )}
        <div className="pos-dialog-actions">
          {confirmation && <button type="button" className="pos-dialog-secondary" disabled={busy} onClick={onClose} autoFocus>Keep editing</button>}
          <button type="button" className="pos-dialog-primary" disabled={busy}
            autoFocus={!confirmation} onClick={confirmation ? onConfirm : onClose}>
            {busy ? 'Submitting order…' : dialog.action || 'Got it'}
          </button>
        </div>
        {busy && <p className="pos-dialog-progress" role="status">Please wait while we save your order.</p>}
      </div>
    </dialog>
  );
}
