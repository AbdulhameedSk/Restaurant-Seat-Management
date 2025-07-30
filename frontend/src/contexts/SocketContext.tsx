import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinRestaurant: (restaurantId: string) => void;
  leaveRestaurant: (restaurantId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000', {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      // Listen for booking updates
      newSocket.on('new-booking', (data) => {
        if (user.role === 'subadmin' || user.role === 'admin') {
          toast.info(`New booking: ${data.message}`);
        }
      });

      newSocket.on('booking-verified', (data) => {
        toast.success(`Booking verified for seat ${data.seatNumber} by ${data.verifiedBy}`);
      });

      newSocket.on('booking-cancelled', (data) => {
        toast.warning(`Booking cancelled for seat ${data.seatNumber}: ${data.reason}`);
      });

      newSocket.on('seat-updated', (data) => {
        console.log('Seat status updated:', data);
      });

      // Error handling
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else {
      // Cleanup socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [token, user]);

  const joinRestaurant = (restaurantId: string) => {
    if (socket && connected) {
      socket.emit('join-restaurant', restaurantId);
      console.log(`Joined restaurant: ${restaurantId}`);
    }
  };

  const leaveRestaurant = (restaurantId: string) => {
    if (socket && connected) {
      socket.emit('leave-restaurant', restaurantId);
      console.log(`Left restaurant: ${restaurantId}`);
    }
  };

  const value: SocketContextType = {
    socket,
    connected,
    joinRestaurant,
    leaveRestaurant,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 