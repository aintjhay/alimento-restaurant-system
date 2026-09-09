import React, { useState, useEffect, useMemo } from 'react';
import './InventoryManagement.css';
import './InventoryRefresh.css';
import { FiPackage, FiAlertTriangle, FiSlash, FiDollarSign } from 'react-icons/fi';
import { getStockStatus, filterStockItems } from './inventoryView';
import API_BASE_URL from '../../config/api';
import { authHeaders } from '../../services/api';
import AdminNav from '../../components/admin/AdminNav';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaDownload, FaSync, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
  const [stockFilter, setStockFilter] = useState('all');
  const [loadError, setLoadError] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const summary = useMemo(() => ({
    totalItems: inventoryItems.length,
    lowStockCount: inventoryItems.filter(item => getStockStatus(item.currentStock, item.minimumThreshold) === 'low').length,
    outOfStockCount: inventoryItems.filter(item => Number(item.currentStock) <= 0).length,
    totalInventoryValue: inventoryItems.reduce((sum, item) => sum + Number(item.currentStock || 0) * Number(item.unitCost || 0), 0)
  }), [inventoryItems]);

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
    productId: '',
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

    return filterStockItems(filtered, stockFilter);
  }, [inventoryItems, selectedCategory, searchTerm, stockFilter]);

  // Memoized paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, stockFilter]);

  useEffect(() => { setCurrentPage(page => Math.min(page, Math.max(1, totalPages))); }, [totalPages]);

  // Fetch inventory data - no auto-refresh, manual only
  useEffect(() => {
    fetchInventory();
    fetch(`${API_BASE_URL}/api/admin/product-options`, { headers: authHeaders() })
      .then(response => response.json())
      .then(result => setProductOptions(result.data || []))
      .catch(() => setProductOptions([]));
  }, []);

  const fetchInventory = async () => {
    try {
      setRefreshing(true);
      setLoadError('');
      const response = await fetch(`${API_BASE_URL}/api/admin/inventory?isActive=true`, { headers: authHeaders() });
      const data = await response.json();

      if (!response.ok || !data.success || !Array.isArray(data.items)) throw new Error(data.message || data.error || 'Unable to load inventory. Please try again.');
      if (data.success) {
        setInventoryItems(data.items || []);
        setLoading(false);
      }
    } catch (error) {
      setLoadError(error.message || 'Unable to load inventory. Please try again.');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      productId: '',
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
      productId: item.productId || '',
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
        ? `${API_BASE_URL}/api/admin/inventory/${editingItem._id}`
        : `${API_BASE_URL}/api/admin/inventory`;

      const method = editingItem ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert(editingItem ? 'Item updated successfully' : 'Item created successfully');
        setShowModal(false);
        fetchInventory();
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
      quantity = Number(quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/inventory/${itemId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ quantity, action })
      });

      const data = await response.json();

      if (data.success) {
        fetchInventory();
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
      const response = await fetch(`${API_BASE_URL}/api/admin/inventory/${itemId}`, {
        method: 'DELETE', headers: authHeaders()
      });

      const data = await response.json();

      if (data.success) {
        alert('Item deleted successfully');
        fetchInventory();
          } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
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
      <AdminNav title="Inventory Management">
      <div className="inventory-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading inventory...</p>
        </div>
      </div>
      </AdminNav>
    );
  }

  return (
    <AdminNav title="Inventory Management">
    <div className="inventory-container">
      {/* Header */}
      <div className="inventory-header">
        <div className="inventory-title">
          <p>Track ingredients, monitor stock levels, and plan your next restock.</p>
        </div>
        <div className="inventory-actions">
          <button className="btn btn-primary" onClick={handleAddNew}>
            <FaPlus /> Add Item
          </button>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <FaDownload /> Export CSV
          </button>
          <button className="btn btn-secondary" disabled={refreshing} onClick={fetchInventory}>
            <FaSync /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loadError && <div className="alert-box alert-warning" role="alert"><div><strong>Inventory could not be refreshed</strong><p>{loadError} Previously loaded items may be out of date.</p><button className="btn btn-secondary" disabled={refreshing} onClick={fetchInventory}>Try again</button></div></div>}
      <div className="stock-summary-grid">
        {[
          ['Total items', summary.totalItems, 'Active inventory items', 'all', FiPackage],
          ['Low stock', summary.lowStockCount, 'At or below minimum', 'low', FiAlertTriangle],
          ['Out of stock', summary.outOfStockCount, 'Restock these items first', 'out', FiSlash]
        ].map(([label, value, hint, filter, Icon]) => <button key={filter} className={`stock-summary-card stock-tone-${filter}`} aria-pressed={stockFilter === filter} onClick={() => { setStockFilter(filter); setSearchTerm(''); setSelectedCategory('All'); }}>
          <span className="stock-card-label">{label}<Icon aria-hidden="true" /></span><strong>{loadError ? 'Unavailable' : value}</strong><small>{hint}</small>
        </button>)}
        <div className="stock-summary-card"><span className="stock-card-label">Inventory value<FiDollarSign aria-hidden="true" /></span><strong>{loadError ? 'Unavailable' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(summary.totalInventoryValue)}</strong><small>Based on current stock cost</small></div>
      </div>
      <div className="stock-filter-row">
        <label className="stock-search"><span>Search inventory</span><div><FaSearch aria-hidden="true" /><input placeholder="Item, supplier, or location" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} /></div></label>
        <label><span>Category</span><select value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)}>{[...new Set([...categories, ...inventoryItems.map(item => item.category).filter(Boolean)])].map(cat => <option key={cat}>{cat}</option>)}</select></label>
        <label><span>Stock status</span><select value={stockFilter} onChange={event => setStockFilter(event.target.value)}><option value="all">All stock levels</option><option value="low">Low stock</option><option value="out">Out of stock</option><option value="good">In stock</option></select></label>
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map(item => {
                  const status = getStockStatus(item.currentStock, item.minimumThreshold);

                  return (
                    <tr key={item._id} className={`status-${status}`}>
                      <td className="item-name">
                        <strong>{item.name}</strong>
                        <details className="stock-details"><summary>View details</summary><dl><dt>Supplier</dt><dd>{item.supplier || 'Not specified'}</dd><dt>Location</dt><dd>{item.location || 'Not specified'}</dd><dt>Unit cost</dt><dd>PHP {Number(item.unitCost || 0).toFixed(2)}</dd><dt>Total value</dt><dd>PHP {(Number(item.currentStock || 0) * Number(item.unitCost || 0)).toFixed(2)}</dd><dt>Remarks</dt><dd>{item.remarks || 'None'}</dd></dl></details>
                      </td>
                      <td>{item.category}</td>
                      <td className="stock-cell">
                        <strong>{item.currentStock} <span className="stock-unit">{item.unit}</span></strong>
                        <small className="stock-minimum">Minimum: {item.minimumThreshold} {item.unit}</small>
                      </td>
                      <td>
                        <span className={`status-badge status-${status}`}>
                          {{ low: 'Low stock', out: 'Out of stock', good: 'In stock' }[status]}
                        </span>
                      </td>
                      <td className="actions-cell"><button className="stock-restock" onClick={() => handleUpdateStock(item._id, 'add')}>Restock</button><button className="stock-restock" onClick={() => handleUpdateStock(item._id, 'subtract')}>Remove stock</button>
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
                  <td colSpan="5" className="empty-state">
                    <div className="empty-state-content">
                      <FiPackage size={32} aria-hidden="true" />
                      <h3>{loadError ? 'Inventory unavailable' : inventoryItems.length ? 'No matching items' : 'Add your first ingredient'}</h3>
                      <p>{loadError ? 'Use Try again above to reload your inventory.' : inventoryItems.length ? 'Try another category or stock status.' : 'Start tracking quantities and get a clear view of what needs restocking.'}</p>
                      {!loadError && (inventoryItems.length ? <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setStockFilter('all'); }}>Clear filters</button> : <button className="btn btn-primary" onClick={handleAddNew}><FaPlus /> Add Item</button>)}
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
                <label>Linked Product (optional)</label>
                <select name="productId" value={formData.productId} onChange={handleFormChange} className="form-input">
                  <option value="">Ingredient or supply (not a sellable product)</option>
                  {productOptions.map(product => <option key={product._id} value={product._id}>{product.name}</option>)}
                </select>
              </div>
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
    </AdminNav>
  );
}

export default InventoryManagement;
