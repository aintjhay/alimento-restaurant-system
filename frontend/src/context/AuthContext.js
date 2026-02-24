import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('portalToken');
    const savedUser = localStorage.getItem('portalUser');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  /**
   * Register new user
   */
  const register = async (firstName, lastName, email, password) => {
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
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save token and user
      localStorage.setItem('portalToken', data.token);
      localStorage.setItem('portalUser', JSON.stringify(data.user));

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
      localStorage.setItem('portalToken', data.token);
      localStorage.setItem('portalUser', JSON.stringify(data.user));

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

  /**
   * Logout user
   */
  const logout = () => {
    localStorage.removeItem('portalToken');
    localStorage.removeItem('portalUser');
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

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('portalUser', JSON.stringify(data.user));
    } catch (error) {
      console.error('Error fetching user:', error);
      // If token is invalid, logout
      logout();
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    register,
    login,
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
