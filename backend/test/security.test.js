import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { pool } from '../src/config/db.js';

let server;
let baseUrl;
let cookieAdmin = '';

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });

  // Login como Admin para obtener cookie de sesión
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'Admin', password: 'Admin123!' }),
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    cookieAdmin = setCookie.split(';')[0];
  }
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await pool.end();
});

// ==============================================================
// PRUEBAS DE SEGURIDAD
// ==============================================================
describe('Seguridad 1: Mitigación de Inyección SQL', () => {
  it('Intento de inyección SQL en Login (" OR "1"="1) debe ser mitigado y fallar (401)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: "' OR '1'='1' -- ", password: "' OR '1'='1" }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.mensaje, 'Credenciales inválidas.');
  });
});

describe('Seguridad 2: Bloqueo de Subida de Archivos Maliciosos', () => {
  it('Intento de subir script malicioso (.php / .sh) como foto de perfil debe ser rechazado', async () => {
    const boundary = '----WebKitFormBoundaryFakeScriptTest';
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="foto"; filename="malware.php"\r\n` +
      `Content-Type: application/x-php\r\n\r\n` +
      `<?php system($_GET['cmd']); ?>\r\n` +
      `--${boundary}--\r\n`;

    const res = await fetch(`${baseUrl}/api/auth/me/foto`, {
      method: 'PUT',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Cookie: cookieAdmin,
      },
      body,
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400); // Multer rechaza el filtro de archivo
    assert.strictEqual(data.ok, false);
    assert.match(data.mensaje, /Formato de archivo no permitido/i);
  });
});

describe('Seguridad 3: Encabezados HTTP de Seguridad (Helmet)', () => {
  it('Las respuestas deben contener los encabezados obligatorios de Helmet', async () => {
    const res = await fetch(`${baseUrl}/api/health`);

    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.ok(res.headers.get('content-security-policy'), 'Debe incluir Content-Security-Policy');
    assert.strictEqual(res.headers.get('x-powered-by'), null, 'No debe filtrar X-Powered-By');
  });
});

describe('Seguridad 4: Lista Blanca de Campos y Escalamiento de Privilegios', () => {
  it('Parámetros extraños o no declarados deben ser ignorados por el validador Zod', async () => {
    const res = await fetch(`${baseUrl}/api/materias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieAdmin,
      },
      body: JSON.stringify({
        clave: 'SEC-101',
        nombre: 'Seguridad en Redes',
        creditos: 8,
        campoInexistente: 'hacker_data',
        inyeccionExtra: 12345,
      }),
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.ok, true);

    // Limpiar materia creada
    await fetch(`${baseUrl}/api/materias/${data.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieAdmin },
    });
  });
});
