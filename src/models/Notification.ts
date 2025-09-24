import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'turn_reminder' | 'new_album' | 'group_invite' | 'theme_change' | 'comment' | 'like';
  
  // Related entities
  album?: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;
  theme?: mongoose.Types.ObjectId;
  fromUser?: mongoose.Types.ObjectId;
  
  // Notification status
  isRead: boolean;
  isDelivered: boolean;
  isPushed: boolean;
  
  // Delivery details
  pushSubscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  
  // Timestamps
  scheduledFor?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['turn_reminder', 'new_album', 'group_invite', 'theme_change', 'comment', 'like'],
    required: true,
    index: true
  },
  
  // Related entities
  album: {
    type: Schema.Types.ObjectId,
    ref: 'Album'
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  theme: {
    type: Schema.Types.ObjectId,
    ref: 'Theme'
  },
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  isPushed: {
    type: Boolean,
    default: false
  },
  
  // Push subscription data
  pushSubscription: {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  },
  
  // Timestamps
  scheduledFor: Date,
  deliveredAt: Date,
  readAt: Date
}, {
  timestamps: true
});

// Indexes for performance
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ type: 1, scheduledFor: 1 });
NotificationSchema.index({ isDelivered: 1, isPushed: 1 });

// Virtual for notification age
NotificationSchema.virtual('isRecent').get(function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > oneDayAgo;
});

// Mark as read method
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Generate notification content based on type
NotificationSchema.methods.generateContent = function() {
  switch (this.type) {
    case 'turn_reminder':
      return {
        title: '🎵 Your Turn!',
        message: "It's your turn to share an album with your group!",
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'turn-reminder',
        requireInteraction: true
      };
    case 'new_album':
      return {
        title: '🎶 New Album Shared!',
        message: this.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'new-album'
      };
    case 'group_invite':
      return {
        title: '👥 Group Invitation',
        message: this.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'group-invite',
        requireInteraction: true
      };
    case 'theme_change':
      return {
        title: '🎭 New Theme',
        message: this.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'theme-change'
      };
    case 'comment':
      return {
        title: '💬 New Comment',
        message: this.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'comment'
      };
    case 'like':
      return {
        title: '❤️ Album Liked',
        message: this.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'like'
      };
    default:
      return {
        title: this.title,
        message: this.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
      };
  }
};

NotificationSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', NotificationSchema);