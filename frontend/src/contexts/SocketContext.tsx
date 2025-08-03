import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SocketContextType } from '../types';

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Connected to server:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Listen for online users updates
      newSocket.on('online-users', (users: string[]) => {
        setOnlineUsers(users);
      });

      // Listen for seat updates
      newSocket.on('seat-updated', (data) => {
        console.log('Seat updated:', data);
        // Handle seat updates (emit custom event for components to listen)
        window.dispatchEvent(new CustomEvent('seat-updated', { detail: data }));
      });

      // Listen for booking status updates
      newSocket.on('booking-status-updated', (data) => {
        console.log('Booking status updated:', data);
        // Handle booking updates (emit custom event for components to listen)
        window.dispatchEvent(new CustomEvent('booking-updated', { detail: data }));
      });

      // Listen for booking cancellations
      newSocket.on('booking-cancelled', (data) => {
        console.log('Booking cancelled:', data);
        // Handle booking cancellation (emit custom event for components to listen)
        window.dispatchEvent(new CustomEvent('booking-cancelled', { detail: data }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setOnlineUsers([]);
      };
    } else {
      // Clean up socket if user is not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setOnlineUsers([]);
      }
    }
  }, [isAuthenticated, user]);

  const joinRestaurant = (restaurantId: string) => {
    if (socket) {
      socket.emit('join-restaurant', restaurantId);
      console.log(`Joined restaurant: ${restaurantId}`);
    }
  };

  const leaveRestaurant = (restaurantId: string) => {
    if (socket) {
      socket.emit('leave-restaurant', restaurantId);
      console.log(`Left restaurant: ${restaurantId}`);
    }
  };

  const value: SocketContextType = {
    socket,
    onlineUsers,
    joinRestaurant,
    leaveRestaurant,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}; 