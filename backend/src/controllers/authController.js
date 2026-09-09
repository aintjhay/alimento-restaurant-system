const User = require('../models/User');
const { isValidPhPhone, PH_PHONE_MESSAGE } = require('../utils/phoneUtils');
const {
  hashPassword,
  comparePassword,
  generateToken
} = require('../utils/authUtils');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, firstName, lastName'
      });
    }

    if (!isValidPhPhone(phone)) return res.status(400).json({ success: false, message: PH_PHONE_MESSAGE });

    let defaultAddress;
    if (address !== undefined) {
      if (!address || typeof address !== 'object' || Array.isArray(address) ||
          !['street', 'city', 'postal'].every(field => typeof address[field] === 'string' && address[field].trim()) ||
          !/^\d{4}$/.test(address.postal.trim())) {
        return res.status(400).json({ success: false, message: 'Please provide an address, city / municipality, and a valid 4-digit postal code.' });
      }
      defaultAddress = { label: 'Home', street: address.street.trim(), city: address.city.trim(), postal: address.postal.trim(), phone, isDefault: true };
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      phone: phone || '',
      addresses: defaultAddress ? [defaultAddress] : []
    });

    if (defaultAddress) user.defaultAddressId = user.addresses[0]._id.toString();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    // Return response without password
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses,
      defaultAddressId: user.defaultAddressId
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    // Return response without password
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage: user.profileImage,
      role: user.role
    };

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email: username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const isDefaultAdmin = normalizedUsername === 'admin' && password === '1234';
    let user = isDefaultAdmin
      ? await User.findOne({ email: normalizedUsername })
      : await User.findOne({ email: normalizedUsername, role: 'admin' });

    // Temporary bootstrap account so the admin screens are accessible on a fresh database.
    if (isDefaultAdmin && !user) {
      user = await User.create({
        firstName: 'Alimento',
        lastName: 'Administrator',
        email: 'admin',
        passwordHash: await hashPassword('1234'),
        role: 'admin'
      });
    } else if (isDefaultAdmin && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    const isPasswordValid = user && (
      isDefaultAdmin || await comparePassword(password, user.passwordHash)
    );
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid administrator credentials' });
    }

    const token = generateToken(user._id, user.email, user.role);
    return res.json({
      success: true,
      message: 'Administrator login successful!',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage: user.profileImage,
      addresses: user.addresses,
      totalOrdersCount: user.totalOrdersCount,
      loyaltyPoints: user.loyaltyPoints,
      role: user.role
    };

    res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

/**
 * Logout user (frontend-side mainly, but for completeness)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // In JWT, logout is mostly frontend-side (remove token)
    // Backend can maintain a blacklist if needed
    res.json({
      success: true,
      message: 'Logout successful. Please remove the token from client-side.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  getCurrentUser,
  logout
};
