import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

// Middleware para verificar la validez del JWT en la cookie httpOnly y la existencia del usuario
export async function verificarToken(req, res, next) {
  try {
    // 1. Extraer el token de la cookie httpOnly (o Authorization Bearer en pruebas)
    const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: 'No autenticado. Por favor inicia sesión.',
      });
    }

    // 2. Verificar la firma del JWT con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Verificación activa en la base de datos (seguridad contra usuarios eliminados o modificados)
    const [filas] = await pool.query(
      `SELECT id, nombre, usuario, correo, rol, foto_perfil, bloqueado_hasta
       FROM usuarios
       WHERE id = ?`,
      [decoded.id]
    );

    if (filas.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Sesión inválida. El usuario ya no existe en el sistema.',
      });
    }

    const usuarioDb = filas[0];

    // 4. Verificar si la cuenta fue bloqueada posteriormente
    if (usuarioDb.bloqueado_hasta && new Date(usuarioDb.bloqueado_hasta) > new Date()) {
      return res.status(403).json({
        ok: false,
        mensaje: 'Esta cuenta se encuentra temporalmente bloqueada por seguridad.',
      });
    }

    // 5. Inyectar datos del usuario autenticado en la petición (sin incluir contraseña ni hashes)
    req.usuario = {
      id: usuarioDb.id,
      nombre: usuarioDb.nombre,
      usuario: usuarioDb.usuario,
      correo: usuarioDb.correo,
      rol: usuarioDb.rol,
      foto_perfil: usuarioDb.foto_perfil,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        mensaje: 'La sesión ha expirado. Por favor inicia sesión nuevamente.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        ok: false,
        mensaje: 'Token de sesión inválido.',
      });
    }
    next(error);
  }
}

// Middleware de autorización por rol (RBAC)
export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        mensaje: 'No autenticado.',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: 'Acceso denegado: no cuentas con los permisos necesarios para realizar esta acción.',
      });
    }

    next();
  };
}
