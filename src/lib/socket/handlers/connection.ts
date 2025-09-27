import { Socket, Server as SocketIOServer } from 'socket.io';
import Activity from '@/models/Activity';
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  user?: any;
}

export const connectionHandler = (socket: AuthenticatedSocket, io: SocketIOServer) => {
  // Handle user status updates
  socket.on('user:status', async (data: { status: 'online' | 'away' | 'busy' }) => {
    try {
      const { status } = data;

      // Update user status in database (if you have a status field)
      // await User.findByIdAndUpdate(socket.userId, { status, lastSeen: new Date() });

      // Broadcast status update to relevant users
      socket.broadcast.emit('user:status:update', {
        userId: socket.userId,
        status,
        timestamp: new Date().toISOString(),
      });

      // Log activity
      if (socket.userId) {
        await (Activity as any).logActivity(
          socket.userId,
          'status_change',
          'user',
          `User changed status to ${status}`,
          { status }
        );
      }

      console.log(`User ${socket.userId} status changed to ${status}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      socket.emit('error', { message: 'Failed to update status' });
    }
  });

  // Handle typing indicators
  socket.on('typing:start', (data: { conversationId: string; receiverId: string }) => {
    try {
      const { conversationId, receiverId } = data;

      // Send typing indicator to the receiver
      socket.to(`user:${receiverId}`).emit('typing:start', {
        conversationId,
        userId: socket.userId,
        user: {
          id: socket.userId,
          name: socket.user?.name,
        },
      });

      console.log(`User ${socket.userId} started typing in conversation ${conversationId}`);
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  });

  socket.on('typing:stop', (data: { conversationId: string; receiverId: string }) => {
    try {
      const { conversationId, receiverId } = data;

      // Stop typing indicator for the receiver
      socket.to(`user:${receiverId}`).emit('typing:stop', {
        conversationId,
        userId: socket.userId,
      });

      console.log(`User ${socket.userId} stopped typing in conversation ${conversationId}`);
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  });

  // Handle presence updates (when user becomes active/inactive)
  socket.on('presence:update', async (data: { isActive: boolean }) => {
    try {
      const { isActive } = data;

      // Update last activity timestamp
      // await User.findByIdAndUpdate(socket.userId, {
      //   lastActivity: new Date(),
      //   isActive
      // });

      // Broadcast presence update
      socket.broadcast.emit('presence:update', {
        userId: socket.userId,
        isActive,
        lastActivity: new Date().toISOString(),
      });

      console.log(`User ${socket.userId} presence updated: ${isActive ? 'active' : 'inactive'}`);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  });

  // Handle heartbeat to maintain connection
  socket.on('heartbeat', () => {
    socket.emit('heartbeat:ack', { timestamp: new Date().toISOString() });
  });

  // Send initial connection data
  socket.emit('connection:established', {
    userId: socket.userId,
    role: socket.userRole,
    connectedAt: new Date().toISOString(),
  });
};
