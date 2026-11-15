<?php
// PLANTILLA. Copia este archivo como config.php en tu hosting y completa los datos.
// (config.php no se sube a GitHub porque tiene contraseñas y claves.)
return [
    'db_host' => 'localhost',
    'db_name' => 'NOMBRE_DE_TU_BASE',
    'db_user' => 'USUARIO_DE_TU_BASE',
    'db_pass' => 'CONTRASEÑA_DE_TU_BASE',

    // Clave que escriben todos para entrar al juego
    'clave_jugadores' => 'CLAVE_JUGADORES',
    // Clave del anfitrión: abre el panel de moderación
    'pin_admin' => 'CLAVE_ADMIN',

    // Hora de inicio en hora de Lima ('AAAA-MM-DD HH:MM'). Vacío = abierto ya.
    'hora_inicio' => '',
    'zona' => 'America/Lima',
];
