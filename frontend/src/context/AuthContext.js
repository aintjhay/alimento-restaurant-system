import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children, scope = 'portal' }) => {
  const tokenKey = scope === 'admin' ? 'adminToken' : 'portalToken';
  const userKey = scope === 'admin' ? 'adminUser' : 'portalUser';
  // Move sessions saved by the old shared login before portal children read them.
  useState(() => {
    let savedUser;
    try { savedUser = JSON.parse(localStorage.getItem('portalUser') || 'null'); } catch { /* Ignore malformed cache. */ }
    if (savedUser?.type === 'guest') {
      localStorage.removeItem('portalUser');
      localStorage.removeItem('portalCheckoutType');
    }
    const savedToken = localStorage.getItem('portalToken');
    if (savedUser?.role === 'admin' || savedToken === 'local-admin-access') {
      if (savedToken && !localStorage.getItem('adminToken')) {
        localStorage.setItem('adminToken', savedToken);
        if (savedUser) localStorage.setItem('adminUser', JSON.stringify(savedUser));
      }
      localStorage.removeItem('portalToken');
      localStorage.removeItem('portalUser');
    }
    return null;
  });
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(tokenKey);
    if (!savedToken) { setLoading(false); return; }
    if (savedToken === 'local-admin-access') {
      localStorage.removeItem(tokenKey); localStorage.removeItem(userKey); setLoading(false); return;
    }
    setToken(savedToken);
    try {
      const cachedUser = JSON.parse(localStorage.getItem(userKey) || 'null');
      if (cachedUser) { setUser(cachedUser); setIsAuthenticated(true); }
    } catch { /* Revalidate malformed cached user data with the server. */ }
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${savedToken}` } })
      .then(async response => {
        if (response.status === 401) {
          localStorage.removeItem(tokenKey); localStorage.removeItem(userKey);
          setToken(null); setUser(null); setIsAuthenticated(false);
          return;
        }
        if (!response.ok) throw new Error('Session check temporarily unavailable');
        const data = await response.json();
        localStorage.setItem(userKey, JSON.stringify(data.user));
        setToken(savedToken); setUser(data.user); setIsAuthenticated(true);
      })
      .catch(error => { console.warn('Could not validate session:', error.message); })
      .finally(() => setLoading(false));
  }, [API_URL, tokenKey, userKey]);

  /**
   * Register new user
   */
  const register = async (firstName, lastName, email, password, address, phone) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          address,
          phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save token and user
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem(userKey, JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      return {
        success: true,
        message: 'Registration successful!',
        user: data.user
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and user
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem(userKey, JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      return {
        success: true,
        message: 'Login successful!',
        user: data.user
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {

        throw new Error(data.message || 'Administrator login failed');
      }

      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem(userKey, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, user: data.user };
    } catch (error) {

      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    const currentToken = localStorage.getItem(tokenKey);
    if (currentToken) Promise.resolve(fetch(`${API_URL}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${currentToken}` } })).catch(() => {});
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Fetch current user profile
   */
  const fetchCurrentUser = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) { logout(); return; }
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem(userKey, JSON.stringify(data.user));
    } catch (error) {
      console.error('Error fetching user:', error);
      // Temporary network/server failures must not erase the saved session.
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    register,
    login,
    adminLogin,
    logout,
    fetchCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
