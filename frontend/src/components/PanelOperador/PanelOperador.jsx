import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ventanillasAPI } from '../../services/api';
import socketService from '../../services/socket';

const COLORES = {
  verde: '#00FF00',
  azul: '#0000FF',
  rojo: '#FF0000',
  negro: '#000000'
};

const PanelOperador = () => {
  const { ventanillaId } = useParams();
  const [ventanilla, setVentanilla] = useState(null);
  const [todasVentanillas, setTodasVentanillas] = useState([]);
  const [anuncio, setAnuncio] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [ventanillaId]);

  useEffect(() => {
    socketService.connect();
    socketService.joinOperador(ventanillaId);

    socketService.onTurnoLlamado((data) => {
      console.log('🔔 Turno llamado:', data);
      cargarDatos();
    });

    return () => {
      socketService.off('turno:llamado');
    };
  }, [ventanillaId]);

  const cargarDatos = async () => {
    try {
      // Cargar mi ventanilla
      const resVent = await ventanillasAPI.obtenerPorId(ventanillaId);
      setVentanilla(resVent.data.data);
      setAnuncio(resVent.data.data.anuncio || '');

      // Cargar todas las ventanillas
      const resTodas = await ventanillasAPI.obtenerActivas();
      setTodasVentanillas(resTodas.data.data);

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleLlamarSiguiente = async () => {
    try {
      const response = await ventanillasAPI.llamarSiguiente(ventanillaId);
      console.log('✅ Turno llamado:', response.data);
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al llamar turno: ' + error.response?.data?.message);
    }
  };

  const handleReLlamar = async () => {
    try {
      await ventanillasAPI.reLlamar(ventanillaId);
      console.log('🔁 Turno re-llamado');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al re-llamar: ' + error.response?.data?.message);
    }
  };

  const handleActualizarAnuncio = async () => {
    try {
      await ventanillasAPI.actualizarAnuncio(ventanillaId, anuncio);
      console.log('📢 Anuncio actualizado');
      alert('Anuncio actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar anuncio');
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-3xl">Cargando...</div>;
  }

  if (!ventanilla) {
    return <div className="flex h-screen items-center justify-center text-3xl text-red-600">Ventanilla no encontrada</div>;
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      <div className="max-w-2xl mx-auto">
        
        {/* HEADER */}
        <div className="bg-white/90 rounded-xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-800">🎫 Panel Operador</h1>
              <p className="text-gray-600">Ventanilla {ventanilla.numero}</p>
            </div>
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-lg"
              style={{ backgroundColor: COLORES[ventanilla.color] }}
            >
              {ventanilla.numero}
            </div>
          </div>
        </div>

        {/* TURNOS EN PROGRESO (otras ventanillas) */}
        <div className="bg-white/90 rounded-xl shadow-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Nro en Progreso</h2>
          <div className="grid grid-cols-4 gap-3">
            {todasVentanillas.map(v => (
              <div key={v._id} className="text-center">
                <div 
                  className="text-white text-sm font-bold py-1 rounded-t"
                  style={{ backgroundColor: COLORES[v.color] }}
                >
                  V{v.numero}
                </div>
                <div className="bg-blue-100 text-blue-900 font-black text-2xl py-3 rounded-b border-2 border-blue-200">
                  {v.turnoActual || '000'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTÓN LLAMAR */}
        <div className="bg-white/90 rounded-xl shadow-2xl p-6 mb-6">
          <button
            onClick={handleLlamarSiguiente}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-6 px-8 rounded-xl shadow-lg flex items-center justify-center gap-4 transition-all text-2xl"
          >
            <div className="bg-white rounded-full p-3">
              <span className="text-green-600 text-4xl">🔔</span>
            </div>
            Llamar Siguiente
          </button>
        </div>

        {/* TURNO ACTUAL Y RE-LLAMAR */}
        <div className="bg-white/90 rounded-xl shadow-2xl p-6 mb-6">
          <div className="bg-blue-700 text-white text-center py-3 rounded-t-lg font-bold text-xl">
            Última Llamada de esta ventanilla
          </div>
          
          <div className="bg-blue-50 p-6 rounded-b-lg">
            {/* Turno Actual */}
            <div className="mb-4">
              <label className="text-gray-700 font-bold block mb-2">Turno Actual:</label>
              <div className="bg-white border-4 border-blue-500 rounded-lg p-6 text-center">
                <span className="text-blue-900 font-black text-6xl">
                  {ventanilla.turnoActual || '000'}
                </span>
              </div>
            </div>

            {/* Botón Re-llamar */}
            <button
              onClick={handleReLlamar}
              disabled={!ventanilla.turnoActual || ventanilla.turnoActual === '000'}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-lg transition-all text-xl"
            >
              🔁 Re-llamar Turno Actual
            </button>
          </div>
        </div>

        {/* ANUNCIO */}
        <div className="bg-white/90 rounded-xl shadow-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📢 Anuncio para Pacientes</h2>
          
          <textarea
            value={anuncio}
            onChange={(e) => setAnuncio(e.target.value)}
            placeholder="Escribir mensaje para los pacientes..."
            className="w-full border-2 border-gray-300 rounded-lg p-4 text-lg mb-4 focus:border-blue-500 focus:outline-none"
            rows="3"
            maxLength="200"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">
              {anuncio.length}/200 caracteres
            </span>
            <button
              onClick={handleActualizarAnuncio}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
            >
              Actualizar Anuncio
            </button>
          </div>
        </div>

        {/* ÚLTIMOS TURNOS LLAMADOS */}
        <div className="bg-white/90 rounded-xl shadow-2xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Últimos Turnos</h2>
          
          {ventanilla.ultimosLlamados && ventanilla.ultimosLlamados.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {ventanilla.ultimosLlamados.slice(0, 5).map((turno, idx) => (
                <div 
                  key={idx}
                  className="bg-blue-900 text-white text-center py-3 rounded-lg font-bold text-xl"
                >
                  {turno}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">No hay turnos llamados aún</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default PanelOperador;