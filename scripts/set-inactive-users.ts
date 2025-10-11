import mongoose from "mongoose";

// User model schema (minimal version needed for this script)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  isActive: Boolean,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Users to deactivate based on the names provided
const USERS_TO_DEACTIVATE = [
  "Demo User",
  "Jake Roa",
  "Joe Panzarella", // Will catch both Joe Panzarella users
  "Matthew Young",
  "Emily Young",
  "Darshan Patel",
  "Taylor Roa",
];

async function setInactiveUsers() {
  try {
    // MongoDB URI from .env.local
    const MONGODB_URI = "mongodb+srv://jyoungiv_db_user:iLh3sgpMklDaBx1p@cluster0.twifgsh.mongodb.net/note-club-modern?retryWrites=true&w=majority&";

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all users that match the names to deactivate
    const usersToUpdate = await User.find({
      name: { $in: USERS_TO_DEACTIVATE },
    });

    console.log(`\nFound ${usersToUpdate.length} users to deactivate:`);
    usersToUpdate.forEach((user: any) => {
      console.log(`  - ${user.name} (${user.email || user.username})`);
    });

    // Update all matching users to inactive
    const result = await User.updateMany(
      { name: { $in: USERS_TO_DEACTIVATE } },
      { $set: { isActive: false } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} users to inactive status`);

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

setInactiveUsers();
