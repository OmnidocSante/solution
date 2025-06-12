const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.rooms = new Map(); // Pour stocker les salles actives
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Middleware d'authentification Socket.IO
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Nouvelle connexion Socket.IO:', socket.user.id);
      this.connectedUsers.set(socket.user.id, socket.id);

      // Rejoindre la salle de l'agence de l'utilisateur
      if (socket.user.agence) {
        const agenceRoom = `agence_${socket.user.agence}`;
        socket.join(agenceRoom);
        this.rooms.set(agenceRoom, new Set([socket.id]));
      }

      // Rejoindre la salle admin si l'utilisateur est admin
      if (socket.user.role === 'admin') {
        socket.join('admin');
        this.rooms.set('admin', new Set([socket.id]));
      }

      // Gérer les souscriptions aux mises à jour en temps réel
      socket.on('subscribe', (data) => {
        const { type, id } = data;
        const room = `${type}_${id}`;
        socket.join(room);
        if (!this.rooms.has(room)) {
          this.rooms.set(room, new Set());
        }
        this.rooms.get(room).add(socket.id);
      });

      socket.on('unsubscribe', (data) => {
        const { type, id } = data;
        const room = `${type}_${id}`;
        socket.leave(room);
        if (this.rooms.has(room)) {
          this.rooms.get(room).delete(socket.id);
          if (this.rooms.get(room).size === 0) {
            this.rooms.delete(room);
          }
        }
      });

      socket.on('disconnect', () => {
        console.log('Déconnexion Socket.IO:', socket.user.id);
        this.connectedUsers.delete(socket.user.id);
        
        // Nettoyer les salles
        this.rooms.forEach((sockets, room) => {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.rooms.delete(room);
          }
        });
      });
    });
  }

  // Émettre un événement à tous les utilisateurs
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Émettre un événement à une agence spécifique
  emitToAgency(agenceId, event, data) {
    if (this.io) {
      this.io.to(`agence_${agenceId}`).emit(event, data);
    }
  }

  // Émettre un événement aux administrateurs
  emitToAdmins(event, data) {
    if (this.io) {
      this.io.to('admin').emit(event, data);
    }
  }

  // Émettre un événement à un utilisateur spécifique
  emitToUser(userId, event, data) {
    if (this.io) {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit(event, data);
      }
    }
  }

  // Mettre à jour les données en temps réel
  updateData(type, id, data) {
    if (this.io) {
      const room = `${type}_${id}`;
      this.io.to(room).emit('data_update', {
        type,
        id,
        data,
        timestamp: new Date()
      });
    }
  }

  // Notifications pour les abonnés
  notifyNewAbonne(abonne) {
    this.emitToAll('new_abonne', abonne);
    this.updateData('abonne', abonne.id, abonne);
  }

  notifyUpdateAbonne(abonne) {
    this.emitToAll('update_abonne', abonne);
    this.updateData('abonne', abonne.id, abonne);
  }

  notifyDeleteAbonne(abonne) {
    this.emitToAll('delete_abonne', abonne);
    this.updateData('abonne', abonne.id, null);
  }

  // Notifications pour les conjoints
  notifyNewConjoint(conjoint) {
    this.emitToAll('new_conjoint', conjoint);
    this.updateData('conjoint', conjoint.id, conjoint);
  }

  notifyUpdateConjoint(conjoint) {
    this.emitToAll('update_conjoint', conjoint);
    this.updateData('conjoint', conjoint.id, conjoint);
  }

  notifyDeleteConjoint(conjointId) {
    this.emitToAll('delete_conjoint', conjointId);
    this.updateData('conjoint', conjointId, null);
  }

  // Notifications pour les enfants
  notifyNewEnfant(enfant) {
    this.emitToAll('new_enfant', enfant);
    this.updateData('enfant', enfant.id, enfant);
  }

  notifyUpdateEnfant(enfant) {
    this.emitToAll('update_enfant', enfant);
    this.updateData('enfant', enfant.id, enfant);
  }

  notifyDeleteEnfant(enfantId) {
    this.emitToAll('delete_enfant', enfantId);
    this.updateData('enfant', enfantId, null);
  }

  // Notifications pour les documents
  notifyNewDocument(document) {
    this.emitToAll('new_document', document);
    this.updateData('document', document.id, document);
  }

  notifyDeleteDocument(documentId) {
    this.emitToAll('delete_document', documentId);
    this.updateData('document', documentId, null);
  }

  // Notifications pour les utilisateurs
  notifyNewUser(user) {
    this.emitToAll('new_user', user);
    this.updateData('user', user.id, user);
  }

  notifyUpdateUser(user) {
    this.emitToAll('update_user', user);
    this.updateData('user', user.id, user);
  }

  notifyDeleteUser(userId) {
    this.emitToAll('delete_user', userId);
    this.updateData('user', userId, null);
  }

  // Notifications système
  notifySystemMessage(message) {
    this.emitToAll('system_message', {
      message,
      timestamp: new Date()
    });
  }
}

// Exporter une instance unique du service
module.exports = new SocketService(); 