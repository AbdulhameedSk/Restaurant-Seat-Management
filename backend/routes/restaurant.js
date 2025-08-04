const express = require('express');
const multer = require('multer');
const path = require('path');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const Booking = require('../models/Booking'); // Added Booking model import

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/restaurants/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'restaurant-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// @desc    Create new restaurant
// @route   POST /api/restaurant
// @access  Private/Admin or Restaurant Owner
router.post('/', protect, authorize('admin', 'restaurant'), upload.array('images', 5), async (req, res) => {
  try {
    const {
      name, description, address, phone, email, cuisine, priceRange,
      operatingHours, amenities, seats
    } = req.body;

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        images.push({
          url: `/uploads/restaurants/${file.filename}`,
          publicId: file.filename,
          caption: req.body[`caption_${index}`] || ''
        });
      });
    }

    // Parse JSON fields
    const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;
    const parsedCuisine = typeof cuisine === 'string' ? JSON.parse(cuisine) : cuisine;
    const parsedOperatingHours = typeof operatingHours === 'string' ? JSON.parse(operatingHours) : operatingHours;
    const parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
    const parsedSeats = typeof seats === 'string' ? JSON.parse(seats) : seats;

    const restaurantData = {
      name,
      description,
      address: parsedAddress,
      phone,
      email,
      images,
      cuisine: parsedCuisine,
      priceRange,
      operatingHours: parsedOperatingHours,
      amenities: parsedAmenities,
      seats: parsedSeats || [],
      owner: req.user.id
    };

    const restaurant = await Restaurant.create(restaurantData);

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      restaurant
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating restaurant',
      error: error.message
    });
  }
});

// @desc    Get all restaurants
// @route   GET /api/restaurant
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      cuisine,
      priceRange,
      search
    } = req.query;

    // Build query
    let query = { isActive: true };

    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }

    if (cuisine) {
      query.cuisine = { $in: [cuisine] };
    }

    if (priceRange) {
      query.priceRange = priceRange;
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { cuisine: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const restaurants = await Restaurant.find(query)
      .populate('owner', 'name email')
      .select('-subAdmins')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Restaurant.countDocuments(query);

    res.json({
      success: true,
      count: restaurants.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      restaurants
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: error.message
    });
  }
});

// @desc    Get single restaurant
// @route   GET /api/restaurant/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('subAdmins', 'name email');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      restaurant
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant',
      error: error.message
    });
  }
});

// @desc    Update restaurant
// @route   PUT /api/restaurant/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), upload.array('newImages', 5), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const {
      name, description, address, phone, email, cuisine, priceRange,
      operatingHours, amenities, seats, removeImages
    } = req.body;

    // Update basic fields
    if (name) restaurant.name = name;
    if (description) restaurant.description = description;
    if (address) restaurant.address = typeof address === 'string' ? JSON.parse(address) : address;
    if (phone) restaurant.phone = phone;
    if (email) restaurant.email = email;
    if (cuisine) restaurant.cuisine = typeof cuisine === 'string' ? JSON.parse(cuisine) : cuisine;
    if (priceRange) restaurant.priceRange = priceRange;
    if (operatingHours) restaurant.operatingHours = typeof operatingHours === 'string' ? JSON.parse(operatingHours) : operatingHours;
    if (amenities) restaurant.amenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
    if (seats) restaurant.seats = typeof seats === 'string' ? JSON.parse(seats) : seats;

    // Handle image removal
    if (removeImages) {
      const imagesToRemove = typeof removeImages === 'string' ? JSON.parse(removeImages) : removeImages;
      restaurant.images = restaurant.images.filter(img => !imagesToRemove.includes(img.publicId));
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        restaurant.images.push({
          url: `/uploads/restaurants/${file.filename}`,
          publicId: file.filename,
          caption: req.body[`newCaption_${index}`] || ''
        });
      });
    }

    await restaurant.save();

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      restaurant
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating restaurant',
      error: error.message
    });
  }
});

