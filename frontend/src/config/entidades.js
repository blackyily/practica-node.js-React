// ==============================================================
// CONFIGURACIÓN CENTRALIZADA DE ENTIDADES (CATÁLOGOS)
// Define las columnas, formularios y relaciones de cada módulo
// ==============================================================

export const entidades = {
  // 1. Materias
  materias: {
    nombre: 'materias',
    titulo: 'Catálogo de Materias',
    singular: 'Materia',
    endpoint: '/api/materias',
    campoBusqueda: 'nombre',
    columnas: [
      { key: 'clave', label: 'Clave' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'creditos', label: 'Créditos' },
      { key: 'descripcion', label: 'Descripción' },
    ],
    campos: [
      { name: 'clave', label: 'Clave', type: 'text', placeholder: 'Ej. MAT-101', required: true },
      { name: 'nombre', label: 'Nombre de la Materia', type: 'text', placeholder: 'Ej. Cálculo Diferencial', required: true },
      { name: 'creditos', label: 'Créditos', type: 'number', min: 1, max: 50, required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Breve descripción del temario...' },
    ],
  },

  // 2. Maestros
  maestros: {
    nombre: 'maestros',
    titulo: 'Catálogo de Maestros',
    singular: 'Maestro',
    endpoint: '/api/maestros',
    campoBusqueda: 'nombre',
    columnas: [
      { key: 'numero_empleado', label: 'No. Empleado' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'apellidos', label: 'Apellidos' },
      { key: 'correo', label: 'Correo' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'especialidad', label: 'Especialidad' },
    ],
    campos: [
      { name: 'numero_empleado', label: 'No. de Empleado', type: 'text', placeholder: 'Ej. EMP-001', required: true },
      { name: 'nombre', label: 'Nombre(s)', type: 'text', placeholder: 'Ej. Juan Carlos', required: true },
      { name: 'apellidos', label: 'Apellidos', type: 'text', placeholder: 'Ej. Morales Sánchez', required: true },
      { name: 'correo', label: 'Correo Electrónico', type: 'email', placeholder: 'profesor@escolar.edu', required: true },
      { name: 'telefono', label: 'Teléfono', type: 'text', placeholder: '55 1234 5678' },
      { name: 'especialidad', label: 'Especialidad', type: 'text', placeholder: 'Ej. Matemáticas Aplicadas', required: true },
    ],
  },

  // 3. Grupos
  grupos: {
    nombre: 'grupos',
    titulo: 'Catálogo de Grupos',
    singular: 'Grupo',
    endpoint: '/api/grupos',
    campoBusqueda: 'codigo',
    // Carga de opciones foráneas para los selects del formulario
    relaciones: [
      { campo: 'materia_id', endpoint: '/api/materias', valueKey: 'id', labelKey: 'nombre' },
      {
        campo: 'maestro_id',
        endpoint: '/api/maestros',
        valueKey: 'id',
        labelFormatter: (item) => `${item.nombre} ${item.apellidos} (${item.especialidad})`,
      },
    ],
    columnas: [
      { key: 'codigo', label: 'Código' },
      { key: 'materia_nombre', label: 'Materia' },
      { key: 'maestro_nombre', label: 'Maestro Titular' },
      { key: 'semestre', label: 'Semestre' },
      { key: 'horario', label: 'Horario' },
      { key: 'aula', label: 'Aula' },
    ],
    campos: [
      { name: 'codigo', label: 'Código de Grupo', type: 'text', placeholder: 'Ej. G-101', required: true },
      { name: 'materia_id', label: 'Materia', type: 'select', required: true },
      { name: 'maestro_id', label: 'Maestro Titular', type: 'select', required: true },
      { name: 'semestre', label: 'Semestre / Periodo', type: 'text', placeholder: 'Ej. 2026-1', required: true },
      { name: 'horario', label: 'Horario', type: 'text', placeholder: 'Ej. Lun y Mié 08:00 - 10:00', required: true },
      { name: 'aula', label: 'Aula o Laboratorio', type: 'text', placeholder: 'Ej. Aula Magna B', required: true },
    ],
  },

  // 4. Alumnos
  alumnos: {
    nombre: 'alumnos',
    titulo: 'Catálogo de Alumnos',
    singular: 'Alumno',
    endpoint: '/api/alumnos',
    campoBusqueda: 'nombre',
    relaciones: [
      { campo: 'grupo_id', endpoint: '/api/grupos', valueKey: 'id', labelKey: 'codigo' },
    ],
    columnas: [
      { key: 'matricula', label: 'Matrícula' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'apellidos', label: 'Apellidos' },
      { key: 'correo', label: 'Correo' },
      {
        key: 'grupo_codigo',
        label: 'Grupo Asignado',
        badge: (val) => ({
          color: val ? 'primary' : 'secondary',
          text: val || 'Sin asignar',
        }),
      },
      { key: 'fecha_nacimiento', label: 'Fecha Nac.' },
    ],
    campos: [
      { name: 'matricula', label: 'Matrícula Escolar', type: 'text', placeholder: 'Ej. ALU-2026-001', required: true },
      { name: 'nombre', label: 'Nombre(s)', type: 'text', placeholder: 'Ej. Mariana', required: true },
      { name: 'apellidos', label: 'Apellidos', type: 'text', placeholder: 'Ej. Rivera Cruz', required: true },
      { name: 'correo', label: 'Correo Electrónico', type: 'email', placeholder: 'alumno@escolar.edu', required: true },
      { name: 'grupo_id', label: 'Grupo Asignado (Opcional)', type: 'select', placeholder: '-- Sin asignar --' },
      { name: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date' },
    ],
  },

  // 5. Usuarios (Exclusivo Administradores)
  usuarios: {
    nombre: 'usuarios',
    titulo: 'Administración de Usuarios del Sistema',
    singular: 'Usuario',
    endpoint: '/api/usuarios',
    campoBusqueda: 'usuario',
    columnas: [
      { key: 'id', label: 'ID' },
      { key: 'nombre', label: 'Nombre Completo' },
      { key: 'usuario', label: 'Usuario' },
      { key: 'correo', label: 'Correo' },
      {
        key: 'rol',
        label: 'Rol',
        badge: (rol) => ({
          color: rol === 'admin' ? 'danger' : 'info',
          text: String(rol || '').toUpperCase(),
        }),
      },
      {
        key: 'bloqueado_hasta',
        label: 'Estado',
        badge: (bloq) =>
          bloq && new Date(bloq) > new Date()
            ? { color: 'warning text-dark', text: 'Bloqueado temporalmente' }
            : { color: 'success', text: 'Activo' },
      },
    ],
    campos: [
      { name: 'nombre', label: 'Nombre Completo', type: 'text', placeholder: 'Ej. Laura Domínguez', required: true },
      { name: 'usuario', label: 'Nombre de Usuario', type: 'text', placeholder: 'Ej. ldominguez', required: true, soloCrear: true },
      { name: 'correo', label: 'Correo Electrónico', type: 'email', placeholder: 'usuario@escolar.edu', required: true },
      {
        name: 'password',
        label: 'Contraseña',
        type: 'password',
        placeholder: 'Mínimo 6 caracteres',
        requiredOnCreate: true,
        helpText: 'Al editar, dejar vacío si no se desea cambiar la contraseña.',
      },
    ],
  },
};

export default entidades;
