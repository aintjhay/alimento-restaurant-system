import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
            
            // Simulate API delay for smooth animation
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Fetch all orders summary
            const ordersResponse = await fetch('http://localhost:5000/api/orders');
            const ordersData = await ordersResponse.json();
            
            if (ordersData.success) {
                setOrders(ordersData.data.orders);
                setDashboardData({
                    totalRevenue: ordersData.data.summary.totalRevenue,
                    todayRevenue: ordersData.data.summary.todayRevenue,
                    totalOrders: ordersData.data.summary.totalOrders,
                    todayOrders: ordersData.data.summary.todayOrders,
                    averageOrderValue: ordersData.data.summary.averageOrderValue,
                    topItems: ordersData.data.topItems || []
                });
            }
            
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Calculate recent orders (last 5)
    const recentOrders = orders
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

    // Format currency
    const formatCurrency = (amount) => {
        return `₱${amount.toFixed(0)}`;
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit'
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
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <tr key={order.id || order.orderNumber}>
                                            <td className="order-number">#{order.orderNumber}</td>
                                            <td className="table-number">Table {order.tableNumber}</td>
                                            <td>{formatDate(order.timestamp)}</td>
                                            <td className="order-total">
                                                {formatCurrency(order.totalAmount || order.total || 0)}
                                            </td>
                                            <td>
                                                <span className={`order-status status-${order.status.toLowerCase()}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5">
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