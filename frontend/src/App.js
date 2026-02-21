import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import PantallaPrincipal from './components/PantallaPrincipal/PantallaPrincipal';
import PanelOperador from './components/PanelOperador/PanelOperador';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pantalla Principal (Sala de Espera) */}
        <Route path="/" element={<PantallaPrincipal />} />
        <Route path="/pantalla" element={<PantallaPrincipal />} />
        
        {/* Panel Operador (Ventanilla) */}
        <Route path="/operador/:ventanillaId" element={<PanelOperador />} />
        
        {/* Página de selección de ventanilla (opcional) */}
        <Route path="/seleccionar" element={<SeleccionarVentanilla />} />
      </Routes>
    </BrowserRouter>
  );
}

// Componente auxiliar para seleccionar ventanilla (opcional)
function SeleccionarVentanilla() {
  const [ventanillas, setVentanillas] = React.useState([]);

  React.useEffect(() => {
    fetch('http://localhost:5000/api/ventanillas')
      .then(r => r.json())
      .then(data => setVentanillas(data.data));
  }, []);

  const COLORES = {
    verde: '#00FF00',
    azul: '#0000FF',
    rojo: '#FF0000',
    negro: '#000000'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-black text-white text-center mb-12">
          🏥 Seleccionar Ventanilla
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {ventanillas.map(v => (
            <Link
              key={v._id}
              to={`/operador/${v._id}`}
              className="bg-white rounded-2xl shadow-2xl p-8 hover:scale-105 transition-transform"
            >
              <div className="text-center">
                <div 
                  className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-black shadow-lg"
                  style={{ backgroundColor: COLORES[v.color] }}
                >
                  {v.numero}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Ventanilla {v.numero}
                </h2>
                <p className="text-gray-600 mt-2">
                  {v.operador || 'Sin operador'}
                </p>
                <div className="mt-4 bg-blue-100 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Turno actual</p>
                  <p className="text-3xl font-black text-blue-900">
                    {v.turnoActual || '000'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/pantalla"
            className="inline-block bg-white text-purple-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-purple-50 transition-all text-xl"
          >
            📺 Ver Pantalla Pública
          </Link>
        </div>
      </div>
    </div>
  );
}

export default App; 