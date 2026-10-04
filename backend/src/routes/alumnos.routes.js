import { Router } from 'express';
import { pool } from '../config/db.js';
import { verificarToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { alumnoSchema } from '../validators/entidades.schema.js';

const router = Router();

// Todas las rutas CRUD de alumnos están protegidas por autenticación
router.use(verificarToken);

// 1. GET /api/alumnos - Listar todos los alumnos con el código de su grupo asignado
router.get('/', async (req, res, next) => {
  try {
    const [alumnos] = await pool.query(
      `SELECT a.id, a.matricula, a.nombre, a.apellidos, a.correo,
              a.grupo_id, g.codigo AS grupo_codigo,
              DATE_FORMAT(a.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
              a.created_at
       FROM alumnos a
       LEFT JOIN grupos g ON a.grupo_id = g.id
       ORDER BY a.id ASC`
    );
    return res.json({ ok: true, datos: alumnos });
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/alumnos/:id - Obtener un alumno específico
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [filas] = await pool.query(
      `SELECT a.id, a.matricula, a.nombre, a.apellidos, a.correo,
              a.grupo_id, g.codigo AS grupo_codigo,
              DATE_FORMAT(a.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
              a.created_at
       FROM alumnos a
       LEFT JOIN grupos g ON a.grupo_id = g.id
       WHERE a.id = ?`,
      [id]
    );
    if (filas.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Alumno no encontrado.' });
    }
    return res.json({ ok: true, dato: filas[0] });
  } catch (error) {
    next(error);
  }
});

// 3. POST /api/alumnos - Registrar nuevo alumno
router.post('/', validate(alumnoSchema), async (req, res, next) => {
  try {
    const { matricula, nombre, apellidos, correo, grupo_id, fecha_nacimiento } = req.body;
    const [resultado] = await pool.query(
      `INSERT INTO alumnos (matricula, nombre, apellidos, correo, grupo_id, fecha_nacimiento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [matricula, nombre, apellidos, correo, grupo_id || null, fecha_nacimiento || null]
    );
    return res.status(201).json({
      ok: true,
      mensaje: 'Alumno registrado exitosamente.',
      id: resultado.insertId,
    });
  } catch (error) {
    next(error);
  }
});

// 4. PUT /api/alumnos/:id - Actualizar datos del alumno
router.put('/:id', validate(alumnoSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { matricula, nombre, apellidos, correo, grupo_id, fecha_nacimiento } = req.body;
    const [resultado] = await pool.query(
      `UPDATE alumnos
       SET matricula = ?, nombre = ?, apellidos = ?, correo = ?, grupo_id = ?, fecha_nacimiento = ?
       WHERE id = ?`,
      [matricula, nombre, apellidos, correo, grupo_id || null, fecha_nacimiento || null, id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Alumno no encontrado.' });
    }
    return res.json({ ok: true, mensaje: 'Alumno actualizado exitosamente.' });
  } catch (error) {
    next(error);
  }
});

// 5. DELETE /api/alumnos/:id - Eliminar alumno
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [resultado] = await pool.query('DELETE FROM alumnos WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Alumno no encontrado.' });
    }
    return res.json({ ok: true, mensaje: 'Alumno eliminado exitosamente.' });
  } catch (error) {
    next(error);
  }
});

export default router;
