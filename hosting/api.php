<?php
/**
 * API del Amigo Secreto Familiar 2026 (PHP 7.0+ / MySQL o MariaDB con InnoDB).
 * Todas las acciones van por POST JSON {"accion": ..., "clave": ..., ...}.
 *
 * Jugadores (requieren la clave de ingreso):
 *   entrar     {clave}                       → rol 'jugador' o 'admin'
 *   estado                                   → hora del servidor, inicio y nombres ocupados/terminados
 *   reclamar   {nombre, token}               → vincula un nombre a un celular
 *   resultado  {nombre, token}               → sorteo ya hecho (o null)
 *   progreso   {nombre, token, evento, desafio} → evento: inicio | completo | ayuda | salto
 *   sortear    {nombre, token}               → sortea su amigo secreto (una vez, sin repetir)
 * Anfitrión (la clave debe ser la de admin):
 *   admin                                    → todo el detalle para moderar
 *   liberar    {nombre}                      → desvincula el celular (conserva el progreso)
 *   anular     {nombre}                      → borra su sorteo (su persona vuelve al bombo)
 *   reiniciar_jugador {nombre}               → borra celular, progreso y sorteo de esa persona
 *   reiniciar                                → borra todo
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
function texto($v): string { return is_string($v) ? trim($v) : ''; }
function ahora_db(): string { return date('Y-m-d H:i:s'); }
function ms($fecha) { return $fecha ? strtotime((string)$fecha) * 1000 : null; }

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
$accion = $entrada['accion'] ?? ($_GET['accion'] ?? 'ping');
$clave = texto($entrada['clave'] ?? '');

$esAdmin = $clave !== '' && hash_equals((string)$cfg['pin_admin'], $clave);
$esJugador = $esAdmin || ($clave !== '' && hash_equals((string)$cfg['clave_jugadores'], $clave));

function exigir_jugador(bool $ok)
{
    if (!$ok) { usleep(400000); error_api('Clave de ingreso incorrecta.', 401); }
}
function exigir_admin(bool $ok)
{
    if (!$ok) { usleep(400000); error_api('Clave de anfitrión incorrecta.', 403); }
}

function validar_jugador(PDO $pdo, array $in, bool $mismoCelular = true): array
{
    $nombre = texto($in['nombre'] ?? '');
    $token = texto($in['token'] ?? '');
    if ($nombre === '' || !preg_match('/^[a-f0-9]{32}$/', $token)) error_api('Datos incompletos.');
    $st = $pdo->prepare('SELECT * FROM amigo_participantes WHERE nombre = ?');
    $st->execute([$nombre]);
    $fila = $st->fetch();
    if (!$fila) error_api('Ese nombre no está en la lista.', 404);
    if ($mismoCelular && $fila['token'] !== $token) error_api('Este nombre está vinculado a otro celular.', 409);
    return [$fila, $nombre, $token];
}

function inicio_ms(array $cfg)
{
    $h = trim((string)($cfg['hora_inicio'] ?? ''));
    if ($h === '') return null;
    $t = strtotime($h);
    return $t ? $t * 1000 : null;
}

switch ($accion) {

    case 'ping': // para comprobar la instalación desde el navegador
        $n = (int)$pdo->query('SELECT COUNT(*) FROM amigo_participantes')->fetchColumn();
        responder(['ok' => true, 'participantes' => $n]);

    case 'entrar':
        if ($esAdmin) responder(['ok' => true, 'rol' => 'admin']);
        exigir_jugador($esJugador);
        responder(['ok' => true, 'rol' => 'jugador']);

    case 'estado':
        exigir_jugador($esJugador);
        $filas = $pdo->query('SELECT nombre, token IS NOT NULL AS ocupado, asignado IS NOT NULL AS termino FROM amigo_participantes')->fetchAll();
        foreach ($filas as &$f) { $f['ocupado'] = (bool)$f['ocupado']; $f['termino'] = (bool)$f['termino']; }
        responder([
            'ok' => true,
            'ahora' => (int)round(microtime(true) * 1000),
            'inicio' => inicio_ms($cfg),
            'participantes' => $filas,
        ]);

    case 'reclamar':
        exigir_jugador($esJugador);
        list($fila, $nombre, $token) = validar_jugador($pdo, $entrada, false);
        if ($fila['token'] !== null && $fila['token'] !== $token) {
            error_api('Este nombre ya se está usando en otro celular. Pídele al anfitrión que lo libere.', 409);
        }
        if ($fila['token'] === null) {
            $st = $pdo->prepare('UPDATE amigo_participantes SET token = ?, reclamado_en = ?, ultima_actividad = ? WHERE nombre = ? AND token IS NULL');
            $st->execute([$token, ahora_db(), ahora_db(), $nombre]);
            if ($st->rowCount() === 0) error_api('Este nombre acaba de ser tomado en otro celular.', 409);
        }
        responder(['ok' => true, 'asignado' => $fila['asignado'], 'completados' => (int)$fila['completados']]);

    case 'resultado':
        exigir_jugador($esJugador);
        list($fila) = validar_jugador($pdo, $entrada);
        responder(['ok' => true, 'asignado' => $fila['asignado'], 'orden' => $fila['orden'] !== null ? (int)$fila['orden'] : null, 'completados' => (int)$fila['completados']]);

    case 'progreso':
        exigir_jugador($esJugador);
        list(, $nombre) = validar_jugador($pdo, $entrada);
        $evento = texto($entrada['evento'] ?? '');
        $d = (int)($entrada['desafio'] ?? 0);
        if ($d < 1 || $d > 3) error_api('Desafío inválido.');
        $t = ahora_db();
        if ($evento === 'inicio') {
            $st = $pdo->prepare('UPDATE amigo_participantes SET desafio_actual = ?, inicio_juego = COALESCE(inicio_juego, ?), ultima_actividad = ? WHERE nombre = ?');
            $st->execute([$d, $t, $t, $nombre]);
        } elseif ($evento === 'completo') {
            $st = $pdo->prepare('UPDATE amigo_participantes SET completados = GREATEST(completados, ?), desafio_actual = NULL, inicio_juego = COALESCE(inicio_juego, ?), ultima_actividad = ? WHERE nombre = ?');
            $st->execute([$d, $t, $t, $nombre]);
        } elseif ($evento === 'ayuda') {
            $st = $pdo->prepare('UPDATE amigo_participantes SET ayudas = ayudas + 1, ultima_actividad = ? WHERE nombre = ?');
            $st->execute([$t, $nombre]);
        } elseif ($evento === 'salto') {
            $st = $pdo->prepare('UPDATE amigo_participantes SET saltos = saltos + 1, ultima_actividad = ? WHERE nombre = ?');
            $st->execute([$t, $nombre]);
        } else {
            error_api('Evento inválido.');
        }
        responder(['ok' => true]);

    case 'sortear':
        exigir_jugador($esJugador);
        list(, $nombre, $token) = validar_jugador($pdo, $entrada, false);
        $ini = inicio_ms($cfg);
        if ($ini !== null && microtime(true) * 1000 < $ini) error_api('El juego aún no empieza.', 403);

        $pdo->beginTransaction();
        try {
            // Bloquea la tabla completa (14 filas) para que dos sorteos simultáneos no choquen
            $todos = $pdo->query('SELECT nombre, token, asignado, orden FROM amigo_participantes FOR UPDATE')->fetchAll();
            $yo = null;
            foreach ($todos as $f) if ($f['nombre'] === $nombre) $yo = $f;
            if ($yo['token'] !== $token) { $pdo->rollBack(); error_api('Este nombre está vinculado a otro celular.', 409); }
            if ($yo['asignado'] !== null) { $pdo->commit(); responder(['ok' => true, 'asignado' => $yo['asignado'], 'orden' => (int)$yo['orden']]); }

            $tomados = []; $pendientes = []; $maxOrden = 0;
            foreach ($todos as $f) {
                if ($f['asignado'] !== null) { $tomados[$f['asignado']] = true; $maxOrden = max($maxOrden, (int)$f['orden']); }
                else $pendientes[] = $f['nombre'];
            }
            $candidatos = [];
            foreach ($todos as $f) {
                if ($f['nombre'] !== $nombre && !isset($tomados[$f['nombre']])) $candidatos[] = $f['nombre'];
            }
            // Regla anti-bloqueo: si solo quedan dos por sortear y el otro sigue libre, me toca él;
            // si no, al final quedaría solo consigo mismo.
            if (count($pendientes) === 2) {
                $otro = $pendientes[0] === $nombre ? $pendientes[1] : $pendientes[0];
                if (in_array($otro, $candidatos, true)) $candidatos = [$otro];
            }
            if (!$candidatos) { $pdo->rollBack(); error_api('No quedan personas para sortear. Avísale al anfitrión.', 409); }

            $elegido = $candidatos[random_int(0, count($candidatos) - 1)];
            $t = ahora_db();
            $st = $pdo->prepare('UPDATE amigo_participantes SET asignado = ?, orden = ?, sorteado_en = ?, completados = GREATEST(completados, 2), desafio_actual = 3, ultima_actividad = ? WHERE nombre = ?');
            $st->execute([$elegido, $maxOrden + 1, $t, $t, $nombre]);
            $pdo->commit();
            responder(['ok' => true, 'asignado' => $elegido, 'orden' => $maxOrden + 1]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_api('Hubo un problema al sortear. Intenta de nuevo.', 500);
        }

    case 'admin':
        exigir_admin($esAdmin);
        $filas = $pdo->query('SELECT * FROM amigo_participantes ORDER BY nombre')->fetchAll();
        $out = [];
        foreach ($filas as $f) {
            $out[] = [
                'nombre' => $f['nombre'],
                'ocupado' => $f['token'] !== null,
                'reclamado_en' => ms($f['reclamado_en']),
                'desafio_actual' => $f['desafio_actual'] !== null ? (int)$f['desafio_actual'] : null,
                'completados' => (int)$f['completados'],
                'ayudas' => (int)$f['ayudas'],
                'saltos' => (int)$f['saltos'],
                'inicio_juego' => ms($f['inicio_juego']),
                'ultima_actividad' => ms($f['ultima_actividad']),
                'asignado' => $f['asignado'],
                'orden' => $f['orden'] !== null ? (int)$f['orden'] : null,
                'sorteado_en' => ms($f['sorteado_en']),
            ];
        }
        responder(['ok' => true, 'participantes' => $out, 'inicio' => inicio_ms($cfg), 'ahora' => (int)round(microtime(true) * 1000)]);

    case 'liberar':
        exigir_admin($esAdmin);
        $st = $pdo->prepare('UPDATE amigo_participantes SET token = NULL, reclamado_en = NULL WHERE nombre = ?');
        $st->execute([texto($entrada['nombre'] ?? '')]);
        responder(['ok' => true]);

    case 'anular':
        exigir_admin($esAdmin);
        $st = $pdo->prepare('UPDATE amigo_participantes SET asignado = NULL, orden = NULL, sorteado_en = NULL WHERE nombre = ?');
        $st->execute([texto($entrada['nombre'] ?? '')]);
        responder(['ok' => true]);

    case 'reiniciar_jugador':
        exigir_admin($esAdmin);
        $st = $pdo->prepare('UPDATE amigo_participantes SET token = NULL, reclamado_en = NULL, desafio_actual = NULL, completados = 0, ayudas = 0, saltos = 0, inicio_juego = NULL, ultima_actividad = NULL, asignado = NULL, orden = NULL, sorteado_en = NULL WHERE nombre = ?');
        $st->execute([texto($entrada['nombre'] ?? '')]);
        responder(['ok' => true]);

    case 'reiniciar':
        exigir_admin($esAdmin);
        $pdo->exec('UPDATE amigo_participantes SET token = NULL, reclamado_en = NULL, desafio_actual = NULL, completados = 0, ayudas = 0, saltos = 0, inicio_juego = NULL, ultima_actividad = NULL, asignado = NULL, orden = NULL, sorteado_en = NULL');
        responder(['ok' => true]);

    default:
        error_api('Acción desconocida.');
}
