import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import API_BASE_URL from '../../config/api';
import ForecastChart from '../../components/admin/ForecastChart';
import RecentOrders from '../../components/dashboard/RecentOrders';
import { 
  PendingIcon, PreparingIcon, ReadyIcon, ServedIcon, CompletedIcon,
  UnpaidIcon, VerificationIcon, VerifiedIcon, PaidIcon, PartiallyPaidIcon, RefundedIcon
} from '../../components/icons/StatusIcons';

function Dashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [dashboardData, setDashboardData] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        totalOrders: 0,
        todayOrders: 0,
        averageOrderValue: 0,
        topItems: [],
        pendingOrders: 0,
        preparingOrders: 0,
        completedOrders: 0,
        statusBreakdown: {}
    });
    
    const [previousData, setPreviousData] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        averageOrderValue: 0
    });

    // Fetch orders data from backend
    useEffect(() => {
        fetchDashboardData();
        
        // Refresh data every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);

        // Close dropdown on outside click
        const handleClickOutside = () => {
            setOpenDropdown(null);
        };
        document.addEventListener('click', handleClickOutside);
        
        return () => {
            clearInterval(interval);
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true);
            
            // Fetch all orders from backend with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const ordersResponse = await fetch(`${API_BASE_URL}/api/orders?limit=200`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
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
                
                // Calculate status breakdown
                const statusBreakdown = {
                    pending: 0,
                    preparing: 0,
                    ready: 0,
                    served: 0,
                    completed: 0
                };
                
                let pendingOrders = 0;
                let preparingOrders = 0;
                let completedOrders = 0;
                
                allOrders.forEach(order => {
                    const status = order.status || 'pending';
                    if (statusBreakdown.hasOwnProperty(status)) {
                        statusBreakdown[status]++;
                    }
                    
                    // Count pending/preparing
                    if (status === 'pending' || status === 'preparing' || status === 'ready') {
                        pendingOrders++;
                    }
                    if (status === 'preparing') {
                        preparingOrders++;
                    }
                    if (status === 'completed') {
                        completedOrders++;
                    }
                });
                
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
                
                const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                
                setDashboardData({
                    totalRevenue,
                    todayRevenue,
                    totalOrders,
                    todayOrders: todayOrders.length,
                    averageOrderValue: avgOrderValue,
                    topItems: topItems,
                    pendingOrders,
                    preparingOrders,
                    completedOrders,
                    statusBreakdown
                });
                
                // Store current data as previous for next comparison
                setPreviousData({
                    totalRevenue,
                    todayRevenue,
                    averageOrderValue: avgOrderValue
                });
                
                console.log('✅ Dashboard stats calculated:', {
                    totalRevenue,
                    todayRevenue,
                    totalOrders,
                    todayOrders: todayOrders.length,
                    pendingOrders,
                    statusBreakdown
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

    // Calculate trend percentage
    const calculateTrend = (current, previous) => {
        if (previous === 0) return 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    // Get trend color and arrow
    const getTrendIndicator = (trend) => {
        if (trend > 0) return { icon: '↑', color: '#4caf50', label: `+${trend}%` };
        if (trend < 0) return { icon: '↓', color: '#f44336', label: `${trend}%` };
        return { icon: '→', color: '#9e9e9e', label: '0%' };
    };

    const handleStatusClick = (e, dropdownId) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        console.log('🎯 Status clicked:', dropdownId);
        setDropdownPos({
            top: rect.top - 10,
            left: rect.left
        });
        setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
    };

    // Get icon for status
    const getStatusIconComponent = (status) => {
        switch(status) {
            case 'pending': return <PendingIcon size={12} />;
            case 'preparing': return <PreparingIcon size={12} />;
            case 'ready': return <ReadyIcon size={12} />;
            case 'served': return <ServedIcon size={12} />;
            case 'completed': return <CompletedIcon size={12} />;
            default: return null;
        }
    };

    const getPaymentIconComponent = (status) => {
        switch(status) {
            case 'unpaid': return <UnpaidIcon size={12} />;
            case 'payment_pending_verification': return <VerificationIcon size={12} />;
            case 'payment_verified': return <VerifiedIcon size={12} />;
            case 'paid': return <PaidIcon size={12} />;
            case 'partially_paid': return <PartiallyPaidIcon size={12} />;
            case 'refunded': return <RefundedIcon size={12} />;
            default: return null;
        }
    };

    // Update order status with timeout and retry logic
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        const maxRetries = 2;
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[Order Status Update] Attempt ${attempt}/${maxRetries} for Order ${orderId} -> ${newStatus}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
                
                const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || result.error || `Failed to update order: ${response.statusText}`);
                }

                if (result.success || result.status === newStatus) {
                    // Update the local state
                    setOrders(orders.map(order => 
                        order._id === orderId ? { ...order, status: newStatus } : order
                    ));
                    console.log(`✅ Order ${orderId} status updated to ${newStatus}`);
                    setUpdatingOrderId(null);
                    return; // Success, exit function
                } else {
                    throw new Error(result.message || 'Status update unsuccessful');
                }
            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt} failed:`, error.message);
                
                // If this wasn't the last attempt and error is timeout/network, retry
                if (attempt < maxRetries && (error.name === 'AbortError' || error.message.includes('Failed to fetch'))) {
                    console.log(`Retrying in 1 second...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue; // Try again
                }
                
                // Don't retry other errors
                break;
            }
        }
        
        // If we get here, all retries failed
        console.error('❌ Error updating order status after retries:', lastError);
        const errorMsg = lastError?.message || 'Failed to update order status';
        alert(`${errorMsg}\n\nNote: The backend may be starting up. Please try again in a moment.`);
        setUpdatingOrderId(null);
    };

    const handleUpdatePaymentStatus = async (orderId, newStatus) => {
        setUpdatingPaymentId(orderId);
        const maxRetries = 2;
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[Payment Status Update] Attempt ${attempt}/${maxRetries} for Order ${orderId}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
                
                const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ paymentStatus: newStatus }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || result.error || `Failed to update payment status: ${response.statusText}`);
                }

                if (result.success || result.paymentStatus === newStatus) {
                    setOrders(orders.map(order =>
                        order._id === orderId ? { ...order, paymentStatus: newStatus } : order
                    ));
                    console.log(`✅ Order ${orderId} payment status updated to ${newStatus}`);
                    setUpdatingPaymentId(null);
                    return; // Success, exit function
                } else {
                    throw new Error(result.message || 'Payment status update unsuccessful');
                }
            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt} failed:`, error.message);
                
                // If this wasn't the last attempt and error is timeout/network, retry
                if (attempt < maxRetries && (error.name === 'AbortError' || error.message.includes('Failed to fetch'))) {
                    console.log(`Retrying in 1 second...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue; // Try again
                }
                
                // Don't retry other errors
                break;
            }
        }
        
        // If we get here, all retries failed
        console.error('❌ Error updating payment status after retries:', lastError);
        const errorMsg = lastError?.message || 'Failed to update payment status';
        alert(`${errorMsg}\n\nNote: The backend may be starting up. Please try again in a moment.`);
        setUpdatingPaymentId(null);
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
        
        // Convert to GMT+8 (Philippines timezone)
        const gmtPlus8 = new Date(date.getTime() + (8 * 60 * 60 * 1000) - (date.getTimezoneOffset() * 60 * 1000));
        
        // Format as MM/DD, HH:MM AM/PM
        const month = String(gmtPlus8.getMonth() + 1).padStart(2, '0');
        const day = String(gmtPlus8.getDate()).padStart(2, '0');
        const hours = gmtPlus8.getHours();
        const minutes = String(gmtPlus8.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? '12' : (hours > 12 ? hours - 12 : hours);
        
        return `${month}/${day}, ${displayHours}:${minutes} ${ampm}`;
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
                            {previousData.totalRevenue > 0 && (
                                <div className="trend-badge" style={{ color: getTrendIndicator(calculateTrend(dashboardData.totalRevenue, previousData.totalRevenue)).color }}>
                                    {getTrendIndicator(calculateTrend(dashboardData.totalRevenue, previousData.totalRevenue)).icon} {getTrendIndicator(calculateTrend(dashboardData.totalRevenue, previousData.totalRevenue)).label}
                                </div>
                            )}
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
                            {previousData.todayRevenue > 0 && (
                                <div className="trend-badge" style={{ color: getTrendIndicator(calculateTrend(dashboardData.todayRevenue, previousData.todayRevenue)).color }}>
                                    {getTrendIndicator(calculateTrend(dashboardData.todayRevenue, previousData.todayRevenue)).icon} {getTrendIndicator(calculateTrend(dashboardData.todayRevenue, previousData.todayRevenue)).label}
                                </div>
                            )}
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
                            <h3>Pending Orders</h3>
                            <div className="stat-icon">⏳</div>
                        </div>
                        <div className="stat-value pending-badge">
                            {dashboardData.pendingOrders}
                        </div>
                        <div className="stat-trend">
                            <span>In progress</span>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                                Preparing: {dashboardData.preparingOrders}
                            </div>
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
                            {previousData.averageOrderValue > 0 && (
                                <div className="trend-badge" style={{ color: getTrendIndicator(calculateTrend(dashboardData.averageOrderValue, previousData.averageOrderValue)).color }}>
                                    {getTrendIndicator(calculateTrend(dashboardData.averageOrderValue, previousData.averageOrderValue)).icon} {getTrendIndicator(calculateTrend(dashboardData.averageOrderValue, previousData.averageOrderValue)).label}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="dashboard-main">
                {/* Recent Orders - Professional Card Layout */}
                <RecentOrders 
                  orders={recentOrders}
                  onRefresh={fetchDashboardData}
                  onPrint={(order) => {
                    console.log('Print order:', order);
                    // Implement print functionality
                  }}
                  onDetails={(order) => {
                    console.log('Show order details:', order);
                    // Implement order details modal
                  }}
                  onStatusChange={(orderId, newStatus) => {
                    if (newStatus === 'paid') {
                      handleUpdatePaymentStatus(orderId, newStatus);
                    } else {
                      handleUpdateOrderStatus(orderId, newStatus);
                    }
                  }}
                  limit={10}
                />

                {/* Side by Side: Order Status & Top Items */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    {/* Order Status Breakdown Chart */}
                    <div className="status-breakdown">
                        <div className="status-breakdown-header">
                            <h2>Order Status Distribution</h2>
                        </div>
                        <div className="status-breakdown-content">
                            <div className="status-bars">
                                {Object.entries(dashboardData.statusBreakdown).map(([status, count]) => {
                                    const total = dashboardData.totalOrders || 1;
                                    const percentage = (count / total) * 100;
                                    const statusColors = {
                                        pending: '#2196f3',
                                        preparing: '#ff9800',
                                        ready: '#8bc34a',
                                        served: '#9c27b0',
                                        completed: '#4caf50'
                                    };
                                    
                                    return (
                                        <div key={status} className="status-bar-item">
                                            <div className="status-bar-label">
                                                <span className="status-name">
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </span>
                                                <span className="status-count">{count}</span>
                                            </div>
                                            <div className="status-bar-container">
                                                <div 
                                                    className="status-bar-fill" 
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: statusColors[status]
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="status-bar-percent">{percentage.toFixed(1)}%</div>
                                        </div>
                                    );
                                })}
                            </div>
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

                {/* Demand Forecast */}
                <ForecastChart days={7} />
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

            {/* Floating Status Dropdown */}
            {openDropdown && (
                <div 
                    className="floating-dropdown"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: `${dropdownPos.top}px`,
                        left: `${dropdownPos.left}px`,
                        zIndex: 9999
                    }}
                >
                    {openDropdown.startsWith('payment-') && (
                        <div className="status-dropdown-menu">
                            <button
                                onClick={() => {
                                    handleUpdatePaymentStatus(openDropdown.split('-')[1], 'unpaid');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <UnpaidIcon size={16} />
                                <span>Unpaid</span>
                            </button>
                            <button
                                onClick={() => {
                                    handleUpdatePaymentStatus(openDropdown.split('-')[1], 'payment_pending_verification');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <VerificationIcon size={16} />
                                <span>Pending Verification</span>
                            </button>
                            <button
                                onClick={() => {
                                    handleUpdatePaymentStatus(openDropdown.split('-')[1], 'payment_verified');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <VerifiedIcon size={16} />
                                <span>Verified</span>
                            </button>
                            <button
                                onClick={() => {
                                    handleUpdatePaymentStatus(openDropdown.split('-')[1], 'paid');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <PaidIcon size={16} />
                                <span>Paid</span>
                            </button>
                            <button
                                onClick={() => {
                                    handleUpdatePaymentStatus(openDropdown.split('-')[1], 'partially_paid');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <PartiallyPaidIcon size={16} />
                                <span>Partially Paid</span>
                            </button>
                            <button
                                onClick={() => {
                                    handleUpdatePaymentStatus(openDropdown.split('-')[1], 'refunded');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <RefundedIcon size={16} />
                                <span>Refunded</span>
                            </button>
                        </div>
                    )}
                    {openDropdown.startsWith('order-') && (
                        <div className="status-dropdown-menu">
                            <button 
                                onClick={() => {
                                    handleUpdateOrderStatus(openDropdown.split('-')[1], 'pending');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <PendingIcon size={16} />
                                <span>Pending</span>
                            </button>
                            <button 
                                onClick={() => {
                                    handleUpdateOrderStatus(openDropdown.split('-')[1], 'preparing');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <PreparingIcon size={16} />
                                <span>Preparing</span>
                            </button>
                            <button 
                                onClick={() => {
                                    handleUpdateOrderStatus(openDropdown.split('-')[1], 'ready');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <ReadyIcon size={16} />
                                <span>Ready</span>
                            </button>
                            <button 
                                onClick={() => {
                                    handleUpdateOrderStatus(openDropdown.split('-')[1], 'served');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <ServedIcon size={16} />
                                <span>Served</span>
                            </button>
                            <button 
                                onClick={() => {
                                    handleUpdateOrderStatus(openDropdown.split('-')[1], 'completed');
                                    setOpenDropdown(null);
                                }}
                                className="status-option"
                            >
                                <CompletedIcon size={16} />
                                <span>Completed</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Dashboard;