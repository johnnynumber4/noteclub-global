const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Simple script to reset a user's password
async function resetPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/noteclub-modern');

    // Import User model
    const User = mongoose.model('User', require('../src/models/User').default.schema);

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