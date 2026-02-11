import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import './Portal.css';

const PortalLoginRegister = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return 0;
    let strength = 1;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const getPasswordStrengthText = (strength) => {
    const texts = ['Weak', 'Fair', 'Good', 'Strong'];
    return texts[strength - 1] || 'Weak';
  };

  const getPasswordStrengthColor = (strength) => {
    const colors = ['#d32f2f', '#ff9800', '#fbc02d', '#689f38'];
    return colors[strength - 1] || '#d32f2f';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginEmail || !loginPassword) {
      setError('Please enter email and password');
      return;
    }

    if (!validateEmail(loginEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Simulate login - in production, call your backend
      const user = {
        id: Date.now(),
        email: loginEmail,
        name: loginEmail.split('@')[0],
        type: 'registered'
      };

      localStorage.setItem('portalUser', JSON.stringify(user));
      localStorage.setItem('portalCheckoutType', 'registered');
      if (rememberMe) {
        localStorage.setItem('portalRememberMe', 'true');
      }
      
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/portal');
      }, 800);
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (regName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (!validateEmail(regEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Simulate registration - in production, call your backend
      const user = {
        id: Date.now(),
        name: regName,
        email: regEmail,
        type: 'registered'
      };

      localStorage.setItem('portalUser', JSON.stringify(user));
      localStorage.setItem('portalCheckoutType', 'registered');
      
      setSuccess('Account created! Redirecting...');
      setTimeout(() => {
        navigate('/portal');
      }, 800);
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    const guestUser = {
      id: Date.now(),
      email: `guest_${Date.now()}@alimento.local`,
      name: 'Guest',
      type: 'guest'
    };
    localStorage.setItem('portalUser', JSON.stringify(guestUser));
    localStorage.setItem('portalCheckoutType', 'guest');
    navigate('/portal');
  };

  const regPasswordStrength = getPasswordStrength(regPassword);

  return (
    <div className="portal-page">
      <PortalHeader />
      
      <main className="portal-main">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-content">
              <h2 className="auth-title">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="auth-subtitle">
                {isLogin
                  ? 'Login to your account to continue ordering'
                  : 'Sign up to get started with your first order'}
              </p>

              <div className="auth-tabs">
                <button
                  className={`auth-tab ${isLogin ? 'active' : ''}`}
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                    setSuccess('');
                  }}
                >
                  Login
                </button>
                <button
                  className={`auth-tab ${!isLogin ? 'active' : ''}`}
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                    setSuccess('');
                  }}
                >
                  Register
                </button>
              </div>

              {error && (
                <div className="auth-alert auth-error">
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="auth-alert auth-success">
                  <span className="alert-icon">✓</span>
                  <span>{success}</span>
                </div>
              )}

              {isLogin ? (
                // LOGIN FORM
                <form onSubmit={handleLogin} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="login-email">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">📧</span>
                      <input
                        id="login-email"
                        type="email"
                        placeholder="example@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={loading}
                      />
                      {loginEmail && validateEmail(loginEmail) && (
                        <span className="input-check">✓</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="label-row">
                      <label htmlFor="login-password">Password</label>
                      <button
                        type="button"
                        className="forgot-pwd-btn"
                        onClick={() => setError('Password reset feature coming soon!')}
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        disabled={loading}
                      >
                        {showLoginPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Keep me logged in</span>
                  </label>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>

                  <p className="auth-demo-note">
                    Demo: Use any email and password to login
                  </p>
                </form>
              ) : (
                // REGISTER FORM
                <form onSubmit={handleRegister} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="reg-name">Full Name</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input
                        id="reg-name"
                        type="text"
                        placeholder="Your full name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        disabled={loading}
                      />
                      {regName.length >= 2 && (
                        <span className="input-check">✓</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-email">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">📧</span>
                      <input
                        id="reg-email"
                        type="email"
                        placeholder="example@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        disabled={loading}
                      />
                      {regEmail && validateEmail(regEmail) && (
                        <span className="input-check">✓</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-password">Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        disabled={loading}
                      >
                        {showRegPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {regPassword && (
                      <div className="password-strength">
                        <div
                          className="strength-bar"
                          style={{
                            width: `${(regPasswordStrength / 4) * 100}%`,
                            backgroundColor: getPasswordStrengthColor(regPasswordStrength)
                          }}
                        ></div>
                        <span
                          className="strength-text"
                          style={{ color: getPasswordStrengthColor(regPasswordStrength) }}
                        >
                          {getPasswordStrengthText(regPasswordStrength)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-confirm">Confirm Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input
                        id="reg-confirm"
                        type={showRegConfirm ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowRegConfirm(!showRegConfirm)}
                        disabled={loading}
                      >
                        {showRegConfirm ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {regPassword && regConfirmPassword && (
                      <span
                        className="match-indicator"
                        style={{
                          color: regPassword === regConfirmPassword ? '#4caf50' : '#d32f2f'
                        }}
                      >
                        {regPassword === regConfirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>
              )}

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="guest-btn"
                onClick={handleGuestContinue}
                disabled={loading}
              >
                Continue as Guest
              </button>
            </div>
          </div>

          <div className="auth-footer">
            <button
              type="button"
              className="back-link"
              onClick={() => navigate('/portal')}
            >
              ← Back to Menu
            </button>
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
};

export default PortalLoginRegister;
