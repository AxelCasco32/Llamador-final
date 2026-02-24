// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { ventanillasAPI } from '../../services/api';
import socketService from '../../services/socket';

const COLORES_VENTANILLA = ['#00A8B5', '#007A85', '#005F6B'];

const PantallaPrincipal = () => {
  const [ventanillas, setVentanillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [iniciada, setIniciada] = useState(false);

  // ===== CARGA INICIAL =====
  useEffect(() => {
    cargarVentanillas();
  }, []);

  // ===== REPRODUCIR SONIDO =====
  // Crea una nueva instancia de Audio cada vez → permite superposición total
  const reproducirSonido = () => {
    const audio = new Audio('/sounds/llamada.mp3');
    audio.play().catch(err => console.warn('Audio bloqueado:', err));
  };

  // ===== SOCKETS =====
  useEffect(() => {
    socketService.connect();
    socketService.joinPantalla();

    socketService.onTurnoLlamado(() => {
      reproducirSonido();
      cargarVentanillas();
    });

    // Re-llamar también dispara sonido
    socketService.onTurnoReLlamado(() => {
      reproducirSonido();
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
      socketService.off('turno:rellamado');
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

  const iniciarPantalla = () => {
    // Desbloquear contexto de audio en el primer gesto del usuario
    const audio = new Audio('/sounds/llamada.mp3');
    audio.play().then(() => audio.pause()).catch(() => {});
    setIniciada(true);
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingText}>Cargando...</div>
      </div>
    );
  }

  if (!iniciada) {
    return (
      <div style={styles.inicioScreen}>
        <button style={styles.inicioBtn} onClick={iniciarPantalla}>
          <img src="/images/logo.png" alt="Logo" style={{ width: 100, marginBottom: 20 }} />
          <span style={styles.inicioBtnText}>Iniciar Pantalla</span>
        </button>
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
    <div style={styles.root}>
      <div style={styles.layout}>

        {/* ================= COLUMNA IZQUIERDA ================= */}
        <div style={styles.leftCol}>

          {/* TURNOS ACTUALES */}
          <div style={styles.ventanillasGrid}>
            {ventanillas.map((v, idx) => (
              <div key={v._id} style={styles.ventanillaCard}>
                <div
                  style={{
                    ...styles.turnoDisplay,
                    background: `linear-gradient(145deg, ${COLORES_VENTANILLA[idx % 3]}, ${COLORES_VENTANILLA[(idx + 1) % 3]})`
                  }}
                >
                  <span style={styles.turnoNumero}>
                    {v.turnoActual || '000'}
                  </span>
                </div>
                <div style={styles.ventanillaLabel}>
                  <span style={styles.ventanillaTexto}>Ventanilla</span>
                  <span style={styles.ventanillaNumero}>{v.numero}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ANUNCIOS */}
          <div style={styles.anunciosCard}>
            <h2 style={styles.seccionTitulo}>Anuncios</h2>
            <div style={styles.anunciosBody}>
              {ventanillas.some(v => v.anuncio) ? (
                ventanillas.map(v =>
                  v.anuncio ? (
                    <div key={v._id} style={styles.anuncioItem}>
                      <div
                        style={{
                          ...styles.anuncioBadge,
                          background: COLORES_VENTANILLA[ventanillas.indexOf(v) % 3]
                        }}
                      >
                        {v.numero}
                      </div>
                      <p style={styles.anuncioTexto}>{v.anuncio}</p>
                    </div>
                  ) : null
                )
              ) : (
                <p style={styles.vacioPrimario}>No hay anuncios en este momento</p>
              )}
            </div>
          </div>

        </div>

        {/* ================= COLUMNA DERECHA ================= */}
        <div style={styles.rightCol}>

          {/* LOGO */}
          <div style={styles.logoCard}>
            <img
              src="/images/logo.png"
              alt="HIGA Luisa C. de Gandulfo"
              style={styles.logoImg}
            />
          </div>

          {/* ÚLTIMOS TURNOS */}
          <div style={styles.ultimosCard}>
            <h2 style={styles.seccionTitulo}>Últimos turnos</h2>
            <div style={styles.ultimosList}>
              {ultimosLlamados.length > 0 ? (
                ultimosLlamados.map((item, idx) => (
                  <div key={idx} style={styles.ultimoItem}>
                    <div style={styles.ultimoCol}>
                      <span style={styles.ultimoLabel}>Nro</span>
                      <span style={styles.ultimoValor}>{item.numero}</span>
                    </div>
                    <div style={styles.ultimoDivider} />
                    <div style={{ ...styles.ultimoCol, alignItems: 'flex-end' }}>
                      <span style={styles.ultimoLabel}>Ventanilla</span>
                      <span style={styles.ultimoValor}>{item.ventanilla}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.vacioSecundario}>Esperando turnos...</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ===================== ESTILOS =====================
const styles = {
  root: {
    height: '100vh',
    width: '100vw',
    background: 'linear-gradient(135deg, #E8F7F8 0%, #F5FAFA 60%, #EAF4F5 100%)',
    padding: '20px',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', 'Inter', 'Helvetica Neue', sans-serif",
    boxSizing: 'border-box',
  },
  layout: {
    height: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '20px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  // ---- VENTANILLAS ----
  ventanillasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    height: '42%',
  },
  ventanillaCard: {
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 95, 107, 0.18), 0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
  },
  turnoDisplay: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnoNumero: {
    color: 'white',
    fontSize: '120px',
    fontWeight: '900',
    letterSpacing: '4px',
    textShadow: '0 4px 20px rgba(0,0,0,0.2)',
    lineHeight: 1,
  },
  ventanillaLabel: {
    background: 'white',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  ventanillaTexto: {
    color: '#5A7A8A',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  ventanillaNumero: {
    color: '#1A2E3B',
    fontSize: '64px',
    fontWeight: '800',
    lineHeight: 1,
  },

  // ---- TÍTULO SECCIÓN ----
  seccionTitulo: {
    color: '#1A2E3B',
    fontSize: '16px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '16px',
    paddingBottom: '14px',
    borderBottom: '2px solid #E8F7F8',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },

  // ---- ANUNCIOS ----
  anunciosCard: {
    flex: 1,
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(0, 95, 107, 0.08)',
    padding: '24px 28px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(0, 168, 181, 0.12)',
  },
  anunciosBody: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  anuncioItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'linear-gradient(90deg, #E8F7F8, #F5FAFA)',
    border: '1px solid rgba(0, 168, 181, 0.2)',
    borderRadius: '12px',
    padding: '14px 18px',
  },
  anuncioBadge: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '800',
    fontSize: '20px',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  anuncioTexto: {
    color: '#1A2E3B',
    fontWeight: '600',
    fontSize: '22px',
    flex: 1,
  },
  vacioPrimario: {
    textAlign: 'center',
    color: '#A8D8DC',
    fontSize: '20px',
    padding: '40px 0',
    fontStyle: 'italic',
  },

  // ---- LOGO ----
  logoCard: {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(0, 95, 107, 0.10)',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '220px',
    border: '1px solid rgba(0, 168, 181, 0.12)',
  },
  logoImg: {
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 2px 8px rgba(0,95,107,0.12))',
  },

  // ---- ÚLTIMOS TURNOS ----
  ultimosCard: {
    flex: 1,
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(0, 95, 107, 0.08)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid rgba(0, 168, 181, 0.12)',
  },
  ultimosList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
  },
  ultimoItem: {
    background: 'linear-gradient(135deg, #00A8B5, #005F6B)',
    borderRadius: '14px',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 12px rgba(0, 95, 107, 0.2)',
  },
  ultimoCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  ultimoLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  ultimoValor: {
    color: 'white',
    fontSize: '36px',
    fontWeight: '800',
    lineHeight: 1,
  },
  ultimoDivider: {
    width: '1px',
    height: '40px',
    background: 'rgba(255,255,255,0.2)',
  },
  vacioSecundario: {
    textAlign: 'center',
    color: '#A8D8DC',
    fontSize: '18px',
    padding: '40px 0',
    fontStyle: 'italic',
  },

  // ---- LOADING / INICIO ----
  loadingScreen: {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#E8F7F8',
  },
  loadingText: {
    color: '#00A8B5',
    fontSize: '28px',
    fontWeight: '600',
    letterSpacing: '2px',
  },
  inicioScreen: {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #005F6B, #00A8B5)',
  },
  inicioBtn: {
    background: 'white',
    border: 'none',
    borderRadius: '24px',
    padding: '48px 72px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
  },
  inicioBtnText: {
    color: '#005F6B',
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '1px',
  },
};

export default PantallaPrincipal;