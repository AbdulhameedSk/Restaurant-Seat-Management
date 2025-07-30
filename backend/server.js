const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000, // 15 seconds timeout
  socketTimeoutMS: 45000, // 45 seconds socket timeout
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  // Create default admin user
  require('./utils/createDefaultAdmin')();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error.message);
  console.log('💡 Please check if MongoDB is running or update MONGODB_URI in .env file');
});

// Import routes
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurant');
const bookingRoutes = require('./routes/booking');
const userRoutes = require('./routes/user');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/user', userRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-restaurant', (restaurantId) => {
    socket.join(restaurantId);
    console.log(`User ${socket.id} joined restaurant ${restaurantId}`);
  });

  socket.on('seat-status-update', (data) => {
    socket.to(data.restaurantId).emit('seat-updated', data);
  });

  socket.on('booking-verified', (data) => {
    socket.to(data.restaurantId).emit('booking-status-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Cron job to check for expired bookings every minute
cron.schedule('* * * * *', async () => {
  try {
    const Booking = require('./models/Booking');
    const expiredBookings = await Booking.find({
      status: 'confirmed',
      arrivalDeadline: { $lt: new Date() },
      verified: false
    });

    for (let booking of expiredBookings) {
      booking.status = 'cancelled';
      booking.cancelReason = 'No-show - exceeded 15 minute arrival window';
      await booking.save();

      // Notify all users in the restaurant about the cancelled booking
      io.to(booking.restaurant.toString()).emit('booking-cancelled', {
        bookingId: booking._id,
        seatNumber: booking.seatNumber,
        reason: booking.cancelReason
      });
    }
  } catch (error) {
    console.error('Error checking expired bookings:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io }; 