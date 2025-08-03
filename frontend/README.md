# Restaurant Seat Management - Frontend

This is the React TypeScript frontend for the Restaurant Seat Management Portal.

## Features

- **User Authentication**: Login and registration with role-based access control
- **Restaurant Browsing**: Search and filter restaurants by cuisine, location, and price range
- **Seat Booking**: Interactive seat selection and booking system
- **Real-time Updates**: Socket.io integration for live seat availability and booking status
- **Dashboard Views**: 
  - Admin: Manage restaurants, users, and view analytics
  - SubAdmin: Verify customer arrivals and manage bookings
  - User: Browse restaurants and manage personal bookings
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Socket.io Client** for real-time communication
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Date-fns** for date manipulation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 5000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000
```

3. Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects the app from Create React App

## Project Structure

```
src/
├── components/
│   ├── auth/           # Login and registration components
│   ├── common/         # Shared components (LoadingSpinner, etc.)
│   └── dashboards/     # Role-specific dashboard components
├── contexts/           # React contexts (Auth, Socket)
├── services/           # API service functions
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component with routing
└── index.tsx           # App entry point
```

## API Integration

The frontend communicates with the backend through RESTful APIs and Socket.io:

- **Authentication**: `/api/auth/*`
- **Restaurants**: `/api/restaurant/*`
- **Bookings**: `/api/booking/*`
- **Users**: `/api/user/*`
- **Real-time**: Socket.io events for live updates

## User Roles

1. **Admin**: Full system access, can manage restaurants and users
2. **SubAdmin**: Restaurant-specific access, can verify arrivals
3. **User**: Can browse restaurants and make bookings

## Demo Accounts

- **Admin**: admin@restaurant.com / Admin123!
- **User**: Register a new account for user access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request 