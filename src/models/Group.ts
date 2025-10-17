import mongoose, { Document, Schema, model } from "mongoose";

export interface IGroup extends Document {
  name: string;
  description?: string;
  
  // Group settings
  isPrivate: boolean;
  inviteCode: string;
  maxMembers: number;
  
  // Members
  members: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  
  // Turn management
  turnOrder: mongoose.Types.ObjectId[]; // Ordered list of member IDs
  currentTurnIndex: number;
  turnDurationDays: number;
  
  // Group avatar and customization
  avatarUrl?: string;
  coverImageUrl?: string;
  
  // Statistics
  totalAlbumsShared: number;
  totalThemes: number;
  
  // Settings
  allowMemberInvites: boolean;
  requireApprovalForAlbums: boolean;
  notifyOnNewAlbums: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    // Group settings
    isPrivate: {
      type: Boolean,
      default: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 6,
      maxlength: 8,
    },
    maxMembers: {
      type: Number,
      default: 20,
      min: 2,
      max: 1000,
    },
    
    // Members
    members: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    admins: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Turn management
    turnOrder: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    currentTurnIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    turnDurationDays: {
      type: Number,
      default: 7,
      min: 1,
      max: 30,
    },
    
    // Group avatar and customization
    avatarUrl: {
      type: String,
      trim: true,
    },
    coverImageUrl: {
      type: String,
      trim: true,
    },
    
    // Statistics
    totalAlbumsShared: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalThemes: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Settings
    allowMemberInvites: {
      type: Boolean,
      default: true,
    },
    requireApprovalForAlbums: {
      type: Boolean,
      default: false,
    },
    notifyOnNewAlbums: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance (unique: true already defined in schema)
GroupSchema.index({ members: 1 });
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ isPrivate: 1 });

// Virtual for current turn user ID (simple getter)
GroupSchema.virtual("currentTurnUserId").get(function () {
  if (this.turnOrder.length === 0) return null;
  return this.turnOrder[this.currentTurnIndex];
});

// Virtual for next turn user ID (simple getter)
GroupSchema.virtual("nextTurnUserId").get(function () {
  if (this.turnOrder.length === 0) return null;
  const nextIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
  return this.turnOrder[nextIndex];
});

// Virtual for member count
GroupSchema.virtual("memberCount").get(function () {
  return this.members.length;
});

// Method to generate unique invite code
GroupSchema.statics.generateInviteCode = async function(): Promise<string> {
  let code: string;
  let exists = true;
  
  while (exists) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = await this.findOne({ inviteCode: code });
    exists = !!existing;
  }
  
  return code!;
};

// Method to add member to group
GroupSchema.methods.addMember = async function(userId: mongoose.Types.ObjectId) {
  if (this.members.includes(userId)) {
    throw new Error("User is already a member");
  }
  
  if (this.members.length >= this.maxMembers) {
    throw new Error("Group is at maximum capacity");
  }
  
  this.members.push(userId);
  
  // Add to turn order in alphabetical order by username
  const User = mongoose.model("User");
  const user = await User.findById(userId).select("username");
  
  if (user) {
    // Get all users in turn order with usernames
    const usersInOrder = await User.find({
      _id: { $in: this.turnOrder }
    }).select("username").sort({ username: 1 });
    
    // Find correct position for new user
    let insertIndex = 0;
    for (let i = 0; i < usersInOrder.length; i++) {
      if (user.username < usersInOrder[i].username) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }
    
    this.turnOrder.splice(insertIndex, 0, userId);
    
    // Adjust current turn index if necessary
    if (insertIndex <= this.currentTurnIndex) {
      this.currentTurnIndex++;
    }
  }
  
  await this.save();
};

// Method to remove member from group
GroupSchema.methods.removeMember = async function(userId: mongoose.Types.ObjectId) {
  const memberIndex = this.members.indexOf(userId);
  if (memberIndex === -1) {
    throw new Error("User is not a member");
  }
  
  // Remove from members
  this.members.splice(memberIndex, 1);
  
  // Remove from admins if applicable
  const adminIndex = this.admins.indexOf(userId);
  if (adminIndex !== -1) {
    this.admins.splice(adminIndex, 1);
  }
  
  // Remove from turn order
  const turnIndex = this.turnOrder.indexOf(userId);
  if (turnIndex !== -1) {
    this.turnOrder.splice(turnIndex, 1);
    
    // Adjust current turn index
    if (turnIndex < this.currentTurnIndex) {
      this.currentTurnIndex--;
    } else if (turnIndex === this.currentTurnIndex && this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
    }
  }
  
  await this.save();
};

// Method to record that a user just posted
// Sets currentTurnIndex to the index of who just went
GroupSchema.methods.recordUserPosted = async function(userId: mongoose.Types.ObjectId) {
  // Find the index of the user who just posted
  const userIndex = this.turnOrder.findIndex(
    (id: mongoose.Types.ObjectId) => id.toString() === userId.toString()
  );

  if (userIndex === -1) {
    return;
  }

  this.currentTurnIndex = userIndex;
  await this.save();
};

