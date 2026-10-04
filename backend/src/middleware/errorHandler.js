import { ZodError } from 'zod';

// Middleware centralizado de manejo de errores
// Previene fuga de información interna (como stack traces o detalles crudos de SQL)
export function errorHandler(err, req, res, next) {
  // Registro en consola del servidor (para debugging del desarrollador)
  console.error('[ERROR HANDLER]:', {
    mensaje: err.message,
    codigo: err.code,
    sqlState: err.sqlState,
    ruta: req.originalUrl,
    metodo: req.method,
  });

  // 1. Errores de validación de esquemas Zod (compatible con Zod v3 y Zod v4)
  if (err instanceof ZodError) {
    const listaIssues = err.issues || err.errors || [];
    const detalles = listaIssues.map((e) => ({
      campo: Array.isArray(e.path) ? e.path.join('.') : '',
      mensaje: e.message,
    }));
    return res.status(400).json({
      ok: false,
      mensaje: 'Error de validación en los datos enviados.',
      errores: detalles,
    });
  }

  // 2. Errores de MariaDB / Triggers personalizados (SQLSTATE 45000)
  if (err.sqlState === '45000') {
    return res.status(400).json({
      ok: false,
      mensaje: err.sqlMessage || 'Violación de regla de integridad en la base de datos.',
    });
  }

  // 3. Error de duplicidad en MariaDB (ER_DUP_ENTRY - Código 1062)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      ok: false,
      mensaje: 'Ya existe un registro con esos datos únicos (usuario, correo, matrícula o clave duplicada).',
    });
  }

  // 4. Error de llave foránea referenciada al intentar eliminar (ER_ROW_IS_REFERENCED_2 - Código 1451)
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      ok: false,
      mensaje: 'No se puede eliminar el registro porque tiene otros datos asociados (integridad referencial).',
    });
  }

  // 5. Error de llave foránea no encontrada al insertar/actualizar (ER_NO_REFERENCED_ROW_2 - Código 1452)
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      ok: false,
      mensaje: 'El registro relacionado (materia, maestro o grupo) no existe.',
    });
  }

  // 6. Error de tamaño o tipo de archivo en Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      ok: false,
      mensaje: 'El archivo excede el tamaño máximo permitido (2 MB).',
    });
  }

  if (err.message && err.message.includes('Formato de archivo no permitido')) {
    return res.status(400).json({
      ok: false,
      mensaje: err.message,
    });
  }

  // 7. Errores con código de estado HTTP explícito
  const statusCode = err.status || err.statusCode || (err.status >= 400 && err.status < 600 ? err.status : 500);
  const safeMessage = statusCode === 500
    ? 'Ocurrió un error interno en el servidor. Por favor intente más tarde.'
    : err.message;

  return res.status(statusCode).json({
    ok: false,
    mensaje: safeMessage,
  });
}
