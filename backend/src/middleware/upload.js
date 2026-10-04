import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio seguro de destino
const uploadDir = path.resolve(__dirname, '../../uploads');

// Configuración de almacenamiento en disco con nombres aleatorios y seguros
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar prefijo aleatorio criptográfico para evitar colisiones y path traversal
    const randomHex = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `avatar-${req.usuario?.id || 'anon'}-${Date.now()}-${randomHex}${ext}`;
    cb(null, filename);
  },
});

// Filtro estricto de tipos de archivo (solo imágenes rasterizadas seguras)
// Rechaza explícitamente SVG (riesgo XSS), ejecutables y scripts
const fileFilter = (req, file, cb) => {
  const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.webp'];
  const mimetypesPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  const esExtensionValida = extensionesPermitidas.includes(ext);
  const esMimetypeValido = mimetypesPermitidos.includes(file.mimetype);

  if (esExtensionValida && esMimetypeValido) {
    cb(null, true);
  } else {
    const error = new Error('Formato de archivo no permitido. Solo se aceptan imágenes JPG, PNG o WEBP.');
    error.status = 400;
    cb(error);
  }
};

// Exportar middleware de Multer con límite de 2 MB
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 Megabytes
    files: 1, // Solo un archivo por petición
  },
});
