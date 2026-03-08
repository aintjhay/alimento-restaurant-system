const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET - Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// POST - Create new user profile
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    const user = new User({
      firstName,
      lastName,
      email,
      phone
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'User profile created successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user profile',
      error: error.message
    });
  }
});

// PUT - Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { firstName, lastName, phone, profileImage } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    });
  }
});

// POST - Add delivery address
router.post('/:userId/addresses', async (req, res) => {
  try {
    const { label, street, city, postal, phone, isDefault } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If this is default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    const newAddress = {
      label,
      street,
      city,
      postal,
      phone,
      isDefault: isDefault || user.addresses.length === 0
    };
    
    user.addresses.push(newAddress);
    
    // MongoDB auto-generates _id, but we need to save first to ensure it's created
    await user.save();
    
    // Set the default address ID to the newly created address
    const addedAddress = user.addresses[user.addresses.length - 1];
    if (addedAddress._id) {
      user.defaultAddressId = addedAddress._id.toString();
      await user.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding address',
      error: error.message
    });
  }
});

// PUT - Update delivery address
router.put('/:userId/addresses/:addressId', async (req, res) => {
  try {
    const { label, street, city, postal, phone, isDefault } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // If this is being set as default, unset others
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
      user.defaultAddressId = req.params.addressId;
    }
    
    address.label = label || address.label;
    address.street = street || address.street;
    address.city = city || address.city;
    address.postal = postal || address.postal;
    address.phone = phone || address.phone;
    if (isDefault !== undefined) address.isDefault = isDefault;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating address',
      error: error.message
    });
  }
});

// DELETE - Remove delivery address
router.delete('/:userId/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.addresses.id(req.params.addressId).deleteOne();
    
    // Update default address if needed
    if (user.defaultAddressId === req.params.addressId) {
      user.defaultAddressId = user.addresses.length > 0 ? user.addresses[0]._id : null;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Address deleted successfully',
      addresses: user.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting address',
      error: error.message
    });
  }
});

// GET - Get all addresses for user
router.get('/:userId/addresses', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      addresses: user.addresses,
      defaultAddressId: user.defaultAddressId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching addresses',
      error: error.message
    });
  }
});

module.exports = router;
