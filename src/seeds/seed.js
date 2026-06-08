const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const User = require('../models/User');
const trips = require('../../Doc/trips.json');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  await Trip.deleteMany({});
  const tripDocs = trips.map(({ id, createdAt, updatedAt, ...trip }) => ({
    ...trip,
    startDate: new Date(trip.startDate),
    endDate: new Date(trip.endDate),
  }));
  await Trip.insertMany(tripDocs);
  console.log(`Seeded ${tripDocs.length} trips`);

  const adminEmail = 'admin@tripzen.com';
  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: { name: 'Admin', role: 'admin' },
      $setOnInsert: { email: adminEmail, passwordHash },
    },
    { upsert: true, new: true, lean: true }
  );
  if (admin.role === 'admin') {
    console.log('Admin user ready: admin@tripzen.com / admin123');
  }

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
