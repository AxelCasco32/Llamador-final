// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ventanillasAPI, colaAPI } from '../../services/api';

const COLORES = {
  verde: '#00A8B5',
  azul: '#007A85',
  rojo: '#005F6B',
  negro: '#1A2E3B'
};

const PanelAdmin = () => {
  const [ventanillas, setVentanillas] = useState([]);
  const [cola, setCola] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState('estadisticas');
  const [confirmarReset, setConfirmarReset] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null); // guarda la ventanilla a eliminar
  const [logoPreview, setLogoPreview] = useState('/images/logo.png');
  const [mensajeExito, setMensajeExito] = useState('');

  // Estado formulario nueva ventanilla
  const [formNueva, setFormNueva] = useState({ numero: '', color: 'verde', operador: '' });
  const [errorForm, setErrorForm] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resVent, resCola] = await Promise.all([
        ventanillasAPI.obtenerTodas(),
        colaAPI.obtenerEstado()
      ]);
      setVentanillas(resVent.data.data);
      setCola(resCola.data.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const mostrarExito = (mensaje) => {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  // ===== CREAR VENTANILLA =====
  const handleCrearVentanilla = async () => {
    setErrorForm('');
    if (!formNueva.numero) return setErrorForm('El número es obligatorio');
    if (isNaN(formNueva.numero) || Number(formNueva.numero) <= 0) return setErrorForm('El número debe ser mayor a 0');
    if (ventanillas.some(v => v.numero === Number(formNueva.numero))) return setErrorForm('Ya existe una ventanilla con ese número');

    setCreando(true);
    try {
      await ventanillasAPI.crear({
        numero: Number(formNueva.numero),
        color: formNueva.color,
        operador: formNueva.operador,
        turnoActual: '000',
        activa: true
      });
      setFormNueva({ numero: '', color: 'verde', operador: '' });
      await cargarDatos();
      mostrarExito(`Ventanilla ${formNueva.numero} creada correctamente`);
    } catch (error) {
      setErrorForm(error.response?.data?.message || 'Error al crear la ventanilla');
    } finally {
      setCreando(false);
    }
  };

  // ===== ELIMINAR VENTANILLA =====
  const handleEliminarVentanilla = async () => {
    if (!confirmarEliminar) return;
    try {
      await ventanillasAPI.eliminar(confirmarEliminar._id);
      setConfirmarEliminar(null);
      await cargarDatos();
      mostrarExito(`Ventanilla ${confirmarEliminar.numero} eliminada`);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ===== TOGGLE ACTIVA =====
  const handleToggleVentanilla = async (id, activaActual) => {
    try {
      await ventanillasAPI.toggleActiva(id);
      await cargarDatos();
      mostrarExito(`Ventanilla ${activaActual ? 'desactivada' : 'activada'} correctamente`);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ===== RESETEAR COLA =====
  const handleResetearCola = async () => {
    try {
      await colaAPI.resetear();
      setConfirmarReset(false);
      cargarDatos();
      mostrarExito('Cola reseteada correctamente');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCambiarLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      mostrarExito('Logo actualizado en vista previa. Para aplicarlo permanentemente, copiá el archivo a /public/images/logo.png');
    };
    reader.readAsDataURL(file);
  };

  // ===== ESTADÍSTICAS =====
  const totalTurnos = cola?.turnosAsignados?.length || 0;
  const turnosPendientes = cola?.turnos?.filter(t => t.estado === 'pendiente')?.length || 0;
  const turnosAtendidos = cola?.turnos?.filter(t => t.estado === 'asignado')?.length || 0;
  const ventanillasActivas = ventanillas.filter(v => v.activa).length;

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingText}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={styles.root}>

      {/* ===== MODAL RESET COLA ===== */}
      {confirmarReset && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalIcono}>⚠️</div>
            <h2 style={styles.modalTitulo}>¿Resetear cola completa?</h2>
            <p style={styles.modalTexto}>
              Se reiniciarán todos los turnos y ventanillas del día. Esta acción no se puede deshacer.
            </p>
            <div style={styles.modalBotones}>
              <button style={styles.btnCancelar} onClick={() => setConfirmarReset(false)}>Cancelar</button>
              <button style={styles.btnConfirmar} onClick={handleResetearCola}>Sí, resetear</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL ELIMINAR VENTANILLA ===== */}
      {confirmarEliminar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalIcono}>🗑️</div>
            <h2 style={styles.modalTitulo}>¿Eliminar Ventanilla {confirmarEliminar.numero}?</h2>
            <p style={styles.modalTexto}>
              Se eliminará permanentemente la ventanilla {confirmarEliminar.numero}. Esta acción no se puede deshacer.
            </p>
            <div style={styles.modalBotones}>
              <button style={styles.btnCancelar} onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
              <button style={styles.btnConfirmar} onClick={handleEliminarVentanilla}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TOAST ÉXITO ===== */}
      {mensajeExito && (
        <div style={styles.toast}>✅ {mensajeExito}</div>
      )}

      <div style={styles.layout}>

        {/* ===== SIDEBAR ===== */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarLogo}>
            <img src={logoPreview} alt="Logo" style={styles.sidebarLogoImg} />
          </div>
          <p style={styles.sidebarTitulo}>Panel Admin</p>
          <p style={styles.sidebarSub}>HIGA Gandulfo</p>

          <nav style={styles.nav}>
            {[
              { id: 'estadisticas', label: 'Estadísticas', icono: '📊' },
              { id: 'ventanillas', label: 'Ventanillas', icono: '🏢' },
              { id: 'logo', label: 'Cambiar Logo', icono: '🖼️' },
              { id: 'cola', label: 'Gestión Cola', icono: '🔄' },
            ].map(item => (
              <button
                key={item.id}
                style={{ ...styles.navBtn, ...(seccionActiva === item.id ? styles.navBtnActivo : {}) }}
                onClick={() => setSeccionActiva(item.id)}
              >
                <span style={styles.navIcono}>{item.icono}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ===== CONTENIDO PRINCIPAL ===== */}
        <div style={styles.main}>

          {/* ===== ESTADÍSTICAS ===== */}
          {seccionActiva === 'estadisticas' && (
            <div>
              <h1 style={styles.pageTitulo}>Estadísticas del día</h1>
              <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, borderTop: '4px solid #00A8B5' }}>
                  <div style={styles.statNumero}>{turnosAtendidos}</div>
                  <div style={styles.statLabel}>Turnos atendidos</div>
                </div>
                <div style={{ ...styles.statCard, borderTop: '4px solid #007A85' }}>
                  <div style={styles.statNumero}>{turnosPendientes}</div>
                  <div style={styles.statLabel}>Turnos pendientes</div>
                </div>
                <div style={{ ...styles.statCard, borderTop: '4px solid #005F6B' }}>
                  <div style={styles.statNumero}>{totalTurnos}</div>
                  <div style={styles.statLabel}>Total del día</div>
                </div>
                <div style={{ ...styles.statCard, borderTop: '4px solid #1A2E3B' }}>
                  <div style={styles.statNumero}>{ventanillasActivas}</div>
                  <div style={styles.statLabel}>Ventanillas activas</div>
                </div>
              </div>

              <div style={styles.card}>
                <h2 style={styles.cardTitulo}>Turno actual por ventanilla</h2>
                <div style={styles.ventanillasStatsGrid}>
                  {ventanillas.filter(v => v.activa).map((v) => (
                    <div key={v._id} style={styles.ventanillaStatItem}>
                      <div style={{ ...styles.ventanillaStatHeader, background: `linear-gradient(135deg, ${COLORES[v.color] || COLORES.verde}, #1A2E3B)` }}>
                        Ventanilla {v.numero}
                      </div>
                      <div style={styles.ventanillaStatNumero}>{v.turnoActual || '000'}</div>
                      <div style={styles.ventanillaStatUltimos}>
                        {v.ultimosLlamados?.slice(0, 3).map((t, i) => (
                          <span key={i} style={styles.ultimoBadge}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== GESTIÓN VENTANILLAS ===== */}
          {seccionActiva === 'ventanillas' && (
            <div>
              <h1 style={styles.pageTitulo}>Gestión de Ventanillas</h1>

              {/* FORMULARIO CREAR */}
              <div style={styles.card}>
                <h2 style={styles.cardTitulo}>➕ Nueva Ventanilla</h2>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Número</label>
                    <input
                      type="number"
                      min="1"
                      value={formNueva.numero}
                      onChange={e => setFormNueva(prev => ({ ...prev, numero: e.target.value }))}
                      placeholder="Ej: 4"
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Color</label>
                    <select
                      value={formNueva.color}
                      onChange={e => setFormNueva(prev => ({ ...prev, color: e.target.value }))}
                      style={styles.formInput}
                    >
                      <option value="verde">Verde</option>
                      <option value="azul">Azul</option>
                      <option value="rojo">Rojo</option>
                      <option value="negro">Negro</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Operador</label>
                    <input
                      type="text"
                      value={formNueva.operador}
                      onChange={e => setFormNueva(prev => ({ ...prev, operador: e.target.value }))}
                      placeholder="Nombre del operador"
                      style={styles.formInput}
                    />
                  </div>
                </div>

                {/* Preview color */}
                <div style={styles.colorPreview}>
                  <div style={{ ...styles.colorDot, background: COLORES[formNueva.color] }} />
                  <span style={styles.colorLabel}>Vista previa: Ventanilla {formNueva.numero || '?'}</span>
                </div>

                {errorForm && <p style={styles.errorMsg}>⚠️ {errorForm}</p>}

                <button
                  style={{ ...styles.btnCrear, opacity: creando ? 0.7 : 1 }}
                  onClick={handleCrearVentanilla}
                  disabled={creando}
                >
                  {creando ? 'Creando...' : '➕ Crear Ventanilla'}
                </button>
              </div>

              {/* LISTA VENTANILLAS */}
              <div style={styles.card}>
                <h2 style={styles.cardTitulo}>Ventanillas registradas ({ventanillas.length})</h2>
                <div style={styles.ventanillasList}>
                  {ventanillas.map((v) => (
                    <div key={v._id} style={styles.ventanillaRow}>
                      <div style={{ ...styles.ventanillaBadge, background: COLORES[v.color] || COLORES.verde }}>
                        {v.numero}
                      </div>
                      <div style={styles.ventanillaInfo}>
                        <div style={styles.ventanillaNombre}>Ventanilla {v.numero}</div>
                        <div style={styles.ventanillaDetalle}>
                          Color: {v.color} · Turno actual: {v.turnoActual || '000'} {v.operador ? `· ${v.operador}` : ''}
                        </div>
                      </div>
                      <div style={styles.ventanillaAcciones}>
                        {/* Toggle activa */}
                        <div
                          style={{ ...styles.toggleSwitch, background: v.activa ? '#00A8B5' : '#C8DDE0' }}
                          onClick={() => handleToggleVentanilla(v._id, v.activa)}
                        >
                          <div style={{ ...styles.toggleThumb, transform: v.activa ? 'translateX(24px)' : 'translateX(2px)' }} />
                        </div>
                        <span style={{ ...styles.toggleLabel, color: v.activa ? '#00A8B5' : '#A8D8DC' }}>
                          {v.activa ? 'Activa' : 'Inactiva'}
                        </span>
                        {/* Botón eliminar */}
                        <button
                          style={styles.btnEliminar}
                          onClick={() => setConfirmarEliminar(v)}
                          title="Eliminar ventanilla"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== CAMBIAR LOGO ===== */}
          {seccionActiva === 'logo' && (
            <div>
              <h1 style={styles.pageTitulo}>Cambiar Logo</h1>
              <div style={styles.card}>
                <h2 style={styles.cardTitulo}>Logo actual</h2>
                <div style={styles.logoPreviewBox}>
                  <img src={logoPreview} alt="Logo actual" style={styles.logoPreviewImg} />
                </div>
                <p style={styles.logoDescripcion}>
                  Seleccioná una imagen para previsualizar el nuevo logo. Para aplicarlo permanentemente,
                  copiá el archivo a <code style={styles.code}>/public/images/logo.png</code>.
                </p>
                <label style={styles.btnSubirLogo}>
                  🖼️ Seleccionar nuevo logo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCambiarLogo} />
                </label>
              </div>
            </div>
          )}

          {/* ===== GESTIÓN COLA ===== */}
          {seccionActiva === 'cola' && (
            <div>
              <h1 style={styles.pageTitulo}>Gestión de Cola</h1>
              <div style={styles.card}>
                <h2 style={styles.cardTitulo}>Estado actual</h2>
                <div style={styles.colaEstado}>
                  <div style={styles.colaItem}>
                    <span style={styles.colaLabel}>Turnos totales hoy</span>
                    <span style={styles.colaValor}>{totalTurnos}</span>
                  </div>
                  <div style={styles.colaItem}>
                    <span style={styles.colaLabel}>Atendidos</span>
                    <span style={{ ...styles.colaValor, color: '#00A8B5' }}>{turnosAtendidos}</span>
                  </div>
                  <div style={styles.colaItem}>
                    <span style={styles.colaLabel}>Pendientes</span>
                    <span style={{ ...styles.colaValor, color: '#005F6B' }}>{turnosPendientes}</span>
                  </div>
                </div>
              </div>

              <div style={{ ...styles.card, border: '1px solid rgba(229, 62, 62, 0.2)', marginTop: 20 }}>
                <h2 style={{ ...styles.cardTitulo, color: '#c53030' }}>Zona de peligro</h2>
                <p style={styles.reinicioDescripcion}>
                  Resetea la cola completa del día y pone todas las ventanillas en cero.
                </p>
                <button style={styles.btnReiniciar} onClick={() => setConfirmarReset(true)}>
                  <span>🔄</span>
                  <span>Resetear cola completa</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ===================== ESTILOS =====================
const styles = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #E8F7F8 0%, #F5FAFA 60%, #EAF4F5 100%)',
    fontFamily: "'Segoe UI', 'Inter', 'Helvetica Neue', sans-serif",
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    minHeight: '100vh',
  },

  // ---- SIDEBAR ----
  sidebar: {
    background: 'linear-gradient(180deg, #1A2E3B 0%, #005F6B 100%)',
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sidebarLogo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  sidebarLogoImg: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
  },
  sidebarTitulo: {
    color: 'white',
    fontSize: '18px',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: '1px',
    margin: 0,
  },
  sidebarSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    textAlign: 'center',
    marginBottom: '24px',
    marginTop: '4px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  navBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.7)',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'left',
  },
  navBtnActivo: {
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
  },
  navIcono: { fontSize: '18px' },

  // ---- MAIN ----
  main: {
    padding: '32px',
    overflowY: 'auto',
  },
  pageTitulo: {
    color: '#1A2E3B',
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '24px',
    letterSpacing: '0.5px',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 24px rgba(0, 95, 107, 0.08)',
    border: '1px solid rgba(0, 168, 181, 0.12)',
    marginBottom: '20px',
  },
  cardTitulo: {
    color: '#1A2E3B',
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid #E8F7F8',
  },

  // ---- FORMULARIO ----
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    color: '#5A7A8A',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  formInput: {
    border: '2px solid #E8F7F8',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '15px',
    color: '#1A2E3B',
    outline: 'none',
    background: '#FAFEFE',
    fontFamily: 'inherit',
  },
  colorPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  colorDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  colorLabel: {
    color: '#5A7A8A',
    fontSize: '13px',
    fontWeight: '600',
  },
  errorMsg: {
    color: '#e53e3e',
    fontSize: '13px',
    marginBottom: '12px',
    fontWeight: '600',
  },
  btnCrear: {
    background: 'linear-gradient(135deg, #00A8B5, #005F6B)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 95, 107, 0.2)',
  },

  // ---- STATS ----
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 16px rgba(0, 95, 107, 0.08)',
    textAlign: 'center',
  },
  statNumero: {
    color: '#1A2E3B',
    fontSize: '48px',
    fontWeight: '900',
    lineHeight: 1,
    marginBottom: '8px',
  },
  statLabel: {
    color: '#5A7A8A',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  ventanillasStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  ventanillaStatItem: {
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  ventanillaStatHeader: {
    color: 'white',
    fontSize: '13px',
    fontWeight: '700',
    padding: '10px 14px',
    letterSpacing: '1px',
  },
  ventanillaStatNumero: {
    background: '#E8F7F8',
    color: '#1A2E3B',
    fontSize: '36px',
    fontWeight: '900',
    textAlign: 'center',
    padding: '16px',
  },
  ventanillaStatUltimos: {
    background: 'white',
    padding: '8px 12px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  ultimoBadge: {
    background: '#E8F7F8',
    color: '#005F6B',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '20px',
  },

  // ---- VENTANILLAS ----
  ventanillasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  ventanillaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#FAFEFE',
    borderRadius: '14px',
    border: '1px solid #E8F7F8',
  },
  ventanillaBadge: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '22px',
    fontWeight: '900',
    flexShrink: 0,
  },
  ventanillaInfo: { flex: 1 },
  ventanillaNombre: {
    color: '#1A2E3B',
    fontSize: '16px',
    fontWeight: '700',
  },
  ventanillaDetalle: {
    color: '#5A7A8A',
    fontSize: '13px',
    marginTop: '2px',
  },
  ventanillaAcciones: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  toggleSwitch: {
    width: '52px',
    height: '28px',
    borderRadius: '14px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.3s',
    flexShrink: 0,
  },
  toggleThumb: {
    position: 'absolute',
    top: '3px',
    width: '22px',
    height: '22px',
    background: 'white',
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s',
  },
  toggleLabel: {
    fontSize: '13px',
    fontWeight: '700',
    minWidth: '52px',
  },
  btnEliminar: {
    background: 'linear-gradient(135deg, #fc8181, #e53e3e)',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(229, 62, 62, 0.2)',
  },

  // ---- LOGO ----
  logoPreviewBox: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px',
    background: '#F5FAFA',
    borderRadius: '14px',
    marginBottom: '16px',
    border: '2px dashed #A8D8DC',
  },
  logoPreviewImg: {
    height: '140px',
    objectFit: 'contain',
  },
  logoDescripcion: {
    color: '#5A7A8A',
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  code: {
    background: '#E8F7F8',
    color: '#005F6B',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  btnSubirLogo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #00A8B5, #005F6B)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 95, 107, 0.2)',
  },

  // ---- COLA ----
  colaEstado: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  colaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: '#F5FAFA',
    borderRadius: '12px',
    border: '1px solid #E8F7F8',
  },
  colaLabel: {
    color: '#5A7A8A',
    fontSize: '14px',
    fontWeight: '600',
  },
  colaValor: {
    color: '#1A2E3B',
    fontSize: '24px',
    fontWeight: '800',
  },
  reinicioDescripcion: {
    color: '#5A7A8A',
    fontSize: '14px',
    marginBottom: '16px',
  },
  btnReiniciar: {
    background: 'linear-gradient(135deg, #fc8181, #e53e3e)',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    padding: '16px 24px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 4px 16px rgba(229, 62, 62, 0.25)',
    width: '100%',
    justifyContent: 'center',
  },

  // ---- MODAL ----
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalCard: {
    background: 'white',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '420px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalIcono: { fontSize: '52px', marginBottom: '16px' },
  modalTitulo: {
    color: '#1A2E3B',
    fontSize: '22px',
    fontWeight: '800',
    marginBottom: '12px',
  },
  modalTexto: {
    color: '#5A7A8A',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '28px',
  },
  modalBotones: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  btnCancelar: {
    background: '#E8F7F8',
    color: '#1A2E3B',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  btnConfirmar: {
    background: 'linear-gradient(135deg, #fc8181, #e53e3e)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(229, 62, 62, 0.3)',
  },

  // ---- TOAST ----
  toast: {
    position: 'fixed',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1A2E3B',
    color: 'white',
    padding: '14px 28px',
    borderRadius: '30px',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: 2000,
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
  },

  // ---- LOADING ----
  loadingScreen: {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#E8F7F8',
  },
  loadingText: {
    color: '#00A8B5',
    fontSize: '24px',
    fontWeight: '600',
    letterSpacing: '2px',
  },
};

export default PanelAdmin;