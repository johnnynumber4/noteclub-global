const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern';

async function resetPassword(email, newPassword) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log(`🔄 Resetting password for ${email}...`);
    
    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password
    const result = await db.collection('users').updateOne(
      { email },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('❌ User not found');
      return false;
    }
    
    if (result.modifiedCount === 1) {
      console.log('✅ Password reset successfully');
      console.log(`New password: ${newPassword}`);
      return true;
    }
    
    console.log('⚠️ Password was not changed');
    return false;
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    return false;
  } finally {
    await client.close();
  }
}

// If called directly, reset password for jyoungiv@gmail.com
if (require.main === module) {
  const email = 'jyoungiv@gmail.com';
  const newPassword = 'noteclub123'; // Simple test password
  
  resetPassword(email, newPassword);
}

module.exports = { resetPassword };