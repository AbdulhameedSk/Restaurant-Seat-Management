const express = require('express');
const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');
const { protect, authorize, checkRestaurantAccess } = require('../middleware/auth');

const router = express.Router();

// @desc    Create new booking
// @route   POST /api/booking
// @access  Private/User
router.post('/', protect, async (req, res) => {
  try {
    const {
      restaurant,
      seatNumber,
      seatType,
      partySize,
      bookingDate,
      bookingTime,
      specialRequests,
      contactPhone
    } = req.body;

    // Check if restaurant exists and is active
    const restaurantDoc = await Restaurant.findById(restaurant);
    if (!restaurantDoc || !restaurantDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found or inactive'
      });
    }

    // Check if seat exists and is available
    const seat = restaurantDoc.seats.find(s => s.seatNumber === seatNumber);
    if (!seat) {
      return res.status(400).json({
        success: false,
        message: 'Seat not found'
      });
    }

    if (!seat.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Seat is not available'
      });
    }

    // Check for existing booking for the same seat, date, and time
    const existingBooking = await Booking.findOne({
      restaurant,
      seatNumber,
      bookingDate: new Date(bookingDate),
      bookingTime,
      status: { $in: ['confirmed', 'arrived'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Seat is already booked for this date and time'
      });
    }

    // Create booking
    const bookingData = {
      user: req.user.id,
      restaurant,
      seatNumber,
      seatType,
      partySize,
      bookingDate: new Date(bookingDate),
      bookingTime,
      specialRequests,
      contactPhone
    };

    const booking = await Booking.create(bookingData);
    
    // Populate the booking with user and restaurant details
    await booking.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'restaurant', select: 'name address phone' }
    ]);

    // Mark seat as unavailable
    seat.isAvailable = false;
    await restaurantDoc.save();

    // Emit socket event for real-time updates
    const { io } = require('../server');
    io.to(restaurant.toString()).emit('new-booking', {
      booking,
      seatNumber,
      message: `New booking created for seat ${seatNumber}`
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
});

// @desc    Get user's bookings
// @route   GET /api/booking/my-bookings
// @access  Private/User
router.get('/my-bookings', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('restaurant', 'name address phone images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      bookings
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// @desc    Get booking by ID
// @route   GET /api/booking/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('restaurant', 'name address phone images')
      .populate('verifiedBy', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    if (req.user.role === 'subadmin' && booking.restaurant._id.toString() !== req.user.restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
});

// @desc    Cancel booking
// @route   PUT /api/booking/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (req.user.role === 'user' && booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    if (req.user.role === 'subadmin' && booking.restaurant.toString() !== req.user.restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled'
      });
    }

    // Cancel booking
    await booking.cancelBooking(reason || 'Cancelled by user');

    // Make seat available again
    const restaurant = await Restaurant.findById(booking.restaurant);
    const seat = restaurant.seats.find(s => s.seatNumber === booking.seatNumber);
    if (seat) {
      seat.isAvailable = true;
      await restaurant.save();
    }

    // Emit socket event
    const { io } = require('../server');
    io.to(booking.restaurant.toString()).emit('booking-cancelled', {
      bookingId: booking._id,
      seatNumber: booking.seatNumber,
      reason: booking.cancelReason
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});

// @desc    Verify customer arrival (SubAdmin only)
// @route   PUT /api/booking/:id/verify
// @access  Private/SubAdmin
router.put('/:id/verify', protect, authorize('subadmin'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if subadmin has access to this restaurant
    if (booking.restaurant.toString() !== req.user.restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this booking'
      });
    }

    // Verify arrival
    try {
      await booking.verifyArrival(req.user.id);
      
      await booking.populate([
        { path: 'user', select: 'name email phone' },
        { path: 'restaurant', select: 'name' },
        { path: 'verifiedBy', select: 'name' }
      ]);

      // Emit socket event
      const { io } = require('../server');
      io.to(booking.restaurant.toString()).emit('booking-verified', {
        bookingId: booking._id,
        seatNumber: booking.seatNumber,
        verifiedBy: req.user.name,
        verificationTime: booking.verificationTime
      });

      res.json({
        success: true,
        message: 'Customer arrival verified successfully',
        booking
      });
    } catch (verifyError) {
      res.status(400).json({
        success: false,
        message: verifyError.message
      });
    }
  } catch (error) {
    console.error('Verify arrival error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying arrival',
      error: error.message
    });
  }
});

