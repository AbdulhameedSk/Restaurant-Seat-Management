const User = require('../models/User');

const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin
    const adminData = {
      name: 'System Administrator',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@restaurant.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!',
      role: 'admin',
      isActive: true
    };

    const admin = await User.create(adminData);
    console.log('Default admin user created successfully');
    console.log('Admin Email:', admin.email);
    console.log('Admin Password: Change this in production!');
    
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

module.exports = createDefaultAdmin; 