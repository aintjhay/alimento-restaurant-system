import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import './PortalLoginRegister.css';
import { phPhoneInputProps, isValidPhPhone, PH_PHONE_MESSAGE } from '../../utils/phoneUtils';

const PortalLoginRegister = () => {
  const navigate = useNavigate();
  const { login, register, logout } = useAuth();
  const location = useLocation();
  const returnTo = location.state?.returnTo === '/portal/checkout' ? '/portal/checkout' : '/portal';
  const [isLogin, setIsLogin] = useState(new URLSearchParams(location.search).get('mode') !== 'register');

  React.useEffect(() => {
    setIsLogin(new URLSearchParams(location.search).get('mode') !== 'register');
    setError('');
    setSuccess('');
  }, [location.search]);
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
  const [regPhone, setRegPhone] = useState('');
  const [phoneInvalid, setPhoneInvalid] = useState(false);
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
        navigate(returnTo);
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

    if (!isValidPhPhone(regPhone)) { setPhoneInvalid(true); return; }

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
      const result = await register(regFirstName, regLastName, regEmail, regPassword, undefined, regPhone);
      
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
      setRegEmail(''); setRegPhone(''); setPhoneInvalid(false);
      setRegPassword('');
      setRegConfirmPassword('');
      
      setTimeout(() => {
        navigate(returnTo);
      }, 800);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    logout?.();
    localStorage.removeItem('portalUser');
    localStorage.removeItem('portalToken');
    localStorage.setItem('portalCheckoutType', 'guest');
    navigate(returnTo);
  };

  return (
    <div className="portal-page portal-auth-page">
      <div className="portal-auth-stage">
      <PortalHeader />
      
      <main className="portal-main">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-content">
              <h1 className="auth-title">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="auth-subtitle">
                {isLogin
                  ? 'Log in to use your saved details and order history.'
                  : 'Good food is just a few details away.'}
              </p>

              <div className="auth-tabs" role="group" aria-label="Account access">
                <button
                  className={`auth-tab ${isLogin ? 'active' : ''}`}
                  aria-pressed={isLogin}
                  disabled={loading}
                  onClick={() => {
                    setIsLogin(true);
                    navigate('/portal/login', { replace: true, state: location.state });
                    setError('');
                    setSuccess('');
                    // Clear register form when switching to login
                    setRegFirstName('');
                    setRegLastName('');
                    setRegEmail(''); setRegPhone(''); setPhoneInvalid(false);
                    setRegPassword('');
                    setRegConfirmPassword('');
                  }}
                >
                  Log in
                </button>
                <button
                  className={`auth-tab ${!isLogin ? 'active' : ''}`}
                  aria-pressed={!isLogin}
                  disabled={loading}
                  onClick={() => {
                    setIsLogin(false);
                    navigate('/portal/login?mode=register', { replace: true, state: location.state });
                    setError('');
                    setSuccess('');
                    // Clear login form when switching to register
                    setLoginEmail('');
                    setLoginPassword('');
                    setRememberMe(false);
                  }}
                >
                  Create account
                </button>
              </div>

              {error && (
                <div className="auth-alert auth-error" role="alert">
                  <span className="alert-icon"><AlertIcon color="#d32f2f" size={20} /></span>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="auth-alert auth-success" role="status">
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
                        autoComplete="email"
                        required
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
                        disabled={loading}
                        onClick={() => navigate('/portal/forgot-password')}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="input-wrapper">
                      <span className="input-icon"><LockIcon /></span>
                      <input
                        id="login-password"
                        autoComplete="current-password"
                        required
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showLoginPassword}
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
                      'Log in'
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
                          minLength={2}
                        autoComplete="given-name"
                        required
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
                          minLength={2}
                        autoComplete="family-name"
                        required
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
                        autoComplete="email"
                        required
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
                    <label htmlFor="reg-phone">Phone Number *</label>
                    <div className="input-wrapper">
                      <input
                        {...phPhoneInputProps}
                        id="reg-phone"
                        value={regPhone}
                        aria-invalid={phoneInvalid}
                        aria-describedby={phoneInvalid ? 'reg-phone-error' : undefined}
                        onChange={e => {
                          setRegPhone(e.target.value);
                          if (isValidPhPhone(e.target.value)) setPhoneInvalid(false);
                        }}
                        onInvalid={e => { e.preventDefault(); setPhoneInvalid(true); }}
                        disabled={loading}
                      />
                    </div>
                    {phoneInvalid && <small id="reg-phone-error" className="registration-phone-error" role="alert">{PH_PHONE_MESSAGE}</small>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-password">Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><LockIcon /></span>
                      <input
                        id="reg-password"
                        minLength={6}
                        aria-describedby="reg-password-help"
                        autoComplete="new-password"
                        required
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showRegPassword}
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        disabled={loading}
                      >
                        {showRegPassword ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
                      </button>
                    </div>
                    <small id="reg-password-help" className="auth-field-help">Use at least 6 characters.</small>
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
                        autoComplete="new-password"
                        required
                        type={showRegConfirm ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        aria-label={showRegConfirm ? 'Hide password' : 'Show password'}
                        aria-pressed={showRegConfirm}
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
                        Creating account...
                      </>
                    ) : (
                      'Create account'
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
                Continue as guest
              </button>
              <p className="auth-field-help">No account needed to place an order.</p>
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
              Back to menu
            </button>
          </div>
        </div>
      </main>
      </div>

      <PortalFooter />
    </div>
  );
};

export default PortalLoginRegister;
