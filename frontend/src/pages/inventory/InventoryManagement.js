import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './InventoryManagement.css';
import API_BASE_URL from '../../config/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaDownload, FaSync, FaExclamationTriangle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ITEMS_PER_PAGE = 20;

function InventoryManagement() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStockCount: 0,
    totalInventoryValue: 0,
    categoryBreakdown: {}
  });

  const categories = [
    'All',
    'Carbs',
    'Meat',
    'Fresh',
    'Prepped Sauces',
    'Other Food Items',
    'Raw Sauces',
    'Herbs and Seasonings'
  ];

  const units = ['PCS', 'KG', 'PACK', 'JAR', 'BOTT', 'L', 'CAN', 'SACK'];
  const inventoryTypes = ['Daily', 'Weekly', 'Monthly', 'Every Other Week'];

  const [formData, setFormData] = useState({
    name: '',
    category: 'Other Food Items',
    unit: 'PCS',
    currentStock: 0,
    minimumThreshold: 5,
    maximumCapacity: '',
    reorderQuantity: '',
    unitCost: 0,
    supplier: '',
    location: '',
    expiryDate: '',
    remarks: '',
    inventoryType: 'Daily'
  });

  // Memoized filtered items with pagination
  const filteredItems = useMemo(() => {
    let filtered = inventoryItems;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.supplier?.toLowerCase().includes(term) ||
        item.location?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [inventoryItems, selectedCategory, searchTerm]);

  // Memoized paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Fetch inventory data - no auto-refresh, manual only
  useEffect(() => {
    fetchInventory();
    fetchSummary();
  }, []);

  const fetchInventory = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_BASE_URL}/api/inventory?isActive=true`);
      const data = await response.json();

      if (data.success) {
        setInventoryItems(data.items || []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/summary/overview`);
      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  }, []);

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Other Food Items',
      unit: 'PCS',
      currentStock: 0,
      minimumThreshold: 5,
      maximumCapacity: '',
      reorderQuantity: '',
      unitCost: 0,
      supplier: '',
      location: '',
      expiryDate: '',
      remarks: '',
      inventoryType: 'Daily'
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minimumThreshold: item.minimumThreshold,
      maximumCapacity: item.maximumCapacity || '',
      reorderQuantity: item.reorderQuantity || '',
      unitCost: item.unitCost,
      supplier: item.supplier || '',
      location: item.location || '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      remarks: item.remarks || '',
      inventoryType: item.inventoryType
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'currentStock' || name === 'minimumThreshold' || name === 'unitCost' || name === 'maximumCapacity' || name === 'reorderQuantity'
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSaveItem = async () => {
    if (!formData.name.trim()) {
      alert('Please enter item name');
      return;
    }

    try {
      const url = editingItem
        ? `${API_BASE_URL}/api/inventory/${editingItem._id}`
        : `${API_BASE_URL}/api/inventory`;

      const method = editingItem ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert(editingItem ? 'Item updated successfully' : 'Item created successfully');
        setShowModal(false);
        fetchInventory();
        fetchSummary();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item');
    }
  };

  const handleUpdateStock = async (itemId, action) => {
    const item = inventoryItems.find(i => i._id === itemId);
    if (!item) return;

    let quantity = 1;
    if (action === 'add' || action === 'subtract') {
      quantity = prompt(`Enter quantity to ${action}:`, '1');
      if (!quantity) return;
      quantity = parseInt(quantity);
      if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/${itemId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, action })
      });

      const data = await response.json();

      if (data.success) {
        fetchInventory();
        fetchSummary();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/${itemId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Item deleted successfully');
        fetchInventory();
        fetchSummary();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const getStockStatus = (current, minimum) => {
    if (current <= minimum) return 'low';
    if (current <= minimum * 1.5) return 'warning';
    return 'good';
  };

  const getLowStockItems = () => {
    return inventoryItems.filter(item => item.currentStock <= item.minimumThreshold);
  };

  const exportToCSV = () => {
    const headers = ['Item Name', 'Category', 'Current Stock', 'Unit', 'Minimum Threshold', 'Unit Cost', 'Total Value', 'Supplier', 'Location', 'Remarks'];
    const rows = filteredItems.map(item => [
      item.name,
      item.category,
      item.currentStock,
      item.unit,
      item.minimumThreshold,
      item.unitCost,
      (item.currentStock * item.unitCost).toFixed(2),
      item.supplier || '',
      item.location || '',
      item.remarks || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      {/* Header */}
      <div className="inventory-header">
        <div className="inventory-title">
          <h1 className="text-teal font-bold">Inventory Management</h1>
          <span>Alimento</span>
        </div>
        <div className="inventory-actions">
          <button className="btn btn-primary" onClick={handleAddNew}>
            <FaPlus /> Add Item
          </button>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <FaDownload /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={() => { fetchInventory(); fetchSummary(); }}>
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-content">
            <div className="summary-card-header">
              <h3>Total Items</h3>
              <div className="summary-icon">📦</div>
            </div>
            <div className="summary-value">{summary.totalItems}</div>
            <div className="summary-trend">Active inventory items</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-content">
            <div className="summary-card-header">
              <h3>Low Stock</h3>
              <div className="summary-icon">⚠️</div>
            </div>
            <div className="summary-value warning">{summary.lowStockCount}</div>
            <div className="summary-trend">Items below threshold</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-content">
            <div className="summary-card-header">
              <h3>Total Value</h3>
              <div className="summary-icon">💰</div>
            </div>
            <div className="summary-value">₱{summary.totalInventoryValue?.toFixed(0) || 0}</div>
            <div className="summary-trend">Inventory value</div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {getLowStockItems().length > 0 && (
        <div className="alert-box alert-warning">
          <FaExclamationTriangle className="alert-icon" />
          <div className="alert-content">
            <h4>Low Stock Alert</h4>
            <p>{getLowStockItems().length} items are below minimum threshold</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="inventory-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search items, supplier, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filter">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-bar">
        <span className="pagination-info">
          Showing {paginatedItems.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} of {filteredItems.length} items
        </span>
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <FaChevronLeft /> Previous
          </button>
          <span className="pagination-page">Page {currentPage} of {totalPages || 1}</span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table-card">
        <div className="table-header">
          <h2>Inventory Items ({filteredItems.length})</h2>
          <span className="table-subtitle">{selectedCategory !== 'All' ? selectedCategory : 'All Categories'}</span>
        </div>

        <div className="table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Unit</th>
                <th>Min. Threshold</th>
                <th>Unit Cost</th>
                <th>Total Value</th>
                <th>Supplier</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map(item => {
                  const status = getStockStatus(item.currentStock, item.minimumThreshold);
                  const totalValue = (item.currentStock * item.unitCost).toFixed(2);

                  return (
                    <tr key={item._id} className={`status-${status}`}>
                      <td className="item-name">
                        <strong>{item.name}</strong>
                        {item.remarks && <div className="item-remarks">{item.remarks}</div>}
                      </td>
                      <td>{item.category}</td>
                      <td className="stock-cell">
                        <div className="stock-display">
                          <span className="stock-number">{item.currentStock}</span>
                          <div className="stock-controls">
                            <button
                              className="stock-btn"
                              onClick={() => handleUpdateStock(item._id, 'add')}
                              title="Add stock"
                            >
                              +
                            </button>
                            <button
                              className="stock-btn"
                              onClick={() => handleUpdateStock(item._id, 'subtract')}
                              title="Remove stock"
                            >
                              −
                            </button>
                          </div>
                        </div>
                      </td>
                      <td>{item.unit}</td>
                      <td>{item.minimumThreshold}</td>
                      <td>₱{item.unitCost.toFixed(2)}</td>
                      <td className="value-cell">₱{totalValue}</td>
                      <td>{item.supplier || '—'}</td>
                      <td>{item.location || '—'}</td>
                      <td>
                        <span className={`status-badge status-${status}`}>
                          {status === 'low' && '🔴 Low'}
                          {status === 'warning' && '🟡 Warning'}
                          {status === 'good' && '🟢 Good'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteItem(item._id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="empty-state">
                    <div className="empty-state-content">
                      <div className="empty-state-icon">📭</div>
                      <p>No items found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., 110G CHORIZO"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="form-input"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleFormChange}
                    className="form-input"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Inventory Type</label>
                  <select
                    name="inventoryType"
                    value={formData.inventoryType}
                    onChange={handleFormChange}
                    className="form-input"
                  >
                    {inventoryTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Current Stock *</label>
                  <input
                    type="number"
                    name="currentStock"
                    value={formData.currentStock}
                    onChange={handleFormChange}
                    min="0"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Minimum Threshold *</label>
                  <input
                    type="number"
                    name="minimumThreshold"
                    value={formData.minimumThreshold}
                    onChange={handleFormChange}
                    min="0"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Unit Cost</label>
                  <input
                    type="number"
                    name="unitCost"
                    value={formData.unitCost}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleFormChange}
                    placeholder="Supplier name"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="Storage location"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleFormChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Remarks</label>
                  <input
                    type="text"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleFormChange}
                    placeholder="Additional notes"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveItem}>Save Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryManagement;