// @desc    Delete restaurant
// @route   DELETE /api/restaurant/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    await restaurant.deleteOne();

    res.json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting restaurant',
      error: error.message
    });
  }
});

// @desc    Get restaurant seats
// @route   GET /api/restaurant/:id/seats
// @access  Public
router.get('/:id/seats', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).select('seats name');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      seats: restaurant.seats,
      restaurantName: restaurant.name
    });
  } catch (error) {
    console.error('Get seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seats',
      error: error.message
    });
  }
});

// @desc    Update seat layout
// @route   PUT /api/restaurant/:id/seats
// @access  Private/Admin
router.put('/:id/seats', protect, authorize('admin'), async (req, res) => {
  try {
    const { seats, layout } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    restaurant.seats = seats;
    if (layout) {
      restaurant.layout = layout;
    }

    await restaurant.save();

    res.json({
      success: true,
      message: 'Seat layout updated successfully',
      seats: restaurant.seats,
      layout: restaurant.layout
    });
  } catch (error) {
    console.error('Update seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating seat layout',
      error: error.message
    });
  }
});

// @desc    Get restaurants managed by restaurant owner
// @route   GET /api/restaurant/owner/managed
// @access  Private/Restaurant

router.get('/owner/managed', protect, authorize('restaurant'), async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user.id })
      .populate('subAdmins', 'name email isActive')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: restaurants.length,
      restaurants
    });
  } catch (error) {
    console.error('Get managed restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching managed restaurants',
      error: error.message
    });
  }
});

// @desc    Get available seats for a restaurant on specific date/time
// @route   GET /api/restaurant/:id/available-seats
// @access  Public
router.get('/:id/available-seats', async (req, res) => {
  try {
    const { date, time } = req.query;
    
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // If no date/time provided, return all seats with their current availability
    if (!date || !time) {
      return res.json({
        success: true,
        seats: restaurant.seats
      });
    }

    // Find bookings for the specific date and time
    const bookingDate = new Date(date);
    const existingBookings = await Booking.find({
      restaurant: req.params.id,
      bookingDate,
      bookingTime: time,
      status: { $in: ['confirmed', 'arrived'] }
    });

    // Mark seats as unavailable if they have bookings
    const bookedSeatNumbers = existingBookings.map(booking => booking.seatNumber);
    const availableSeats = restaurant.seats.map(seat => ({
      ...seat.toObject(),
      isAvailable: !bookedSeatNumbers.includes(seat.seatNumber)
    }));

    res.json({
      success: true,
      seats: availableSeats,
      date,
      time,
      totalSeats: availableSeats.length,
      availableCount: availableSeats.filter(seat => seat.isAvailable).length
    });
  } catch (error) {
    console.error('Get available seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available seats',
      error: error.message
    });
  }
});

// @desc    Get seat availability with next available times
// @route   GET /api/restaurant/:id/seat-availability
// @access  Public
router.get('/:id/seat-availability', async (req, res) => {
  try {
    const { date, time } = req.query;
    
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const bookingDate = new Date(date);
    const currentDate = new Date();
    
    // If date is in the past, return error
    if (bookingDate < currentDate.setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check availability for past dates'
      });
    }

    // Get all bookings for the specific date
    const dayBookings = await Booking.find({
      restaurant: req.params.id,
      bookingDate,
      status: { $in: ['confirmed', 'arrived'] }
    });

    // Get bookings for the specific time slot
    const timeSlotBookings = dayBookings.filter(booking => booking.bookingTime === time);
    const bookedSeatNumbers = timeSlotBookings.map(booking => booking.seatNumber);

    // Calculate seat availability
    const seatAvailability = restaurant.seats.map(seat => {
      const isAvailable = !bookedSeatNumbers.includes(seat.seatNumber);
      return {
        _id: seat._id,
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        position: seat.position,
        isAvailable,
        capacity: getSeatCapacity(seat.seatType)
      };
    });

    // Generate next available time slots if current time is not available
    const availableSeats = seatAvailability.filter(seat => seat.isAvailable);
    let nextAvailableTimes = [];

    if (availableSeats.length === 0) {
      nextAvailableTimes = await findNextAvailableTimes(restaurant._id, bookingDate, time, restaurant.seats);
    }

    // Get operating hours for the day
    const dayName = bookingDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const operatingHours = restaurant.operatingHours[dayName];

    res.json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        description: restaurant.description,
        images: restaurant.images,
        operatingHours: operatingHours
      },
      date,
      time,
      seatAvailability,
      availableSeats,
      totalSeats: restaurant.seats.length,
      availableCount: availableSeats.length,
      nextAvailableTimes: nextAvailableTimes.slice(0, 5), // Show next 5 available slots
      timeSlots: generateTimeSlots(operatingHours)
    });
  } catch (error) {
    console.error('Get seat availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seat availability',
      error: error.message
    });
  }
});

