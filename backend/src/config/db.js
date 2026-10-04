import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validación de variables críticas de conexión
const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    console.warn(`[ADVERTENCIA] Variable de entorno ${envVar} no está definida en .env`);
  }
}

// Configuración del Pool de conexiones MariaDB
// Usamos exclusivamente el usuario con mínimos privilegios 'lab_app'
export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'lab_app',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'lab_escolar',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Función de verificación de conectividad
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS resultado, CURRENT_USER() AS usuario_actual');
    connection.release();
    return {
      ok: true,
      usuario: rows[0].usuario_actual,
      resultado: rows[0].resultado,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

export default pool;
