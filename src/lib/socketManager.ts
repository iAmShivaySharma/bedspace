// lib/socketManager.ts
import { io, Socket } from 'socket.io-client';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private connectionPromise: Promise<Socket> | null = null;
  private roomSubscriptions: Map<string, Set<string>> = new Map();
  private eventHandlers: Map<string, Set<(...args: any[]) => void>> = new Map();

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public async getSocket(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    // If already connecting, wait for that connection
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create new connection
    this.connectionPromise = this.createConnection();
    return this.connectionPromise;
  }

  private async createConnection(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      console.log('SocketManager: Creating new connection');

      // Clean up existing socket if any
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      }

      const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
        path: '/api/socket',
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
      });

      newSocket.on('connect', () => {
        console.log('SocketManager: Connected to Socket.IO server:', newSocket.id);
        this.socket = newSocket;
        this.connectionPromise = null;

        // Re-join all rooms
        this.roomSubscriptions.forEach((subscribers, roomId) => {
          if (subscribers.size > 0) {
            newSocket.emit('join-room', roomId);
          }
        });

        resolve(newSocket);
      });

      newSocket.on('connect_error', error => {
        console.error('SocketManager: Connection error:', error);
        this.connectionPromise = null;
        reject(error);
      });

      newSocket.on('disconnect', reason => {
        console.log('SocketManager: Disconnected:', reason);
        // Don't set socket to null here - let reconnection handle it
      });

      newSocket.on('reconnect', attemptNumber => {
        console.log('SocketManager: Reconnected after', attemptNumber, 'attempts');

        // Re-join all rooms after reconnection
        this.roomSubscriptions.forEach((subscribers, roomId) => {
          if (subscribers.size > 0) {
            newSocket.emit('join-room', roomId);
          }
        });
      });
    });
  }

  public async joinRoom(roomId: string, subscriberId: string): Promise<void> {
    const socket = await this.getSocket();

    if (!this.roomSubscriptions.has(roomId)) {
      this.roomSubscriptions.set(roomId, new Set());
      // Only emit join-room if this is the first subscriber
      socket.emit('join-room', roomId);
      console.log('SocketManager: Joined room:', roomId);
    }

    this.roomSubscriptions.get(roomId)!.add(subscriberId);
  }

  public async leaveRoom(roomId: string, subscriberId: string): Promise<void> {
    const subscribers = this.roomSubscriptions.get(roomId);
    if (!subscribers) return;

    subscribers.delete(subscriberId);

    // If no more subscribers, leave the room
    if (subscribers.size === 0) {
      this.roomSubscriptions.delete(roomId);
      if (this.socket?.connected) {
        this.socket.emit('leave-room', roomId);
        console.log('SocketManager: Left room:', roomId);
      }
    }
  }

  public async on(
    event: string,
    handler: (...args: any[]) => void,
    subscriberId: string
  ): Promise<void> {
    const socket = await this.getSocket();

    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
      // Only register the event listener once
      socket.on(event, (...args) => {
        // Call all handlers for this event
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
          handlers.forEach(h => h(...args));
        }
      });
    }

    this.eventHandlers.get(event)!.add(handler);
  }

  public off(event: string, handler: (...args: any[]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);

      // If no more handlers, remove the event listener
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
        if (this.socket) {
          this.socket.off(event);
        }
      }
    }
  }

  public async emit(event: string, data: any): Promise<void> {
    const socket = await this.getSocket();
    socket.emit(event, data);
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

export const socketManager = SocketManager.getInstance();
