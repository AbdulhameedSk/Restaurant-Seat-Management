const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

const createDemoData = async () => {
  try {
    console.log('Creating demo data...');

    // Check if demo restaurant owner already exists
    const restaurantOwnerExists = await User.findOne({ 
      email: 'owner@restaurant.com' 
    });
    
    if (!restaurantOwnerExists) {
      // Create demo restaurant owner
      const restaurantOwnerData = {
        name: 'Demo Restaurant Owner',
        email: 'owner@restaurant.com',
        password: 'Owner123!',
        phone: '9876543210',
        role: 'restaurant',
        isActive: true
      };

      const restaurantOwner = await User.create(restaurantOwnerData);
      console.log('Demo restaurant owner created successfully');
      console.log('Restaurant Owner Email:', restaurantOwner.email);
      console.log('Restaurant Owner Password: Owner123!');

      // Create a demo restaurant for the owner
      const demoRestaurantData = {
        name: 'Demo Italiano Restaurant',
        description: 'A beautiful Italian restaurant with authentic cuisine and cozy atmosphere. Perfect for family dinners and romantic dates.',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        phone: '9876543210',
        email: 'demo@italiano.com',
        images: [],
        cuisine: ['Italian', 'Mediterranean'],
        priceRange: 'moderate',
        operatingHours: {
          monday: { open: '11:00', close: '23:00', isClosed: false },
          tuesday: { open: '11:00', close: '23:00', isClosed: false },
          wednesday: { open: '11:00', close: '23:00', isClosed: false },
          thursday: { open: '11:00', close: '23:00', isClosed: false },
          friday: { open: '11:00', close: '23:00', isClosed: false },
          saturday: { open: '11:00', close: '23:00', isClosed: false },
          sunday: { open: '12:00', close: '22:00', isClosed: false }
        },
        amenities: ['wifi', 'parking', 'ac', 'outdoor-seating'],
        seats: [
          { seatNumber: 'T1', seatType: 'table-2', isAvailable: true, position: { x: 100, y: 100 } },
          { seatNumber: 'T2', seatType: 'table-2', isAvailable: true, position: { x: 200, y: 100 } },
          { seatNumber: 'T3', seatType: 'table-4', isAvailable: true, position: { x: 300, y: 100 } },
          { seatNumber: 'T4', seatType: 'table-4', isAvailable: true, position: { x: 100, y: 200 } },
          { seatNumber: 'T5', seatType: 'table-6', isAvailable: true, position: { x: 200, y: 200 } },
          { seatNumber: 'B1', seatType: 'bar', isAvailable: true, position: { x: 400, y: 100 } },
          { seatNumber: 'B2', seatType: 'bar', isAvailable: true, position: { x: 400, y: 150 } },
          { seatNumber: 'C1', seatType: 'counter', isAvailable: true, position: { x: 500, y: 100 } }
        ],
        owner: restaurantOwner._id,
        subAdmins: [],
        isActive: true
      };

      const demoRestaurant = await Restaurant.create(demoRestaurantData);
      console.log('Demo restaurant created:', demoRestaurant.name);

      // Create a demo subadmin for the restaurant
      const subAdminData = {
        name: 'Demo SubAdmin',
        email: 'subadmin@restaurant.com',
        password: 'SubAdmin123!',
        role: 'subadmin',
        restaurant: demoRestaurant._id,
        createdBy: restaurantOwner._id,
        isActive: true
      };

      const subAdmin = await User.create(subAdminData);
      
      // Add subadmin to restaurant's subAdmins array
      demoRestaurant.subAdmins.push(subAdmin._id);
      await demoRestaurant.save();

      console.log('Demo subadmin created successfully');
      console.log('SubAdmin Email:', subAdmin.email);
      console.log('SubAdmin Password: SubAdmin123!');

    } else {
      console.log('Demo restaurant owner already exists');
    }

    // Check if demo customer exists
    const customerExists = await User.findOne({ 
      email: 'customer@demo.com' 
    });
    
    if (!customerExists) {
      // Create demo customer
      const customerData = {
        name: 'Demo Customer',
        email: 'customer@demo.com',
        password: 'Customer123!',
        phone: '9123456780',
        role: 'user',
        isActive: true
      };

      const customer = await User.create(customerData);
      console.log('Demo customer created successfully');
      console.log('Customer Email:', customer.email);
      console.log('Customer Password: Customer123!');
    } else {
      console.log('Demo customer already exists');
    }

    console.log('\n=== DEMO ACCOUNTS SUMMARY ===');
    console.log('🔐 Admin: admin@restaurant.com / Admin123!');
    console.log('🏪 Restaurant Owner: owner@restaurant.com / Owner123!');
    console.log('👨‍💼 SubAdmin: subadmin@restaurant.com / SubAdmin123!');
    console.log('👤 Customer: customer@demo.com / Customer123!');
    console.log('===============================\n');

  } catch (error) {
    console.error('Error creating demo data:', error);
  }
};

module.exports = createDemoData; 