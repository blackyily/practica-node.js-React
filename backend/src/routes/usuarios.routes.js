import { Router } from 'express';
import bcrypt from 'bcryptjs';

import { pool } from '../config/db.js';
import { verificarToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { crearUsuarioSchema, actualizarUsuarioSchema } from '../validators/usuarios.schema.js';

const router = Router();

// Todas las rutas de administración de usuarios requieren autenticación y rol 'admin'
router.use(verificarToken, requireRole('admin'));

// ==============================================================
// 1. GET /api/usuarios
// Listado de todos los usuarios registrados (sin exponer hashes)
// ==============================================================
router.get('/', async (req, res, next) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT id, nombre, usuario, correo, rol, foto_perfil, intentos_fallidos, bloqueado_hasta, created_at
       FROM usuarios
       ORDER BY id ASC`
    );

    return res.json({
      ok: true,
      datos: usuarios,
    });
  } catch (error) {
    next(error);
  }
});

// ==============================================================
// 2. POST /api/usuarios
// Crear nuevo usuario (Protección contra escalamiento de privilegios)
// SIEMPRE se asigna rol 'usuario', ignorando cualquier intento de enviar 'admin'
// ==============================================================
router.post('/', validate(crearUsuarioSchema), async (req, res, next) => {
  try {
    const { nombre, usuario, correo, password } = req.body;

    // Regla de seguridad mandatoria del laboratorio:
    // Los usuarios creados desde la API SIEMPRE tienen rol 'usuario'
    const rolSeguro = 'usuario';

    // Cifrado seguro de contraseña con bcrypt
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Consulta SQL parametrizada
    const [resultado] = await pool.query(
      `INSERT INTO usuarios (nombre, usuario, correo, password_hash, rol)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, usuario, correo, hash, rolSeguro]
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado exitosamente con rol de usuario.',
      usuario: {
        id: resultado.insertId,
        nombre,
        usuario,
        correo,
        rol: rolSeguro,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==============================================================
// 3. PUT /api/usuarios/:id
// Actualizar información de un usuario
// ==============================================================
router.put('/:id', validate(actualizarUsuarioSchema), async (req, res, next) => {
  try {
    const usuarioId = Number(req.params.id);
    if (isNaN(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Identificador de usuario inválido.',
      });
    }

    const { nombre, correo, password, desbloquear } = req.body;

    // Verificar que el usuario exista
    const [filas] = await pool.query('SELECT id, rol FROM usuarios WHERE id = ?', [usuarioId]);
    if (filas.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'El usuario no existe.',
      });
    }

    // Construcción dinámica y parametrizada de campos permitidos
    const updates = [];
    const params = [];

    if (nombre) {
      updates.push('nombre = ?');
      params.push(nombre);
    }
    if (correo) {
      updates.push('correo = ?');
      params.push(correo);
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      updates.push('password_hash = ?');
      params.push(hash);
    }
    if (desbloquear) {
      updates.push('intentos_fallidos = 0, bloqueado_hasta = NULL');
    }

    if (updates.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No se enviaron datos para actualizar.',
      });
    }

    params.push(usuarioId);
    await pool.query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return res.json({
      ok: true,
      mensaje: 'Usuario actualizado exitosamente.',
    });
  } catch (error) {
    next(error);
  }
});

// ==============================================================
// 4. DELETE /api/usuarios/:id
// Eliminar un usuario
// Protegido por trigger en MariaDB para administradores
// ==============================================================
router.delete('/:id', async (req, res, next) => {
  try {
    const usuarioId = Number(req.params.id);
    if (isNaN(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Identificador de usuario inválido.',
      });
    }

    // 1. Evitar que el administrador autenticado se elimine a sí mismo
    if (usuarioId === req.usuario.id) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No puedes eliminar tu propia cuenta de usuario en sesión.',
      });
    }

    // 2. Ejecutar eliminación
    // Si el usuario objetivo tiene rol 'admin', el trigger MariaDB 'trg_prevent_admin_delete'
    // cancelará la consulta con SIGNAL SQLSTATE '45000'
    const [resultado] = await pool.query('DELETE FROM usuarios WHERE id = ?', [usuarioId]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'El usuario no fue encontrado.',
      });
    }

    return res.json({
      ok: true,
      mensaje: 'Usuario eliminado exitosamente.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
