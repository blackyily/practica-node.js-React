import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

// Administradores iniciales obligatorios por el laboratorio
const ADMINS_INICIALES = [
  {
    nombre: 'Administrador Principal',
    usuario: 'Admin',
    correo: 'admin@escolar.edu',
    passwordPlano: 'Admin123!',
    rol: 'admin',
  },
  {
    nombre: 'Super Administrador Root',
    usuario: 'Root',
    correo: 'root@escolar.edu',
    passwordPlano: 'Root123!',
    rol: 'admin',
  },
];

async function seed() {
  console.log('==================================================');
  console.log('Iniciando proceso de SEED (Administradores Iniciales)...');

  try {
    for (const adm of ADMINS_INICIALES) {
      // 1. Verificar si el usuario ya existe para garantizar idempotencia
      const [filasExistentes] = await pool.query(
        'SELECT id, usuario, correo, rol FROM usuarios WHERE usuario = ? OR correo = ?',
        [adm.usuario, adm.correo]
      );

      if (filasExistentes.length > 0) {
        console.log(`ℹ️  El usuario '${adm.usuario}' ya existe en la base de datos. Se omite para evitar duplicados.`);
        continue;
      }

      // 2. Cifrado seguro de contraseña con bcrypt (cost factor = 10)
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adm.passwordPlano, salt);

      // 3. Inserción con consulta parametrizada protegida contra inyección SQL
      await pool.query(
        `INSERT INTO usuarios (nombre, usuario, correo, password_hash, rol)
         VALUES (?, ?, ?, ?, ?)`,
        [adm.nombre, adm.usuario, adm.correo, hash, adm.rol]
      );

      console.log(`✅ Administrador '${adm.usuario}' creado exitosamente.`);
      console.log(`   Usuario: ${adm.usuario}`);
      console.log(`   Correo: ${adm.correo}`);
      console.log(`   Contraseña inicial: ${adm.passwordPlano}`);
    }

    console.log('--------------------------------------------------');
    console.log('Proceso de SEED finalizado con éxito.');
    console.log('==================================================');
  } catch (error) {
    console.error('❌ Error durante la ejecución del seed:', error.message);
    process.exit(1);
  } finally {
    // Cerrar el pool para que el script termine limpiamente
    await pool.end();
  }
}

seed();
