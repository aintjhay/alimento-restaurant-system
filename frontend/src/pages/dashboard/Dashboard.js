import React from 'react';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Alimento Dashboard</h1>
        <p>Welcome to your restaurant management system</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Today's Revenue</h3>
          <p className="stat-value">₱0.00</p>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <h3>Active Tables</h3>
          <p className="stat-value">0/0</p>
        </div>
      </div>

      {/* Top Items Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>Top Performing Items</h3>
        </div>
        <p>No data available yet</p>
      </div>
    </div>
  );
}

export default Dashboard;
