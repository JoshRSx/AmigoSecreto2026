-- Amigo Secreto Familiar 2026
-- Importar en phpMyAdmin: selecciona tu base de datos → pestaña "Importar" → este archivo.
-- Volver a importarlo REINICIA todo (sorteos y progreso). Solo toca la tabla amigo_participantes.

SET NAMES utf8mb4;

DROP TABLE IF EXISTS amigo_participantes;

CREATE TABLE amigo_participantes (
  nombre            VARCHAR(40)  NOT NULL PRIMARY KEY,
  token             CHAR(32)     NULL COMMENT 'Celular que eligió el nombre',
  reclamado_en      DATETIME     NULL COMMENT 'Cuándo eligió su nombre',
  desafio_actual    TINYINT      NULL COMMENT 'Desafío que está jugando (1-3)',
  completados       TINYINT      NOT NULL DEFAULT 0 COMMENT 'Desafíos superados (0-3)',
  ayudas            SMALLINT     NOT NULL DEFAULT 0 COMMENT 'Veces que pidió ayuda',
  saltos            SMALLINT     NOT NULL DEFAULT 0 COMMENT 'Desafíos saltados',
  inicio_juego      DATETIME     NULL COMMENT 'Cuándo empezó el primer desafío',
  ultima_actividad  DATETIME     NULL,
  asignado          VARCHAR(40)  NULL COMMENT 'Su amigo secreto',
  orden             INT          NULL COMMENT 'Orden en que sorteó',
  sorteado_en       DATETIME     NULL,
  UNIQUE KEY uq_asignado (asignado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO amigo_participantes (nombre) VALUES
  ('Joshua'), ('Estephany'), ('Dante'), ('Guillermo'), ('Josefina'),
  ('Gabriel'), ('Noemí'), ('Patricia'), ('Fernando'), ('Valeria'),
  ('Cesar'), ('Jhency'), ('Juliett'), ('Ashley');
