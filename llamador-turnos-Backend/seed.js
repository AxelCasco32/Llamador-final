import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ventanilla from './src/models/Ventanilla.js';
import Cola from './src/models/Cola.js';

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Limpiar colecciones
    await Ventanilla.deleteMany({});
    await Cola.deleteMany({});
    console.log('🧹 Colecciones limpiadas');
    
    // Crear ventanillas
    const ventanillas = [
      { numero: 3, color: 'rojo', turnoActual: '000', operador: 'Operador 1' },
      { numero: 5, color: 'verde', turnoActual: '000', operador: 'Operador 2' },
      { numero: 7, color: 'azul', turnoActual: '000', operador: 'Operador 3' }
    ];
    
    await Ventanilla.insertMany(ventanillas);
    console.log('✅ 3 ventanillas creadas');
    
    // Crear cola del día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const cola = new Cola({
      fecha: hoy,
      turnoActual: 0,
      turnosDisponibles: Array.from({ length: 100 }, (_, i) => i + 1),
      turnosLlamados: []
    });
    
    await cola.save();
    console.log('✅ Cola creada (turnos 1-100)');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Base de datos inicializada');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const todasVentanillas = await Ventanilla.find();
    console.log('\n📋 Ventanillas:');
    todasVentanillas.forEach(v => {
      console.log(`  - Ventanilla ${v.numero} (${v.color}) - ID: ${v._id}`);
    });
    
    console.log('\n📋 Cola:');
    console.log(`  - Turnos disponibles: ${cola.turnosDisponibles.length}`);
    console.log(`  - Próximo turno: ${cola.obtenerSiguiente()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();