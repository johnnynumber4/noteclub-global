import mongoose from "mongoose";

// User model schema (minimal version needed for this script)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  isActive: Boolean,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Users to activate
const USERS_TO_ACTIVATE = [
  "Brian Weidman",
  "Cameron Mahood",
  "Jared No",
  "Joe Panzarella",
  "John Keith",
  "Ken Hertzog",
];

async function setActiveUsers() {
  try {
    // MongoDB URI from .env.local
    const MONGODB_URI = "mongodb+srv://jyoungiv_db_user:iLh3sgpMklDaBx1p@cluster0.twifgsh.mongodb.net/note-club-modern?retryWrites=true&w=majority&";

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all users that match the names to activate
    const usersToUpdate = await User.find({
      name: { $in: USERS_TO_ACTIVATE },
    });

    console.log(`\nFound ${usersToUpdate.length} users to activate:`);
    usersToUpdate.forEach((user: any) => {
      console.log(`  - ${user.name} (${user.email || user.username})`);
    });

    // Update all matching users to active
    const result = await User.updateMany(
      { name: { $in: USERS_TO_ACTIVATE } },
      { $set: { isActive: true } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} users to active status`);

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

setActiveUsers();
