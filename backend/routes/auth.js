const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Only allow regular users to register via public route
    const userData = {
      name,
      email,
      password,
      phone,
      role: 'user' // Force role to be user for public registration
    };

    const user = await User.create(userData);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).populate('restaurant');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        restaurant: user.restaurant,
        permissions: user.getPermissions()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('restaurant');
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        restaurant: user.restaurant,
        permissions: user.getPermissions(),
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
});

// @desc    Create subadmin (Restaurant Owner only)
// @route   POST /api/auth/subadmin
// @access  Private/Restaurant
router.post('/subadmin', protect, authorize('restaurant'), async (req, res) => {
  try {
    const { name, email, password, restaurant } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Verify that the restaurant belongs to the current user
    const Restaurant = require('../models/Restaurant');
    const restaurantDoc = await Restaurant.findById(restaurant);
    
    if (!restaurantDoc) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurantDoc.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only create subadmins for your own restaurants'
      });
    }

    const subAdminData = {
      name,
      email,
      password,
      role: 'subadmin',
      restaurant,
      createdBy: req.user.id
    };

    const subAdmin = await User.create(subAdminData);

    // Add subadmin to restaurant's subAdmins array
    restaurantDoc.subAdmins.push(subAdmin._id);
    await restaurantDoc.save();

    res.status(201).json({
      success: true,
      message: 'SubAdmin created successfully',
      subAdmin: {
        id: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        role: subAdmin.role,
        restaurant: subAdmin.restaurant
      }
    });
  } catch (error) {
    console.error('Create subadmin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subadmin',
      error: error.message
    });
  }
});

// @desc    Get subadmins for restaurant owner's restaurants
// @route   GET /api/auth/subadmins
// @access  Private/Restaurant
router.get('/subadmins', protect, authorize('restaurant'), async (req, res) => {
  try {
    // Get all restaurants owned by this user
    const Restaurant = require('../models/Restaurant');
    const ownedRestaurants = await Restaurant.find({ owner: req.user.id }).select('_id');

    // If no restaurants owned, return empty subadmins
    if (ownedRestaurants.length === 0) {
      return res.json({
        success: true,
        count: 0,
        subAdmins: []
      });
    }

    const restaurantIds = ownedRestaurants.map(r => r._id);

    // Get subadmins for owned restaurants only
    const subAdmins = await User.find({ 
      role: 'subadmin',
      restaurant: { $in: restaurantIds }
    })
      .populate('restaurant', 'name')
      .populate('createdBy', 'name')
      .select('-password');

    res.json({
      success: true,
      count: subAdmins.length,
      subAdmins
    });
  } catch (error) {
    console.error('Get subadmins error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subadmins',
      error: error.message
    });
  }
});

// @desc    Get all subadmins (Admin only - system level)
// @route   GET /api/auth/admin/subadmins
// @access  Private/Admin
router.get('/admin/subadmins', protect, authorize('admin'), async (req, res) => {
  try {
    const subAdmins = await User.find({ role: 'subadmin' })
      .populate('restaurant', 'name')
      .populate('createdBy', 'name')
      .select('-password');

    res.json({
      success: true,
      count: subAdmins.length,
      subAdmins
    });
  } catch (error) {
    console.error('Get all subadmins error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subadmins',
      error: error.message
    });
  }
});

// @desc    Get all restaurant owners (Admin only)
// @route   GET /api/auth/admin/restaurant-owners
// @access  Private/Admin
router.get('/admin/restaurant-owners', protect, authorize('admin'), async (req, res) => {
  try {
    const restaurantOwners = await User.find({ role: 'restaurant' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: restaurantOwners.length,
      restaurantOwners
    });
  } catch (error) {
    console.error('Get restaurant owners error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant owners',
      error: error.message
    });
  }
});

// @desc    Deactivate/Activate user (Admin only)
// @route   PUT /api/auth/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
});

// @desc    Register a new restaurant owner
// @route   POST /api/auth/register-restaurant-owner
// @access  Public
router.post('/register-restaurant-owner', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Validate required fields for restaurant owner
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for restaurant owners'
      });
    }

    const userData = {
      name,
      email,
      password,
      phone,
      role: 'restaurant'
    };

    const user = await User.create(userData);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Restaurant owner registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        permissions: user.getPermissions()
      }
    });
  } catch (error) {
    console.error('Restaurant owner registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating restaurant owner',
      error: error.message
    });
  }
});

module.exports = router; 