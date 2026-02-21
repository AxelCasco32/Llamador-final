import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }
  
  // Conectar
  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      this.socket.on('connect', () => {
        console.log('✅ Socket conectado:', this.socket.id);
      });
      
      this.socket.on('disconnect', () => {
        console.log('❌ Socket desconectado');
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión:', error);
      });
    }
    
    return this.socket;
  }
  
  // Desconectar
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // Unirse como pantalla pública
  joinPantalla() {
    if (this.socket) {
      this.socket.emit('pantalla:conectar');
      console.log('📺 Conectado como pantalla pública');
    }
  }
  
  // Unirse como operador
  joinOperador(ventanillaId) {
    if (this.socket) {
      this.socket.emit('operador:conectar', { ventanillaId });
      console.log(`👤 Conectado como operador (Ventanilla ${ventanillaId})`);
    }
  }
  
  // Escuchar evento: turno llamado
  onTurnoLlamado(callback) {
    if (this.socket) {
      this.socket.on('turno:llamado', callback);
    }
  }
  
  // Escuchar evento: turno re-llamado
  onTurnoReLlamado(callback) {
    if (this.socket) {
      this.socket.on('turno:rellamado', callback);
    }
  }
  
  // Escuchar evento: anuncio actualizado
  onAnuncioActualizado(callback) {
    if (this.socket) {
      this.socket.on('anuncio:actualizado', callback);
    }
  }
  
  // Escuchar evento: cola completada
  onColaCompletada(callback) {
    if (this.socket) {
      this.socket.on('cola:completada', callback);
    }
  }
  
  // Escuchar evento: ventanilla limpiada
  onVentanillaLimpiada(callback) {
    if (this.socket) {
      this.socket.on('ventanilla:limpiada', callback);
    }
  }
  
  // Remover listener
  off(evento) {
    if (this.socket) {
      this.socket.off(evento);
    }
  }
  
  // Obtener socket
  getSocket() {
    return this.socket;
  }
}

export default new SocketService();