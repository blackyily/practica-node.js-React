import { z } from 'zod';

// ==============================================================
// Esquema de validación para MATERIAS
// ==============================================================
export const materiaSchema = z.object({
  clave: z
    .string({ required_error: 'La clave de la materia es obligatoria.' })
    .trim()
    .min(2, 'La clave debe tener al menos 2 caracteres.')
    .max(20, 'La clave no puede exceder 20 caracteres.')
    .transform((val) => val.toUpperCase()),
  nombre: z
    .string({ required_error: 'El nombre de la materia es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
  creditos: z
    .coerce
    .number({ required_error: 'Los créditos son obligatorios.' })
    .int('Los créditos deben ser un número entero.')
    .min(1, 'El mínimo de créditos es 1.')
    .max(50, 'El máximo de créditos es 50.'),
  descripcion: z
    .string()
    .trim()
    .max(500, 'La descripción no puede exceder 500 caracteres.')
    .optional()
    .nullable(),
});

// ==============================================================
// Esquema de validación para MAESTROS
// ==============================================================
export const maestroSchema = z.object({
  numero_empleado: z
    .string({ required_error: 'El número de empleado es obligatorio.' })
    .trim()
    .min(2, 'El número de empleado debe tener al menos 2 caracteres.')
    .max(20, 'El número de empleado no puede exceder 20 caracteres.'),
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
  apellidos: z
    .string({ required_error: 'Los apellidos son obligatorios.' })
    .trim()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres.')
    .max(100, 'Los apellidos no pueden exceder 100 caracteres.'),
  correo: z
    .string({ required_error: 'El correo electrónico es obligatorio.' })
    .trim()
    .email('Formato de correo electrónico inválido.')
    .max(100, 'El correo no puede exceder 100 caracteres.'),
  telefono: z
    .string()
    .trim()
    .max(20, 'El teléfono no puede exceder 20 caracteres.')
    .optional()
    .nullable(),
  especialidad: z
    .string({ required_error: 'La especialidad es obligatoria.' })
    .trim()
    .min(2, 'La especialidad debe tener al menos 2 caracteres.')
    .max(100, 'La especialidad no puede exceder 100 caracteres.'),
});

// ==============================================================
// Esquema de validación para GRUPOS
// ==============================================================
export const grupoSchema = z.object({
  codigo: z
    .string({ required_error: 'El código del grupo es obligatorio.' })
    .trim()
    .min(2, 'El código debe tener al menos 2 caracteres.')
    .max(20, 'El código no puede exceder 20 caracteres.')
    .transform((val) => val.toUpperCase()),
  materia_id: z
    .coerce
    .number({ required_error: 'La materia es obligatoria.' })
    .int('Identificador de materia inválido.')
    .positive('Debe seleccionar una materia válida.'),
  maestro_id: z
    .coerce
    .number({ required_error: 'El maestro es obligatorio.' })
    .int('Identificador de maestro inválido.')
    .positive('Debe seleccionar un maestro válido.'),
  semestre: z
    .string({ required_error: 'El semestre es obligatorio.' })
    .trim()
    .min(1, 'El semestre es obligatorio.')
    .max(20, 'El semestre no puede exceder 20 caracteres.'),
  horario: z
    .string({ required_error: 'El horario es obligatorio.' })
    .trim()
    .min(1, 'El horario es obligatorio.')
    .max(50, 'El horario no puede exceder 50 caracteres.'),
  aula: z
    .string({ required_error: 'El aula es obligatoria.' })
    .trim()
    .min(1, 'El aula es obligatoria.')
    .max(50, 'El aula no puede exceder 50 caracteres.'),
});

// ==============================================================
// Esquema de validación para ALUMNOS
// ==============================================================
export const alumnoSchema = z.object({
  matricula: z
    .string({ required_error: 'La matrícula es obligatoria.' })
    .trim()
    .min(2, 'La matrícula debe tener al menos 2 caracteres.')
    .max(20, 'La matrícula no puede exceder 20 caracteres.')
    .transform((val) => val.toUpperCase()),
  nombre: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
  apellidos: z
    .string({ required_error: 'Los apellidos son obligatorios.' })
    .trim()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres.')
    .max(100, 'Los apellidos no pueden exceder 100 caracteres.'),
  correo: z
    .string({ required_error: 'El correo electrónico es obligatorio.' })
    .trim()
    .email('Formato de correo electrónico inválido.')
    .max(100, 'El correo no puede exceder 100 caracteres.'),
  grupo_id: z
    .coerce
    .number()
    .int('Identificador de grupo inválido.')
    .positive()
    .optional()
    .nullable()
    .transform((val) => (val ? Number(val) : null)),
  fecha_nacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento debe tener formato AAAA-MM-DD.')
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? val : null)),
});
