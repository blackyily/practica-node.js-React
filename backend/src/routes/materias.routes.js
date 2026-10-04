import { Router } from 'express';
import { pool } from '../config/db.js';
import { verificarToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { materiaSchema } from '../validators/entidades.schema.js';

const router = Router();

// Todas las rutas CRUD de materias están protegidas por autenticación
router.use(verificarToken);

// 1. GET /api/materias - Listar todas las materias
router.get('/', async (req, res, next) => {
  try {
    const [materias] = await pool.query(
      'SELECT id, clave, nombre, creditos, descripcion, created_at FROM materias ORDER BY id ASC'
    );
    return res.json({ ok: true, datos: materias });
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/materias/:id - Obtener una materia específica
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [filas] = await pool.query(
      'SELECT id, clave, nombre, creditos, descripcion, created_at FROM materias WHERE id = ?',
      [id]
    );
    if (filas.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Materia no encontrada.' });
    }
    return res.json({ ok: true, dato: filas[0] });
  } catch (error) {
    next(error);
  }
});

// 3. POST /api/materias - Crear una nueva materia
router.post('/', validate(materiaSchema), async (req, res, next) => {
  try {
    const { clave, nombre, creditos, descripcion } = req.body;
    const [resultado] = await pool.query(
      'INSERT INTO materias (clave, nombre, creditos, descripcion) VALUES (?, ?, ?, ?)',
      [clave, nombre, creditos, descripcion || null]
    );
    return res.status(201).json({
      ok: true,
      mensaje: 'Materia creada exitosamente.',
      id: resultado.insertId,
    });
  } catch (error) {
    next(error);
  }
});

// 4. PUT /api/materias/:id - Actualizar materia
router.put('/:id', validate(materiaSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { clave, nombre, creditos, descripcion } = req.body;
    const [resultado] = await pool.query(
      'UPDATE materias SET clave = ?, nombre = ?, creditos = ?, descripcion = ? WHERE id = ?',
      [clave, nombre, creditos, descripcion || null, id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Materia no encontrada.' });
    }
    return res.json({ ok: true, mensaje: 'Materia actualizada exitosamente.' });
  } catch (error) {
    next(error);
  }
});

// 5. DELETE /api/materias/:id - Eliminar materia
// Si la materia está asignada a un grupo, MariaDB lanzará error de FK (ON DELETE RESTRICT)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [resultado] = await pool.query('DELETE FROM materias WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Materia no encontrada.' });
    }
    return res.json({ ok: true, mensaje: 'Materia eliminada exitosamente.' });
  } catch (error) {
    next(error);
  }
});

export default router;
