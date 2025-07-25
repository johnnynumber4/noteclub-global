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

    // Import User model
    const { User } = require("../src/models/User");

    // Demo user data
    const demoUserData = {
      name: "Demo User",
      email: "demo@noteclub.com",
      password: "demo123", // This will be hashed automatically by the User schema
      username: "demo_user",
      joinedAt: new Date(),
      albumsShared: 0,
      totalAlbumsPosted: 0,
      turnOrder: 1,
      isActive: true,
      emailVerified: new Date(), // Mark as verified for demo purposes
      bio: "Demo user account for testing Note Club Modern",
      location: "Demo City",
      favoriteGenres: ["Rock", "Hip-Hop", "Electronic"],
      musicStreaming: {
        spotify: "https://open.spotify.com/user/demo",
        youtubeMusic: "https://music.youtube.com/channel/demo",
      },
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
