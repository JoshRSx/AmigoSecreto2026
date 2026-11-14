-- Amigo Secreto Familiar 2026
-- Importar en phpMyAdmin: selecciona tu base de datos → pestaña "Importar" → este archivo.
-- Volver a importarlo REINICIA el sorteo.

SET NAMES utf8mb4;

DROP TABLE IF EXISTS participantes;

CREATE TABLE participantes (
  nombre       VARCHAR(40) NOT NULL PRIMARY KEY,
  token        CHAR(32)    NULL COMMENT 'Celular que reclamó el nombre',
  asignado     VARCHAR(40) NULL COMMENT 'A quién le regala',
  orden        INT         NULL COMMENT 'Orden en que terminó',
  sorteado_en  DATETIME    NULL,
  UNIQUE KEY uq_asignado (asignado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO participantes (nombre) VALUES
  ('Joshua'), ('Estephany'), ('Dante'), ('Guillermo'), ('Josefina'),
  ('Gabriel'), ('Noemí'), ('Patricia'), ('Fernando'), ('Valeria'),
  ('Cesar'), ('Jhency'), ('Juliett'), ('Ashley');
