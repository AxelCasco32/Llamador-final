import mongoose from 'mongoose';

const ventanillaSchema = new mongoose.Schema({
    numero: {
        type: Number,
        required: true,
        unique: true 
    },
    color: {
        type: String, 
        enum: ['verde', 'azul', 'rojo', 'negro'],  
        default: 'verde'
    },
    turnoActual: {  
        type: String,
        default: '000'
    },
    ultimosLlamados: [{
        type: String
    }],
    anuncio: {
        type: String,
        default: '',
        maxlength: 200
    },
    activa: {
        type: Boolean,
        default: true  
    },
    operador: { 
        type: String,
        default: ''
    }
}, { timestamps: true }); 


// ===== MÉTODOS DE INSTANCIA =====

ventanillaSchema.methods.asignarTurno = function(numeroTurno) {
  this.turnoActual = numeroTurno; 
  
  // Agregar a historial
  this.ultimosLlamados.unshift(numeroTurno);
  if (this.ultimosLlamados.length > 10) {
    this.ultimosLlamados = this.ultimosLlamados.slice(0, 10);
  }
  
  return this.save();
};

ventanillaSchema.methods.actualizarAnuncio = function(texto) {
  this.anuncio = texto;
  return this.save();
};

ventanillaSchema.methods.limpiar = function() {
  this.turnoActual = '000';  
  this.ultimosLlamados = [];
  this.anuncio = '';
  return this.save();
};

const Ventanilla = mongoose.model ('Ventanilla', ventanillaSchema);
export default Ventanilla;