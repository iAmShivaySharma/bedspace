import { Socket, Server as SocketIOServer } from 'socket.io';
import { Conversation } from '@/models/Message';
import connectDB from '@/lib/mongodb';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  user?: any;
}

export const roomHandler = (socket: AuthenticatedSocket, io: SocketIOServer) => {
  // Join a conversation room
  socket.on('room:join', async (data: { conversationId: string }) => {
    try {
      const { conversationId } = data;

      await connectDB();

      // Verify user is part of conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(socket.userId as any)) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Join the conversation room
      socket.join(`conversation:${conversationId}`);

      // Notify other participants that user joined
      socket.to(`conversation:${conversationId}`).emit('room:user_joined', {
        conversationId,
        userId: socket.userId,
        user: {
          id: socket.userId,
          name: socket.user?.name,
          avatar: socket.user?.avatar,
        },
        timestamp: new Date().toISOString(),
      });

      socket.emit('room:joined', { conversationId });

      console.log(`User ${socket.userId} joined conversation room ${conversationId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Leave a conversation room
  socket.on('room:leave', async (data: { conversationId: string }) => {
    try {
      const { conversationId } = data;

      // Leave the conversation room
      socket.leave(`conversation:${conversationId}`);

      // Notify other participants that user left
      socket.to(`conversation:${conversationId}`).emit('room:user_left', {
        conversationId,
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });

      socket.emit('room:left', { conversationId });

      console.log(`User ${socket.userId} left conversation room ${conversationId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Get room participants
  socket.on('room:participants', async (data: { conversationId: string }) => {
    try {
      const { conversationId } = data;

      await connectDB();

      const conversation = await Conversation.findById(conversationId).populate(
        'participants',
        'name avatar lastActivity status'
      );

      if (
        !conversation ||
        !conversation.participants.find((p: any) => p._id.toString() === socket.userId)
      ) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Get online status for participants
      const participants = conversation.participants.map((participant: any) => ({
        id: participant._id,
        name: participant.name,
        avatar: participant.avatar,
        isOnline: io.sockets.adapter.rooms.has(`user:${participant._id}`),
        lastActivity: participant.lastActivity?.toISOString(),
        status: participant.status || 'offline',
      }));

      socket.emit('room:participants', {
        conversationId,
        participants,
      });

      console.log(`Retrieved participants for conversation ${conversationId}`);
    } catch (error) {
      console.error('Error getting room participants:', error);
      socket.emit('error', { message: 'Failed to get participants' });
    }
  });

  // Admin room management
  if (socket.userRole === 'admin') {
    // Join admin room for moderation
    socket.on('admin:room:join', () => {
      socket.join('admin');
      socket.emit('admin:room:joined');
      console.log(`Admin ${socket.userId} joined admin room`);
    });

    // Get all active conversations (admin only)
    socket.on('admin:conversations:list', async (data: { page?: number; limit?: number }) => {
      try {
        const { page = 1, limit = 20 } = data;

        await connectDB();

        const conversations = await Conversation.find({})
          .populate('participants', 'name email role')
          .populate('lastMessage')
          .sort({ lastActivity: -1 })
          .limit(limit)
          .skip((page - 1) * limit);

        const transformedConversations = conversations.map((conv: any) => ({
          id: conv._id,
          participants: conv.participants.map((p: any) => ({
            id: p._id,
            name: p.name,
            email: p.email,
            role: p.role,
          })),
          lastMessage: conv.lastMessage
            ? {
                content: conv.lastMessage.content,
                createdAt: conv.lastMessage.createdAt,
                type: conv.lastMessage.type,
              }
            : null,
          messageCount: conv.messageCount,
          createdAt: conv.createdAt,
          lastActivity: conv.lastActivity,
        }));

        socket.emit('admin:conversations:list', {
          conversations: transformedConversations,
          pagination: { page, limit, hasMore: conversations.length === limit },
        });

        console.log(`Admin ${socket.userId} retrieved conversation list`);
      } catch (error) {
        console.error('Error getting admin conversations:', error);
        socket.emit('error', { message: 'Failed to get conversations' });
      }
    });

    // Monitor conversation (admin can view any conversation)
    socket.on('admin:conversation:monitor', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;

        await connectDB();

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Join conversation room with admin privileges
        socket.join(`conversation:${conversationId}`);
        socket.join(`admin:conversation:${conversationId}`);

        socket.emit('admin:conversation:monitoring', { conversationId });

        console.log(`Admin ${socket.userId} monitoring conversation ${conversationId}`);
      } catch (error) {
        console.error('Error monitoring conversation:', error);
        socket.emit('error', { message: 'Failed to monitor conversation' });
      }
    });
  }
};
