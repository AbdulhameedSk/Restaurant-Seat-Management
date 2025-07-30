const express = require('express');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users (Admin only)
// @route   GET /api/user
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      search
    } = req.query;

    // Build query
    let query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .populate('restaurant', 'name')
      .populate('createdBy', 'name email')
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @desc    Get single user (Admin only)
// @route   GET /api/user/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('restaurant', 'name address')
      .populate('createdBy', 'name email')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's booking statistics if they are a customer
    let bookingStats = null;
    if (user.role === 'user') {
      const totalBookings = await Booking.countDocuments({ user: user._id });
      const completedBookings = await Booking.countDocuments({ 
        user: user._id, 
        status: 'completed' 
      });
      const cancelledBookings = await Booking.countDocuments({ 
        user: user._id, 
        status: 'cancelled' 
      });
      const noShowBookings = await Booking.countDocuments({ 
        user: user._id, 
        status: 'no-show' 
      });

      bookingStats = {
        total: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        noShows: noShowBookings
      };
    }

    res.json({
      success: true,
      user,
      bookingStats
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// @desc    Update user (Admin only)
// @route   PUT /api/user/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, phone, isActive, restaurant } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (restaurant && user.role === 'subadmin') user.restaurant = restaurant;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('restaurant', 'name')
      .select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/user/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deletion of other admins
    if (user.role === 'admin' && user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete other admin users'
      });
    }

    // Check if user has active bookings
    const activeBookings = await Booking.countDocuments({
      user: user._id,
      status: { $in: ['confirmed', 'arrived'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with ${activeBookings} active booking(s)`
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// @desc    Get user dashboard stats (for current user)
// @route   GET /api/user/dashboard/stats
// @access  Private
router.get('/dashboard/stats', protect, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'user') {
      // User statistics
      const totalBookings = await Booking.countDocuments({ user: req.user.id });
      const upcomingBookings = await Booking.countDocuments({
        user: req.user.id,
        status: 'confirmed',
        bookingDate: { $gte: new Date() }
      });
      const completedBookings = await Booking.countDocuments({
        user: req.user.id,
        status: 'completed'
      });

      stats = {
        totalBookings,
        upcomingBookings,
        completedBookings,
        role: 'user'
      };
    } else if (req.user.role === 'subadmin') {
      // SubAdmin statistics
      const restaurantId = req.user.restaurant._id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayBookings = await Booking.countDocuments({
        restaurant: restaurantId,
        bookingDate: { $gte: today, $lt: tomorrow }
      });

      const pendingVerifications = await Booking.countDocuments({
        restaurant: restaurantId,
        status: 'confirmed',
        verified: false,
        arrivalDeadline: { $gte: new Date() }
      });

      const todayVerified = await Booking.countDocuments({
        restaurant: restaurantId,
        bookingDate: { $gte: today, $lt: tomorrow },
        verified: true,
        verifiedBy: req.user.id
      });

      stats = {
        todayBookings,
        pendingVerifications,
        todayVerified,
        role: 'subadmin',
        restaurant: req.user.restaurant.name
      };
    } else if (req.user.role === 'admin') {
      // Admin statistics
      const totalUsers = await User.countDocuments({ role: 'user' });
      const totalSubAdmins = await User.countDocuments({ role: 'subadmin' });
      const totalBookings = await Booking.countDocuments();
      const totalRestaurants = await User.countDocuments({ role: 'admin' }); // This should be Restaurant count

      stats = {
        totalUsers,
        totalSubAdmins,
        totalBookings,
        totalRestaurants,
        role: 'admin'
      };
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// @desc    Get recent activity (for current user)
// @route   GET /api/user/dashboard/activity
// @access  Private
router.get('/dashboard/activity', protect, async (req, res) => {
  try {
    let activity = [];

    if (req.user.role === 'user') {
      // Recent bookings for user
      const recentBookings = await Booking.find({ user: req.user.id })
        .populate('restaurant', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      activity = recentBookings.map(booking => ({
        type: 'booking',
        action: `Booking ${booking.status}`,
        details: `${booking.restaurant.name} - Seat ${booking.seatNumber}`,
        date: booking.createdAt,
        status: booking.status
      }));
    } else if (req.user.role === 'subadmin') {
      // Recent verifications by subadmin
      const recentVerifications = await Booking.find({
        restaurant: req.user.restaurant._id,
        verifiedBy: req.user.id
      })
        .populate('user', 'name')
        .sort({ verificationTime: -1 })
        .limit(5);

      activity = recentVerifications.map(booking => ({
        type: 'verification',
        action: 'Verified arrival',
        details: `${booking.user.name} - Seat ${booking.seatNumber}`,
        date: booking.verificationTime,
        status: 'verified'
      }));
    } else if (req.user.role === 'admin') {
      // Recent system activities
      const recentUsers = await User.find({ createdBy: req.user.id })
        .sort({ createdAt: -1 })
        .limit(3);

      activity = recentUsers.map(user => ({
        type: 'user_creation',
        action: 'Created user',
        details: `${user.name} (${user.role})`,
        date: user.createdAt,
        status: 'created'
      }));
    }

    res.json({
      success: true,
      activity
    });
  } catch (error) {
    console.error('Get dashboard activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard activity',
      error: error.message
    });
  }
});

module.exports = router; 