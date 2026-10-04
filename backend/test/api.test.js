import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { pool } from '../src/config/db.js';

let server;
let baseUrl;

// Variables de sesión para pruebas
let cookieAdmin = '';
let cookieUsuario = '';
let idUsuarioPrueba = null;
let idMateriaPrueba = null;
let idMaestroPrueba = null;
let idGrupoPrueba = null;
let idAlumnoPrueba = null;

before(async () => {
  // Iniciar servidor en puerto libre efímero para no chocar con el puerto 3000
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  // Limpieza final de datos de prueba si quedaron pendientes
  try {
    if (idAlumnoPrueba) await pool.query('DELETE FROM alumnos WHERE id = ?', [idAlumnoPrueba]);
    if (idGrupoPrueba) await pool.query('DELETE FROM grupos WHERE id = ?', [idGrupoPrueba]);
    if (idMateriaPrueba) await pool.query('DELETE FROM materias WHERE id = ?', [idMateriaPrueba]);
    if (idMaestroPrueba) await pool.query('DELETE FROM maestros WHERE id = ?', [idMaestroPrueba]);
    if (idUsuarioPrueba) await pool.query('DELETE FROM usuarios WHERE id = ?', [idUsuarioPrueba]);
  } catch (e) {
    // Ignorar si ya se eliminaron
  }

  // Cerrar servidor y pool de base de datos
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await pool.end();
});

// ==============================================================
// 1. Diagnóstico del Servidor
// ==============================================================
describe('1. Diagnóstico y Salud del Servidor', () => {
  it('GET /api/health debe responder 200 OK con estado operativo', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.ok, true);
    assert.match(data.mensaje, /operativa/i);
  });
});

// ==============================================================
// 2. Módulo de Autenticación
// ==============================================================
describe('2. Módulo de Autenticación (POST /login, GET /me, POST /logout)', () => {
  it('Login con contraseña incorrecta debe responder 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: 'Admin', password: 'ClaveTotalmenteIncorrecta!' }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.mensaje, 'Credenciales inválidas.');
  });

  it('Login exitoso con usuario Admin debe generar cookie httpOnly y responder 200', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: 'Admin', password: 'Admin123!' }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.usuario.usuario, 'Admin');
    assert.strictEqual(data.usuario.rol, 'admin');

    // Verificar cabecera Set-Cookie con httpOnly
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Debe incluir la cabecera Set-Cookie');
    assert.match(setCookie, /token=/i);
    assert.match(setCookie, /httponly/i);
    assert.match(setCookie, /samesite=strict/i);

    // Guardar cookie para las siguientes pruebas
    cookieAdmin = setCookie.split(';')[0];
  });

  it('GET /api/auth/me sin cookie debe responder 401 No autenticado', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    const data = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.ok, false);
  });

  it('GET /api/auth/me con cookie válida debe responder 200 con datos del usuario', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookieAdmin },
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.usuario.usuario, 'Admin');
    assert.strictEqual(data.usuario.rol, 'admin');
    assert.strictEqual(data.usuario.password_hash, undefined, 'No debe filtrar el hash de contraseña');
  });
});

