const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Load environment variables manually from .env.local
function loadEnvFile() {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env.local');

    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      const lines = envFile.split('\n');

      lines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key] = value;
        }
      });

      console.log('📄 Loaded .env.local file');
    } else {
      console.log('❌ .env.local file not found');
    }
  } catch (error) {
    console.log('⚠️  Could not load .env.local:', error.message);
  }
}

loadEnvFile();

// Simple script to reset a user's password
async function resetPassword() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    console.log('📍 URI:', process.env.MONGODB_URI ? 'Found in env' : 'NOT FOUND - check .env.local');

    // Connect to your MongoDB Atlas cluster
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB Atlas');

    // Define User schema inline to avoid import issues
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String },
      // ... other fields don't matter for this script
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const email = 'jyoungiv@gmail.com';
    const newPassword = 'newpassword123'; // Change this to your desired password

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user
    const result = await User.updateOne(
      { email: email },
      { password: hashedPassword }
    );

    if (result.matchedCount > 0) {
      console.log(`✅ Password updated successfully for ${email}`);
      console.log(`🔑 New password: ${newPassword}`);
    } else {
      console.log(`❌ User not found: ${email}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

resetPassword();