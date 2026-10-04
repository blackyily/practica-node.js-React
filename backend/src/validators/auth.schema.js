import { z } from 'zod';

// Esquema de validación para el inicio de sesión
export const loginSchema = z.object({
  usuario: z
    .string({ required_error: 'El nombre de usuario es obligatorio.' })
    .trim()
    .min(3, 'El usuario debe tener al menos 3 caracteres.')
    .max(50, 'El usuario no puede exceder 50 caracteres.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(4, 'La contraseña debe tener al menos 4 caracteres.'),
});

// Esquema de validación para cambio de contraseña
export const changePasswordSchema = z.object({
  passwordActual: z
    .string({ required_error: 'La contraseña actual es obligatoria.' })
    .min(1, 'Debes ingresar tu contraseña actual.'),
  nuevoPassword: z
    .string({ required_error: 'La nueva contraseña es obligatoria.' })
    .min(6, 'La nueva contraseña debe tener al menos 6 caracteres.')
    .max(100, 'La nueva contraseña no puede exceder 100 caracteres.')
    .regex(/[A-Z]/, 'La nueva contraseña debe contener al menos una letra mayúscula.')
    .regex(/[0-9]/, 'La nueva contraseña debe contener al menos un número.'),
});
