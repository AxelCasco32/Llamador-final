import mongoose from 'mongoose';

const colaSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true,
    unique: true
  },
  
  turnoActual: {
    type: Number,
    default: 0
  },
  
  turnosDisponibles: [{
    type: Number
  }],
  
  turnosLlamados: [{
    numero: Number,
    ventanilla: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  resetAt: {
    type: Date,
    default: Date.now
  }
  
}, { timestamps: true });

//metodos estaticos 

colaSchema.statics.obtenerColaHoy = async function() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  let cola = await this.findOne({ fecha: hoy });
  
  if (!cola) {
    cola = await this.create({
      fecha: hoy,
      turnoActual: 0,
      turnosDisponibles: Array.from({ length: 100 }, (_, i) => i + 1),
      turnosLlamados: []
    });
    
    console.log('✅ Nueva cola creada para hoy');
  }
  
  return cola;
};

// metodos de instancia

// Obtener siguiente turno disponible
colaSchema.methods.obtenerSiguiente = function() {
  if (this.turnosDisponibles.length === 0) {
    return null;
  }
  
  return this.turnosDisponibles[0];
};

// Asignar turno a ventanilla
colaSchema.methods.asignarTurno = function(ventanillaNumero) {  // ✅ Sin async
  const siguienteTurno = this.turnosDisponibles.shift();
  
  if (!siguienteTurno) {
    throw new Error('No hay más turnos disponibles');
  }
  
  const numeroFormateado = String(siguienteTurno).padStart(3, '0');
  
  this.turnosLlamados.push({
    numero: siguienteTurno,
    ventanilla: ventanillaNumero,
    timestamp: new Date()
  });
  
  this.turnoActual = siguienteTurno;
  
  // SI LLEGÓ AL 100, RESETEAR AUTOMÁTICAMENTE
  if (siguienteTurno === 100) {
    console.log('🔄 Turno 100 alcanzado. Cola se reiniciará.');
    
    // ✅ Resetear inmediatamente
    this.turnoActual = 0;
    this.turnosDisponibles = Array.from({ length: 100 }, (_, i) => i + 1);
    this.turnosLlamados = [];
    this.resetAt = new Date();
  }
  
  return { 
    numero: numeroFormateado, 
    turno: siguienteTurno, 
    esUltimo: siguienteTurno === 100 
  };
};

// Resetear cola manualmente
colaSchema.methods.resetear = function() {
  this.turnoActual = 0;
  this.turnosDisponibles = Array.from({ length: 100 }, (_, i) => i + 1);
  this.turnosLlamados = [];
  this.resetAt = new Date();
  return this.save();
};

const Cola = mongoose.model('Cola', colaSchema);
export default Cola;