import express from 'express';
import VentanillaController from '../controllers/ventanillaController.js';

const router = express.Router();

// ===== RUTAS ESTÁTICAS (deben ir antes que /:id) =====
router.get('/', VentanillaController.obtenerTodas);
router.get('/activas', VentanillaController.obtenerActivas);
router.get('/cola/estado', VentanillaController.estadoCola);
router.post('/cola/resetear', VentanillaController.resetearCola);
router.post('/', VentanillaController.crear);

// ===== RUTAS CON :id =====
router.get('/:id', VentanillaController.obtenerPorId);
router.post('/:id/llamar-siguiente', VentanillaController.llamarSiguiente);
router.post('/:id/rellamar', VentanillaController.reLlamar);
router.patch('/:id/anuncio', VentanillaController.actualizarAnuncio);
router.patch('/:id/toggle', VentanillaController.toggleActiva);
router.delete('/:id/limpiar', VentanillaController.limpiar);
router.delete('/:id', VentanillaController.eliminar);
router.post('/:id/reiniciar-contador', VentanillaController.reiniciarContador);

export default router;