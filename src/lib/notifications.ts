import webpush from 'web-push';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import PushSubscription from '@/models/PushSubscription';
import { User } from '@/models/User';
import mongoose from 'mongoose';

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:jyoungiv@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface NotificationData {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'turn_reminder' | 'new_album' | 'group_invite' | 'theme_change' | 'comment' | 'like';
  albumId?: string | mongoose.Types.ObjectId;
  groupId?: string | mongoose.Types.ObjectId;
  themeId?: string | mongoose.Types.ObjectId;
  fromUserId?: string | mongoose.Types.ObjectId;
  url?: string;
}

export class NotificationService {
  /**
   * Create and send a notification to a user
   */
  static async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      await dbConnect();

      // Create notification record
      const notification = new Notification({
        user: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        album: data.albumId,
        group: data.groupId,
        theme: data.themeId,
        fromUser: data.fromUserId,
        isRead: false,
        isDelivered: false,
        isPushed: false
      });

      await notification.save();

      // Send push notification
      await this.sendPushNotification(notification);

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to user's devices
   */
  static async sendPushNotification(notification: any): Promise<void> {
    try {
      // Get user's active push subscriptions
      const subscriptions = await PushSubscription.find({
        user: notification.user,
        isActive: true
      });

      if (subscriptions.length === 0) {
        console.log('No active push subscriptions for user');
        return;
      }

      // Generate notification content
      const content = notification.generateContent();
      
      // Add click action URL
      if (notification.album) {
        content.data = {
          url: `/albums/${notification.album}`,
          albumId: notification.album.toString()
        };
      } else if (notification.group) {
        content.data = {
          url: `/groups/${notification.group}`,
          groupId: notification.group.toString()
        };
      } else {
        content.data = {
          url: '/dashboard'
        };
      }

      const payload = JSON.stringify(content);

      // Send to all user's devices
      const pushPromises = subscriptions.map(async (subscription) => {
        // Check if user wants this type of notification
        if (!subscription.isNotificationEnabled(notification.type)) {
          return;
        }

        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys
            },
            payload
          );

          // Update subscription last used
          await subscription.updateLastUsed();
          
        } catch (error: any) {
          console.error('Push notification failed:', error);
          
          // Handle expired subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: subscription._id });
            console.log('Removed expired push subscription');
          }
        }
      });

      await Promise.all(pushPromises);

      // Mark notification as pushed
      notification.isPushed = true;
      notification.isDelivered = true;
      notification.deliveredAt = new Date();
      await notification.save();

    } catch (error) {
      console.error('Failed to send push notifications:', error);
    }
  }

  /**
   * Send turn reminder to the next user in line
   */
  static async sendTurnReminder(groupId: string | mongoose.Types.ObjectId, userId: string | mongoose.Types.ObjectId): Promise<void> {
    try {
      await dbConnect();
      
      const Group = require('@/models/Group').default;
      const group = await Group.findById(groupId);
      
      if (!group) return;

      await this.sendNotification({
        userId,
        title: '🎵 Your Turn!',
        message: `It's your turn to share an album in ${group.name}!`,
        type: 'turn_reminder',
        groupId
      });
    } catch (error) {
      console.error('Failed to send turn reminder:', error);
    }
  }

  /**
   * Notify group members about a new album
   */
  static async notifyNewAlbum(albumId: string | mongoose.Types.ObjectId, excludeUserId?: string | mongoose.Types.ObjectId): Promise<void> {
    try {
      await dbConnect();
      
      const Album = require('@/models/Album').default;
      const Group = require('@/models/Group').default;
      
      const album = await Album.findById(albumId).populate('postedBy group');
      if (!album) return;

      const group = album.group;
      const poster = album.postedBy;

      // Notify all group members except the poster
      const memberIds = group.members.filter((memberId: any) => 
        memberId.toString() !== (excludeUserId || poster._id).toString()
      );

      const notifications = memberIds.map((memberId: any) =>
        this.sendNotification({
          userId: memberId,
          title: '🎶 New Album Shared!',
          message: `${poster.name} shared "${album.title}" by ${album.artist}`,
          type: 'new_album',
          albumId,
          groupId: group._id,
          fromUserId: poster._id
        })
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Failed to notify new album:', error);
    }
  }

  /**
   * Get user's notifications
   */
  static async getUserNotifications(userId: string | mongoose.Types.ObjectId, limit = 50) {
    try {
      await dbConnect();

      const notifications = await Notification.find({ user: userId })
        .populate('fromUser', 'name username image')
        .populate('album', 'title artist')
        .populate('group', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return notifications;
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId: string | mongoose.Types.ObjectId, notificationIds?: string[]): Promise<void> {
    try {
      await dbConnect();

      const query: any = { user: userId };
      if (notificationIds && notificationIds.length > 0) {
        query._id = { $in: notificationIds };
      }

      await Notification.updateMany(
        query,
        { 
          $set: { 
            isRead: true, 
            readAt: new Date() 
          } 
        }
      );
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string | mongoose.Types.ObjectId): Promise<number> {
    try {
      await dbConnect();
      return await Notification.countDocuments({ user: userId, isRead: false });
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }
}

export default NotificationService;