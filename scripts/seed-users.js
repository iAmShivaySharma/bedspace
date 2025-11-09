const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// User schema (simplified for seeding)
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    verificationStatus: { type: String, default: 'pending' },
    businessName: { type: String },
    verificationDocuments: [{ type: Object }],
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

async function seedUsers() {
  try {
    console.log('Starting user seeding process...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('MongoDB DB:', process.env.MONGODB_DB);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB,
    });

    console.log('✅ Connected to MongoDB successfully');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create admin user
    const existingAdmin = await User.findOne({ email: 'admin@bedspace.com' });
    if (!existingAdmin) {
      const admin = new User({
        email: 'admin@bedspace.com',
        password: hashedPassword,
        name: 'Admin User',
        phone: '+91 9999999999',
        role: 'admin',
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      await admin.save();
      console.log('✅ Admin user created: admin@bedspace.com / password123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create seeker users
    const seekers = [
      {
        email: 'seeker@bedspace.com',
        name: 'John Seeker',
        phone: '+91 9876543210',
      },
      {
        email: 'seeker2@bedspace.com',
        name: 'Jane Seeker',
        phone: '+91 9876543211',
      },
    ];

    for (const seekerData of seekers) {
      const existingSeeker = await User.findOne({ email: seekerData.email });
      if (!existingSeeker) {
        const seeker = new User({
          ...seekerData,
          password: hashedPassword,
          role: 'seeker',
          isVerified: true,
          isEmailVerified: true,
          isPhoneVerified: true,
        });
        await seeker.save();
        console.log(`✅ Seeker user created: ${seekerData.email} / password123`);
      } else {
        console.log(`ℹ️  Seeker user already exists: ${seekerData.email}`);
      }
    }

    // Create provider users
    const providers = [
      {
        email: 'provider@bedspace.com',
        name: 'Provider One',
        phone: '+91 9876543220',
        businessName: 'Comfort Stays',
        verificationStatus: 'approved',
      },
      {
        email: 'provider2@bedspace.com',
        name: 'Provider Two',
        phone: '+91 9876543221',
        businessName: 'Cozy Rooms',
        verificationStatus: 'pending',
      },
    ];

    for (const providerData of providers) {
      const existingProvider = await User.findOne({ email: providerData.email });
      if (!existingProvider) {
        const provider = new User({
          ...providerData,
          password: hashedPassword,
          role: 'provider',
          isVerified: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          verificationDocuments: [
            {
              type: 'id_card',
              fileName: 'sample-id.jpg',
              fileUrl: '/uploads/sample-id.jpg',
              status: providerData.verificationStatus === 'approved' ? 'approved' : 'pending',
              uploadedAt: new Date(),
            },
          ],
        });
        await provider.save();
        console.log(
          `✅ Provider user created: ${providerData.email} / password123 (${providerData.verificationStatus})`
        );
      } else {
        console.log(`ℹ️  Provider user already exists: ${providerData.email}`);
      }
    }

    console.log('\n🎉 User seeding completed!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@bedspace.com / password123');
    console.log('Seeker: seeker@bedspace.com / password123');
    console.log('Provider (Approved): provider@bedspace.com / password123');
    console.log('Provider (Pending): provider2@bedspace.com / password123');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    } catch (closeError) {
      console.error('Error closing connection:', closeError);
    }
  }
}

// Add process error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

console.log('🚀 Starting seed script...');
seedUsers()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
