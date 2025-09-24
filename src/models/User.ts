import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified?: Date;

  // Music preferences
  favoriteGenres: string[];
  musicPlatforms: {
    spotify?: string;
    youtubeMusic?: string;
    appleMusic?: string;
    tidal?: string;
    deezer?: string;
  };

  // Turn order and participation
  turnOrder: number; // Based on alphabetical order of username
  username: string; // Unique username for turn ordering
  isActive: boolean; // Can participate in turns
  lastPostDate?: Date;
  totalAlbumsPosted: number;

  // Profile
  bio?: string;
  location?: string;

  // Statistics
  albumsPosted: number;
  commentsPosted: number;
  likesGiven: number;
  likesReceived: number;

  // Preferences
  notificationSettings: {
    newThemes: boolean;
    turnReminders: boolean;
    comments: boolean;
    likes: boolean;
    emails: boolean;
  };

  // Account status
  role: "member" | "moderator" | "admin";
  isVerified: boolean;
  isBanned: boolean;
  bannedUntil?: Date;
  banReason?: string;

  // Timestamps
  joinedAt: Date;
  lastActive: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      minlength: 6,
      select: false, // Don't include password in queries by default
    },
    image: {
      type: String,
      trim: true,
    },
    emailVerified: {
      type: Date,
    },

    // Music preferences
    favoriteGenres: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    musicPlatforms: {
      spotify: {
        type: String,
        trim: true,
        match: /^https:\/\/(open\.)?spotify\.com\/user\//,
      },
      youtubeMusic: {
        type: String,
        trim: true,
      },
      appleMusic: {
        type: String,
        trim: true,
      },
      tidal: {
        type: String,
        trim: true,
      },
      deezer: {
        type: String,
        trim: true,
      },
    },

    // Turn order and participation
    turnOrder: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastPostDate: {
      type: Date,
    },
    totalAlbumsPosted: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Profile
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    // Statistics
    albumsPosted: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsPosted: {
      type: Number,
      default: 0,
      min: 0,
    },
    likesGiven: {
      type: Number,
      default: 0,
      min: 0,
    },
    likesReceived: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Preferences
    notificationSettings: {
      newThemes: {
        type: Boolean,
        default: true,
      },
      turnReminders: {
        type: Boolean,
        default: true,
      },
      comments: {
        type: Boolean,
        default: true,
      },
      likes: {
        type: Boolean,
        default: true,
      },
      emails: {
        type: Boolean,
        default: true,
      },
    },

    // Account status
    role: {
      type: String,
      enum: ["member", "moderator", "admin"],
      default: "member",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedUntil: {
      type: Date,
    },
    banReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Timestamps
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent password from being returned in JSON
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Indexes for performance
// Email and username indexes already defined with unique: true in schema
UserSchema.index({ turnOrder: 1 });
UserSchema.index({ isActive: 1, turnOrder: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ joinedAt: -1 });

// Virtual for checking if user is currently banned
UserSchema.virtual("isCurrentlyBanned").get(function () {
  if (!this.isBanned) return false;
  if (!this.bannedUntil) return true;
  return new Date() < this.bannedUntil;
});

// Virtual for full profile completion percentage
UserSchema.virtual("profileCompletion").get(function () {
  let completed = 0;
  const total = 7;

  if (this.bio) completed++;
  if (this.location) completed++;
  if (this.image) completed++;
  if (this.favoriteGenres.length > 0) completed++;
  if (Object.values(this.musicPlatforms).some((url) => url)) completed++;
  if (this.isVerified) completed++;
  if (this.albumsPosted > 0) completed++;

  return Math.round((completed / total) * 100);
});

// Ensure virtuals are included in JSON
UserSchema.set("toJSON", { virtuals: true });

// Text search index
UserSchema.index({
  name: "text",
  username: "text",
  bio: "text",
});

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
