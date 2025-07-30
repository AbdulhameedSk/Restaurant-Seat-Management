const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password').populate('restaurant');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please login first'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Check if user has specific permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please login first'
      });
    }

    const userPermissions = req.user.getPermissions();
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Check if subadmin belongs to the restaurant
const checkRestaurantAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next(); // Admin has access to all restaurants
    }

    if (req.user.role === 'subadmin') {
      const restaurantId = req.params.restaurantId || req.body.restaurant;
      
      if (!restaurantId) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant ID is required'
        });
      }

      if (req.user.restaurant._id.toString() !== restaurantId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this restaurant'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Restaurant access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking restaurant access'
    });
  }
};

// Optional authentication (for routes that can work with or without auth)
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password').populate('restaurant');
    } catch (error) {
      // Continue without setting req.user if token is invalid
      console.log('Optional auth failed:', error.message);
    }
  }

  next();
};

module.exports = {
  protect,
  authorize,
  checkPermission,
  checkRestaurantAccess,
  optionalAuth
}; 