import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Inicio() {
  const { usuario, esAdmin } = useAuth();

  const modulos = [
    {
      titulo: 'Alumnos',
      descripcion: 'Consulta, alta y asignación de estudiantes a grupos escolares.',
      icono: '🎓',
      ruta: '/alumnos',
      color: 'primary',
    },
    {
      titulo: 'Maestros',
      descripcion: 'Registro de docentes, número de empleado y especialidades.',
      icono: '👨‍🏫',
      ruta: '/maestros',
      color: 'success',
    },
    {
      titulo: 'Materias',
      descripcion: 'Catálogo de asignaturas, claves oficiales y créditos académicos.',
      icono: '📚',
      ruta: '/materias',
      color: 'warning',
    },
    {
      titulo: 'Grupos',
      descripcion: 'Asignación de materias, horarios, aulas y profesores titulares.',
      icono: '👥',
      ruta: '/grupos',
      color: 'info',
    },
  ];

  if (esAdmin) {
    modulos.push({
      titulo: 'Gestión de Usuarios',
      descripcion: 'Control de accesos y administración de cuentas del sistema.',
      icono: '🛡️',
      ruta: '/usuarios',
      color: 'danger',
    });
  }

  return (
    <div className="container-fluid py-2">
      {/* Banner de Bienvenida */}
      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex flex-wrap align-items-center justify-content-between">
            <div>
              <h1 className="fw-bold text-dark mb-2">¡Hola, {usuario?.nombre}! 👋</h1>
              <p className="lead text-muted mb-0">
                Bienvenido al panel principal del <strong>Sistema Escolar</strong>. Tu rol actual es{' '}
                <span
                  className={`badge px-3 py-1 ${
                    esAdmin ? 'bg-danger text-white' : 'bg-info text-dark'
                  }`}
                >
                  {usuario?.rol?.toUpperCase()}
                </span>
                .
              </p>
            </div>
            <div className="mt-3 mt-md-0">
              <Link to="/perfil" className="btn btn-outline-primary px-4 py-2 fw-semibold">
                ⚙️ Configurar Mi Perfil
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Acceso a Módulos */}
      <h4 className="fw-bold text-dark mb-3">Módulos del Sistema</h4>
      <div className="row g-4 mb-4">
        {modulos.map((mod) => (
          <div key={mod.ruta} className="col-12 col-md-6 col-xl-4">
            <div className="card h-100 shadow-sm border-0 hover-shadow transition">
              <div className="card-body p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <span className="fs-1 me-3">{mod.icono}</span>
                    <h5 className="fw-bold text-dark mb-0">{mod.titulo}</h5>
                  </div>
                  <p className="text-muted small mb-4">{mod.descripcion}</p>
                </div>
                <Link to={mod.ruta} className={`btn btn-${mod.color} w-100 fw-semibold text-white`}>
                  Ir a {mod.titulo} →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de Seguridad y Estado del Sistema */}
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-body p-4">
          <h5 className="fw-bold text-dark mb-3">Estado de Seguridad y Arquitectura</h5>
          <div className="row g-3 text-secondary small">
            <div className="col-12 col-md-4">
              <div className="p-3 bg-light rounded-3 border">
                <strong>🔒 Autenticación:</strong>
                <div className="text-success mt-1">JWT en cookie httpOnly + SameSite=Strict</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-3 bg-light rounded-3 border">
                <strong>🛡️ MariaDB 11.4:</strong>
                <div className="text-primary mt-1">Usuario limitado 'lab_app' (DML)</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-3 bg-light rounded-3 border">
                <strong>⚡ Proxy Inverso:</strong>
                <div className="text-secondary mt-1">Vite Proxy activo (/api y /uploads)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inicio;
