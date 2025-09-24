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
      max: 100,
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

// Method to advance to next turn
GroupSchema.methods.advanceToNextTurn = async function() {
  if (this.turnOrder.length === 0) return;
  
  this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
  await this.save();
  
  return this.turnOrder[this.currentTurnIndex];
};

// Method to get current turn user with populated data
GroupSchema.methods.getCurrentTurnUser = async function() {
  if (this.turnOrder.length === 0) return null;
  
  const User = mongoose.model("User");
  const currentUserId = this.turnOrder[this.currentTurnIndex];
  return await User.findById(currentUserId).select("name username image");
};

// Method to get next turn user with populated data
GroupSchema.methods.getNextTurnUser = async function() {
  if (this.turnOrder.length === 0) return null;
  
  const User = model("User");
  const nextIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
  const nextUserId = this.turnOrder[nextIndex];
  return await User.findById(nextUserId).select("name username image");
};

// Ensure virtuals are included in JSON
GroupSchema.set("toJSON", { virtuals: true });

// Text search index
GroupSchema.index({
  name: "text",
  description: "text",
});

export const Group = mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);