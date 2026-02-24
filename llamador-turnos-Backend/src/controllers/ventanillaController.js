import Ventanilla from '../models/Ventanilla.js';
import Cola from '../models/Cola.js';

class VentanillaController {

  // GET /api/ventanillas - Obtener todas
  async obtenerTodas(req, res) {
    try {
      const ventanillas = await Ventanilla.find().sort({ numero: 1 });
      res.json({ success: true, data: ventanillas });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/ventanillas/activas
  async obtenerActivas(req, res) {
    try {
      const ventanillas = await Ventanilla.find({ activa: true }).sort({ numero: 1 });
      res.json({ success: true, data: ventanillas });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/ventanillas/:id
  async obtenerPorId(req, res) {
    try {
      const ventanilla = await Ventanilla.findById(req.params.id);
      if (!ventanilla) return res.status(404).json({ success: false, message: 'No encontrada' });
      res.json({ success: true, data: ventanilla });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/ventanillas/:id/llamar-siguiente
  async llamarSiguiente(req, res) {
    try {
      const ventanilla = await Ventanilla.findById(req.params.id);
      if (!ventanilla) return res.status(404).json({ success: false, message: 'No encontrada' });

      const cola = await Cola.obtenerColaHoy();
      const siguiente = cola.obtenerSiguiente();

      if (!siguiente) return res.status(400).json({ success: false, message: 'No hay más turnos' });

      const { numero, esUltimo } = cola.asignarTurno(ventanilla.numero);
      await cola.save();

      ventanilla.turnoActual = numero;
      ventanilla.ultimosLlamados.unshift(numero);
      ventanilla.ultimosLlamados = ventanilla.ultimosLlamados.slice(0, 5);
      await ventanilla.save();

      req.io.emit('turno:llamado', {
        ventanilla: ventanilla.numero,
        color: ventanilla.color,
        turno: numero,
        ultimosLlamados: ventanilla.ultimosLlamados
      });

      res.json({ success: true, data: ventanilla });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/ventanillas/:id/rellamar
  async reLlamar(req, res) {
    try {
      const ventanilla = await Ventanilla.findById(req.params.id);
      req.io.emit('turno:rellamado', {
        ventanilla: ventanilla.numero,
        turno: ventanilla.turnoActual
      });
      res.json({ success: true, data: ventanilla });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // PATCH /api/ventanillas/:id/anuncio
  async actualizarAnuncio(req, res) {
    try {
      const { anuncio } = req.body;
      const ventanilla = await Ventanilla.findByIdAndUpdate(
        req.params.id,
        { anuncio: anuncio || '' },
        { new: true }
      );

      if (!ventanilla) return res.status(404).json({ success: false, message: 'No encontrada' });

      req.io.emit('anuncio:actualizado', {
        ventanilla: ventanilla.numero,
        anuncio: ventanilla.anuncio
      });

      res.json({ success: true, data: ventanilla });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/ventanillas/:id/limpiar
  async limpiar(req, res) {
    try {
      const ventanilla = await Ventanilla.findByIdAndUpdate(
        req.params.id,
        { turnoActual: '000', ultimosLlamados: [], anuncio: '' },
        { new: true }
      );
      res.json({ success: true, data: ventanilla });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/ventanillas/cola/estado
  async estadoCola(req, res) {
    try {
      const cola = await Cola.obtenerColaHoy();
      res.json({ success: true, data: cola });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/ventanillas/cola/resetear
  async resetearCola(req, res) {
    try {
      const cola = await Cola.obtenerColaHoy();
      await cola.resetear();
      await Ventanilla.updateMany({}, { turnoActual: '000', ultimosLlamados: [], anuncio: '' });
      req.io.emit('cola:reseteada', { mensaje: 'Cola reiniciada' });
      res.json({ success: true, message: 'Reiniciado' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/ventanillas/:id/reiniciar-contador
  async reiniciarContador(req, res) {
    try {
      const ventanilla = await Ventanilla.findByIdAndUpdate(
        req.params.id,
        { turnoActual: '000', ultimosLlamados: [] },
        { new: true }
      );
      if (!ventanilla) return res.status(404).json({ success: false, message: 'No encontrada' });
      req.io.emit('turno:llamado', {
        ventanilla: ventanilla.numero,
        turno: '000',
        ultimosLlamados: []
      });
      res.json({ success: true, data: ventanilla });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/ventanillas - Crear
  async crear(req, res) {
    try {
      const ventanilla = new Ventanilla(req.body);
      await ventanilla.save();
      res.status(201).json({ success: true, data: ventanilla });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

}

export default new VentanillaController();