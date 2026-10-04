import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { pool } from '../config/db.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { verificarToken } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// ==============================================================
// 1. POST /api/auth/login
// Inicio de sesión con rate limit, JWT en cookie httpOnly y bloqueo por intentos fallidos
// ==============================================================
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { usuario, password } = req.body;

    // Consulta parametrizada para buscar al usuario por su nombre de usuario
    const [filas] = await pool.query(
      `SELECT id, nombre, usuario, correo, password_hash, rol, foto_perfil, intentos_fallidos, bloqueado_hasta
       FROM usuarios
       WHERE usuario = ?`,
      [usuario]
    );

    // Si el usuario no existe, devolvemos error genérico (no revelamos si el usuario existe o no)
    if (filas.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Credenciales inválidas.',
      });
    }

    const usuarioDb = filas[0];

    // Verificar si la cuenta está actualmente bloqueada por fuerza bruta
    if (usuarioDb.bloqueado_hasta && new Date(usuarioDb.bloqueado_hasta) > new Date()) {
      const tiempoRestanteMin = Math.ceil(
        (new Date(usuarioDb.bloqueado_hasta).getTime() - Date.now()) / (1000 * 60)
      );
      return res.status(403).json({
        ok: false,
        mensaje: `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta nuevamente en aproximadamente ${tiempoRestanteMin} minuto(s).`,
      });
    }

    // Comparar la contraseña en texto plano contra el hash bcrypt
    const passwordCorrecto = await bcrypt.compare(password, usuarioDb.password_hash);

    if (!passwordCorrecto) {
      const nuevosIntentos = usuarioDb.intentos_fallidos + 1;

      // Si alcanza 5 intentos fallidos, bloqueamos la cuenta por 15 minutos
      if (nuevosIntentos >= 5) {
        const fechaBloqueo = new Date(Date.now() + 15 * 60 * 1000);
        await pool.query(
          `UPDATE usuarios
           SET intentos_fallidos = ?, bloqueado_hasta = ?
           WHERE id = ?`,
          [nuevosIntentos, fechaBloqueo, usuarioDb.id]
        );

        return res.status(403).json({
          ok: false,
          mensaje: 'Has alcanzado el límite de 5 intentos fallidos. Tu cuenta ha sido bloqueada temporalmente durante 15 minutos.',
        });
      }

      // Si no alcanza los 5 intentos, registramos el fallo y devolvemos mensaje genérico
      await pool.query(
        `UPDATE usuarios
         SET intentos_fallidos = ?
         WHERE id = ?`,
        [nuevosIntentos, usuarioDb.id]
      );

      return res.status(401).json({
        ok: false,
        mensaje: 'Credenciales inválidas.',
      });
    }

    // Contraseña correcta: reestablecemos contadores de bloqueo
    await pool.query(
      `UPDATE usuarios
       SET intentos_fallidos = 0, bloqueado_hasta = NULL
       WHERE id = ?`,
      [usuarioDb.id]
    );

    // Generar JSON Web Token firmado
    const payload = {
      id: usuarioDb.id,
      usuario: usuarioDb.usuario,
      rol: usuarioDb.rol,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    // Almacenar el JWT de manera segura en cookie httpOnly
    res.cookie('token', token, {
      httpOnly: true, // Inaccesible desde JavaScript en el navegador (protección contra XSS)
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict', // Solo se envía en peticiones del mismo sitio (protección contra CSRF)
      maxAge: 8 * 60 * 60 * 1000, // 8 horas de vigencia
    });

    return res.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso.',
      usuario: {
        id: usuarioDb.id,
        nombre: usuarioDb.nombre,
        usuario: usuarioDb.usuario,
        correo: usuarioDb.correo,
        rol: usuarioDb.rol,
        foto_perfil: usuarioDb.foto_perfil,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==============================================================
// 2. POST /api/auth/logout
// Cierre de sesión y revocación/limpieza de la cookie de autenticación
// ==============================================================
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.json({
    ok: true,
    mensaje: 'Sesión cerrada exitosamente.',
  });
});

// ==============================================================
// 3. GET /api/auth/me
// Obtener el perfil y datos del usuario actualmente autenticado
// ==============================================================
router.get('/me', verificarToken, (req, res) => {
  return res.json({
    ok: true,
    usuario: req.usuario,
  });
});

// ==============================================================
// 4. PUT /api/auth/me/password
// Cambio de contraseña para el usuario autenticado
// ==============================================================
router.put('/me/password', verificarToken, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { passwordActual, nuevoPassword } = req.body;

    // Obtener el hash actual del usuario desde la base de datos
    const [filas] = await pool.query(
      'SELECT password_hash FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );

    if (filas.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Usuario no encontrado.',
      });
    }

    const { password_hash } = filas[0];

    // Verificar que la contraseña actual ingresada sea correcta
    const coincide = await bcrypt.compare(passwordActual, password_hash);
    if (!coincide) {
      return res.status(400).json({
        ok: false,
        mensaje: 'La contraseña actual ingresada es incorrecta.',
      });
    }

    // Hashear la nueva contraseña con factor de coste 10
    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(nuevoPassword, salt);

    // Actualizar en MariaDB
    await pool.query(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [nuevoHash, req.usuario.id]
    );

    return res.json({
      ok: true,
      mensaje: 'Contraseña actualizada exitosamente.',
    });
  } catch (error) {
    next(error);
  }
});

// ==============================================================
// 5. PUT /api/auth/me/foto
// Subida y actualización de la fotografía de perfil del usuario
// ==============================================================
router.put('/me/foto', verificarToken, uploadAvatar.single('foto'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No se envió ningún archivo de imagen.',
      });
    }

    // Ruta relativa accesible vía HTTP a través del proxy y de static()
    const nuevaFotoUrl = `/uploads/${req.file.filename}`;

    // Obtener la foto previa para eliminarla y no acumular archivos huérfanos
    const [filas] = await pool.query(
      'SELECT foto_perfil FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );

    if (filas.length > 0 && filas[0].foto_perfil) {
      const fotoAnterior = filas[0].foto_perfil.replace(/^\/uploads\//, '');
      const rutaAnterior = path.resolve(__dirname, '../../uploads', fotoAnterior);
      if (fs.existsSync(rutaAnterior)) {
        try {
          fs.unlinkSync(rutaAnterior);
        } catch (e) {
          console.warn('[AVATAR]: No se pudo borrar el archivo anterior:', e.message);
        }
      }
    }

    // Actualizar la foto en la base de datos
    await pool.query(
      'UPDATE usuarios SET foto_perfil = ? WHERE id = ?',
      [nuevaFotoUrl, req.usuario.id]
    );

    return res.json({
      ok: true,
      mensaje: 'Foto de perfil actualizada exitosamente.',
      foto_perfil: nuevaFotoUrl,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
