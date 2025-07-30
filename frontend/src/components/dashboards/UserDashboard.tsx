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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  TableRestaurant,
  BookOnline,
  History,
  ExitToApp,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <TableRestaurant sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My Bookings
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
          Restaurant Seat Booking
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Book your favorite seats and manage your reservations
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  My Current Bookings
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Your active and upcoming reservations
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="No active bookings"
                      secondary="Book a seat at your favorite restaurant to get started"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BookOnline color="primary" sx={{ mr: 2 }} />
                      <Typography variant="h6">Quick Actions</Typography>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Browse Restaurants
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Book a Table
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                    >
                      My Profile
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <History color="primary" sx={{ mr: 2 }} />
                      <Typography variant="h6">Booking Stats</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4" color="primary">0</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Bookings
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4" color="success.main">0</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="info.main">0</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upcoming
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Booking History
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="No booking history"
                  secondary="Your completed bookings will appear here"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default UserDashboard; 