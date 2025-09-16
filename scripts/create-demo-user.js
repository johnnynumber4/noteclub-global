#!/usr/bin/env node

// Demo User Setup Script
// Creates a demo user account for testing the Note Club Modern app

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Connect to MongoDB
const MONGODB_URI = "mongodb://localhost:27017/note-club-modern";

async function createDemoUser() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Define User schema inline (since we can't import ES modules in CommonJS)
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      username: { type: String, required: true, unique: true },
      turnOrder: { type: Number, default: 1 },
      favoriteGenres: [String],
      musicPlatforms: {
        spotify: String,
        youtubeMusic: String,
        appleMusic: String,
        tidal: String,
        deezer: String,
      },
      isActive: { type: Boolean, default: true },
      albumsPosted: { type: Number, default: 0 },
      commentsPosted: { type: Number, default: 0 },
      likesGiven: { type: Number, default: 0 },
      likesReceived: { type: Number, default: 0 },
      totalAlbumsPosted: { type: Number, default: 0 },
      notificationSettings: {
        newThemes: { type: Boolean, default: true },
        turnReminders: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        likes: { type: Boolean, default: true },
        emails: { type: Boolean, default: true },
      },
      role: { type: String, default: "member" },
      isVerified: { type: Boolean, default: false },
      isBanned: { type: Boolean, default: false },
      bio: String,
      location: String,
      joinedAt: { type: Date, default: Date.now },
      lastActive: { type: Date, default: Date.now },
    }, { timestamps: true });

    // Hash password before saving
    userSchema.pre("save", async function (next) {
      if (!this.isModified("password") || !this.password) return next();
      try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
      } catch (error) {
        next(error);
      }
    });

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // Demo user data
    const demoUserData = {
      name: "Demo User",
      email: "demo@noteclub.com",
      password: "demo123", // This will be hashed automatically by the User schema
      username: "demo_user",
      joinedAt: new Date(),
      albumsPosted: 0,
      totalAlbumsPosted: 0,
      turnOrder: 1,
      isActive: true,
      isVerified: true, // Mark as verified for demo purposes
      bio: "Demo user account for testing Note Club Modern",
      location: "Demo City",
      favoriteGenres: ["Rock", "Hip-Hop", "Electronic"],
      musicPlatforms: {
        spotify: "https://open.spotify.com/user/demo",
        youtubeMusic: "https://music.youtube.com/channel/demo",
      },
      commentsPosted: 0,
      likesGiven: 0,
      likesReceived: 0,
      notificationSettings: {
        newThemes: true,
        turnReminders: true,
        comments: true,
        likes: true,
        emails: true,
      },
      role: "member",
      isBanned: false,
      lastActive: new Date(),
    };

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: demoUserData.email });

    if (existingUser) {
      console.log("📝 Demo user already exists!");
      console.log("🔑 Login credentials:");
      console.log("   Email: demo@noteclub.com");
      console.log("   Password: demo123");
    } else {
      // Create demo user
      console.log("👤 Creating demo user...");
      const demoUser = new User(demoUserData);
      await demoUser.save();

      console.log("✅ Demo user created successfully!");
      console.log("🔑 Login credentials:");
      console.log("   Email: demo@noteclub.com");
      console.log("   Password: demo123");
    }

    console.log("🌐 You can now sign in at: http://localhost:3000/auth/signin");
  } catch (error) {
    console.error("❌ Error creating demo user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the script
createDemoUser();
