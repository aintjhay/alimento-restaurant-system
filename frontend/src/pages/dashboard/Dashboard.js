import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        totalOrders: 0,
        todayOrders: 0,
        averageOrderValue: 0,
        topItems: []
    });

    // Fetch orders data from backend
    useEffect(() => {
        fetchDashboardData();
        
        // Refresh data every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true);
            
            // Fetch all orders from backend
            const ordersResponse = await fetch('http://localhost:5000/api/orders?limit=200');
            const ordersData = await ordersResponse.json();
            
            console.log('Dashboard API Response:', ordersData);
            
            if (ordersData.success) {
                const allOrders = ordersData.orders || [];
                setOrders(allOrders);
                
                // Calculate dashboard stats from orders
                const totalRevenue = allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                const totalOrders = allOrders.length;
                
                // Get today's orders
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayOrders = allOrders.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    orderDate.setHours(0, 0, 0, 0);
                    return orderDate.getTime() === today.getTime();
                });
                const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                
                // Calculate top items
                const itemMap = {};
                allOrders.forEach(order => {
                    if (order.items) {
                        order.items.forEach(item => {
                            if (!itemMap[item.name]) {
                                itemMap[item.name] = { name: item.name, count: 0 };
                            }
                            itemMap[item.name].count += item.quantity || 1;
                        });
                    }
                });
                
                const topItems = Object.values(itemMap)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);
                
                setDashboardData({
                    totalRevenue,
                    todayRevenue,
                    totalOrders,
                    todayOrders: todayOrders.length,
                    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                    topItems: topItems
                });
                
                console.log('✅ Dashboard stats calculated:', {
                    totalRevenue,
                    todayRevenue,
                    totalOrders,
                    todayOrders: todayOrders.length
                });
            } else {
                console.error('API Response not successful:', ordersData);
            }
            
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error('❌ Error fetching dashboard data:', error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Update order status
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error(`Failed to update order: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Update the local state
                setOrders(orders.map(order => 
                    order._id === orderId ? { ...order, status: newStatus } : order
                ));
                console.log(`✅ Order ${orderId} status updated to ${newStatus}`);
            }
        } catch (error) {
            console.error('❌ Error updating order status:', error);
            alert('Failed to update order status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleUpdatePaymentStatus = async (orderId, newStatus) => {
        setUpdatingPaymentId(orderId);
        try {
            const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ paymentStatus: newStatus })
            });

            if (!response.ok) {
                throw new Error(`Failed to update payment status: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success) {
                setOrders(orders.map(order =>
                    order._id === orderId ? { ...order, paymentStatus: newStatus } : order
                ));
            }
        } catch (error) {
            console.error('❌ Error updating payment status:', error);
            alert('Failed to update payment status');
        } finally {
            setUpdatingPaymentId(null);
        }
    };

    // Calculate recent orders (last 5)
    const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
        .slice(0, 5);

    // Format currency
    const formatCurrency = (amount) => {
        return `₱${amount.toFixed(0)}`;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Calculate bar width for top items
    const calculateBarWidth = (count, maxCount) => {
        if (maxCount === 0) return '0%';
        return `${(count / maxCount) * 100}%`;
    };

    // Get max count for top items
    const maxItemCount = dashboardData.topItems.length > 0 
        ? Math.max(...dashboardData.topItems.map(item => item.count))
        : 0;

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <h1 className="text-teal font-bold">Dashboard</h1>
                    <span>Alimento</span>
                </div>
                <div className="dashboard-subtitle">
                    <p className="time-display">
                        Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <button 
                        onClick={fetchDashboardData} 
                        className="refresh-btn"
                        disabled={refreshing}
                    >
                        {refreshing ? '↻' : '↻'} Refresh
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-content">
                        <div className="stat-card-header">
                            <h3>Total Revenue</h3>
                            <div className="stat-icon">₱</div>
                        </div>
                        <div className="stat-value">
                            {formatCurrency(dashboardData.totalRevenue)}
                        </div>
                        <div className="stat-trend">
                            <span>All time revenue</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-content">
                        <div className="stat-card-header">
                            <h3>Today's Revenue</h3>
                            <div className="stat-icon">📈</div>
                        </div>
                        <div className="stat-value">
                            {formatCurrency(dashboardData.todayRevenue)}
                        </div>
                        <div className="stat-trend">
                            <span>{dashboardData.todayOrders} orders today</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-content">
                        <div className="stat-card-header">
                            <h3>Total Orders</h3>
                            <div className="stat-icon">📋</div>
                        </div>
                        <div className="stat-value">
                            {dashboardData.totalOrders}
                        </div>
                        <div className="stat-trend">
                            <span>Completed orders</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-content">
                        <div className="stat-card-header">
                            <h3>Average Order</h3>
                            <div className="stat-icon">⚡</div>
                        </div>
                        <div className="stat-value">
                            {formatCurrency(dashboardData.averageOrderValue)}
                        </div>
                        <div className="stat-trend">
                            <span>Per order average</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Recent Orders */}
                <div className="recent-orders">
                    <div className="recent-orders-header">
                        <h2>Recent Orders</h2>
                        <button className="view-all-btn">View All →</button>
                    </div>
                    <div className="table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Table</th>
                                    <th>Time</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Proof</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <tr key={order._id || order.id || order.orderNumber}>
                                            <td className="order-number">#{order.orderNumber}</td>
                                            <td className="table-number">Table {order.tableNumber}</td>
                                            <td>{formatDate(order.createdAt || order.timestamp)}</td>
                                            <td className="order-total">
                                                {formatCurrency(order.totalAmount || order.total || 0)}
                                            </td>
                                            <td>
                                                <div className="status-cell">
                                                    <span className={`payment-status payment-${(order.paymentStatus || 'unpaid')}`}>
                                                        {order.paymentStatus || 'unpaid'}
                                                    </span>
                                                    <div className="status-dropdown">
                                                        <button
                                                            onClick={() => handleUpdatePaymentStatus(order._id, 'payment_pending_verification')}
                                                            disabled={updatingPaymentId === order._id}
                                                            className="status-option"
                                                        >
                                                            Payment Pending
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdatePaymentStatus(order._id, 'payment_verified')}
                                                            disabled={updatingPaymentId === order._id}
                                                            className="status-option"
                                                        >
                                                            Payment Verified
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdatePaymentStatus(order._id, 'paid')}
                                                            disabled={updatingPaymentId === order._id}
                                                            className="status-option"
                                                        >
                                                            Paid
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {order.paymentProof ? (
                                                    <a
                                                        className="proof-link"
                                                        href={order.paymentProof}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        View
                                                    </a>
                                                ) : (
                                                    <span className="proof-muted">None</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="status-cell">
                                                    <span className={`order-status status-${order.status.toLowerCase()}`}>
                                                        {order.status}
                                                    </span>
                                                    <div className="status-dropdown">
                                                        <button 
                                                            onClick={() => handleUpdateOrderStatus(order._id, 'pending')}
                                                            disabled={updatingOrderId === order._id}
                                                            className="status-option"
                                                        >
                                                            Pending
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                                                            disabled={updatingOrderId === order._id}
                                                            className="status-option"
                                                        >
                                                            Preparing
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateOrderStatus(order._id, 'ready')}
                                                            disabled={updatingOrderId === order._id}
                                                            className="status-option"
                                                        >
                                                            Ready
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateOrderStatus(order._id, 'served')}
                                                            disabled={updatingOrderId === order._id}
                                                            className="status-option"
                                                        >
                                                            Served
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                                                            disabled={updatingOrderId === order._id}
                                                            className="status-option"
                                                        >
                                                            Completed
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7">
                                            <div className="empty-state">
                                                <div className="empty-state-icon">📋</div>
                                                <p className="empty-state-text">No orders yet</p>
                                                <p className="empty-state-subtext">Start taking orders in the POS</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Items */}
                <div className="top-items">
                    <div className="top-items-header">
                        <h2>Top Items</h2>
                    </div>
                    <div className="items-list">
                        {dashboardData.topItems.length > 0 ? (
                            dashboardData.topItems.slice(0, 5).map((item, index) => (
                                <div key={index} className="top-item">
                                    <div className="item-rank">{index + 1}</div>
                                    <div className="item-info">
                                        <div className="item-name">{item.name}</div>
                                        <div className="item-stats">
                                            <span className="item-count">{item.count} sold</span>
                                            <div className="item-bar">
                                                <div 
                                                    className="bar-fill" 
                                                    style={{ width: calculateBarWidth(item.count, maxItemCount) }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">🏆</div>
                                <p className="empty-state-text">No items sold yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="performance-section">
                <div className="performance-header">
                    <h2>Performance</h2>
                </div>
                <div className="performance-stats">
                    <div className="performance-metric">
                        <div className="metric-value">
                            {dashboardData.todayOrders}
                        </div>
                        <div className="metric-label">Today's Orders</div>
                    </div>
                    <div className="performance-metric">
                        <div className="metric-value">
                            ₱{(dashboardData.todayOrders > 0 ? dashboardData.todayRevenue / dashboardData.todayOrders : 0).toFixed(0)}
                        </div>
                        <div className="metric-label">Avg Today</div>
                    </div>
                    <div className="performance-metric">
                        <div className="metric-value">
                            {dashboardData.totalOrders}
                        </div>
                        <div className="metric-label">Total Orders</div>
                    </div>
                    <div className="performance-metric">
                        <div className="metric-value">
                            {formatCurrency(dashboardData.totalRevenue)}
                        </div>
                        <div className="metric-label">Total Revenue</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button 
                    onClick={() => window.location.href = '/pos'}
                    className="action-btn primary"
                >
                    <span>🍽️</span> Go to POS
                </button>
                <button 
                    onClick={() => window.location.href = '/menu'}
                    className="action-btn"
                >
                    <span>📋</span> View Menu
                </button>
                <button 
                    onClick={() => window.location.href = '/analytics'}
                    className="action-btn"
                >
                    <span>📊</span> Analytics
                </button>
            </div>
        </div>
    );
}

export default Dashboard;