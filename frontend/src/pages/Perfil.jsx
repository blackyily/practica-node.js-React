import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api.js';
import Avatar from '../components/Avatar.jsx';

export function Perfil() {
  const { usuario, actualizarUsuarioLocal } = useAuth();

  // Estados para subida de foto
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [msgFoto, setMsgFoto] = useState({ tipo: '', texto: '' });

  // Estados para cambio de contraseña
  const [passActual, setPassActual] = useState('');
  const [passNuevo, setPassNuevo] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [msgPass, setMsgPass] = useState({ tipo: '', texto: '' });

  // Manejador de selección de foto
  const handleSeleccionarFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación local de tipo MIME
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMsgFoto({ tipo: 'danger', texto: 'Solo se permiten imágenes JPG, PNG o WEBP.' });
      return;
    }

    // Validación local de tamaño (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setMsgFoto({ tipo: 'danger', texto: 'La imagen excede el límite máximo de 2 MB.' });
      return;
    }

    setArchivoFoto(file);
    setPreviewFoto(URL.createObjectURL(file));
    setMsgFoto({ tipo: '', texto: '' });
  };

  // Subir foto al servidor
  const handleSubirFoto = async (e) => {
    e.preventDefault();
    if (!archivoFoto) return;

    setSubiendoFoto(true);
    setMsgFoto({ tipo: '', texto: '' });

    try {
      const formData = new FormData();
      formData.append('foto', archivoFoto);

      const res = await api.upload('/api/auth/me/foto', formData, 'PUT');
      if (res.ok && res.foto_perfil) {
        actualizarUsuarioLocal({ foto_perfil: res.foto_perfil });
        setMsgFoto({ tipo: 'success', texto: '¡Fotografía de perfil actualizada con éxito!' });
        setArchivoFoto(null);
        setPreviewFoto(null);
      }
    } catch (err) {
      setMsgFoto({ tipo: 'danger', texto: err.message || 'Error al subir la fotografía.' });
    } finally {
      setSubiendoFoto(false);
    }
  };

  // Cambiar contraseña
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setMsgPass({ tipo: '', texto: '' });

    if (passNuevo !== passConfirm) {
      setMsgPass({ tipo: 'danger', texto: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }

    setCambiandoPass(true);
    try {
      await api.put('/api/auth/me/password', {
        passwordActual: passActual,
        nuevoPassword: passNuevo,
      });

      setMsgPass({ tipo: 'success', texto: '¡Contraseña actualizada exitosamente!' });
      setPassActual('');
      setPassNuevo('');
      setPassConfirm('');
    } catch (err) {
      setMsgPass({ tipo: 'danger', texto: err.message || 'Error al actualizar la contraseña.' });
    } finally {
      setCambiandoPass(false);
    }
  };

  return (
    <div className="container-fluid py-2">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">Mi Perfil</h2>
          <p className="text-muted mb-0">Gestiona tus datos personales, foto de perfil y seguridad de acceso.</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Columna Izquierda: Información de la Cuenta y Subida de Fotografía */}
        <div className="col-12 col-lg-5">
          {/* Tarjeta de Datos de Usuario */}
          <div className="card shadow-sm border-0 mb-4 bg-white">
            <div className="card-body p-4 text-center">
              <div className="d-flex justify-content-center mb-3">
                <Avatar
                  src={previewFoto || usuario?.foto_perfil}
                  nombre={usuario?.nombre}
                  size={100}
                />
              </div>
              <h4 className="fw-bold text-dark mb-1">{usuario?.nombre}</h4>
              <p className="text-muted mb-2">@{usuario?.usuario}</p>
              <div className="mb-3">
                <span
                  className={`badge px-3 py-1 ${
                    usuario?.rol === 'admin' ? 'bg-danger text-white' : 'bg-info text-dark'
                  }`}
                >
                  {usuario?.rol?.toUpperCase()}
                </span>
              </div>
              <p className="text-secondary small mb-0">
                <strong>Correo registrado:</strong> {usuario?.correo}
              </p>
            </div>
          </div>

          {/* Formulario de Subida de Fotografía */}
          <div className="card shadow-sm border-0 bg-white">
            <div className="card-body p-4">
              <h5 className="fw-bold text-dark mb-3">📸 Actualizar Fotografía</h5>

              {msgFoto.texto && (
                <div className={`alert alert-${msgFoto.tipo} py-2 small`} role="alert">
                  {msgFoto.texto}
                </div>
              )}

              <form onSubmit={handleSubirFoto}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">
                    Selecciona una imagen (JPG, PNG o WEBP, máx. 2 MB):
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleSeleccionarFoto}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 fw-semibold"
                  disabled={!archivoFoto || subiendoFoto}
                >
                  {subiendoFoto ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Subiendo imagen...
                    </>
                  ) : (
                    'Subir y Guardar Foto'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Cambio de Contraseña */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 bg-white">
            <div className="card-body p-4 p-md-5">
              <h5 className="fw-bold text-dark mb-2">🔒 Seguridad y Cambio de Contraseña</h5>
              <p className="text-muted small mb-4">
                Por seguridad, tu nueva contraseña debe tener al menos 6 caracteres, incluir al menos una
                letra mayúscula y al menos un número.
              </p>

              {msgPass.texto && (
                <div className={`alert alert-${msgPass.tipo} py-2 small`} role="alert">
                  {msgPass.texto}
                </div>
              )}

              <form onSubmit={handleCambiarPassword}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">Contraseña Actual</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Ingresa tu contraseña actual"
                    value={passActual}
                    onChange={(e) => setPassActual(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small text-secondary">Nueva Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Mínimo 6 caracteres (ej. ClaveSegura2026!)"
                    value={passNuevo}
                    onChange={(e) => setPassNuevo(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold small text-secondary">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Repite la nueva contraseña"
                    value={passConfirm}
                    onChange={(e) => setPassConfirm(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-success px-4 py-2 fw-semibold"
                  disabled={cambiandoPass}
                >
                  {cambiandoPass ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Actualizando contraseña...
                    </>
                  ) : (
                    'Actualizar Contraseña'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
