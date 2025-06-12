import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
    });

    this.socket.on('disconnect', () => {
      console.log('Déconnecté du serveur Socket.IO');
    });

    // Réattacher tous les écouteurs existants
    this.listeners.forEach((callback, event) => {
      this.socket.on(event, callback);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
    this.listeners.set(event, callback);
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
    this.listeners.delete(event);
  }
}

export default new SocketService(); 