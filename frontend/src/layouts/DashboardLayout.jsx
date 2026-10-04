import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

export function DashboardLayout() {
  const { usuario, logout, esAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* 1. Menú Lateral (Sidebar) */}
      <aside
        className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark shadow"
        style={{ width: '280px', minHeight: '100vh', position: 'sticky', top: 0 }}
      >
        {/* Marca / Logotipo */}
        <div className="d-flex align-items-center mb-3 pb-3 border-bottom border-secondary text-decoration-none text-white">
          <span className="fs-4 fw-bold tracking-tight">🏫 Sistema Escolar</span>
        </div>

        {/* Tarjeta de Información del Usuario en Sesión (Requerido por laboratorio) */}
        <div className="p-3 mb-3 bg-secondary bg-opacity-25 rounded-3 text-center border border-secondary border-opacity-50">
          <div className="d-flex justify-content-center mb-2">
            <Avatar src={usuario?.foto_perfil} nombre={usuario?.nombre} size={64} />
          </div>
          <h6 className="fw-bold mb-0 text-truncate text-white" title={usuario?.nombre}>
            {usuario?.nombre || 'Usuario'}
          </h6>
          <small className="text-light text-opacity-75 d-block mb-1">
            @{usuario?.usuario}
          </small>
          <div className="small text-truncate text-secondary mb-2" title={usuario?.correo}>
            {usuario?.correo}
          </div>
          <span
            className={`badge px-3 py-1 ${
              usuario?.rol === 'admin' ? 'bg-danger text-white' : 'bg-info text-dark'
            }`}
          >
            {usuario?.rol?.toUpperCase()}
          </span>
        </div>

        {/* Enlaces de Navegación */}
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `nav-link d-flex align-items-center ${
                  isActive ? 'active bg-primary text-white fw-bold' : 'text-white-50 hover-light'
                }`
              }
            >
              <span className="me-2">📊</span> Inicio
            </NavLink>
          </li>
          <li className="nav-item mb-1">
            <NavLink
              to="/alumnos"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center ${
                  isActive ? 'active bg-primary text-white fw-bold' : 'text-white-50 hover-light'
                }`
              }
            >
              <span className="me-2">🎓</span> Alumnos
            </NavLink>
          </li>
          <li className="nav-item mb-1">
            <NavLink
              to="/maestros"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center ${
                  isActive ? 'active bg-primary text-white fw-bold' : 'text-white-50 hover-light'
                }`
              }
            >
              <span className="me-2">👨‍🏫</span> Maestros
            </NavLink>
          </li>
          <li className="nav-item mb-1">
            <NavLink
              to="/materias"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center ${
                  isActive ? 'active bg-primary text-white fw-bold' : 'text-white-50 hover-light'
                }`
              }
            >
              <span className="me-2">📚</span> Materias
            </NavLink>
          </li>
          <li className="nav-item mb-1">
            <NavLink
              to="/grupos"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center ${
                  isActive ? 'active bg-primary text-white fw-bold' : 'text-white-50 hover-light'
                }`
              }
            >
              <span className="me-2">👥</span> Grupos
            </NavLink>
          </li>

          {/* Módulo de Usuarios: Exclusivo para administradores */}
          {esAdmin && (
            <li className="nav-item mb-1">
              <NavLink
                to="/usuarios"
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center ${
                    isActive ? 'active bg-danger text-white fw-bold' : 'text-danger-emphasis hover-light'
                  }`
                }
              >
                <span className="me-2">🛡️</span> Usuarios
              </NavLink>
            </li>
          )}

          <li className="nav-item mt-3 pt-3 border-top border-secondary">
            <NavLink
              to="/perfil"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center ${
                  isActive ? 'active bg-primary text-white fw-bold' : 'text-white-50 hover-light'
                }`
              }
            >
              <span className="me-2">⚙️</span> Mi Perfil
            </NavLink>
          </li>
        </ul>

        {/* Botón de Cierre de Sesión */}
        <div className="pt-3 border-top border-secondary">
          <button
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center fw-semibold"
            onClick={handleLogout}
          >
            <span className="me-2">🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. Área Principal de Contenido */}
      <main className="flex-grow-1 p-4 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
