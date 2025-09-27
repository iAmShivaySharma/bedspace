import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { chatHandler } from './handlers/chat';
import { connectionHandler } from './handlers/connection';
import { roomHandler } from './handlers/rooms';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  user?: any;
}

class SocketManager {
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin:
          process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        await connectDB();
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.user = user;

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);

      // Store user connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);

        // Join user to their personal room
        socket.join(`user:${socket.userId}`);

        // Join admin users to admin room
        if (socket.userRole === 'admin') {
          socket.join('admin');
        }
      }

      // Register event handlers
      connectionHandler(socket, this.io!);
      chatHandler(socket, this.io!);
      roomHandler(socket, this.io!);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });

      // Handle errors
      socket.on('error', error => {
        console.error('Socket error:', error);
      });
    });

    console.log('✅ Socket.IO server initialized');
    return this.io;
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getUserSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Send message to specific user
  sendToUser(userId: string, event: string, data: any) {
    if (this.io && this.connectedUsers.has(userId)) {
      this.io.to(`user:${userId}`).emit(event, data);
      return true;
    }
    return false;
  }

  // Send message to all admins
  sendToAdmins(event: string, data: any) {
    if (this.io) {
      this.io.to('admin').emit(event, data);
      return true;
    }
    return false;
  }

  // Broadcast to all connected users
  broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
      return true;
    }
    return false;
  }
}

// Singleton instance
export const socketManager = new SocketManager();

// Helper function to get socket instance
export const getIO = () => socketManager.getIO();

export default socketManager;
