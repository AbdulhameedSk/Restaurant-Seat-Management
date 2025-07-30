# Restaurant Seat Management Portal

A comprehensive MERN stack application for managing restaurant seat bookings with role-based access control and real-time verification system.

## Features

### 🏪 For Admins
- **Restaurant Management**: Create and manage restaurant profiles with image uploads
- **SubAdmin Creation**: Create subadmin accounts for restaurant staff
- **System Dashboard**: Monitor all bookings, users, and system analytics
- **User Management**: Manage all user accounts and permissions

### 👨‍💼 For SubAdmins
- **Arrival Verification**: Verify customer arrivals in real-time
- **Booking Management**: View and manage restaurant-specific bookings
- **15-Minute Rule**: Automatic booking cancellation if customers don't arrive within 15 minutes
- **Real-time Notifications**: Get notified of new bookings and updates

### 👤 For Users (Customers)
- **Restaurant Discovery**: Browse available restaurants
- **Seat Booking**: Book specific seats at preferred times
- **Booking Management**: View and manage personal bookings
- **Real-time Updates**: Get notified about booking status changes

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.IO** for real-time communication
- **Multer** for file uploads
- **bcryptjs** for password hashing
- **node-cron** for scheduled tasks

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for modern UI components
- **React Router** for navigation
- **Axios** for API calls
- **Socket.IO Client** for real-time updates
- **React Hook Form** with Yup validation
- **React Toastify** for notifications

## Project Structure

```
Restaurant Seat Management/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── restaurant.js
│   │   ├── booking.js
│   │   └── user.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── createDefaultAdmin.js
│   ├── uploads/
│   │   └── restaurants/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── dashboards/
│   │   │   ├── public/
│   │   │   └── common/
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/restaurant-management
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=30d
   DEFAULT_ADMIN_EMAIL=admin@restaurant.com
   DEFAULT_ADMIN_PASSWORD=Admin123!
   BOOKING_TIMEOUT_MINUTES=15
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Admin Credentials

When you first run the application, a default admin account is created:

- **Email**: admin@restaurant.com
- **Password**: Admin123!

⚠️ **Important**: Change these credentials immediately in production!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/subadmin` - Create subadmin (Admin only)

### Restaurants
- `GET /api/restaurant` - Get all restaurants
- `POST /api/restaurant` - Create restaurant (Admin only)
- `GET /api/restaurant/:id` - Get restaurant details
- `PUT /api/restaurant/:id` - Update restaurant (Admin only)

### Bookings
- `POST /api/booking` - Create booking
- `GET /api/booking/my-bookings` - Get user bookings
- `PUT /api/booking/:id/verify` - Verify arrival (SubAdmin only)
- `GET /api/booking/restaurant/:restaurantId` - Get restaurant bookings

### Users
- `GET /api/user` - Get all users (Admin only)
- `GET /api/user/dashboard/stats` - Get dashboard statistics

## Key Features Implementation

### 🕐 15-Minute Arrival Window
- Bookings have a 15-minute window after the booking time for customer arrival
- Automatic cancellation using cron jobs if customers don't show up
- Real-time notifications to subadmins about pending arrivals

### 🔄 Real-time Updates
- Socket.IO integration for instant notifications
- Live booking status updates
- Real-time seat availability changes

### 🔒 Role-Based Access Control
- **Admin**: Full system access
- **SubAdmin**: Restaurant-specific verification access
- **User**: Personal booking management access

### 📱 Responsive Design
- Modern Material-UI components
- Mobile-friendly interface
- Intuitive user experience across all devices

## User Workflows

### Customer Booking Flow
1. Browse restaurants
2. Select preferred seat and time
3. Complete booking
4. Arrive within 15 minutes of booking time
5. Get verified by restaurant staff

### SubAdmin Verification Flow
1. Monitor pending arrivals dashboard
2. Verify customer arrival when they show up
3. Handle no-shows and cancellations
4. Manage restaurant-specific bookings

### Admin Management Flow
1. Create and manage restaurant profiles
2. Upload restaurant images
3. Create subadmin accounts
4. Monitor system-wide analytics

## Development

### Adding New Features
1. Backend: Add routes in `/routes`, models in `/models`, middleware in `/middleware`
2. Frontend: Add components in `/components`, contexts in `/contexts`
3. Update TypeScript interfaces as needed

### Environment Variables
- Update `.env` file for backend configuration
- Frontend uses proxy configuration to connect to backend

## Production Deployment

### Backend
1. Set NODE_ENV=production
2. Use environment variables for sensitive data
3. Set up MongoDB Atlas or production database
4. Configure CORS for production frontend URL

### Frontend
1. Build production bundle: `npm run build`
2. Serve static files or deploy to hosting service
3. Update API endpoints for production backend

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based route protection
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue or contact the development team.

---

**Happy Booking! 🍽️✨** 