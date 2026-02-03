import React, { useState } from 'react';

const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [menuItems, setMenuItems] = useState([
    { id: 1, name: 'CHORIZO JALAPENO', price: 200, category: 'Pasta', is_available: true },
    { id: 2, name: 'CLASSIC CARBONARA', price: 220, category: 'Pasta', is_available: true },
  ]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@alimento.com' && password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Use: admin@alimento.com / admin123');
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        backgroundColor: '#1A1A1A'
      }}>
        <div style={{ 
          backgroundColor: '#2C2C2C', 
          padding: '40px', 
          borderRadius: '15px',
          width: '400px'
        }}>
          <h2 style={{ color: '#E8B052', textAlign: 'center' }}>🔐 Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="admin@alimento.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px' }}
            />
            <input
              type="password"
              placeholder="admin123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px' }}
            />
            <button type="submit" style={{ 
              width: '100%', 
              padding: '15px', 
              backgroundColor: '#327282', 
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px'
            }}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', color: 'white', backgroundColor: '#1A1A1A', minHeight: '80vh' }}>
      <h1>📊 Admin Dashboard</h1>
      <p>Menu Management | Orders | Inventory</p>
      
      <div style={{ backgroundColor: '#2C2C2C', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
        <h3>Menu Items ({menuItems.length})</h3>
        <table style={{ width: '100%', color: 'white' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>₱{item.price}</td>
                <td>{item.category}</td>
                <td>{item.is_available ? '✅ Available' : '❌ Unavailable'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button 
        onClick={() => setIsLoggedIn(false)}
        style={{ 
          marginTop: '30px', 
          padding: '10px 20px', 
          backgroundColor: '#BC6C4D',
          color: 'white',
          border: 'none',
          borderRadius: '6px'
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default AdminDashboard;
