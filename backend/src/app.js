import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import materiasRoutes from './routes/materias.routes.js';
import maestrosRoutes from './routes/maestros.routes.js';
import gruposRoutes from './routes/grupos.routes.js';
import alumnosRoutes from './routes/alumnos.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Seguridad HTTP con Helmet (oculta X-Powered-By, añade CSP, X-Content-Type-Options, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permite servir imágenes a través del proxy de Vite
}));

// 2. Parseo de Cookies (requerido para leer JWT en cookie httpOnly)
app.use(cookieParser());

// 3. Parseo del cuerpo de peticiones JSON y formularios urlencoded
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Servir archivos estáticos subidos (fotos de perfil)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 5. Aplicar Rate Limit general a las rutas de la API
app.use('/api', generalLimiter);

// 6. Endpoint de diagnóstico y salud del sistema
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'API del Sistema Escolar operativa',
    entorno: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// 7. Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/maestros', maestrosRoutes);
app.use('/api/grupos', gruposRoutes);
app.use('/api/alumnos', alumnosRoutes);

// 8. Manejador para rutas de API no encontradas (404)
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      ok: false,
      mensaje: `Ruta ${req.originalUrl} no encontrada en el servidor.`,
    });
  }
  next();
});

// 9. Middleware centralizado de manejo de errores
app.use(errorHandler);

export default app;
