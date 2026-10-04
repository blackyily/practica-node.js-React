import app from './app.js';
import { pool, testConnection } from './config/db.js';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  console.log('----------------------------------------------------');
  console.log('Iniciando Sistema Escolar API...');
  console.log('Verificando conexión con MariaDB (usuario lab_app)...');

  // 1. Probar conectividad con la base de datos antes de abrir el puerto
  const dbStatus = await testConnection();

  if (!dbStatus.ok) {
    console.error('❌ Error crítico: No se pudo conectar a MariaDB:');
    console.error(dbStatus.error);
    console.error('Verifica que el contenedor de MariaDB esté corriendo y las credenciales en .env sean correctas.');
    process.exit(1);
  }

  console.log(`✅ Conexión a MariaDB exitosa.`);
  console.log(`   Usuario conectado: ${dbStatus.usuario}`);
  console.log(`   Base de datos: ${process.env.DB_NAME || 'lab_escolar'}`);

  // 2. Iniciar servidor HTTP
  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor Express escuchando en http://localhost:${PORT}`);
    console.log(`   Diagnóstico disponible en: http://localhost:${PORT}/api/health`);
    console.log('----------------------------------------------------');
  });

  // 3. Manejo de señales de apagado limpio (Graceful Shutdown)
  const shutdown = async (signal) => {
    console.log(`\nRecibida señal ${signal}. Cerrando servidor y conexiones de base de datos...`);
    server.close(async () => {
      await pool.end();
      console.log('Conexiones a MariaDB cerradas. Proceso finalizado con éxito.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer();
