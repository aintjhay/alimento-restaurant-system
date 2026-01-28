import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  // ALIMENTO COLOR THEME
  const theme = {
    deepTeal: '#327282',      // Velvet chairs & tiles
    matteOnyx: '#1A1A1A',     // Exterior signage
    goldenGlow: '#E8B052',    // Pendant lights
    terracotta: '#BC6C4D',    // Wood tabletops
    softParchment: '#F2EFE9', // Off-white walls
    industrialGray: '#4A4A4A', // Exposed elements
    chalkboard: '#2C2C2C',    // Menu board
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
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
      customer_name: "Walk-in Customer",
      items: [
        { id: 1, name: "CHORIZO JALAPENO", price: 200, quantity: 2 },
        { id: 4, name: "TEQUILA SUNRISE", price: 120, quantity: 1 }
      ]
    };

    try {
      const response = await axios.post(`${API_URL}/orders`, sampleOrder);
      alert(`✓ Order #${response.data.order_number} Created\nTotal: ₱${response.data.total}`);
      fetchAllData();
    } catch (error) {
      alert('Failed to create order');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        backgroundColor: theme.softParchment,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: `4px solid ${theme.goldenGlow}`,
          borderTopColor: theme.deepTeal,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2 style={{ color: theme.matteOnyx, marginBottom: '10px' }}>Loading Alimento System</h2>
        <p style={{ color: theme.industrialGray }}>Fetching fresh data from the kitchen...</p>
      </div>
    );
  }

  return (
    <div className="App" style={{
      backgroundColor: theme.softParchment,
      minHeight: '100vh',
      fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      color: theme.matteOnyx
    }}>
      {/* MODERN INDUSTRIAL HEADER */}
      <header style={{
        background: `linear-gradient(135deg, ${theme.matteOnyx} 0%, ${theme.chalkboard} 100%)`,
        color: 'white',
        padding: '25px 20px',
        textAlign: 'center',
        borderBottom: `3px solid ${theme.goldenGlow}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* RESTAURANT LOGO/TITLE */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: theme.deepTeal,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.goldenGlow,
              fontSize: '24px',
              fontWeight: 'bold',
              fontFamily: "'Playfair Display', serif"
            }}>
              A
            </div>
            <h1 style={{
              margin: 0,
              fontSize: '2.5rem',
              fontWeight: 300,
              letterSpacing: '2px',
              fontFamily: "'Playfair Display', serif"
            }}>
              ALIMENTO
            </h1>
          </div>
          
          <p style={{
            margin: 0,
            fontSize: '1.1rem',
            color: theme.goldenGlow,
            maxWidth: '800px',
            lineHeight: '1.5'
          }}>
            Restaurant Management System • Modern Industrial meets Mediterranean Charm
          </p>
          
          {/* ACTION BUTTONS */}
          <div style={{ 
            display: 'flex', 
            gap: '15px',
            marginTop: '10px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button onClick={fetchAllData} style={{
              padding: '12px 25px',
              backgroundColor: 'transparent',
              border: `2px solid ${theme.deepTeal}`,
              color: 'white',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.deepTeal;
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.transform = 'translateY(0)';
            }}>
              <span>🔄</span> Refresh Data
            </button>
            
            <button onClick={handleOrder} style={{
              padding: '12px 30px',
              backgroundColor: theme.deepTeal,
              border: 'none',
              color: 'white',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: `0 4px 15px ${theme.deepTeal}40`
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#285a66';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 6px 20px ${theme.deepTeal}60`;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = theme.deepTeal;
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 15px ${theme.deepTeal}40`;
            }}>
              <span>📝</span> Create Sample Order
            </button>
          </div>
        </div>
      </header>

      {/* CHALKBOARD STATUS BAR */}
      <div style={{
        backgroundColor: theme.chalkboard,
        color: 'white',
        padding: '12px 20px',
        margin: '20px auto',
        maxWidth: '1200px',
        borderRadius: '8px',
        borderLeft: `5px solid ${theme.goldenGlow}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#4CAF50',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}></div>
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: '18px' }}>
            System Status: <strong>Connected</strong>
          </span>
        </div>
        <div style={{ fontSize: '14px', color: '#CCCCCC' }}>
          <code style={{ backgroundColor: '#00000030', padding: '3px 8px', borderRadius: '4px' }}>
            Backend: {API_URL}
          </code>
        </div>
      </div>

      {/* MEDITERRANEAN TILE INSPIRED DASHBOARD */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '25px'
      }}>
        {/* AZULEJO TILE INSPIRED MENU CARD */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: `1px solid ${theme.softParchment}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '80px',
            height: '80px',
            backgroundColor: theme.deepTeal,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
            opacity: 0.1
          }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: theme.deepTeal,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              📋
            </div>
            <h2 style={{
              margin: 0,
              color: theme.matteOnyx,
              fontSize: '1.8rem',
              fontWeight: 600
            }}>
              Menu Items <span style={{
                backgroundColor: theme.deepTeal,
                color: 'white',
                padding: '2px 12px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                marginLeft: '10px'
              }}>{menu.length}</span>
            </h2>
          </div>
          
          <p style={{ color: theme.industrialGray, marginBottom: '25px' }}>
            For POS & Customer Portal • Updated in real-time
          </p>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
            {menu.map(item => (
              <div key={item.id} style={{
                borderBottom: `1px solid ${theme.softParchment}`,
                padding: '15px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.softParchment}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                <div>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '16px',
                    color: theme.matteOnyx,
                    marginBottom: '5px'
                  }}>
                    {item.name}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: theme.deepTeal,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      backgroundColor: `${theme.deepTeal}15`,
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      {item.category}
                    </span>
                    {item.available !== false && (
                      <span style={{
                        backgroundColor: '#4CAF5020',
                        color: '#2E7D32',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ● Available
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  fontWeight: 700,
                  fontSize: '18px',
                  color: theme.terracotta
                }}>
                  ₱{item.price}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INDUSTRIAL METAL INSPIRED ORDERS CARD */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: `1px solid ${theme.softParchment}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '4px',
            background: `linear-gradient(90deg, ${theme.industrialGray}, ${theme.goldenGlow})`
          }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: theme.industrialGray,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              📊
            </div>
            <h2 style={{
              margin: 0,
              color: theme.matteOnyx,
              fontSize: '1.8rem',
              fontWeight: 600
            }}>
              Recent Orders <span style={{
                backgroundColor: theme.industrialGray,
                color: 'white',
                padding: '2px 12px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                marginLeft: '10px'
              }}>{orders.length}</span>
            </h2>
          </div>
          
          <p style={{ color: theme.industrialGray, marginBottom: '25px' }}>
            Admin Dashboard View • Live order tracking
          </p>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
            {orders.map(order => (
              <div key={order.id} style={{
                borderBottom: `1px solid ${theme.softParchment}`,
                padding: '15px 0',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.softParchment}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ 
                    fontWeight: 700, 
                    fontSize: '16px',
                    color: theme.matteOnyx,
                    letterSpacing: '0.5px'
                  }}>
                    {order.order_number}
                  </div>
                  <span style={{
                    backgroundColor: 
                      order.status === 'completed' ? '#4CAF5020' :
                      order.status === 'preparing' ? '#FF980020' :
                      '#2196F320',
                    color: 
                      order.status === 'completed' ? '#2E7D32' :
                      order.status === 'preparing' ? '#F57C00' :
                      '#1976D2',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {order.status}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: theme.industrialGray,
                  marginBottom: '5px'
                }}>
                  {order.customer_name} • {order.time || 'Today'}
                </div>
                <div style={{ 
                  textAlign: 'right', 
                  fontWeight: 700,
                  fontSize: '18px',
                  color: theme.terracotta
                }}>
                  ₱{order.total}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WOVEN GLOBE PENDANT INSPIRED FORECAST CARD */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: `1px solid ${theme.softParchment}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            background: `radial-gradient(circle, ${theme.goldenGlow}20 0%, transparent 70%)`,
            borderRadius: '50%'
          }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: theme.goldenGlow,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.matteOnyx,
              fontSize: '20px'
            }}>
              🤖
            </div>
            <h2 style={{
              margin: 0,
              color: theme.matteOnyx,
              fontSize: '1.8rem',
              fontWeight: 600
            }}>
              ML Demand Forecast
            </h2>
          </div>
          
          <p style={{ color: theme.industrialGray, marginBottom: '25px' }}>
            Machine Learning Preview • Predictive analytics
          </p>
          
          {forecast && (
            <>
              {/* GOLDEN GLOBE PREDICTION */}
              <div style={{ 
                textAlign: 'center', 
                margin: '30px 0',
                padding: '25px',
                backgroundColor: `${theme.goldenGlow}10`,
                borderRadius: '15px',
                border: `1px dashed ${theme.goldenGlow}40`
              }}>
                <div style={{ 
                  fontSize: '2.8rem', 
                  fontWeight: 800,
                  color: theme.terracotta,
                  marginBottom: '5px',
                  textShadow: `0 2px 10px ${theme.goldenGlow}30`
                }}>
                  ₱{forecast.predicted_sales_tomorrow?.toLocaleString() || '12,540'}
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  color: theme.industrialGray,
                  fontWeight: 500
                }}>
                  Predicted Sales (Tomorrow)
                </div>
              </div>
              
              {/* TOP ITEMS */}
              <h3 style={{ 
                color: theme.matteOnyx,
                marginBottom: '15px',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: theme.deepTeal,
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>↑</span>
                Top Predicted Items:
              </h3>
              
              {forecast.top_items?.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                  padding: '12px 15px',
                  backgroundColor: `${theme.deepTeal}08`,
                  borderRadius: '10px',
                  borderLeft: `4px solid ${theme.deepTeal}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: theme.deepTeal,
                      color: 'white',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                  </div>
                  <strong style={{ 
                    color: theme.deepTeal,
                    fontSize: '16px'
                  }}>
                    {item.predicted_qty} units
                  </strong>
                </div>
              ))}
              
              {/* MODEL INFO */}
              <div style={{ 
                marginTop: '25px', 
                padding: '15px', 
                backgroundColor: `${theme.softParchment}`,
                borderRadius: '10px',
                fontSize: '0.9rem',
                borderTop: `3px solid ${theme.goldenGlow}`
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: theme.goldenGlow,
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    ⚙️
                  </div>
                  <strong style={{ color: theme.matteOnyx }}>Model:</strong>
                </div>
                <div style={{ color: theme.industrialGray, lineHeight: '1.5' }}>
                  {forecast.note || 'Linear Regression analysis based on historical sales patterns, day of week, and seasonal trends.'}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* TERRAZZO INSPIRED FOOTER */}
      <footer style={{ 
        marginTop: '40px', 
        padding: '25px 20px',
        backgroundColor: theme.matteOnyx,
        color: 'white',
        textAlign: 'center',
        borderTop: `3px solid ${theme.goldenGlow}`
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            fontSize: '1.1rem', 
            fontWeight: 300,
            marginBottom: '10px',
            letterSpacing: '1px',
            fontFamily: "'Playfair Display', serif"
          }}>
            ALIMENTO RESTO
          </div>
          <p style={{ 
            color: '#AAAAAA', 
            fontSize: '0.95rem',
            marginBottom: '15px',
            maxWidth: '800px',
            margin: '0 auto 15px',
            lineHeight: '1.6'
          }}>
            Modern Industrial • Mediterranean Accents • Artisanal Dining
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px',
            marginTop: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              padding: '8px 20px',
              backgroundColor: `${theme.deepTeal}30`,
              borderRadius: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: theme.goldenGlow }}>✓</span> Integrated POS
            </div>
            <div style={{ 
              padding: '8px 20px',
              backgroundColor: `${theme.deepTeal}30`,
              borderRadius: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: theme.goldenGlow }}>✓</span> Customer Portal
            </div>
            <div style={{ 
              padding: '8px 20px',
              backgroundColor: `${theme.deepTeal}30`,
              borderRadius: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: theme.goldenGlow }}>✓</span> ML Forecasting
            </div>
          </div>
          <div style={{ 
            marginTop: '20px', 
            paddingTop: '15px', 
            borderTop: `1px solid ${theme.industrialGray}`,
            fontSize: '0.85rem',
            color: '#888888'
          }}>
            Capstone Project • Ready for Pre-Oral Presentation • {new Date().getFullYear()}
          </div>
        </div>
      </footer>

      {/* CSS ANIMATIONS */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: ${theme.softParchment};
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: ${theme.deepTeal}40;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: ${theme.deepTeal}60;
          }
        `}
      </style>
    </div>
  );
}

export default App;