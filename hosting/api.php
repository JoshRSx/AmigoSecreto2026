<?php
/**
 * API del Amigo Secreto Familiar 2026 (PHP 7.0+ / MySQL o MariaDB con InnoDB).
 *
 * Acciones (POST JSON {"accion": ..., ...}; "estado" también por GET):
 *   estado                         → hora del servidor, hora de inicio y nombres ocupados/terminados
 *   reclamar   {nombre, token}     → asocia un nombre a un celular (token aleatorio del navegador)
 *   resultado  {nombre, token}     → devuelve el sorteo ya hecho de ese nombre (o null)
 *   sortear    {nombre, token}     → sortea a quién le regala (una sola vez, sin repetir)
 *   admin      {pin}               → lista completa para el anfitrión
 *   liberar    {pin, nombre}       → desvincula el celular de un nombre
 *   anular     {pin, nombre}       → borra el sorteo de un nombre (su persona vuelve al bombo)
 *   reiniciar  {pin}               → borra todo
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$cfg = require __DIR__ . '/config.php';
date_default_timezone_set($cfg['zona'] ?? 'America/Lima');

function responder($datos, int $codigo = 200)
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}
function error_api(string $msg, int $codigo = 400)
{
    responder(['ok' => false, 'error' => $msg], $codigo);
}

try {
    $pdo = new PDO(
        'mysql:host=' . $cfg['db_host'] . ';dbname=' . $cfg['db_name'] . ';charset=utf8mb4',
        $cfg['db_user'],
        $cfg['db_pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (Throwable $e) {
    error_api('No se pudo conectar a la base de datos. Revisa config.php.', 500);
}

$entrada = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($entrada)) $entrada = [];
$accion = $entrada['accion'] ?? ($_GET['accion'] ?? 'estado');

function texto($v): string { return is_string($v) ? trim($v) : ''; }

function validar_jugador(PDO $pdo, array $in): array
{
    $nombre = texto($in['nombre'] ?? '');
    $token = texto($in['token'] ?? '');
    if ($nombre === '' || !preg_match('/^[a-f0-9]{32}$/', $token)) error_api('Datos incompletos.');
    $st = $pdo->prepare('SELECT * FROM participantes WHERE nombre = ?');
    $st->execute([$nombre]);
    $fila = $st->fetch();
    if (!$fila) error_api('Ese nombre no está en la lista.', 404);
    return [$fila, $nombre, $token];
}

function exigir_pin(array $cfg, array $in)
{
    $pin = texto($in['pin'] ?? '');
    if ($pin === '' || !hash_equals((string)$cfg['pin_admin'], $pin)) {
        usleep(400000); // frena intentos repetidos
        error_api('PIN incorrecto.', 403);
    }
}

function inicio_ms(array $cfg)
{
    $h = trim((string)($cfg['hora_inicio'] ?? ''));
    if ($h === '') return null;
    $t = strtotime($h);
    return $t ? $t * 1000 : null;
}

switch ($accion) {

    case 'estado':
        $filas = $pdo->query('SELECT nombre, token IS NOT NULL AS ocupado, asignado IS NOT NULL AS termino FROM participantes')->fetchAll();
        foreach ($filas as &$f) { $f['ocupado'] = (bool)$f['ocupado']; $f['termino'] = (bool)$f['termino']; }
        responder([
            'ok' => true,
            'ahora' => (int)round(microtime(true) * 1000),
            'inicio' => inicio_ms($cfg),
            'participantes' => $filas,
            'whatsapp' => (string)($cfg['whatsapp_anfitrion'] ?? ''),
        ]);

    case 'reclamar':
        list($fila, $nombre, $token) = validar_jugador($pdo, $entrada);
        if ($fila['token'] !== null && $fila['token'] !== $token) {
            error_api('Este nombre ya se está usando en otro celular. Pídele al anfitrión que lo libere.', 409);
        }
        if ($fila['token'] === null) {
            // Solo lo toma si sigue libre (evita que dos celulares lo reclamen a la vez)
            $st = $pdo->prepare('UPDATE participantes SET token = ? WHERE nombre = ? AND token IS NULL');
            $st->execute([$token, $nombre]);
            if ($st->rowCount() === 0) error_api('Este nombre acaba de ser tomado en otro celular.', 409);
        }
        responder(['ok' => true, 'asignado' => $fila['asignado']]);

    case 'resultado':
        list($fila, , $token) = validar_jugador($pdo, $entrada);
        if ($fila['token'] !== $token) error_api('Este nombre está vinculado a otro celular.', 409);
        responder(['ok' => true, 'asignado' => $fila['asignado'], 'orden' => $fila['orden'] !== null ? (int)$fila['orden'] : null]);

    case 'sortear':
        list(, $nombre, $token) = validar_jugador($pdo, $entrada);
        $ini = inicio_ms($cfg);
        if ($ini !== null && microtime(true) * 1000 < $ini) error_api('El juego aún no empieza.', 403);

        $pdo->beginTransaction();
        try {
            // Bloquea la tabla completa (14 filas) para que dos sorteos simultáneos no choquen
            $todos = $pdo->query('SELECT nombre, token, asignado, orden FROM participantes FOR UPDATE')->fetchAll();
            $yo = null;
            foreach ($todos as $f) if ($f['nombre'] === $nombre) $yo = $f;
            if ($yo['token'] !== $token) { $pdo->rollBack(); error_api('Este nombre está vinculado a otro celular.', 409); }
            if ($yo['asignado'] !== null) { $pdo->commit(); responder(['ok' => true, 'asignado' => $yo['asignado'], 'orden' => (int)$yo['orden']]); }

            $tomados = []; $pendientes = []; $maxOrden = 0;
            foreach ($todos as $f) {
                if ($f['asignado'] !== null) { $tomados[$f['asignado']] = true; $maxOrden = max($maxOrden, (int)$f['orden']); }
                else $pendientes[] = $f['nombre']; // aún no sortean (incluye al jugador actual)
            }
            $candidatos = [];
            foreach ($todos as $f) {
                if ($f['nombre'] !== $nombre && !isset($tomados[$f['nombre']])) $candidatos[] = $f['nombre'];
            }
            // Regla anti-bloqueo: si solo quedamos dos por sortear y el otro sigue libre,
            // me toca él; si no, al final quedaría solo consigo mismo.
            if (count($pendientes) === 2) {
                $otro = $pendientes[0] === $nombre ? $pendientes[1] : $pendientes[0];
                if (in_array($otro, $candidatos, true)) $candidatos = [$otro];
            }
            if (!$candidatos) { $pdo->rollBack(); error_api('No quedan personas para sortear. Avísale al anfitrión.', 409); }

            $elegido = $candidatos[random_int(0, count($candidatos) - 1)];
            $st = $pdo->prepare('UPDATE participantes SET asignado = ?, orden = ?, sorteado_en = ? WHERE nombre = ?');
            $st->execute([$elegido, $maxOrden + 1, date('Y-m-d H:i:s'), $nombre]);
            $pdo->commit();
            responder(['ok' => true, 'asignado' => $elegido, 'orden' => $maxOrden + 1]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_api('Hubo un problema al sortear. Intenta de nuevo.', 500);
        }

    case 'admin':
        exigir_pin($cfg, $entrada);
        $filas = $pdo->query('SELECT nombre, token IS NOT NULL AS ocupado, asignado, orden, sorteado_en FROM participantes ORDER BY orden IS NULL, orden, nombre')->fetchAll();
        foreach ($filas as &$f) { $f['ocupado'] = (bool)$f['ocupado']; $f['orden'] = $f['orden'] !== null ? (int)$f['orden'] : null; }
        responder(['ok' => true, 'participantes' => $filas, 'inicio' => inicio_ms($cfg), 'ahora' => (int)round(microtime(true) * 1000)]);

    case 'liberar':
        exigir_pin($cfg, $entrada);
        $st = $pdo->prepare('UPDATE participantes SET token = NULL WHERE nombre = ?');
        $st->execute([texto($entrada['nombre'] ?? '')]);
        responder(['ok' => true]);

    case 'anular':
        exigir_pin($cfg, $entrada);
        $st = $pdo->prepare('UPDATE participantes SET asignado = NULL, orden = NULL, sorteado_en = NULL WHERE nombre = ?');
        $st->execute([texto($entrada['nombre'] ?? '')]);
        responder(['ok' => true]);

    case 'reiniciar':
        exigir_pin($cfg, $entrada);
        $pdo->exec('UPDATE participantes SET token = NULL, asignado = NULL, orden = NULL, sorteado_en = NULL');
        responder(['ok' => true]);

    default:
        error_api('Acción desconocida.');
}
