import mongoose, { Schema, Document } from 'mongoose';
import { MESSAGE_TYPES } from '@/constants';

export interface IMessage extends Document {
  _id: string;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  _id: string;
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  isActive: boolean;
  listingId?: mongoose.Types.ObjectId; // Associated listing if chat is about a specific property
  listingTitle?: string; // Cached listing title for quick reference
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    messageType: {
      type: String,
      enum: Object.values(MESSAGE_TYPES),
      default: MESSAGE_TYPES.TEXT,
    },
    fileUrl: String,
    fileName: String,
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      index: true,
    },
    listingTitle: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, isRead: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });
MessageSchema.index({ createdAt: -1 });

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ isActive: 1, lastMessageAt: -1 });

// Ensure participants array has exactly 2 elements and they are unique
ConversationSchema.index(
  { participants: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

// Virtual for unread message count
ConversationSchema.virtual('unreadCount').get(function () {
  // This will be populated by aggregation in queries
  return (this as any)._unreadCount || 0;
});

// Method to mark message as read
MessageSchema.methods.markAsRead = function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to soft delete message
MessageSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to find or create conversation
ConversationSchema.statics.findOrCreate = async function (
  participant1: string,
  participant2: string,
  listingId?: string,
  listingTitle?: string
) {
  const participants = [participant1, participant2].sort(); // Sort to ensure consistent order

  // Search criteria - include listingId if provided for listing-specific conversations
  const searchCriteria: any = {
    participants: { $all: participants, $size: 2 },
    isActive: true,
  };

  if (listingId) {
    searchCriteria.listingId = listingId;
  } else {
    // For general conversations, ensure no listingId is set
    searchCriteria.listingId = { $exists: false };
  }

  let conversation = await this.findOne(searchCriteria);

  if (!conversation) {
    const conversationData: any = {
      participants,
      lastMessageAt: new Date(),
    };

    if (listingId) {
      conversationData.listingId = listingId;
      conversationData.listingTitle = listingTitle;
    }

    conversation = await this.create(conversationData);
  }

  return conversation;
};

// Static method to get conversations for a user with unread counts
ConversationSchema.statics.getUserConversations = function (
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  return this.aggregate([
    {
      $match: {
        participants: new mongoose.Types.ObjectId(userId),
        isActive: true,
      },
    },
    {
      $lookup: {
        from: 'messages',
        localField: '_id',
        foreignField: 'conversationId',
        as: 'messages',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'participants',
        foreignField: '_id',
        as: 'participantDetails',
      },
    },
    {
      $addFields: {
        messageCount: { $size: '$messages' },
        unreadCount: {
          $size: {
            $filter: {
              input: '$messages',
              cond: {
                $and: [
                  { $eq: ['$$this.receiverId', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$$this.isRead', false] },
                  { $eq: ['$$this.isDeleted', false] },
                ],
              },
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'messages',
        localField: 'lastMessage',
        foreignField: '_id',
        as: 'lastMessageDetails',
      },
    },
    {
      $addFields: {
        lastMessage: { $arrayElemAt: ['$lastMessageDetails', 0] },
        lastActivity: { $ifNull: ['$lastMessageAt', '$updatedAt'] },
      },
    },
    {
      $project: {
        _id: 1,
        participants: '$participantDetails',
        lastMessage: 1,
        lastActivity: 1,
        messageCount: 1,
        unreadCount: 1,
        listingId: 1,
        listingTitle: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { lastActivity: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);
};

// Static method to mark all messages in conversation as read
MessageSchema.statics.markConversationAsRead = function (conversationId: string, userId: string) {
  return this.updateMany(
    {
      conversationId: new mongoose.Types.ObjectId(conversationId),
      receiverId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

// Pre-save middleware to update conversation's lastMessage and lastMessageAt
MessageSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const Conversation = mongoose.model('Conversation');
      await Conversation.findByIdAndUpdate(this.conversationId, {
        lastMessage: this._id,
        lastMessageAt: this.createdAt,
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }
  next();
});

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
const Conversation =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export { Message, Conversation };
