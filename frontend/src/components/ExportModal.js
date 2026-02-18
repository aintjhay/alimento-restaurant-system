import React, { useState } from 'react';
import { downloadFromAPI } from '../../services/exportService';
import './ExportModal.css';

const ExportModal = ({ isOpen, onClose, type = 'orders' }) => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('all');
  const [status, setStatus] = useState('all');

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      setSuccess(false);

      let endpoint = `http://localhost:5000/api/${type}/export/${exportFormat}`;
      let filename = `${type}-export-${new Date().toISOString().split('T')[0]}.${exportFormat === 'pdf' ? 'pdf' : 'csv'}`;

      // Add query parameters based on filters
      const params = new URLSearchParams();
      
      if (dateRange !== 'all') {
        const today = new Date();
        let startDate;
        
        if (dateRange === '7days') {
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRange === '30days') {
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        
        if (startDate) {
          params.append('startDate', startDate.toISOString().split('T')[0]);
        }
      }
      
      if (status !== 'all' && type === 'orders') {
        params.append('status', status);
      }

      if (params.toString()) {
        endpoint += '?' + params.toString();
      }

      const result = await downloadFromAPI(endpoint, filename);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to export: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal-content" onClick={e => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2>📥 Export {type === 'orders' ? 'Orders' : 'Forecast'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="export-modal-body">
          {/* Format Selection */}
          <div className="form-group">
            <label>Export Format</label>
            <div className="format-options">
              <label className="radio-option">
                <input 
                  type="radio" 
                  value="csv" 
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <span className="option-label">
                  <strong>📊 CSV</strong>
                  <small>Spreadsheet format, best for Excel</small>
                </span>
              </label>
              <label className="radio-option">
                <input 
                  type="radio" 
                  value="pdf" 
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <span className="option-label">
                  <strong>📄 PDF</strong>
                  <small>Report format, best for printing</small>
                </span>
              </label>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="form-group">
            <label>Date Range</label>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="form-select"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          {/* Status Filter (for orders) */}
          {type === 'orders' && (
            <div className="form-group">
              <label>Order Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="form-select"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="export-message error-message">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="export-message success-message">
              ✅ Export completed! Your file is downloading...
            </div>
          )}

          {/* Preview Info */}
          <div className="export-preview">
            <p className="preview-title">📋 Preview:</p>
            <ul>
              <li>Format: <strong>{exportFormat.toUpperCase()}</strong></li>
              <li>Date Range: <strong>{dateRange === 'all' ? 'All Time' : dateRange}</strong></li>
              {type === 'orders' && <li>Status: <strong>{status === 'all' ? 'All' : status}</strong></li>}
              <li>File Size: <strong>Estimated</strong></li>
            </ul>
          </div>
        </div>

        <div className="export-modal-footer">
          <button 
            className="btn btn-outline export-cancel-btn"
            onClick={onClose}
            disabled={exporting}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary export-confirm-btn"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <span className="spinner-small"></span>
                Exporting...
              </>
            ) : (
              <>
                📥 Export Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