// Helper function to get seat capacity
function getSeatCapacity(seatType) {
  switch (seatType) {
    case 'table-2': return 2;
    case 'table-4': return 4;
    case 'table-6': return 6;
    case 'bar': return 1;
    case 'counter': return 1;
    default: return 2;
  }
}

// Helper function to generate time slots
function generateTimeSlots(operatingHours) {
  if (!operatingHours || operatingHours.isClosed) {
    return [];
  }

  const slots = [];
  const openTime = operatingHours.open;
  const closeTime = operatingHours.close;
  
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMinute = openMinute;
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    slots.push(timeString);
    
    // Increment by 30 minutes
    currentMinute += 30;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour++;
    }
  }
  
  return slots;
}

// Helper function to find next available times
async function findNextAvailableTimes(restaurantId, startDate, startTime, restaurantSeats) {
  const nextTimes = [];
  const maxDaysToCheck = 7; // Check next 7 days
  
  for (let dayOffset = 0; dayOffset < maxDaysToCheck; dayOffset++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    
    // Get operating hours for this day
    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const restaurant = await Restaurant.findById(restaurantId);
    const operatingHours = restaurant.operatingHours[dayName];
    
    if (!operatingHours || operatingHours.isClosed) {
      continue;
    }
    
    const timeSlots = generateTimeSlots(operatingHours);
    
    // For the first day, start from the requested time
    const startTimeIndex = dayOffset === 0 ? timeSlots.indexOf(startTime) + 1 : 0;
    
    for (let i = startTimeIndex; i < timeSlots.length; i++) {
      const timeSlot = timeSlots[i];
      
      // Check if any seats are available at this time
      const bookings = await Booking.find({
        restaurant: restaurantId,
        bookingDate: checkDate,
        bookingTime: timeSlot,
        status: { $in: ['confirmed', 'arrived'] }
      });
      
      const bookedSeats = bookings.map(b => b.seatNumber);
      const availableSeats = restaurantSeats.filter(seat => !bookedSeats.includes(seat.seatNumber));
      
      if (availableSeats.length > 0) {
        nextTimes.push({
          date: checkDate.toISOString().split('T')[0],
          time: timeSlot,
          availableSeats: availableSeats.length,
          totalSeats: restaurantSeats.length
        });
        
        if (nextTimes.length >= 10) { // Return max 10 suggestions
          return nextTimes;
        }
      }
    }
  }
  
  return nextTimes;
}

// @desc    Get all restaurants (Admin only - system level)
// @route   GET /api/restaurant/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive
    } = req.query;

    // Build query
    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { 'address.city': new RegExp(search, 'i') }
      ];
    }

    const restaurants = await Restaurant.find(query)
      .populate('owner', 'name email')
      .populate('subAdmins', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Restaurant.countDocuments(query);

    res.json({
      success: true,
      count: restaurants.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      restaurants
    });
  } catch (error) {
    console.error('Get all restaurants (admin) error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: error.message
    });
  }
});

module.exports = router; 