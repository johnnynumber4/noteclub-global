import mongoose from "mongoose";

// User model schema (minimal version needed for this script)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  isActive: Boolean,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function deactivateJpanz() {
  try {
    // MongoDB URI from .env.local
    const MONGODB_URI = "mongodb+srv://jyoungiv_db_user:iLh3sgpMklDaBx1p@cluster0.twifgsh.mongodb.net/note-club-modern?retryWrites=true&w=majority&";

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find the specific user by email
    const userToDeactivate = await User.findOne({
      email: "jpanz07@gmail.com"
    });

    if (!userToDeactivate) {
      console.log("❌ User jpanz07@gmail.com not found");
      return;
    }

    console.log(`\nFound user to deactivate:`);
    console.log(`  - ${userToDeactivate.name} (${userToDeactivate.email})`);

    // Update this specific user to inactive
    const result = await User.updateOne(
      { email: "jpanz07@gmail.com" },
      { $set: { isActive: false } }
    );

    console.log(`\n✅ Deactivated user: ${userToDeactivate.name} (jpanz07@gmail.com)`);

    // Show all active users after update
    const activeUsers = await User.find({ isActive: true }).select(
      "name email username"
    );

    console.log(`\n📊 Active users (${activeUsers.length} total):`);
    activeUsers
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .forEach((user: any) => {
        console.log(`  ✓ ${user.name} (${user.email || user.username})`);
      });

    // Show all inactive users
    const inactiveUsers = await User.find({ isActive: false }).select(
      "name email username"
    );

    console.log(`\n🚫 Inactive users (${inactiveUsers.length} total):`);
    inactiveUsers
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
      .forEach((user: any) => {
        console.log(`  ✗ ${user.name} (${user.email || user.username})`);
      });

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

deactivateJpanz();
