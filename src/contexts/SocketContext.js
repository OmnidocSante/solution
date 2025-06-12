import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://192.168.100.53:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connecté');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket déconnecté');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Erreur Socket:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const subscribe = (type, id) => {
    if (socket && isConnected) {
      socket.emit('subscribe', { type, id });
    }
  };

  const unsubscribe = (type, id) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe', { type, id });
    }
  };

  const value = {
    socket,
    isConnected,
    subscribe,
    unsubscribe
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 