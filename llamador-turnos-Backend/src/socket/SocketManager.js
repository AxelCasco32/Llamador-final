import { Server } from 'socket.io';

class SocketManager {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });
    
    this.initialize();
  }
  
  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`✅ Cliente conectado: ${socket.id}`);
      
      // Pantalla pública se conecta
      socket.on('pantalla:conectar', () => {
        socket.join('pantalla');
        console.log('📺 Pantalla pública conectada');
      });
      
      // Operador se conecta desde ventanilla
      socket.on('operador:conectar', (data) => {
        socket.join(`ventanilla-${data.ventanillaId}`);
        console.log(`👤 Operador conectado a ventanilla ${data.ventanillaId}`);
      });
      
      socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`);
      });
    });
  }
  
  getIO() {
    return this.io;
  }
}

export default SocketManager;