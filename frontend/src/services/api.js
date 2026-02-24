import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para logs
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicios de Ventanillas
export const ventanillasAPI = {
  // Obtener todas
  obtenerTodas: () => api.get('/ventanillas'),

  // Obtener activas (para pantalla pública)
  obtenerActivas: () => api.get('/ventanillas/activas'),

  // Obtener una por ID
  obtenerPorId: (id) => api.get(`/ventanillas/${id}`),

  // Llamar siguiente turno
  llamarSiguiente: (id) => api.post(`/ventanillas/${id}/llamar-siguiente`),

  // Re-llamar turno actual
  reLlamar: (id) => api.post(`/ventanillas/${id}/rellamar`),

  // Actualizar anuncio
  actualizarAnuncio: (id, anuncio) =>
    api.patch(`/ventanillas/${id}/anuncio`, { anuncio }),

  // Limpiar ventanilla
  limpiar: (id) => api.delete(`/ventanillas/${id}/limpiar`),

  // Reiniciar contador de ventanilla
  reiniciarContador: (id) => api.post(`/ventanillas/${id}/reiniciar-contador`),
};

// Servicios de Cola
export const colaAPI = {
  // Estado de la cola
  obtenerEstado: () => api.get('/ventanillas/cola/estado'),

  // Resetear cola completa
  resetear: () => api.post('/ventanillas/cola/resetear'),
};

export default api;