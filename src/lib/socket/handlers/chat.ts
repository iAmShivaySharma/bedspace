import { Socket, Server as SocketIOServer } from 'socket.io';
import { Message, Conversation } from '@/models/Message';
import { Notification } from '@/models/Notification';
import Activity from '@/models/Activity';
import connectDB from '@/lib/mongodb';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  user?: any;
}

export const chatHandler = (socket: AuthenticatedSocket, io: SocketIOServer) => {
  // Send a message
  socket.on(
    'message:send',
    async (data: {
      conversationId?: string;
      receiverId: string;
      content: string;
      type?: 'text' | 'image' | 'file' | 'system';
      metadata?: any;
    }) => {
      try {
        const { conversationId, receiverId, content, type = 'text', metadata } = data;

        if (!receiverId || !content.trim()) {
          socket.emit('error', { message: 'Receiver ID and content are required' });
          return;
        }

        await connectDB();

        // Find or create conversation
        let conversation;
        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
        }

        if (!conversation) {
          conversation = await (Conversation as any).findOrCreate(socket.userId, receiverId);
        }

        // Create message
        const message = new Message({
          conversationId: conversation._id,
          senderId: socket.userId,
          receiverId,
          content,
          type,
          metadata,
          isRead: false,
        });

        await message.save();

        // Update conversation with last message
        conversation.lastMessage = message._id;
        conversation.lastActivity = new Date();
        await conversation.save();

        // Populate message for response
        await message.populate('senderId', 'name avatar');

        const messageData = {
          id: message._id,
          conversationId: conversation._id,
          senderId: socket.userId,
          receiverId,
          content,
          type,
          metadata,
          isRead: false,
          sender: {
            id: socket.userId,
            name: socket.user?.name,
            avatar: socket.user?.avatar,
          },
          createdAt: message.createdAt.toISOString(),
        };

        // Send to sender (confirmation)
        socket.emit('message:sent', messageData);

        // Send to receiver if online
        socket.to(`user:${receiverId}`).emit('message:received', messageData);

        // Create notification for receiver
        await (Notification as any).createNotification(
          receiverId,
          'New Message',
          `You have a new message from ${socket.user?.name}`,
          'info',
          'message',
          {
            entityId: conversation._id.toString(),
            entityType: 'conversation',
            actionUrl: `/messages?conversation=${conversation._id}`,
          }
        );

        // Send notification to receiver if online
        socket.to(`user:${receiverId}`).emit('notification:new', {
          type: 'message',
          title: 'New Message',
          message: `You have a new message from ${socket.user?.name}`,
          conversationId: conversation._id,
        });

        // Log activity
        await (Activity as any).logActivity(
          socket.userId,
          'message_sent',
          'message',
          'Sent a message',
          { receiverId, conversationId: conversation._id.toString() }
        );

        console.log(`Message sent from ${socket.userId} to ${receiverId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    }
  );

  // Mark messages as read
  socket.on('message:markRead', async (data: { conversationId: string; messageIds?: string[] }) => {
    try {
      const { conversationId, messageIds } = data;

      await connectDB();

      let query: any = {
        conversationId,
        receiverId: socket.userId,
        isRead: false,
      };

      if (messageIds && messageIds.length > 0) {
        query._id = { $in: messageIds };
      }

      // Mark messages as read
      const result = await Message.updateMany(query, {
        isRead: true,
        readAt: new Date(),
      });

      // Notify sender that messages were read
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        const otherParticipantId = conversation.participants.find(
          (p: any) => p.toString() !== socket.userId
        );

        if (otherParticipantId) {
          socket.to(`user:${otherParticipantId}`).emit('message:read', {
            conversationId,
            readByUserId: socket.userId,
            readCount: result.modifiedCount,
            timestamp: new Date().toISOString(),
          });
        }
      }

      socket.emit('message:marked_read', {
        conversationId,
        readCount: result.modifiedCount,
      });

      console.log(
        `Marked ${result.modifiedCount} messages as read in conversation ${conversationId}`
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Get conversation messages
  socket.on(
    'conversation:load',
    async (data: { conversationId: string; page?: number; limit?: number }) => {
      try {
        const { conversationId, page = 1, limit = 50 } = data;

        await connectDB();

        // Verify user is part of conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(socket.userId as any)) {
          socket.emit('error', { message: 'Conversation not found or access denied' });
          return;
        }

        // Get messages with pagination
        const messages = await Message.find({ conversationId })
          .populate('senderId', 'name avatar')
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip((page - 1) * limit);

        const transformedMessages = messages.reverse().map((message: any) => ({
          id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId._id,
          receiverId: message.receiverId,
          content: message.content,
          type: message.type,
          metadata: message.metadata,
          isRead: message.isRead,
          sender: {
            id: message.senderId._id,
            name: message.senderId.name,
            avatar: message.senderId.avatar,
          },
          createdAt: message.createdAt.toISOString(),
          readAt: message.readAt?.toISOString(),
        }));

        socket.emit('conversation:loaded', {
          conversationId,
          messages: transformedMessages,
          pagination: {
            page,
            limit,
            hasMore: messages.length === limit,
          },
        });

        console.log(`Loaded ${messages.length} messages for conversation ${conversationId}`);
      } catch (error) {
        console.error('Error loading conversation:', error);
        socket.emit('error', { message: 'Failed to load conversation' });
      }
    }
  );

  // Delete message
  socket.on('message:delete', async (data: { messageId: string; deleteForEveryone?: boolean }) => {
    try {
      const { messageId, deleteForEveryone = false } = data;

      await connectDB();

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user can delete this message
      if (message.senderId.toString() !== socket.userId && !deleteForEveryone) {
        socket.emit('error', { message: 'You can only delete your own messages' });
        return;
      }

      // Only admins can delete for everyone
      if (deleteForEveryone && socket.userRole !== 'admin') {
        socket.emit('error', { message: 'Only admins can delete messages for everyone' });
        return;
      }

      if (deleteForEveryone) {
        // Hard delete for admin
        await Message.findByIdAndDelete(messageId);
      } else {
        // Soft delete for regular users
        message.content = 'This message was deleted';
        message.type = 'system';
        message.metadata = { deleted: true, deletedAt: new Date(), deletedBy: socket.userId };
        await message.save();
      }

      // Notify participants
      const conversation = await Conversation.findById(message.conversationId);
      if (conversation) {
        conversation.participants.forEach((participantId: any) => {
          socket.to(`user:${participantId}`).emit('message:deleted', {
            messageId,
            conversationId: message.conversationId,
            deletedBy: socket.userId,
            deleteForEveryone,
          });
        });
      }

      socket.emit('message:delete_success', { messageId });

      console.log(`Message ${messageId} deleted by ${socket.userId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });
};
