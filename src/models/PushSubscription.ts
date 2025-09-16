import mongoose, { Document, Schema } from "mongoose";

export interface IPushSubscription extends Document {
  user: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  
  // User preferences
  preferences: {
    turnReminders: boolean;
    newAlbums: boolean;
    comments: boolean;
    likes: boolean;
    groupInvites: boolean;
    themeChanges: boolean;
  };
  
  // Metadata
  userAgent?: string;
  isActive: boolean;
  lastUsed: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  
  preferences: {
    turnReminders: {
      type: Boolean,
      default: true
    },
    newAlbums: {
      type: Boolean,
      default: true
    },
    comments: {
      type: Boolean,
      default: true
    },
    likes: {
      type: Boolean,
      default: false
    },
    groupInvites: {
      type: Boolean,
      default: true
    },
    themeChanges: {
      type: Boolean,
      default: true
    }
  },
  
  userAgent: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
PushSubscriptionSchema.index({ user: 1, isActive: 1 });
PushSubscriptionSchema.index({ endpoint: 1 });
PushSubscriptionSchema.index({ lastUsed: 1 });

// Update last used timestamp
PushSubscriptionSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

// Check if notification type is enabled
PushSubscriptionSchema.methods.isNotificationEnabled = function(type: string): boolean {
  switch (type) {
    case 'turn_reminder':
      return this.preferences.turnReminders;
    case 'new_album':
      return this.preferences.newAlbums;
    case 'comment':
      return this.preferences.comments;
    case 'like':
      return this.preferences.likes;
    case 'group_invite':
      return this.preferences.groupInvites;
    case 'theme_change':
      return this.preferences.themeChanges;
    default:
      return false;
  }
};

export default mongoose.models.PushSubscription || 
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);