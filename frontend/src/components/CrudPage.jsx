import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api.js';

export function CrudPage({ config }) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [registroActual, setRegistroActual] = useState(null);
  const [formData, setFormData] = useState({});
  const [opcionesRelaciones, setOpcionesRelaciones] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [guardando, setGuardando] = useState(false);

  // 1. Cargar datos del catálogo actual
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const res = await api.get(config.endpoint);
      setDatos(res.datos || []);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar los registros.');
    } finally {
      setCargando(false);
    }
  }, [config.endpoint]);

  // 2. Cargar opciones para campos select relacionados (ej. materias y maestros para grupos)
  const cargarRelaciones = useCallback(async () => {
    if (!config.relaciones || config.relaciones.length === 0) return;

    const nuevasOpciones = {};
    for (const rel of config.relaciones) {
      try {
        const res = await api.get(rel.endpoint);
        const lista = res.datos || [];
        nuevasOpciones[rel.campo] = lista.map((item) => ({
          value: item[rel.valueKey],
          label: rel.labelFormatter ? rel.labelFormatter(item) : item[rel.labelKey],
        }));
      } catch (err) {
        console.warn(`Error al cargar opciones para ${rel.campo}:`, err.message);
      }
    }
    setOpcionesRelaciones(nuevasOpciones);
  }, [config.relaciones]);

  useEffect(() => {
    cargarDatos();
    cargarRelaciones();
  }, [cargarDatos, cargarRelaciones]);

  // 3. Filtrar registros en tiempo real por búsqueda
  const datosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return datos;
    const query = busqueda.toLowerCase().trim();
    return datos.filter((item) => {
      if (config.campoBusqueda && item[config.campoBusqueda]) {
        return String(item[config.campoBusqueda]).toLowerCase().includes(query);
      }
      return Object.values(item).some((val) =>
        String(val || '').toLowerCase().includes(query)
      );
    });
  }, [datos, busqueda, config.campoBusqueda]);

  // 4. Abrir modal para crear nuevo registro
  const abrirModalNuevo = () => {
    const inicial = {};
    config.campos.forEach((campo) => {
      inicial[campo.name] = '';
    });
    setFormData(inicial);
    setModoEdicion(false);
    setRegistroActual(null);
    setErrorMsg('');
    setModalAbierto(true);
  };

  // 5. Abrir modal para editar registro existente
  const abrirModalEditar = (item) => {
    const editData = {};
    config.campos.forEach((campo) => {
      editData[campo.name] = item[campo.name] ?? '';
    });
    setFormData(editData);
    setModoEdicion(true);
    setRegistroActual(item);
    setErrorMsg('');
    setModalAbierto(true);
  };

  // 6. Manejo de cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 7. Enviar formulario (Crear o Actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorMsg('');

    try {
      if (modoEdicion) {
        // En modo edición, si un campo de password viene vacío, lo omitimos para no sobreescribir
        const payload = { ...formData };
        if (payload.password === '') {
          delete payload.password;
        }
        await api.put(`${config.endpoint}/${registroActual.id}`, payload);
        setSuccessMsg(`${config.singular} actualizado exitosamente.`);
      } else {
        await api.post(config.endpoint, formData);
        setSuccessMsg(`${config.singular} creado exitosamente.`);
      }

      setModalAbierto(false);
      await cargarDatos();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar los datos.');
    } finally {
      setGuardando(false);
    }
  };

  // 8. Eliminar registro con confirmación
  const handleEliminar = async (id) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar este ${config.singular.toLowerCase()}?`)) {
      return;
    }

    setErrorMsg('');
    try {
      await api.delete(`${config.endpoint}/${id}`);
      setSuccessMsg(`${config.singular} eliminado exitosamente.`);
      await cargarDatos();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo eliminar el registro.');
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Encabezado del Módulo */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold text-dark mb-1">{config.titulo}</h2>
          <p className="text-muted mb-0">Gestión y control de {config.nombre}.</p>
        </div>
        <button className="btn btn-primary px-4 py-2 fw-semibold shadow-sm" onClick={abrirModalNuevo}>
          + Nuevo {config.singular}
        </button>
      </div>

      {/* Alertas informativas */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Aviso:</strong> {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
        </div>
      )}

      {/* Barra de Búsqueda */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">🔍</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Buscar en ${config.nombre}...`}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {busqueda && (
                  <button className="btn btn-outline-secondary" onClick={() => setBusqueda('')}>
                    Limpiar
                  </button>
                )}
              </div>
            </div>
            <div className="col text-end text-muted small">
              Mostrando {datosFiltrados.length} de {datos.length} registro(s)
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  {config.columnas.map((col) => (
                    <th key={col.key} className="py-3 px-4 text-secondary text-uppercase small fw-bold">
                      {col.label}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-end text-secondary text-uppercase small fw-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={config.columnas.length + 1} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="text-muted mt-2 mb-0">Cargando registros...</p>
                    </td>
                  </tr>
                ) : datosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={config.columnas.length + 1} className="text-center py-5 text-muted">
                      No se encontraron registros en {config.titulo}.
                    </td>
                  </tr>
                ) : (
                  datosFiltrados.map((item) => (
                    <tr key={item.id}>
                      {config.columnas.map((col) => (
                        <td key={col.key} className="py-3 px-4">
                          {col.badge ? (
                            (() => {
                              const b = col.badge(item[col.key], item);
                              return <span className={`badge bg-${b.color}`}>{b.text}</span>;
                            })()
                          ) : col.render ? (
                            col.render(item[col.key], item)
                          ) : (
                            (item[col.key] ?? '-')
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-end">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => abrirModalEditar(item)}
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleEliminar(item.id)}
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Dinámico de Creación / Edición */}
      {modalAbierto && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  {modoEdicion ? `Editar ${config.singular}` : `Registrar Nuevo ${config.singular}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalAbierto(false)}
                  disabled={guardando}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {errorMsg && (
                    <div className="alert alert-danger py-2 mb-3 small">
                      {errorMsg}
                    </div>
                  )}

                  <div className="row g-3">
                    {config.campos.map((campo) => {
                      // Si el campo es solo al crear (ej. nombre de usuario) y estamos editando, se desactiva
                      if (campo.soloCrear && modoEdicion) {
                        return (
                          <div key={campo.name} className="col-12 col-md-6">
                            <label className="form-label fw-semibold small text-muted">{campo.label}</label>
                            <input
                              type="text"
                              className="form-control bg-light"
                              value={formData[campo.name] || ''}
                              disabled
                            />
                            <div className="form-text small">El nombre de usuario no se puede modificar.</div>
                          </div>
                        );
                      }

                      // Campos tipo SELECT con opciones foráneas
                      if (campo.type === 'select') {
                        const opciones = opcionesRelaciones[campo.name] || [];
                        return (
                          <div key={campo.name} className="col-12 col-md-6">
                            <label className="form-label fw-semibold small">
                              {campo.label} {campo.required && <span className="text-danger">*</span>}
                            </label>
                            <select
                              className="form-select"
                              name={campo.name}
                              value={formData[campo.name] || ''}
                              onChange={handleInputChange}
                              required={campo.required}
                            >
                              <option value="">{campo.placeholder || '-- Selecciona una opción --'}</option>
                              {opciones.map((op) => (
                                <option key={op.value} value={op.value}>
                                  {op.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      // Campos tipo TEXTAREA
                      if (campo.type === 'textarea') {
                        return (
                          <div key={campo.name} className="col-12">
                            <label className="form-label fw-semibold small">
                              {campo.label} {campo.required && <span className="text-danger">*</span>}
                            </label>
                            <textarea
                              className="form-control"
                              name={campo.name}
                              rows="3"
                              placeholder={campo.placeholder}
                              value={formData[campo.name] || ''}
                              onChange={handleInputChange}
                              required={campo.required}
                            ></textarea>
                          </div>
                        );
                      }

                      // Campos estándar (text, number, email, date, password)
                      const isRequired = campo.required || (campo.requiredOnCreate && !modoEdicion);
                      return (
                        <div key={campo.name} className="col-12 col-md-6">
                          <label className="form-label fw-semibold small">
                            {campo.label} {isRequired && <span className="text-danger">*</span>}
                          </label>
                          <input
                            type={campo.type}
                            className="form-control"
                            name={campo.name}
                            min={campo.min}
                            max={campo.max}
                            placeholder={campo.placeholder}
                            value={formData[campo.name] ?? ''}
                            onChange={handleInputChange}
                            required={isRequired}
                          />
                          {campo.helpText && <div className="form-text small">{campo.helpText}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalAbierto(false)}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={guardando}>
                    {guardando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Guardando...
                      </>
                    ) : modoEdicion ? (
                      'Actualizar'
                    ) : (
                      'Guardar'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrudPage;
