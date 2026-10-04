import { Router } from 'express';
import { pool } from '../config/db.js';
import { verificarToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { maestroSchema } from '../validators/entidades.schema.js';

const router = Router();

// Todas las rutas CRUD de maestros están protegidas por autenticación
router.use(verificarToken);

// 1. GET /api/maestros - Listar todos los maestros
router.get('/', async (req, res, next) => {
  try {
    const [maestros] = await pool.query(
      `SELECT id, numero_empleado, nombre, apellidos, correo, telefono, especialidad, created_at
       FROM maestros
       ORDER BY id ASC`
    );
    return res.json({ ok: true, datos: maestros });
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/maestros/:id - Obtener un maestro específico
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [filas] = await pool.query(
      `SELECT id, numero_empleado, nombre, apellidos, correo, telefono, especialidad, created_at
       FROM maestros
       WHERE id = ?`,
      [id]
    );
    if (filas.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Maestro no encontrado.' });
    }
    return res.json({ ok: true, dato: filas[0] });
  } catch (error) {
    next(error);
  }
});

// 3. POST /api/maestros - Crear nuevo maestro
router.post('/', validate(maestroSchema), async (req, res, next) => {
  try {
    const { numero_empleado, nombre, apellidos, correo, telefono, especialidad } = req.body;
    const [resultado] = await pool.query(
      `INSERT INTO maestros (numero_empleado, nombre, apellidos, correo, telefono, especialidad)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [numero_empleado, nombre, apellidos, correo, telefono || null, especialidad]
    );
    return res.status(201).json({
      ok: true,
      mensaje: 'Maestro registrado exitosamente.',
      id: resultado.insertId,
    });
  } catch (error) {
    next(error);
  }
});

// 4. PUT /api/maestros/:id - Actualizar maestro
router.put('/:id', validate(maestroSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { numero_empleado, nombre, apellidos, correo, telefono, especialidad } = req.body;
    const [resultado] = await pool.query(
      `UPDATE maestros
       SET numero_empleado = ?, nombre = ?, apellidos = ?, correo = ?, telefono = ?, especialidad = ?
       WHERE id = ?`,
      [numero_empleado, nombre, apellidos, correo, telefono || null, especialidad, id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Maestro no encontrado.' });
    }
    return res.json({ ok: true, mensaje: 'Maestro actualizado exitosamente.' });
  } catch (error) {
    next(error);
  }
});

// 5. DELETE /api/maestros/:id - Eliminar maestro
// Si el maestro está asignado a un grupo, MariaDB lanzará error de FK (ON DELETE RESTRICT)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [resultado] = await pool.query('DELETE FROM maestros WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Maestro no encontrado.' });
    }
    return res.json({ ok: true, mensaje: 'Maestro eliminado exitosamente.' });
  } catch (error) {
    next(error);
  }
});

export default router;
