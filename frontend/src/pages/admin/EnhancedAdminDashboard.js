import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import { LineChart, BarChart, PieChart, DoughnutChart } from '../../components/charts/ReusableCharts';
import { format, subDays } from 'date-fns';
import './EnhancedAdminDashboard.css';

const EnhancedAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrder: 0,
    topItems: [],
    dailyRevenue: [],
    ordersByCategory: [],
    ordersByType: []
  });

  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      let daysBack = 7;
      if (timeRange === 'month') daysBack = 30;
      else if (timeRange === 'year') daysBack = 365;

      const startDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      // Fetch orders
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        params: { limit: 500 }
      });

      if (response.data.success) {
        const orders = response.data.orders || [];
        
        // Process data
        const processedData = processOrderData(orders, daysBack);
        setDashboardData(processedData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processOrderData = (orders, daysBack) => {
    // Calculate totals
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group by day for daily revenue chart
    const dailyRevenueMap = {};
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MMM dd');
      dailyRevenueMap[date] = 0;
    }

    orders.forEach(order => {
      const date = format(new Date(order.createdAt), 'MMM dd');
      if (dailyRevenueMap.hasOwnProperty(date)) {
        dailyRevenueMap[date] += order.totalAmount || 0;
      }
    });

    const dailyRevenue = Object.values(dailyRevenueMap);
    const dailyLabels = Object.keys(dailyRevenueMap);

    // Group by category
    const categoryMap = {};
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const category = item.category || 'Other';
          categoryMap[category] = (categoryMap[category] || 0) + item.quantity;
        });
      }
    });

    const ordersByCategory = {
      labels: Object.keys(categoryMap),
      datasets: [{
        data: Object.values(categoryMap),
        backgroundColor: [
          'rgba(255, 107, 107, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(99, 132, 205, 0.8)',
          'rgba(205, 132, 99, 0.8)'
        ]
      }]
    };

    // Group by order type
    const typeMap = {
      'Dine-in': 0,
      'Takeaway': 0,
      'Delivery': 0
    };

    orders.forEach(order => {
      if (typeMap.hasOwnProperty(order.orderType)) {
        typeMap[order.orderType]++;
      }
    });

    const ordersByType = {
      labels: Object.keys(typeMap),
      datasets: [{
        data: Object.values(typeMap),
        backgroundColor: [
          'rgba(52, 152, 219, 0.8)',
          'rgba(46, 204, 113, 0.8)',
          'rgba(230, 126, 34, 0.8)'
        ]
      }]
    };

    // Top items
    const itemMap = {};
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (!itemMap[item.name]) {
            itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          }
          itemMap[item.name].quantity += item.quantity || 1;
          itemMap[item.name].revenue += item.itemTotal || 0;
        });
      }
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalOrders,
      totalRevenue,
      averageOrder,
      topItems,
      dailyRevenue: {
        labels: dailyLabels,
        datasets: [{
          label: 'Daily Revenue (Pesos)',
          data: dailyRevenue,
          borderColor: '#2980b9',
          backgroundColor: 'rgba(41, 128, 185, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#2980b9'
        }]
      },
      ordersByCategory,
      ordersByType
    };
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/export/${format}`, {
        responseType: format === 'pdf' ? 'blob' : 'text'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="enhanced-dashboard loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-dashboard">
      <div className="dashboard-header">
        <h1>📊 Enhanced Dashboard</h1>
        <div className="dashboard-controls">
          <div className="time-range-selector">
            <button 
              className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
              onClick={() => setTimeRange('week')}
            >
              7 Days
            </button>
            <button 
              className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
              onClick={() => setTimeRange('month')}
            >
              30 Days
            </button>
            <button 
              className={`range-btn ${timeRange === 'year' ? 'active' : ''}`}
              onClick={() => setTimeRange('year')}
            >
              1 Year
            </button>
          </div>

          <div className="export-buttons">
            <button className="export-btn csv" onClick={() => handleExport('csv')}>
              📥 Export CSV
            </button>
            <button className="export-btn pdf" onClick={() => handleExport('pdf')}>
              📄 Export PDF
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-value">{dashboardData.totalOrders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">₱{dashboardData.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Avg Order Value</h3>
            <p className="stat-value">₱{dashboardData.averageOrder.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Top Item</h3>
            <p className="stat-value">
              {dashboardData.topItems.length > 0 ? dashboardData.topItems[0].name : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-row full-width">
          {dashboardData.dailyRevenue && (
            <LineChart 
              title="Daily Revenue Trend" 
              data={dashboardData.dailyRevenue}
            />
          )}
        </div>

        <div className="chart-row">
          {dashboardData.ordersByCategory && (
            <PieChart 
              title="Orders by Category" 
              data={dashboardData.ordersByCategory}
            />
          )}
          {dashboardData.ordersByType && (
            <DoughnutChart 
              title="Orders by Type" 
              data={dashboardData.ordersByType}
            />
          )}
        </div>
      </div>

      <div className="top-items-section">
        <h2>🏆 Top Items by Revenue</h2>
        <div className="top-items-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Item Name</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.topItems.map((item, idx) => (
                <tr key={idx}>
                  <td>#{idx + 1}</td>
                  <td className="item-name">{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>₱{item.revenue.toFixed(2)}</td>
                  <td>{((item.revenue / dashboardData.totalRevenue) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;
