const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['admin', 'restaurant', 'subadmin', 'user'],
    default: 'user'
  },
  phone: {
    type: String,
    required: function() {
      return this.role === 'user';
    },
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: function() {
      return this.role === 'subadmin';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role === 'subadmin';
    }
  },
  profileImage: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ restaurant: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get user role permissions
userSchema.methods.getPermissions = function() {
  const permissions = {
    admin: ['manage_system', 'view_all_data', 'manage_users', 'system_settings'],
    restaurant: ['create_restaurant', 'manage_own_restaurant', 'create_subadmins', 'manage_seats', 'view_own_bookings'],
    subadmin: ['verify_arrivals', 'manage_bookings', 'view_restaurant_data'],
    user: ['create_booking', 'view_own_bookings', 'cancel_booking']
  };
  
  return permissions[this.role] || [];
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 