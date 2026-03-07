import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PortalHeader from '../../components/portal/PortalHeader';
import PortalFooter from '../../components/portal/PortalFooter';
import AlertIcon from '../../components/icons/AlertIcon';
import CheckIcon from '../../components/icons/CheckIcon';
import EmailIcon from '../../components/icons/EmailIcon';
import LockIcon from '../../components/icons/LockIcon';
import EyeIcon from '../../components/icons/EyeIcon';
import EyeOffIcon from '../../components/icons/EyeOffIcon';
import UserIcon from '../../components/icons/UserIcon';
import XIcon from '../../components/icons/XIcon';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import './Portal.css';

const PortalLoginRegister = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
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
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Auto-dismiss errors after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
      const result = await login(loginEmail, loginPassword);
      
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }

      localStorage.setItem('portalCheckoutType', 'registered');
      if (rememberMe) {
        localStorage.setItem('portalRememberMe', 'true');
      }
      
      setSuccess('Login successful! Redirecting...');
      // Clear form on successful login
      setLoginEmail('');
      setLoginPassword('');
      setRememberMe(false);
      
      setTimeout(() => {
        navigate('/portal');
      }, 800);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regFirstName || !regLastName || !regEmail || !regPassword || !regConfirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (regFirstName.trim().length < 2 || regLastName.trim().length < 2) {
      setError('First and last names must be at least 2 characters');
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
      const result = await register(regFirstName, regLastName, regEmail, regPassword);
      
      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }

      localStorage.setItem('portalCheckoutType', 'registered');
      
      setSuccess('Account created! Redirecting...');
      // Clear form on successful registration
      setRegFirstName('');
      setRegLastName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      
      setTimeout(() => {
        navigate('/portal');
      }, 800);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
                    // Clear register form when switching to login
                    setRegFirstName('');
                    setRegLastName('');
                    setRegEmail('');
                    setRegPassword('');
                    setRegConfirmPassword('');
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
                    // Clear login form when switching to register
                    setLoginEmail('');
                    setLoginPassword('');
                    setRememberMe(false);
                  }}
                >
                  Register
                </button>
              </div>

              {error && (
                <div className="auth-alert auth-error">
                  <span className="alert-icon"><AlertIcon color="#d32f2f" size={20} /></span>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="auth-alert auth-success">
                  <span className="alert-icon"><CheckIcon color="#4caf50" size={20} /></span>
                  <span>{success}</span>
                </div>
              )}

              {isLogin ? (
                // LOGIN FORM
                <form onSubmit={handleLogin} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="login-email">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><EmailIcon /></span>
                      <input
                        id="login-email"
                        type="email"
                        placeholder="example@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={loading}
                      />
                      {loginEmail && validateEmail(loginEmail) && (
                        <span className="input-check"><CheckIcon color="#4caf50" size={18} /></span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="label-row">
                      <label htmlFor="login-password">Password</label>
                      <button
                        type="button"
                        className="forgot-pwd-btn"
                        disabled
                        title="Password reset feature coming soon"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="input-wrapper">
                      <span className="input-icon"><LockIcon /></span>
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
                        {showLoginPassword ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
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
                </form>
              ) : (
                // REGISTER FORM
                <form onSubmit={handleRegister} className="auth-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="reg-firstname">First Name</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><UserIcon /></span>
                        <input
                          id="reg-firstname"
                          type="text"
                          placeholder="First name"
                          value={regFirstName}
                          onChange={(e) => setRegFirstName(e.target.value)}
                          disabled={loading}
                        />
                        {regFirstName.length >= 2 && (
                          <span className="input-check"><CheckIcon color="#4caf50" size={18} /></span>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="reg-lastname">Last Name</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><UserIcon /></span>
                        <input
                          id="reg-lastname"
                          type="text"
                          placeholder="Last name"
                          value={regLastName}
                          onChange={(e) => setRegLastName(e.target.value)}
                          disabled={loading}
                        />
                        {regLastName.length >= 2 && (
                          <span className="input-check"><CheckIcon color="#4caf50" size={18} /></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-email">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><EmailIcon /></span>
                      <input
                        id="reg-email"
                        type="email"
                        placeholder="example@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        disabled={loading}
                      />
                      {regEmail && validateEmail(regEmail) && (
                        <span className="input-check"><CheckIcon color="#4caf50" size={18} /></span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-password">Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><LockIcon /></span>
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
                        {showRegPassword ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
                      </button>
                    </div>
                    {regPassword && (
                      <div className="password-strength">
                        <div
                          className="strength-bar"
                          style={{
                            width: `${(getPasswordStrength(regPassword) / 4) * 100}%`,
                            backgroundColor: getPasswordStrengthColor(getPasswordStrength(regPassword))
                          }}
                        ></div>
                        <span
                          className="strength-text"
                          style={{ color: getPasswordStrengthColor(getPasswordStrength(regPassword)) }}
                        >
                          {getPasswordStrengthText(getPasswordStrength(regPassword))}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-confirm">Confirm Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><LockIcon /></span>
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
                        {showRegConfirm ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
                      </button>
                    </div>
                    {regPassword && regConfirmPassword && (
                      <span
                        className="match-indicator"
                        style={{
                          color: regPassword === regConfirmPassword ? '#4caf50' : '#d32f2f'
                        }}
                      >
                        <span style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center' }}>
                          {regPassword === regConfirmPassword ? <CheckIcon color="#4caf50" size={16} /> : <XIcon color="#d32f2f" size={16} />}
                        </span>
                        {regPassword === regConfirmPassword ? 'Passwords match' : 'Passwords do not match'}
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
              <span style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center' }}>
                <ArrowLeftIcon size={18} />
              </span>
              Back to Menu
            </button>
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
};

export default PortalLoginRegister;
