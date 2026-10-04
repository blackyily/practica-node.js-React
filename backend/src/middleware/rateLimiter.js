import rateLimit from 'express-rate-limit';

// Limitador general para toda la API (evita abusos y denegación de servicio DoS)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 300, // Máximo 300 peticiones por IP en la ventana
  standardHeaders: true, // Devuelve cabeceras RateLimit-* estándar
  legacyHeaders: false, // Deshabilita cabeceras X-RateLimit-* obsoletas
  message: {
    ok: false,
    mensaje: 'Demasiadas solicitudes desde esta dirección IP. Por favor intenta más tarde.',
  },
});

// Limitador estricto para rutas de autenticación (Login)
// Protege activamente contra ataques de fuerza bruta en contraseñas
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 10, // Máximo 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    mensaje: 'Demasiados intentos de autenticación. Por seguridad, espera 15 minutos antes de volver a intentar.',
  },
});
