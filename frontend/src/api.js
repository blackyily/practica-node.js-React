// ==============================================================
// CLIENTE HTTP CENTRALIZADO CON FETCH
// Maneja automáticamente cookies (credentials: 'include') y errores
// ==============================================================

async function request(url, options = {}) {
  // Configuración predeterminada: incluir siempre cookies para soportar JWT httpOnly
  const config = {
    credentials: 'include',
    ...options,
    headers: {
      ...options.headers,
    },
  };

  // Si el cuerpo es un objeto plano (no FormData), formatear a JSON
  if (options.body && !(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(options.body);
  }

  try {
    const respuesta = await fetch(url, config);
    const esJson = respuesta.headers.get('content-type')?.includes('application/json');
    const datos = esJson ? await respuesta.json() : await respuesta.text();

    if (!respuesta.ok) {
      // Si el servidor devolvió errores de validación estructurados de Zod
      if (datos && datos.errores && Array.isArray(datos.errores)) {
        const detalleErrores = datos.errores.map((e) => e.mensaje).join(' ');
        const error = new Error(detalleErrores || datos.mensaje || 'Error en la solicitud.');
        error.status = respuesta.status;
        error.datos = datos;
        throw error;
      }

      const mensajeError = datos?.mensaje || `Error HTTP ${respuesta.status}: ${respuesta.statusText}`;
      const error = new Error(mensajeError);
      error.status = respuesta.status;
      error.datos = datos;
      throw error;
    }

    return datos;
  } catch (err) {
    // Si ya es un Error procesado con status, relanzarlo
    if (err.status) throw err;
    // Si fue un fallo de red o del proxy
    const networkError = new Error(err.message || 'No se pudo conectar con el servidor.');
    networkError.status = 0;
    throw networkError;
  }
}

// Objeto con métodos estándar para realizar peticiones REST
export const api = {
  get: (url) => request(url, { method: 'GET' }),
  post: (url, body) => request(url, { method: 'POST', body }),
  put: (url, body) => request(url, { method: 'PUT', body }),
  delete: (url) => request(url, { method: 'DELETE' }),

  // Subida de archivos (FormData sin cabecera Content-Type manual)
  upload: (url, formData, method = 'PUT') =>
    request(url, {
      method,
      body: formData,
    }),
};

export default api;
