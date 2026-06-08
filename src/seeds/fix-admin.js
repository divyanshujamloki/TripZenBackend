const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const fixAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await User.updateOne(
    { email: 'admin@tripzen.com' },
    { $set: { role: 'admin', name: 'Admin' } }
  );

  const user = await User.findOne({ email: 'admin@tripzen.com' }).lean();
  console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  console.log('Current user:', user);

  await mongoose.disconnect();
  process.exit(0);
};

fixAdmin().catch((err) => {
  console.error('Fix failed:', err.message);
  process.exit(1);
});