// ==============================================================
// 3. Usuarios, Roles y Prevención de Escalamiento de Privilegios
// ==============================================================
describe('3. Administración de Usuarios y Seguridad de Roles (RBAC)', () => {
  it('GET /api/usuarios debe responder 200 para un Administrador', async () => {
    const res = await fetch(`${baseUrl}/api/usuarios`, {
      headers: { Cookie: cookieAdmin },
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.ok, true);
    assert.ok(Array.isArray(data.datos));
    assert.ok(data.datos.length >= 2, 'Deben existir al menos Admin y Root');
  });

  it('POST /api/usuarios forzando "rol": "admin" DEBE asignar rol "usuario" (No escalamiento)', async () => {
    const res = await fetch(`${baseUrl}/api/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieAdmin,
      },
      body: JSON.stringify({
        nombre: 'Usuario de Pruebas',
        usuario: 'user_test',
        correo: 'user_test@escolar.edu',
        password: 'Password123!',
        rol: 'admin', // Intento malicioso de escalamiento
      }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.ok, true);
    assert.strictEqual(data.usuario.rol, 'usuario', 'El servidor debe forzar rol "usuario"');
    idUsuarioPrueba = data.usuario.id;
  });

  it('Login con nuevo usuario debe permitir sesión con rol "usuario"', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: 'user_test', password: 'Password123!' }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.usuario.rol, 'usuario');
    cookieUsuario = res.headers.get('set-cookie').split(';')[0];
  });

  it('Usuario común intentando acceder a /api/usuarios debe recibir 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/usuarios`, {
      headers: { Cookie: cookieUsuario },
    });
    const data = await res.json();

    assert.strictEqual(res.status, 403);
    assert.strictEqual(data.ok, false);
    assert.match(data.mensaje, /permisos necesarios/i);
  });
});

// ==============================================================
// 4. Triggers de Seguridad en MariaDB
// ==============================================================
describe('4. Triggers de Integridad en MariaDB (Máx 2 admins y prohibido borrar admin)', () => {
  it('Trigger debe bloquear eliminación de un Administrador devolviendo error 400', async () => {
    // Intentar borrar a Root (id 2)
    const res = await fetch(`${baseUrl}/api/usuarios/2`, {
      method: 'DELETE',
      headers: { Cookie: cookieAdmin },
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.ok, false);
    assert.match(data.mensaje, /No está permitido eliminar usuarios con rol de administrador/i);
  });

  it('Intento de Admin de eliminarse a sí mismo debe ser rechazado', async () => {
    const res = await fetch(`${baseUrl}/api/usuarios/1`, {
      method: 'DELETE',
      headers: { Cookie: cookieAdmin },
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.match(data.mensaje, /No puedes eliminar tu propia cuenta/i);
  });
});

// ==============================================================
// 5. Operaciones CRUD y Llaves Foráneas (Materias, Maestros, Grupos, Alumnos)
// ==============================================================
describe('5. CRUD de Entidades Escolares e Integridad Referencial', () => {
  it('POST /api/materias debe crear una materia exitosamente', async () => {
    const res = await fetch(`${baseUrl}/api/materias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        clave: 'TEST-100',
        nombre: 'Programación Avanzada',
        creditos: 8,
        descripcion: 'Estructuras de datos y algoritmos',
      }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.ok, true);
    idMateriaPrueba = data.id;
  });

  it('POST /api/maestros debe registrar un maestro exitosamente', async () => {
    const res = await fetch(`${baseUrl}/api/maestros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        numero_empleado: 'DOC-999',
        nombre: 'Guillermo',
        apellidos: 'Vázquez Silva',
        correo: 'guillermo.vazquez@escolar.edu',
        telefono: '5544332211',
        especialidad: 'Inteligencia Artificial',
      }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.ok, true);
    idMaestroPrueba = data.id;
  });

  it('POST /api/grupos debe registrar un grupo vinculando materia y maestro', async () => {
    const res = await fetch(`${baseUrl}/api/grupos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        codigo: 'GRP-99',
        materia_id: idMateriaPrueba,
        maestro_id: idMaestroPrueba,
        semestre: '2026-2',
        horario: 'Mar-Jue 10:00-12:00',
        aula: 'Lab Redes',
      }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.ok, true);
    idGrupoPrueba = data.id;
  });

  it('POST /api/alumnos debe registrar un alumno asignado al grupo', async () => {
    const res = await fetch(`${baseUrl}/api/alumnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        matricula: 'ALU-9999',
        nombre: 'Sofía',
        apellidos: 'Mendoza Ruiz',
        correo: 'sofia.mendoza@alumno.edu',
        grupo_id: idGrupoPrueba,
        fecha_nacimiento: '2004-11-20',
      }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.ok, true);
    idAlumnoPrueba = data.id;
  });

  it('GET /api/grupos debe devolver datos con JOIN (materia_nombre y maestro_nombre)', async () => {
    const res = await fetch(`${baseUrl}/api/grupos`, {
      headers: { Cookie: cookieAdmin },
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    const grupo = data.datos.find((g) => g.id === idGrupoPrueba);
    assert.ok(grupo, 'El grupo creado debe figurar en la lista');
    assert.strictEqual(grupo.materia_nombre, 'Programación Avanzada');
    assert.match(grupo.maestro_nombre, /Guillermo Vázquez Silva/);
  });

  it('DELETE de Materia en uso debe fallar por FK (ON DELETE RESTRICT - 409 Conflict)', async () => {
    const res = await fetch(`${baseUrl}/api/materias/${idMateriaPrueba}`, {
      method: 'DELETE',
      headers: { Cookie: cookieAdmin },
    });
    const data = await res.json();

    assert.strictEqual(res.status, 409);
    assert.strictEqual(data.ok, false);
    assert.match(data.mensaje, /otros datos asociados/i);
  });

  it('DELETE de Grupo debe aplicar ON DELETE SET NULL en Alumno (el alumno no se elimina)', async () => {
    // 1. Eliminar el grupo
    const resGrupo = await fetch(`${baseUrl}/api/grupos/${idGrupoPrueba}`, {
      method: 'DELETE',
      headers: { Cookie: cookieAdmin },
    });
    assert.strictEqual(resGrupo.status, 200);

    // 2. Verificar que el alumno persiste pero con grupo_id nulo
    const resAlumno = await fetch(`${baseUrl}/api/alumnos/${idAlumnoPrueba}`, {
      headers: { Cookie: cookieAdmin },
    });
    const dataAlumno = await resAlumno.json();

    assert.strictEqual(resAlumno.status, 200);
    assert.strictEqual(dataAlumno.dato.id, idAlumnoPrueba);
    assert.strictEqual(dataAlumno.dato.grupo_id, null, 'El grupo_id debe haber cambiado a null');
  });

  it('Limpieza: Eliminar alumno, materia, maestro y usuario de prueba', async () => {
    const delAlumno = await fetch(`${baseUrl}/api/alumnos/${idAlumnoPrueba}`, {
      method: 'DELETE',
      headers: { Cookie: cookieAdmin },
    });
    assert.strictEqual(delAlumno.status, 200);

    const delMateria = await fetch(`${baseUrl}/api/materias/${idMateriaPrueba}`, {
      method: 'DELETE',
      headers: { Cookie: cookieAdmin },
    });
    assert.strictEqual(delMateria.status, 200);

    const delMaestro = await fetch(`${baseUrl}/api/maestros/${idMaestroPrueba}`, {
      method: 'DELETE',
      headers: { Cookie: cookieAdmin },
    });
    assert.strictEqual(delMaestro.status, 200);

    const delUser = await fetch(`${baseUrl}/api/usuarios/${idUsuarioPrueba}`, {
      method: 'DELETE',
      headers: { Cookie: cookieAdmin },
    });
    assert.strictEqual(delUser.status, 200);
  });
});

// ==============================================================
// 6. Cierre de Sesión (Logout)
// ==============================================================
describe('6. Revocación de Sesión (POST /logout)', () => {
  it('POST /api/auth/logout debe expirar la cookie en el pasado', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookieAdmin },
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.ok, true);

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Debe enviar cabecera Set-Cookie para limpiar');
    assert.match(setCookie, /1970/);
  });
});
