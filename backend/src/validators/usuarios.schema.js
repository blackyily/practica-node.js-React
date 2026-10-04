import { z } from 'zod';

// Esquema para creación de usuarios (exclusivo para administradores)
// Nota de seguridad: No se permite definir el campo 'rol' desde el cliente.
// Siempre se forzará al rol 'usuario' en el controlador para evitar escalamiento de privilegios.
export const crearUsuarioSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre completo es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.'),
  usuario: z
    .string({ required_error: 'El nombre de usuario es obligatorio.' })
    .trim()
    .min(3, 'El usuario debe tener al menos 3 caracteres.')
    .max(50, 'El usuario no puede exceder 50 caracteres.')
    .regex(/^[a-zA-Z0-9_]+$/, 'El usuario solo puede contener letras, números y guiones bajos.'),
  correo: z
    .string({ required_error: 'El correo electrónico es obligatorio.' })
    .trim()
    .email('El formato del correo electrónico no es válido.')
    .max(100, 'El correo no puede exceder 100 caracteres.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .max(100, 'La contraseña no puede exceder 100 caracteres.'),
});

// Esquema para actualización de usuario
export const actualizarUsuarioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.')
    .optional(),
  correo: z
    .string()
    .trim()
    .email('El formato del correo no es válido.')
    .max(100, 'El correo no puede exceder 100 caracteres.')
    .optional(),
  password: z
    .string()
    .min(6, 'La nueva contraseña debe tener al menos 6 caracteres.')
    .max(100, 'La contraseña no puede exceder 100 caracteres.')
    .optional(),
  desbloquear: z
    .boolean()
    .optional(),
});
