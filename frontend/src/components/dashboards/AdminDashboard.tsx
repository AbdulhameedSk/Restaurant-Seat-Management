import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Dashboard,
  Restaurant,
  People,
  Settings,
  ExitToApp,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Dashboard sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.name}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Restaurant Management Portal
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage restaurants, subadmins, and system settings
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Restaurant color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6">Restaurants</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Create and manage restaurant profiles, upload images, and configure seating layouts.
                </Typography>
                <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                  Manage Restaurants
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6">SubAdmins</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Create subadmin accounts for restaurant staff to verify customer arrivals.
                </Typography>
                <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                  Manage SubAdmins
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Settings color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6">System Settings</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Configure system-wide settings, view analytics, and manage user accounts.
                </Typography>
                <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                  System Settings
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Restaurants
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active SubAdmins
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">0</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Bookings
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AdminDashboard; 