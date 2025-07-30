const express = require('express');
const multer = require('multer');
const path = require('path');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { protect, authorize, checkPermission } = require('../middleware/auth');

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
// @access  Private/Admin
router.post('/', protect, authorize('admin'), upload.array('images', 5), async (req, res) => {
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

// @desc    Get restaurants managed by admin
// @route   GET /api/restaurant/admin/managed
// @access  Private/Admin
router.get('/admin/managed', protect, authorize('admin'), async (req, res) => {
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

module.exports = router; 