import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { adminLogin, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    const result = await adminLogin(username, password);
    if (result.success) navigate(result.user?.role === 'kitchen' ? '/admin/kitchen' : '/admin/dashboard', { replace: true });
    else setError(result.message);
  };

  return (
    <main className="login-container">
      <section className="login-box" aria-labelledby="admin-login-title">
        <div className="login-brand-mark" aria-hidden="true">A</div>
        <p className="login-eyebrow">ALIMENTO</p>
        <h1 id="admin-login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to your admin account.</p>

        <form onSubmit={handleSubmit} aria-busy={loading}>
          <div className="form-group">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="login-footer">Restaurant administration</p>
      </section>
    </main>
  );
}

export default Login;
