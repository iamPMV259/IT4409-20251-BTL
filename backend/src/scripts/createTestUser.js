const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function main() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, {});
    console.log('Connected to MongoDB');

    const email = 'test@example.com';
    const plainPassword = 'Test1234!';

    let user = await User.findOne({ email });
    if (user) {
      console.log('Test user already exists:', email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    user = await User.create({
      name: 'Test User',
      email,
      passwordHash,
    });

    console.log('Created test user:', user.email);
    console.log('You can login with:', { email, password: plainPassword });
    process.exit(0);
  } catch (err) {
    console.error('Error creating test user:', err.message || err);
    process.exit(1);
  }
}

main();
