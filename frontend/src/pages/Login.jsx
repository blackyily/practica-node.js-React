import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Login() {
  const [usuarioInput, setUsuarioInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login, estaAutenticado } = useAuth();
  const navigate = useNavigate();

  // Si ya tiene una sesión activa, redirigir al Dashboard principal
  if (estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await login(usuarioInput.trim(), passwordInput);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="card shadow-lg border-0" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card-body p-4 p-md-5">
          {/* Encabezado e Icono */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3 shadow"
              style={{ width: '64px', height: '64px', fontSize: '28px' }}
            >
              🏫
            </div>
            <h3 className="fw-bold text-dark mb-1">Sistema Escolar</h3>
            <p className="text-muted small">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-secondary small">Nombre de Usuario</label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">👤</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Admin o tu usuario"
                  value={usuarioInput}
                  onChange={(e) => setUsuarioInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-secondary small">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">🔒</span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Ingresa tu contraseña"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Validando credenciales...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Nota de ayuda para el laboratorio */}
          <div className="mt-4 pt-3 border-top text-center text-muted small">
            <div><strong>Administradores por defecto:</strong></div>
            <code>Admin</code> (Admin123!) o <code>Root</code> (Root123!)
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
