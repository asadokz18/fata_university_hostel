// ============================================
// Seed data (replaces database/database.sql INSERTs)
// Default admin + 9 sample rooms + 4 sample notices
// Run with:  npm run seed
// ============================================
process.env.TZ = 'Asia/Karachi';
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const connectDB = require('./db');
const Admin = require('../models/Admin');
const Room = require('../models/Room');
const Notice = require('../models/Notice');
const mongoose = require('mongoose');

const addDays = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(d);
};

async function seed() {
  await connectDB();

  // make sure all unique indexes exist
  await Promise.all(Object.values(mongoose.models).map(m => m.init()));

  // Default admin (password: admin123) - same bcrypt hash as the SQL script
  const admin = await Admin.findOneAndUpdate(
    { username: 'admin_hostel' },
    {
      $setOnInsert: {
        username: 'admin_hostel',
        full_name: 'Main Admin',
        email: 'asadokz18@gmail.com',
        password: '$2y$10$OhSuu.0gPNV7/TvlfgQd1uPmHnDXcmE6I9rSmPPRPfMLmLGO9jDdq'
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Sample rooms
  const rooms = [
    ['FAQIR IPI HOUSE', '101', 2, 'Student single room on ground floor. Study table and chair is also available'],
    ['FAQIR IPI HOUSE', '102', 2, 'Spacious room with natural light and two study desks'],
    ['FAQIR IPI HOUSE', '103', 3, 'Triple sharing room with attached washroom'],
    ['FAQIR IPI HOUSE', '104', 2, 'Ground floor room with window view and study area'],
    ['FATIMA HOUSE', 'F101', 2, 'Female hostel room with proper security and CCTV surveillance'],
    ['FATIMA HOUSE', 'F102', 2, 'Comfortable room with wardrobe and study area'],
    ['FATIMA HOUSE', 'F103', 3, 'Spacious triple room with attached bathroom'],
    ['KHYBER HOUSE', '12', 2, 'Faculty room on ground floor with two beds'],
    ['KHYBER HOUSE', '13', 1, 'Single occupancy faculty room with attached bathroom']
  ];
  for (const [hostel_name, room_no, capacity, description] of rooms) {
    await Room.updateOne(
      { hostel_name, room_no },
      { $setOnInsert: { hostel_name, room_no, capacity, available_spaces: capacity, description } },
      { upsert: true }
    );
  }

  // Sample notices (only when there are none yet)
  if ((await Notice.countDocuments()) === 0) {
    await Notice.insertMany([
      { title: 'Water Supply Maintenance', message: 'Water supply will be suspended on Sunday 9:00 AM - 12:00 PM for maintenance. Please store water accordingly.', priority: 'Urgent', target_audience: 'All', expiry_date: addDays(7), created_by: admin._id, status: 'Active' },
      { title: 'Welcome to FATA University Hostel', message: 'Dear students and faculty, welcome to our hostel. Please read all hostel rules and regulations carefully. These guidelines ensure comfort and security for all residents.', priority: 'Normal', target_audience: 'All', expiry_date: null, created_by: admin._id, status: 'Active' },
      { title: 'Fee Submission Reminder', message: 'All hostel fees must be submitted by the 15th of each month. Late submission will incur a fine of Rs. 200.', priority: 'Important', target_audience: 'All', expiry_date: addDays(30), created_by: admin._id, status: 'Active' },
      { title: 'New Schedule Update', message: 'Revised meal timings: Breakfast 7:00AM-9:00AM, Lunch 1:00PM-2:30PM, Dinner 7:00PM-9:00PM. Please follow strictly.', priority: 'Important', target_audience: 'All', expiry_date: addDays(60), created_by: admin._id, status: 'Active' }
    ]);
  }

  console.log('Database seeded: admin, 9 rooms, sample notices.');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
