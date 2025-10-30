import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'verification' | 'message' | 'listing' | 'booking' | 'payment';
  isRead: boolean;
  metadata?: {
    entityId?: string;
    entityType?: string;
    actionUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      required: true,
      default: 'info',
    },
    category: {
      type: String,
      enum: ['system', 'verification', 'message', 'listing', 'booking', 'payment'],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      entityId: String,
      entityType: String,
      actionUrl: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, category: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Static method to create notification
NotificationSchema.statics.createNotification = async function (
  userId: string | mongoose.Types.ObjectId,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  category: 'system' | 'verification' | 'message' | 'listing' | 'booking' | 'payment' = 'system',
  metadata?: { entityId?: string; entityType?: string; actionUrl?: string }
) {
  return this.create({
    userId,
    title,
    message,
    type,
    category,
    metadata,
  });
};

// Static method to get user notifications with pagination
NotificationSchema.statics.getUserNotifications = function (
  userId: string | mongoose.Types.ObjectId,
  options: {
    filter?: 'all' | 'read' | 'unread';
    category?: string;
    limit?: number;
    skip?: number;
  } = {}
) {
  const { filter = 'all', category, limit = 20, skip = 0 } = options;

  const query: any = { userId };

  if (filter === 'read') {
    query.isRead = true;
  } else if (filter === 'unread') {
    query.isRead = false;
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  return this.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip);
};

// Static method to mark notifications as read
NotificationSchema.statics.markAsRead = function (
  userId: string | mongoose.Types.ObjectId,
  notificationIds?: string[]
) {
  const query: any = { userId };

  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }

  return this.updateMany(query, { isRead: true });
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function (
  userId: string | mongoose.Types.ObjectId,
  category?: string
) {
  const query: any = { userId, isRead: false };

  if (category && category !== 'all') {
    query.category = category;
  }

  return this.countDocuments(query);
};

const Notification =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export { Notification };
