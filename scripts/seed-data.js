const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// User schema (simplified for seeding)
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String },
    role: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    verificationStatus: { type: String, default: 'pending' },
    businessName: { type: String },
    businessAddress: { type: String },
    businessPhone: { type: String },
    verificationDocuments: [
      {
        type: { type: String },
        url: { type: String },
        status: { type: String, default: 'pending' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

// Sample data
const sampleProviders = [
  {
    email: 'provider1@example.com',
    name: 'John Smith',
    phone: '+1234567890',
    role: 'provider',
    isVerified: true,
    isEmailVerified: true,
    verificationStatus: 'approved',
    businessName: 'Comfort Stays',
    businessAddress: '123 Main St, Downtown',
    businessPhone: '+1234567890',
  },
  {
    email: 'provider2@example.com',
    name: 'Sarah Johnson',
    phone: '+1234567891',
    role: 'provider',
    isVerified: true,
    isEmailVerified: true,
    verificationStatus: 'approved',
    businessName: 'City Beds',
    businessAddress: '456 Oak Ave, Midtown',
    businessPhone: '+1234567891',
  },
  {
    email: 'provider3@example.com',
    name: 'Mike Wilson',
    phone: '+1234567892',
    role: 'provider',
    isVerified: true,
    isEmailVerified: true,
    verificationStatus: 'approved',
    businessName: 'Budget Rooms',
    businessAddress: '789 Pine St, Uptown',
    businessPhone: '+1234567892',
  },
];

const sampleSeekers = [
  {
    email: 'seeker1@example.com',
    name: 'Alice Brown',
    phone: '+1234567893',
    role: 'seeker',
    isVerified: true,
    isEmailVerified: true,
  },
  {
    email: 'seeker2@example.com',
    name: 'Bob Davis',
    phone: '+1234567894',
    role: 'seeker',
    isVerified: true,
    isEmailVerified: true,
  },
  {
    email: 'seeker3@example.com',
    name: 'Carol White',
    phone: '+1234567895',
    role: 'seeker',
    isVerified: true,
    isEmailVerified: true,
  },
];

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB,
    });

    console.log('Connected to MongoDB');

    // Clear existing data (except admin)
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('Cleared existing data');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create providers
    const providers = [];
    for (const providerData of sampleProviders) {
      const provider = new User({
        ...providerData,
        password: hashedPassword,
        verificationDocuments: [
          {
            type: 'id_card',
            url: '/uploads/sample-id.jpg',
            status: 'approved',
          },
          {
            type: 'address_proof',
            url: '/uploads/sample-address.jpg',
            status: 'approved',
          },
        ],
      });
      await provider.save();
      providers.push(provider);
    }

    // Create seekers
    const seekers = [];
    for (const seekerData of sampleSeekers) {
      const seeker = new User({
        ...seekerData,
        password: hashedPassword,
      });
      await seeker.save();
      seekers.push(seeker);
    }

    console.log('Sample data created successfully!');
    console.log('\nProviders:');
    providers.forEach(p => console.log(`- ${p.name} (${p.email}) - ${p.businessName}`));
    console.log('\nSeekers:');
    seekers.forEach(s => console.log(`- ${s.name} (${s.email})`));
    console.log('\nAll users have password: password123');
    console.log('\nAdmin credentials:');
    console.log('Email: admin@bedspace.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedData();
