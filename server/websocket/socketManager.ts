import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export interface SocketUser {
  id: string;
  email: string;
  site: string;
  socketId: string;
}

export class SocketManager {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, SocketUser>();
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [
              'https://dainty-frangollo-38ce07.netlify.app/'  // Add the new deployment domain
            ]
          : ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id']
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', (token: string) => {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          const user: SocketUser = {
            id: decoded.id,
            email: decoded.email,
            site: decoded.site,
            socketId: socket.id
          };

          this.connectedUsers.set(socket.id, user);
          
          // Track user sockets
          if (!this.userSockets.has(user.id)) {
            this.userSockets.set(user.id, new Set());
          }
          this.userSockets.get(user.id)!.add(socket.id);

          // Join site-specific room
          socket.join(`site:${user.site}`);
          
          // Join user-specific room
          socket.join(`user:${user.id}`);

          socket.emit('authenticated', { userId: user.id, site: user.site });
          
          // Notify others in the same site about user connection
          socket.to(`site:${user.site}`).emit('user:connected', {
            userId: user.id,
            email: user.email
          });

          console.log(`User authenticated: ${user.email} (${user.id}) on site ${user.site}`);
        } catch (error) {
          console.error('Authentication failed:', error);
          socket.emit('auth:error', 'Invalid token');
          socket.disconnect();
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          // Remove from user sockets tracking
          const userSocketSet = this.userSockets.get(user.id);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(user.id);
              
              // Notify others about user disconnection only if no other sockets
              socket.to(`site:${user.site}`).emit('user:disconnected', {
                userId: user.id,
                email: user.email
              });
            }
          }

          this.connectedUsers.delete(socket.id);
          console.log(`User disconnected: ${user.email} (${socket.id})`);
        }
      });

      // Handle real-time events
      socket.on('calendar:join', (data: { date: string }) => {
        socket.join(`calendar:${data.date}`);
      });

      socket.on('calendar:leave', (data: { date: string }) => {
        socket.leave(`calendar:${data.date}`);
      });
    });
  }

  // Broadcast event creation/update/deletion
  public broadcastEventChange(site: string, event: any, action: 'created' | 'updated' | 'deleted', excludeUserId?: string) {
    const eventData = {
      action,
      event,
      timestamp: new Date().toISOString()
    };

    // Broadcast to all users in the site except the one who made the change
    this.io.to(`site:${site}`).emit('event:changed', eventData);
    
    // Also broadcast to specific calendar date rooms
    if (event.date) {
      this.io.to(`calendar:${event.date}`).emit('event:changed', eventData);
    }
    if (event.endDate && event.endDate !== event.date) {
      this.io.to(`calendar:${event.endDate}`).emit('event:changed', eventData);
    }
  }

  // Broadcast availability changes
  public broadcastAvailabilityChange(site: string, userId: string, availabilityData: any, excludeSocketId?: string) {
    const changeData = {
      userId,
      availability: availabilityData,
      timestamp: new Date().toISOString()
    };

    // Broadcast to all users in the site
    const sockets = this.io.sockets.adapter.rooms.get(`site:${site}`);
    if (sockets) {
      sockets.forEach(socketId => {
        if (socketId !== excludeSocketId) {
          this.io.to(socketId).emit('availability:changed', changeData);
        }
      });
    }
  }

  // Broadcast user settings changes
  public broadcastUserSettingsChange(site: string, userId: string, settings: any, excludeSocketId?: string) {
    const changeData = {
      userId,
      settings,
      timestamp: new Date().toISOString()
    };

    // Broadcast to all users in the site
    const sockets = this.io.sockets.adapter.rooms.get(`site:${site}`);
    if (sockets) {
      sockets.forEach(socketId => {
        if (socketId !== excludeSocketId) {
          this.io.to(socketId).emit('user:settings:changed', changeData);
        }
      });
    }
  }

  // Send notification to specific user
  public sendNotificationToUser(userId: string, notification: any) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach(socketId => {
        this.io.to(socketId).emit('notification', notification);
      });
    }
  }

  // Get connected users for a site
  public getConnectedUsersForSite(site: string): SocketUser[] {
    const users: SocketUser[] = [];
    const siteRoom = this.io.sockets.adapter.rooms.get(`site:${site}`);
    
    if (siteRoom) {
      siteRoom.forEach(socketId => {
        const user = this.connectedUsers.get(socketId);
        if (user) {
          users.push(user);
        }
      });
    }
    
    return users;
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Get socket instance for external use
  public getIO(): SocketIOServer {
    return this.io;
  }
}

let socketManager: SocketManager | null = null;

export function initializeSocketManager(server: HTTPServer): SocketManager {
  if (!socketManager) {
    socketManager = new SocketManager(server);
  }
  return socketManager;
}

export function getSocketManager(): SocketManager | null {
  return socketManager;
}