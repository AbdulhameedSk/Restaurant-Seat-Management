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

// Database connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = 'mongodb+srv://abdul:abdul@cluster0.puutgw3.mongodb.net/restaurant-management';
    console.log('🔗 Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Create default admin user
    require('./utils/createDefaultAdmin')();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Troubleshooting steps:');
    console.log('   1. Check if MongoDB is running locally: mongod');
    console.log('   2. Create a .env file in backend/ with MONGODB_URI');
    console.log('   3. For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/database');
    console.log('   4. For local MongoDB, use: mongodb://localhost:27017/restaurant-management');
    
    // Don't exit the process, let it continue but log the error
    process.exit(1);
  }
};

// Connect to database
connectDB();

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
    // Check if MongoDB is connected before running the cron job
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  MongoDB not connected, skipping expired bookings check');
      return;
    }

    const Booking = require('./models/Booking');
    const expiredBookings = await Booking.find({
      status: 'confirmed',
      arrivalDeadline: { $lt: new Date() },
      verified: false
    });

    if (expiredBookings.length > 0) {
      console.log(`🕐 Processing ${expiredBookings.length} expired bookings`);
    }

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
    console.error('Error checking expired bookings:', error.message);
    // Don't let the cron job crash the application
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