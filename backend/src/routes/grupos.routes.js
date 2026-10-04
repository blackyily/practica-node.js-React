import { Router } from 'express';
import { pool } from '../config/db.js';
import { verificarToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { grupoSchema } from '../validators/entidades.schema.js';

const router = Router();

// Todas las rutas CRUD de grupos están protegidas por autenticación
router.use(verificarToken);

// 1. GET /api/grupos - Listar todos los grupos con datos de su materia y maestro
router.get('/', async (req, res, next) => {
  try {
    const [grupos] = await pool.query(
      `SELECT g.id, g.codigo, g.materia_id, m.nombre AS materia_nombre,
              g.maestro_id, CONCAT(ma.nombre, ' ', ma.apellidos) AS maestro_nombre,
              g.semestre, g.horario, g.aula, g.created_at
       FROM grupos g
       INNER JOIN materias m ON g.materia_id = m.id
       INNER JOIN maestros ma ON g.maestro_id = ma.id
       ORDER BY g.id ASC`
    );
    return res.json({ ok: true, datos: grupos });
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/grupos/:id - Obtener un grupo específico
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [filas] = await pool.query(
      `SELECT g.id, g.codigo, g.materia_id, m.nombre AS materia_nombre,
              g.maestro_id, CONCAT(ma.nombre, ' ', ma.apellidos) AS maestro_nombre,
              g.semestre, g.horario, g.aula, g.created_at
       FROM grupos g
       INNER JOIN materias m ON g.materia_id = m.id
       INNER JOIN maestros ma ON g.maestro_id = ma.id
       WHERE g.id = ?`,
      [id]
    );
    if (filas.length === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Grupo no encontrado.' });
    }
    return res.json({ ok: true, dato: filas[0] });
  } catch (error) {
    next(error);
  }
});

// 3. POST /api/grupos - Crear nuevo grupo
router.post('/', validate(grupoSchema), async (req, res, next) => {
  try {
    const { codigo, materia_id, maestro_id, semestre, horario, aula } = req.body;
    const [resultado] = await pool.query(
      `INSERT INTO grupos (codigo, materia_id, maestro_id, semestre, horario, aula)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [codigo, materia_id, maestro_id, semestre, horario, aula]
    );
    return res.status(201).json({
      ok: true,
      mensaje: 'Grupo registrado exitosamente.',
      id: resultado.insertId,
    });
  } catch (error) {
    next(error);
  }
});

// 4. PUT /api/grupos/:id - Actualizar grupo
router.put('/:id', validate(grupoSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { codigo, materia_id, maestro_id, semestre, horario, aula } = req.body;
    const [resultado] = await pool.query(
      `UPDATE grupos
       SET codigo = ?, materia_id = ?, maestro_id = ?, semestre = ?, horario = ?, aula = ?
       WHERE id = ?`,
      [codigo, materia_id, maestro_id, semestre, horario, aula, id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Grupo no encontrado.' });
    }
    return res.json({ ok: true, mensaje: 'Grupo actualizado exitosamente.' });
  } catch (error) {
    next(error);
  }
});

// 5. DELETE /api/grupos/:id - Eliminar grupo
// Los alumnos asociados se desvinculan automáticamente a NULL (ON DELETE SET NULL)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [resultado] = await pool.query('DELETE FROM grupos WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ ok: false, mensaje: 'Grupo no encontrado.' });
    }
    return res.json({ ok: true, mensaje: 'Grupo eliminado exitosamente.' });
  } catch (error) {
    next(error);
  }
});

export default router;