// @desc    Get restaurant bookings (SubAdmin/Admin)
// @route   GET /api/booking/restaurant/:restaurantId
// @access  Private/SubAdmin/Admin
router.get('/restaurant/:restaurantId', protect, authorize('subadmin', 'admin'), checkRestaurantAccess, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    const restaurantId = req.params.restaurantId;

    let query = { restaurant: restaurantId };
    
    if (status) {
      query.status = status;
    }

    if (date) {
      const searchDate = new Date(date);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      query.bookingDate = {
        $gte: searchDate,
        $lt: nextDate
      };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('verifiedBy', 'name')
      .sort({ bookingDate: 1, bookingTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    // Get pending arrivals (bookings that need verification)
    const pendingArrivals = await Booking.find({
      restaurant: restaurantId,
      status: 'confirmed',
      verified: false,
      arrivalDeadline: { $gte: new Date() }
    }).populate('user', 'name phone');

    res.json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      bookings,
      pendingArrivals
    });
  } catch (error) {
    console.error('Get restaurant bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant bookings',
      error: error.message
    });
  }
});

// @desc    Get booking statistics (Admin/SubAdmin)
// @route   GET /api/booking/stats/:restaurantId
// @access  Private/SubAdmin/Admin
router.get('/stats/:restaurantId', protect, authorize('subadmin', 'admin'), checkRestaurantAccess, async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's stats
    const todayBookings = await Booking.countDocuments({
      restaurant: restaurantId,
      bookingDate: { $gte: today, $lt: tomorrow }
    });

    const todayVerified = await Booking.countDocuments({
      restaurant: restaurantId,
      bookingDate: { $gte: today, $lt: tomorrow },
      verified: true
    });

    const todayNoShows = await Booking.countDocuments({
      restaurant: restaurantId,
      bookingDate: { $gte: today, $lt: tomorrow },
      status: 'no-show'
    });

    const todayCancelled = await Booking.countDocuments({
      restaurant: restaurantId,
      bookingDate: { $gte: today, $lt: tomorrow },
      status: 'cancelled'
    });

    // Pending arrivals
    const pendingArrivals = await Booking.countDocuments({
      restaurant: restaurantId,
      status: 'confirmed',
      verified: false,
      arrivalDeadline: { $gte: new Date() }
    });

    // Monthly stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthlyBookings = await Booking.countDocuments({
      restaurant: restaurantId,
      bookingDate: { $gte: monthStart, $lt: monthEnd }
    });

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          bookingDate: { $gte: monthStart, $lt: monthEnd },
          status: { $in: ['arrived', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        today: {
          totalBookings: todayBookings,
          verified: todayVerified,
          noShows: todayNoShows,
          cancelled: todayCancelled,
          pendingArrivals
        },
        monthly: {
          totalBookings: monthlyBookings,
          revenue: monthlyRevenue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking statistics',
      error: error.message
    });
  }
});

// @desc    Mark booking as completed
// @route   PUT /api/booking/:id/complete
// @access  Private/SubAdmin
router.put('/:id/complete', protect, authorize('subadmin'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check restaurant access
    if (booking.restaurant.toString() !== req.user.restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this booking'
      });
    }

    if (booking.status !== 'arrived') {
      return res.status(400).json({
        success: false,
        message: 'Only arrived bookings can be marked as completed'
      });
    }

    booking.status = 'completed';
    await booking.save();

    // Make seat available again
    const restaurant = await Restaurant.findById(booking.restaurant);
    const seat = restaurant.seats.find(s => s.seatNumber === booking.seatNumber);
    if (seat) {
      seat.isAvailable = true;
      await restaurant.save();
    }

    res.json({
      success: true,
      message: 'Booking marked as completed',
      booking
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing booking',
      error: error.message
    });
  }
});

module.exports = router; 