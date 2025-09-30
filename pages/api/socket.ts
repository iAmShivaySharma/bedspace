// pages/api/socket.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Extend the default server interface to include Socket.IO
interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

// Extend the response interface to include our socket server
interface SocketApiResponse extends NextApiResponse {
  socket: {
    server: SocketServer;
  } & NextApiResponse['socket'];
}

export default function handler(req: NextApiRequest, res: SocketApiResponse) {
  // Check if Socket.IO server is already initialized
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');

    // Create new Socket.IO server instance
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: '*', // Configure based on your needs
        methods: ['GET', 'POST'],
      },
    });

    // Handle client connections
    io.on('connection', socket => {
      console.log('User connected:', socket.id);

      // Join a specific room (e.g., chat room)
      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        socket.emit('joined-room', roomId);
      });

      // Leave a room
      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room ${roomId}`);
      });

      // Handle message broadcasting
      socket.on(
        'send-message',
        (data: { roomId: string; message: any; senderId: string; senderName: string }) => {
          console.log('Broadcasting message to room:', data.roomId);

          // Broadcast to all users in the room
          io.to(data.roomId).emit('new-message', {
            ...data.message,
            timestamp: new Date().toISOString(),
          });
        }
      );

      // Handle typing indicators
      socket.on('typing-start', (data: { roomId: string; userName: string }) => {
        // Broadcast to others in the room (excluding sender)
        socket.to(data.roomId).emit('user-typing', {
          userName: data.userName,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('typing-stop', (data: { roomId: string; userName: string }) => {
        socket.to(data.roomId).emit('user-stopped-typing', {
          userName: data.userName,
        });
      });

      // Handle custom events (add as needed)
      socket.on(
        'user-status-change',
        (data: { roomId: string; userId: string; status: 'online' | 'offline' | 'away' }) => {
          socket.to(data.roomId).emit('user-status-updated', data);
        }
      );

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    // Attach the Socket.IO server to the HTTP server
    res.socket.server.io = io;
  } else {
    console.log('Socket.IO server already running');
  }

  // End the HTTP response
  res.end();
}

// Disable body parsing for this API route
export const config = {
  api: {
    bodyParser: false,
  },
};
