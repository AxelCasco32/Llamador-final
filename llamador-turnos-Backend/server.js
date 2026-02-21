import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import SocketManager from './src/socket/SocketManager.js';
// IMPORTANTE: 'ventanillaRoutes.js' en minúsculas para evitar errores en Windows/Linux
import ventanillaRoutes from './src/routes/ventanillaRoutes.js';

dotenv.config();

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    
    // 1. Crear Servidor HTTP para Socket.io
    this.server = createServer(this.app);
    
    // 2. Inicializar Sockets ANTES que las rutas
    this.socketManager = new SocketManager(this.server);
    this.io = this.socketManager.getIO();
    
    this.connectDatabase();
    this.setupMiddlewares();
    this.setupRoutes();
  }
  
  async connectDatabase() {
    try {
      // Usar 127.0.0.1 en lugar de localhost evita retrasos en Windows
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/llamador_turnos';
      await mongoose.connect(mongoUri);
      console.log('✅ MongoDB conectado');
    } catch (error) {
      console.error('❌ Error MongoDB:', error.message);
      process.exit(1);
    }
  }
  
  setupMiddlewares() {
    // CORS configurado para el frontend (puerto 3000 por defecto en React/Vite)
    this.app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
    this.app.use(express.json());
    
    // Inyectar el objeto IO en cada petición para que el Controller lo use
    this.app.use((req, res, next) => {
      req.io = this.io;
      next();
    });

    // Logger de peticiones
    this.app.use((req, res, next) => {
      console.log(`📡 ${req.method} ${req.path}`);
      next();
    });
  }
  
  setupRoutes() {
    // Endpoint de prueba
    this.app.get('/health', (req, res) => {
      res.json({ status: 'OK', message: 'Servidor operativo' });
    });
    
    // Rutas principales
    this.app.use('/api/ventanillas', ventanillaRoutes);
    
    // Manejo de rutas inexistentes
    this.app.use('*', (req, res) => {
      res.status(404).json({ success: false, message: 'Ruta no encontrada' });
    });
  }
  
  start() {
    this.server.listen(this.port, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏥 SISTEMA DE TURNOS - GANDULFO');
      console.log(`🚀 Puerto: ${this.port}`);
      console.log(`🔗 URL: http://localhost:${this.port}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  }
}

// Capturar errores críticos que no fueron atrapados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error crítico del sistema:', err);
});

const serverInstance = new Server();
serverInstance.start();