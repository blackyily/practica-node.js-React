import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import CrudPage from './components/CrudPage.jsx';
import entidades from './config/entidades.js';

import Login from './pages/Login.jsx';
import Inicio from './pages/Inicio.jsx';
import Perfil from './pages/Perfil.jsx';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 1. Ruta Pública: Login */}
          <Route path="/login" element={<Login />} />

          {/* 2. Rutas Protegidas bajo el Layout con Menú Lateral */}
          <Route
            path="/"
            element={
              <RutaProtegida>
                <DashboardLayout />
              </RutaProtegida>
            }
          >
            {/* Página de Inicio / Dashboard */}
            <Route index element={<Inicio />} />

            {/* Módulos CRUD Escolares */}
            <Route path="alumnos" element={<CrudPage config={entidades.alumnos} />} />
            <Route path="maestros" element={<CrudPage config={entidades.maestros} />} />
            <Route path="materias" element={<CrudPage config={entidades.materias} />} />
            <Route path="grupos" element={<CrudPage config={entidades.grupos} />} />

            {/* Módulo de Administración de Usuarios (Exclusivo para Administradores) */}
            <Route
              path="usuarios"
              element={
                <RutaProtegida soloAdmin={true}>
                  <CrudPage config={entidades.usuarios} />
                </RutaProtegida>
              }
            />

            {/* Perfil del Usuario y Fotografías */}
            <Route path="perfil" element={<Perfil />} />
          </Route>

          {/* 3. Redirección por defecto para cualquier ruta no reconocida */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
