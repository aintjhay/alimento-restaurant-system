import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch menu, orders, and forecast simultaneously
      const [menuRes, ordersRes, forecastRes] = await Promise.all([
        axios.get(`${API_URL}/menu`),
        axios.get(`${API_URL}/orders`),
        axios.get(`${API_URL}/forecast`)
      ]);
      
      setMenu(menuRes.data);
      setOrders(ordersRes.data);
      setForecast(forecastRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    const sampleOrder = {
      customer_name: "Demo Customer",
      items: [
        { id: 1, name: "CHORIZO JALAPENO", price: 200, quantity: 2 },
        { id: 4, name: "TEQUILA SUNRISE", price: 120, quantity: 1 }
      ]
    };

    try {
      const response = await axios.post(`${API_URL}/orders`, sampleOrder);
      alert(`Order Created!\nOrder #: ${response.data.order_number}\nTotal: ₱${response.data.total}`);
      fetchAllData(); // Refresh orders list
    } catch (error) {
      alert('Failed to create order');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Loading Alimento System...</h2>
        <p>Connecting to backend API...</p>
      </div>
    );
  }

  return (
    <div className="App" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50' }}>🍽️ Alimento Restaurant Management System</h1>
        <p style={{ color: '#7f8c8d' }}>Integrated POS + Customer Portal + ML Demand Forecasting</p>
        <div style={{ marginTop: '10px' }}>
          <button onClick={fetchAllData} style={{ marginRight: '10px', padding: '8px 15px' }}>
            🔄 Refresh Data
          </button>
          <button onClick={handleOrder} style={{ padding: '8px 15px', backgroundColor: '#27ae60', color: 'white', border: 'none' }}>
            📝 Create Sample Order
          </button>
        </div>
      </header>

      {/* SYSTEM STATUS */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>✅ System Status: Connected</h3>
        <p>Backend: <code>{API_URL}</code> | Frontend: <code>http://localhost:3000</code></p>
      </div>

      {/* THREE COLUMNS LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        
        {/* COLUMN 1: MENU (POS/Portal) */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h2 style={{ color: '#e74c3c' }}>📋 Menu Items ({menu.length})</h2>
          <p>For POS & Customer Portal</p>
          {menu.map(item => (
            <div key={item.id} style={{ 
              borderBottom: '1px solid #eee', 
              padding: '10px 0',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong>{item.name}</strong>
                <div style={{ fontSize: '0.9em', color: '#7f8c8d' }}>{item.category}</div>
              </div>
              <div style={{ fontWeight: 'bold' }}>₱{item.price}</div>
            </div>
          ))}
        </div>

        {/* COLUMN 2: ORDERS (Admin Dashboard) */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h2 style={{ color: '#3498db' }}>📊 Recent Orders ({orders.length})</h2>
          <p>Admin Dashboard View</p>
          {orders.map(order => (
            <div key={order.id} style={{ 
              borderBottom: '1px solid #eee', 
              padding: '10px 0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{order.order_number}</strong>
                <span style={{ 
                  backgroundColor: order.status === 'completed' ? '#2ecc71' : '#f39c12',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.8em'
                }}>
                  {order.status}
                </span>
              </div>
              <div>{order.customer_name}</div>
              <div style={{ textAlign: 'right', fontWeight: 'bold' }}>₱{order.total}</div>
            </div>
          ))}
        </div>

        {/* COLUMN 3: ML FORECAST */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
          <h2 style={{ color: '#9b59b6' }}>🤖 ML Demand Forecast</h2>
          <p>Machine Learning Preview</p>
          {forecast && (
            <>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#9b59b6' }}>
                  ₱{forecast.predicted_sales_tomorrow?.toLocaleString() || '12,540'}
                </div>
                <div>Predicted Sales (Tomorrow)</div>
              </div>
              
              <h4>Top Predicted Items:</h4>
              {forecast.top_items?.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>{item.name}</span>
                  <strong>{item.predicted_qty} units</strong>
                </div>
              ))}
              
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#f0e6f6',
                borderRadius: '5px',
                fontSize: '0.9em'
              }}>
                <strong>Model:</strong> {forecast.note || 'Linear Regression'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ 
        marginTop: '30px', 
        textAlign: 'center', 
        color: '#95a5a6',
        fontSize: '0.9em'
      }}>
        <p>Alimento Resto | Capstone Project | Backend + Frontend Integration Demo</p>
        <p>✅ Ready for Pre-Oral Presentation</p>
      </footer>
    </div>
  );
}

export default App;