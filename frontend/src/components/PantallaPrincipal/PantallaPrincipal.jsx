
import React, { useState, useEffect } from 'react';
import { ventanillasAPI } from '../../services/api';
import socketService from '../../services/socket';

const COLORES = {
  verde: '#00FF00',
  azul: '#0000FF',
  rojo: '#FF0000',
  negro: '#000000'
};

const PantallaPrincipal = () => {
  const [ventanillas, setVentanillas] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== CARGA INICIAL =====
  useEffect(() => {
    cargarVentanillas();
  }, []);

  // ===== SOCKETS =====
  useEffect(() => {
    socketService.connect();
    socketService.joinPantalla();

    socketService.onTurnoLlamado(() => {
      cargarVentanillas();
    });

    socketService.onAnuncioActualizado((data) => {
      setVentanillas(prev =>
        prev.map(v =>
          v.numero === data.ventanilla
            ? { ...v, anuncio: data.anuncio }
            : v
        )
      );
    });

    return () => {
      socketService.off('turno:llamado');
      socketService.off('anuncio:actualizado');
    };
  }, []);

  const cargarVentanillas = async () => {
    try {
      const response = await ventanillasAPI.obtenerActivas();
      setVentanillas(response.data.data);
    } catch (error) {
      console.error('Error cargando ventanillas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-3xl">
        Cargando...
      </div>
    );
  }

  // ===== ÚLTIMOS TURNOS =====
  const ultimosLlamados = ventanillas
    .flatMap(v =>
      v.ultimosLlamados.slice(0, 5).map(turno => ({
        numero: turno,
        ventanilla: v.numero
      }))
    )
    .slice(0, 5);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 overflow-hidden">
      <div className="h-full grid grid-cols-[1fr_350px] gap-4">

        {/* ================= COLUMNA IZQUIERDA ================= */}
        <div className="flex flex-col gap-4">

          {/* TURNOS ACTUALES */}
          <div className="grid grid-cols-3 gap-3" style={{ height: '45%' }}>
            {ventanillas.map(v => (
              <div
                key={v._id}
                className="flex flex-col rounded-lg overflow-hidden shadow-2xl border-4 border-gray-700"
                style={{ backgroundColor: COLORES[v.color] }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-white font-black text-[140px] leading-none">
                    {v.turnoActual || '000'}
                  </span>
                </div>

                <div className="bg-white/90 py-3">
                  <p className="text-center font-bold text-gray-700 text-2xl">
                    Ventanilla
                  </p>
                  <p className="text-center font-black text-gray-900 text-[80px] leading-none">
                    {v.numero}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ANUNCIOS PERSONALIZADOS */}
          <div className="flex-1 bg-white rounded-lg shadow-xl border-4 border-gray-300 p-6 overflow-hidden">
            <h2 className="text-center font-black text-4xl text-gray-800 mb-4 border-b-4 pb-2">
              Anuncios
            </h2>

            <div className="space-y-3 overflow-y-auto">
              {ventanillas.some(v => v.anuncio) ? (
                ventanillas.map(v =>
                  v.anuncio ? (
                    <div
                      key={v._id}
                      className="bg-yellow-200 border-2 border-yellow-400 rounded-lg p-4 flex items-center gap-4"
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-2xl"
                        style={{ backgroundColor: COLORES[v.color] }}
                      >
                        {v.numero}
                      </div>

                      <p className="text-gray-900 font-bold text-3xl flex-1">
                        {v.anuncio}
                      </p>
                    </div>
                  ) : null
                )
              ) : (
                <div className="text-center text-gray-400 text-3xl py-12">
                  No hay anuncios en este momento
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= COLUMNA DERECHA ================= */}
        <div className="flex flex-col gap-4">

          {/* LOGO */}
          <div className="bg-white rounded-lg shadow-xl border-4 border-blue-300 p-6 flex items-center justify-center h-[180px]">
            <div className="text-center">
              <div className="text-6xl mb-2">🏥</div>
              <div className="text-blue-900 font-black text-2xl">
                HOSPITAL
              </div>
              <div className="text-blue-700 font-bold text-xl">
                GANDULFO
              </div>
            </div>
          </div>

          {/* ÚLTIMOS TURNOS */}
          <div className="flex-1 bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg shadow-xl border-4 border-blue-300 p-6">
            <h2 className="text-blue-900 font-black text-4xl mb-6 text-center border-b-4 border-blue-500 pb-3">
              Últimos turnos
            </h2>

            <div className="space-y-3">
              {ultimosLlamados.length > 0 ? (
                ultimosLlamados.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-2 gap-3 bg-blue-900 rounded-lg p-4 shadow-lg"
                  >
                    <div className="text-center">
                      <div className="text-blue-300 text-sm font-bold mb-1">
                        Nro
                      </div>
                      <div className="text-white font-black text-4xl">
                        {item.numero}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-blue-300 text-sm font-bold mb-1">
                        Ventanilla
                      </div>
                      <div className="text-white font-black text-4xl">
                        {item.ventanilla}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-blue-400 text-2xl py-12">
                  Esperando turnos...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PantallaPrincipal;
