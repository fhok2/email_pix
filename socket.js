const { validateTempToken } = require('./src/services/tempTokenService.js');

let io;
const connectedSockets = new Map();

module.exports = {
  init: (httpServer) => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: "*", // Permitir qualquer origem (cuidado em produção!)
        methods: ["GET", "POST"],
      },
    });

    io.on('connection', (socket) => {
      // Lê o token da configuração auth (não precisa mais do evento 'authenticate')
      const tempToken = socket.handshake.auth.token;

      const decoded = validateTempToken(tempToken);
      if (decoded) {
        socket.transactionID = decoded.transactionID;
        connectedSockets.set(decoded.transactionID, socket);
        socket.emit('authenticated', { status: 'success' });

        // Adicione um log para verificar se o transactionID está sendo recebido corretamente
        console.log('Cliente conectado com transactionID:', socket.transactionID);
      } else {
        socket.emit('authenticated', { status: 'failure' });
        socket.disconnect();
      }

      socket.on('disconnect', () => {
        console.log(`Client disconnected for transactionID: ${socket.transactionID}`);
        connectedSockets.delete(socket.transactionID);
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
  getConnectedSockets: () => {
    return connectedSockets;
  }
};
