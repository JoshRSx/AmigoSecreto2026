<?php
// Configuración del servidor. Completa los datos de tu base de datos (los ves en cPanel / phpMyAdmin).
return [
    'db_host' => 'localhost',
    'db_name' => 'NOMBRE_DE_TU_BASE',
    'db_user' => 'USUARIO_DE_TU_BASE',
    'db_pass' => 'CONTRASEÑA_DE_TU_BASE',

    // PIN del panel del anfitrión (/#organizador). ¡Cámbialo!
    'pin_admin' => 'CAMBIA-ESTE-PIN',

    // Hora de inicio en hora de Lima (formato 'AAAA-MM-DD HH:MM'). Vacío = abierto ya.
    'hora_inicio' => '',
    'zona' => 'America/Lima',

    // Tu WhatsApp con código de país, sin + ni espacios (ej. '51987654321').
    // Vacío = WhatsApp le pedirá al jugador elegir el contacto.
    'whatsapp_anfitrion' => '51928504589',
];
