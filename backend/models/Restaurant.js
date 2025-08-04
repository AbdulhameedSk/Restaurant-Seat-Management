const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatNumber: {
    type: String,
    required: true
  },
  seatType: {
    type: String,
    enum: ['table-2', 'table-4', 'table-6', 'bar', 'counter'],
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }
});

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    minlength: [2, 'Restaurant name must be at least 2 characters long'],
    maxlength: [100, 'Restaurant name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Restaurant description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, default: '' }
  }],
  cuisine: [{
    type: String,
    required: true
  }],
  priceRange: {
    type: String,
    enum: ['budget', 'moderate', 'expensive', 'luxury'],
    required: true
  },
  seats: [seatSchema],
  totalSeats: {
    type: Number,
    default: 0
  },
  operatingHours: {
    monday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    tuesday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    wednesday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    thursday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    friday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    saturday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } },
    sunday: { open: { type: String }, close: { type: String }, isClosed: { type: Boolean, default: false } }
  },
  amenities: [{
    type: String,
    enum: ['wifi', 'parking', 'ac', 'outdoor-seating', 'bar', 'live-music', 'takeaway', 'delivery']
  }],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subAdmins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  layout: {
    width: { type: Number, default: 800 },
    height: { type: Number, default: 600 }
  }
}, {
  timestamps: true
});

// Indexes for better performance
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ 'address.city': 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ priceRange: 1 });
restaurantSchema.index({ isActive: 1 });

// Update total seats when seats array changes
restaurantSchema.pre('save', function(next) {
  this.totalSeats = this.seats.length;
  next();
});

// Virtual for available seats count
restaurantSchema.virtual('availableSeats').get(function() {
  return this.seats.filter(seat => seat.isAvailable).length;
});

// Method to get available seats
restaurantSchema.methods.getAvailableSeats = function() {
  return this.seats.filter(seat => seat.isAvailable);
};

// Method to check if restaurant is open
restaurantSchema.methods.isOpenNow = function() {
  const now = new Date();
  const day = now.toLocaleLowerCase();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const todayHours = this.operatingHours[day];
  if (!todayHours || todayHours.isClosed) return false;
  
  const openTime = parseInt(todayHours.open.replace(':', ''));
  const closeTime = parseInt(todayHours.close.replace(':', ''));
  
  return currentTime >= openTime && currentTime <= closeTime;
};

module.exports = mongoose.model('Restaurant', restaurantSchema); 