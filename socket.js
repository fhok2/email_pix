const { validateTempToken } = require('./src/services/tempTokenService.js');

let io;
const connectedSockets = new Map();

module.exports = {
  init: (httpServer) => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on('connection', (socket) => {
      socket.on('authenticate', (tempToken) => {
        const decoded = validateTempToken(tempToken);
        if (decoded) {
          socket.transactionID = decoded.transactionID;
          connectedSockets.set(decoded.transactionID, socket);
          socket.emit('authenticated', { status: 'success' });
        } else {
          socket.emit('authenticated', { status: 'failure' });
          socket.disconnect();
        }
      });

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
