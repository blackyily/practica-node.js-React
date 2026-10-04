-- Base de datos: lab_escolar

-- 1. Creación de la base de datos
CREATE DATABASE IF NOT EXISTS lab_escolar
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lab_escolar;

-- 2. Limpieza previa en orden inverso de dependencias (para ejecuciones limpias)
DROP TABLE IF EXISTS alumnos;
DROP TABLE IF EXISTS grupos;
DROP TABLE IF EXISTS materias;
DROP TABLE IF EXISTS maestros;
DROP TABLE IF EXISTS usuarios;

-- 3. Creación de Tablas

-- Tabla: usuarios
-- Almacena credenciales, roles, foto de perfil y control de bloqueo por fuerza bruta
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',
  foto_perfil VARCHAR(255) NULL DEFAULT NULL,
  intentos_fallidos INT NOT NULL DEFAULT 0,
  bloqueado_hasta DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuarios_usuario (usuario),
  INDEX idx_usuarios_correo (correo),
  INDEX idx_usuarios_rol (rol)
) ENGINE=InnoDB;

-- Tabla: maestros
CREATE TABLE maestros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_empleado VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  telefono VARCHAR(20) NULL DEFAULT NULL,
  especialidad VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_maestros_numero (numero_empleado),
  INDEX idx_maestros_correo (correo)
) ENGINE=InnoDB;

-- Tabla: materias
CREATE TABLE materias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  creditos INT NOT NULL,
  descripcion TEXT NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_materias_clave (clave)
) ENGINE=InnoDB;

-- Tabla: grupos
-- Relacionada con materias y maestros (Llaves foráneas con RESTRICT para proteger integridad)
CREATE TABLE grupos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  materia_id INT NOT NULL,
  maestro_id INT NOT NULL,
  semestre VARCHAR(20) NOT NULL,
  horario VARCHAR(50) NOT NULL,
  aula VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_grupos_codigo (codigo),
  CONSTRAINT fk_grupos_materia
    FOREIGN KEY (materia_id) REFERENCES materias (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_grupos_maestro
    FOREIGN KEY (maestro_id) REFERENCES maestros (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabla: alumnos
-- Relacionada con grupos (SET NULL al eliminar un grupo para no perder el registro del alumno)
CREATE TABLE alumnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  grupo_id INT NULL DEFAULT NULL,
  fecha_nacimiento DATE NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_alumnos_matricula (matricula),
  INDEX idx_alumnos_correo (correo),
  CONSTRAINT fk_alumnos_grupo
    FOREIGN KEY (grupo_id) REFERENCES grupos (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 4. Triggers de Seguridad e Integridad

DELIMITER $$

-- Trigger 1: Impedir registrar más de dos administradores al insertar
CREATE TRIGGER trg_check_admin_insert
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
  IF NEW.rol = 'admin' THEN
    IF (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') >= 2 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Violación de regla: No se permite registrar más de dos administradores en el sistema.';
    END IF;
  END IF;
END$$

-- Trigger 2: Impedir promover a un usuario a administrador si ya existen dos
CREATE TRIGGER trg_check_admin_update
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
  IF NEW.rol = 'admin' AND OLD.rol <> 'admin' THEN
    IF (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin') >= 2 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Violación de regla: No se permite tener más de dos administradores en el sistema.';
    END IF;
  END IF;
END$$

-- Trigger 3: Impedir la eliminación de cualquier administrador
CREATE TRIGGER trg_prevent_admin_delete
BEFORE DELETE ON usuarios
FOR EACH ROW
BEGIN
  IF OLD.rol = 'admin' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Violación de regla: No está permitido eliminar usuarios con rol de administrador.';
  END IF;
END$$

DELIMITER ;

-- 5. Creación y Concesión de Permisos de Mínimo Privilegio
-- Usuario: lab_app (Únicamente SELECT, INSERT, UPDATE, DELETE)

CREATE USER IF NOT EXISTS 'lab_app'@'%' IDENTIFIED BY 'lab_secure_password_2026';
CREATE USER IF NOT EXISTS 'lab_app'@'localhost' IDENTIFIED BY 'lab_secure_password_2026';
CREATE USER IF NOT EXISTS 'lab_app'@'127.0.0.1' IDENTIFIED BY 'lab_secure_password_2026';

-- Revocar cualquier permiso previo para garantizar mínimo privilegio
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'lab_app'@'%';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'lab_app'@'localhost';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'lab_app'@'127.0.0.1';

-- Otorgar únicamente operaciones DML (sin DROP, ALTER, CREATE, GRANT, etc.)
GRANT SELECT, INSERT, UPDATE, DELETE ON lab_escolar.* TO 'lab_app'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON lab_escolar.* TO 'lab_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON lab_escolar.* TO 'lab_app'@'127.0.0.1';

FLUSH PRIVILEGES;
