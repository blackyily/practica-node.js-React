import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Componente para proteger el acceso a páginas según autenticación y rol
export function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario, cargando } = useAuth();

  // 1. Mostrar pantalla de carga mientras se valida la cookie de sesión con el backend
  if (cargando) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Verificando sesión...</span>
        </div>
        <p className="text-muted fw-semibold">Cargando Sistema Escolar...</p>
      </div>
    );
  }

  // 2. Si no hay usuario autenticado, redirigir al Login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si la ruta requiere privilegios de administrador y el usuario no los tiene
  if (soloAdmin && usuario.rol !== 'admin') {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
          <h4 className="alert-heading fw-bold">Acceso Denegado</h4>
          <p className="mb-0">
            Esta sección es de uso exclusivo para <strong>Administradores</strong> del sistema escolar.
            Tu cuenta tiene rol de <strong>{usuario.rol}</strong>.
          </p>
        </div>
      </div>
    );
  }

  // 4. Si cumple los requisitos, renderizar el contenido protegido
  return children;
}

export default RutaProtegida;
