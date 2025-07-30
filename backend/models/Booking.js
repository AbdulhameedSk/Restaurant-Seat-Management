const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  seatNumber: {
    type: String,
    required: true
  },
  seatType: {
    type: String,
    required: true
  },
  partySize: {
    type: Number,
    required: true,
    min: [1, 'Party size must be at least 1'],
    max: [8, 'Party size cannot exceed 8']
  },
  bookingDate: {
    type: Date,
    required: true
  },
  bookingTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no-show'],
    default: 'confirmed'
  },
  arrivalDeadline: {
    type: Date,
    required: true
  },
  actualArrivalTime: {
    type: Date
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationTime: {
    type: Date
  },
  specialRequests: {
    type: String,
    maxlength: [200, 'Special requests cannot exceed 200 characters']
  },
  contactPhone: {
    type: String,
    required: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  cancelReason: {
    type: String,
    maxlength: [200, 'Cancel reason cannot exceed 200 characters']
  },
  notes: {
    type: String,
    maxlength: [300, 'Notes cannot exceed 300 characters']
  },
  isWalkIn: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ restaurant: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ arrivalDeadline: 1 });

// Generate unique booking ID before saving
bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingId) {
    const date = new Date();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.bookingId = `RST${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${randomNum}`;
  }
  next();
});

// Set arrival deadline before saving (15 minutes after booking time)
bookingSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('bookingDate') || this.isModified('bookingTime')) {
    const [hours, minutes] = this.bookingTime.split(':').map(Number);
    const bookingDateTime = new Date(this.bookingDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    
    // Add 15 minutes to booking time for arrival deadline
    this.arrivalDeadline = new Date(bookingDateTime.getTime() + (15 * 60 * 1000));
  }
  next();
});

// Virtual for checking if booking is expired
bookingSchema.virtual('isExpired').get(function() {
  return new Date() > this.arrivalDeadline && !this.verified && this.status === 'confirmed';
});

// Virtual for time remaining until arrival deadline
bookingSchema.virtual('timeRemaining').get(function() {
  if (this.verified || this.status !== 'confirmed') return null;
  
  const now = new Date();
  const remaining = this.arrivalDeadline - now;
  
  if (remaining <= 0) return 'Expired';
  
  const minutes = Math.floor(remaining / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  
  return `${minutes}m ${seconds}s`;
});

// Method to check if booking can be verified
bookingSchema.methods.canBeVerified = function() {
  return this.status === 'confirmed' && !this.verified && new Date() <= this.arrivalDeadline;
};

// Method to verify arrival
bookingSchema.methods.verifyArrival = function(subAdminId) {
  if (!this.canBeVerified()) {
    throw new Error('Booking cannot be verified at this time');
  }
  
  this.verified = true;
  this.verifiedBy = subAdminId;
  this.verificationTime = new Date();
  this.actualArrivalTime = new Date();
  this.status = 'arrived';
  
  return this.save();
};

// Method to mark as no-show
bookingSchema.methods.markAsNoShow = function() {
  this.status = 'no-show';
  this.cancelReason = 'Customer did not arrive within the 15-minute window';
  return this.save();
};

// Method to cancel booking
bookingSchema.methods.cancelBooking = function(reason) {
  this.status = 'cancelled';
  this.cancelReason = reason;
  return this.save();
};

module.exports = mongoose.model('Booking', bookingSchema); 