// Method to get whose turn it is NOW (next active user after currentTurnIndex)
// currentTurnIndex = who just went, so we find the next active person
GroupSchema.methods.getCurrentTurnUser = async function() {
  if (this.turnOrder.length === 0) return null;

  const User = mongoose.model("User");
  const maxAttempts = this.turnOrder.length;
  let attempts = 0;
  // Start checking from NEXT index after currentTurnIndex
  let checkIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;

  // Find next active user after the person who just posted
  while (attempts < maxAttempts) {
    const userId = this.turnOrder[checkIndex];
    let user = await User.findById(userId).select("name username image isActive");

    // Try raw query if Mongoose fails (Atlas compatibility)
    if (!user && mongoose.connection?.db) {
      const db = mongoose.connection.db;
      const rawUser = await db.collection('users').findOne({ _id: userId.toString() });
      if (rawUser) {
        user = {
          _id: rawUser._id,
          name: rawUser.name,
          username: rawUser.username,
          image: rawUser.image,
          isActive: rawUser.isActive ?? true,
        } as any;
      }
    }

    if (user && user.isActive) {
      return user;
    }

    checkIndex = (checkIndex + 1) % this.turnOrder.length;
    attempts++;
  }

  // Fallback: return user at next index even if inactive
  const nextIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
  const nextUserId = this.turnOrder[nextIndex];
  let user = await User.findById(nextUserId).select("name username image isActive");

  // Try raw query fallback
  if (!user && mongoose.connection?.db) {
    const db = mongoose.connection.db;
    const rawUser = await db.collection('users').findOne({ _id: nextUserId.toString() });
    if (rawUser) {
      user = {
        _id: rawUser._id,
        name: rawUser.name,
        username: rawUser.username,
        image: rawUser.image,
        isActive: rawUser.isActive ?? true,
      } as any;
    }
  }

  return user;
};

// Method to get next turn user with populated data (skips inactive users)
// Returns the user AFTER the current turn user
// First finds current turn user's position, then looks for next active after that
GroupSchema.methods.getNextTurnUser = async function() {
  if (this.turnOrder.length === 0) return null;

  const User = mongoose.model("User");

  // First, find where the current turn user actually is (after skipping inactives)
  let currentTurnUserIndex = -1;
  const maxAttempts = this.turnOrder.length;
  let attempts = 0;
  let checkIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;

  // Find the current turn user's actual index
  while (attempts < maxAttempts) {
    const userId = this.turnOrder[checkIndex];
    let user = await User.findById(userId).select("isActive");

    // Try raw query if Mongoose fails (Atlas compatibility)
    if (!user && mongoose.connection?.db) {
      const db = mongoose.connection.db;
      const rawUser = await db.collection('users').findOne({ _id: userId.toString() });
      if (rawUser) {
        user = { isActive: rawUser.isActive ?? true } as any;
      }
    }

    if (user && user.isActive) {
      currentTurnUserIndex = checkIndex;
      break;
    }

    checkIndex = (checkIndex + 1) % this.turnOrder.length;
    attempts++;
  }

  // If we couldn't find current turn user, fallback to currentTurnIndex + 2
  if (currentTurnUserIndex === -1) {
    currentTurnUserIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
  }

  // Now find the next active user AFTER the current turn user
  attempts = 0;
  let nextIndex = (currentTurnUserIndex + 1) % this.turnOrder.length;

  while (attempts < maxAttempts) {
    const nextUserId = this.turnOrder[nextIndex];
    let user = await User.findById(nextUserId).select("name username image isActive");

    // Try raw query if Mongoose fails (Atlas compatibility)
    if (!user && mongoose.connection?.db) {
      const db = mongoose.connection.db;
      const rawUser = await db.collection('users').findOne({ _id: nextUserId.toString() });
      if (rawUser) {
        user = {
          _id: rawUser._id,
          name: rawUser.name,
          username: rawUser.username,
          image: rawUser.image,
          isActive: rawUser.isActive ?? true,
        } as any;
      }
    }

    if (user && user.isActive) {
      return user;
    }

    nextIndex = (nextIndex + 1) % this.turnOrder.length;
    attempts++;
  }

  // Fallback: return user at next index even if inactive
  const fallbackIndex = (currentTurnUserIndex + 1) % this.turnOrder.length;
  const fallbackUserId = this.turnOrder[fallbackIndex];
  let user = await User.findById(fallbackUserId).select("name username image isActive");

  // Try raw query fallback
  if (!user && mongoose.connection?.db) {
    const db = mongoose.connection.db;
    const rawUser = await db.collection('users').findOne({ _id: fallbackUserId.toString() });
    if (rawUser) {
      user = {
        _id: rawUser._id,
        name: rawUser.name,
        username: rawUser.username,
        image: rawUser.image,
        isActive: rawUser.isActive ?? true,
      } as any;
    }
  }

  return user;
};

// Ensure virtuals are included in JSON
GroupSchema.set("toJSON", { virtuals: true });

// Text search index
GroupSchema.index({
  name: "text",
  description: "text",
});

export const Group = mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);