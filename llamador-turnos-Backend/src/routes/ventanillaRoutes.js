import express from 'express';
// Corregido: Importamos con V mayúscula para coincidir con el uso de abajo
import VentanillaController from '../controllers/ventanillaController.js';

const router = express.Router();

// Obtener ventanillas
router.get('/', VentanillaController.obtenerTodas);
router.get('/activas', VentanillaController.obtenerActivas);
router.get('/:id', VentanillaController.obtenerPorId);

// Acciones principales
router.post('/:id/llamar-siguiente', VentanillaController.llamarSiguiente);
router.post('/:id/rellamar', VentanillaController.reLlamar);
router.patch('/:id/anuncio', VentanillaController.actualizarAnuncio);
router.delete('/:id/limpiar', VentanillaController.limpiar);

// Gestión de cola
router.get('/cola/estado', VentanillaController.estadoCola);
router.post('/cola/resetear', VentanillaController.resetearCola);

// Admin
// Corregido: Antes decía ventanillaController (minúscula), ahora es VentanillaController
router.post('/', VentanillaController.crear);

export default router;