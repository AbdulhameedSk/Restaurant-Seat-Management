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
  Chip,
} from '@mui/material';
import {
  VerifiedUser,
  Schedule,
  CheckCircle,
  ExitToApp,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const SubAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <VerifiedUser sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SubAdmin Dashboard - {user?.restaurant?.name || 'Restaurant'}
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
          Arrival Verification Portal
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Verify customer arrivals and manage seat occupancy
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pending Arrivals
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Customers who need arrival verification within 15 minutes
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="No pending arrivals"
                      secondary="All customers have been verified or booking window has expired"
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
                      <Schedule color="primary" sx={{ mr: 2 }} />
                      <Typography variant="h6">Today's Stats</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4" color="primary">0</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bookings Today
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4" color="success.main">0</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Verified Arrivals
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="warning.main">0</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Verifications
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircle color="success" sx={{ mr: 2 }} />
                      <Typography variant="h6">Quick Actions</Typography>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Scan QR Code
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Manual Verification
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                    >
                      View All Bookings
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="No recent activity"
                  secondary="Verified arrivals will appear here"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SubAdminDashboard; 