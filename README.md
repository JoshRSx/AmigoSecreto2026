# 🎄 Amigo Secreto Familiar 2026

App web móvil para hacer **el sorteo jugando**: cada participante elige su nombre, supera 3 desafíos de su minijuego y el servidor le asigna al azar a quién le regala (sin repetir, sin que le toque a sí mismo). Luego le avisa al anfitrión por WhatsApp.

## Versión con servidor (PHP + MySQL) — la principal

Todo está en `hosting/`. Instrucciones paso a paso en [`hosting/LEEME.txt`](hosting/LEEME.txt).

- `api.php`: sorteo con transacción y bloqueo (`SELECT … FOR UPDATE`) para sorteos simultáneos, regla anti-bloqueo para el último par, un nombre por celular.
- `/#organizador`: panel con PIN (quién terminó, orden, parejas ocultas por defecto, liberar celular, anular sorteo, reiniciar).
- `#demo`: simula el servidor en el navegador para probar sin hosting.

Desarrollo: edita `src/` y ejecuta `node build.js` → `hosting/index.html`. Pruebas: `test/estres.py` (sorteos concurrentes), `test/e2e_php.py`, `test/demo_full.py`.

---

## Versión anterior sin servidor (Netlify, con pistas) — respaldo

`public/` + `netlify.toml` conservan la versión con pistas escritas por cada regalador. Ya no se regenera con `build.js`.

## Estructura

```
public/            ← lo que publica Netlify
  index.html       ← la app (generada, no editar a mano)
  config.js        ← pistas y hora de inicio (lo genera /#organizador)
src/
  content.js       ← juegos, acertijos y respuestas en texto plano
  template.html    ← interfaz
build.js           ← node build.js → public/index.html (ofusca las respuestas)
test/run.py        ← prueba de punta a punta con Playwright
netlify.toml
```

## Publicar en Netlify

1. Netlify → **Add new site → Import an existing project → GitHub** → este repo.
2. Branch: la que tenga estos archivos. Netlify lee `netlify.toml` (publish = `public`, sin comando de build).
3. Deploy. Opcional: *Site configuration → Change site name* (p. ej. `amigo-secreto-rojas`).

## Flujo del evento

| Cuándo | Quién | Qué |
|---|---|---|
| Después del sorteo | Cada regalador | (Opcional) Abre `https://TU-SITIO.netlify.app/#pistas`, marca a quién le regala, escribe hasta 3 pistas sobre sí mismo y envía el código al anfitrión |
| Cuando lleguen todos | Anfitrión | Abre `/#organizador`, pega los códigos, (opcional) pone la hora de inicio y toca **Generar config.js** |
| Igual | Anfitrión | En GitHub edita `public/config.js`, reemplaza todo con lo generado y haz commit. Netlify publica en ~1 min |
| Domingo | Todos | Abren el link, eligen su nombre y juegan |

### Funciona con o sin pistas

| Situación | Qué pasa |
|---|---|
| Nadie envió código (`paquete` vacío) | Todos juegan sus 3 rondas; cada regalo da un mensaje festivo y al final la revelación es **en persona** |
| Algunos enviaron código | Quien tiene pistas adivina en la app; el resto juega igual y se revela en persona |
| Alguien dejó pistas en blanco | La app las crea con su nombre: cuántas letras tiene, en qué letra termina, con cuál empieza |

- `horaInicio` en `config.js` muestra una cuenta regresiva hasta esa hora (sirve también sin pistas, para que nadie juegue antes).
- `/#demo` prueba el juego con pistas de prueba; ese progreso no se mezcla con el real.
- `/#organizador` nunca muestra pistas ni parejas, solo quién falta.

## Cambiar acertijos

Edita `src/content.js` y ejecuta `node build.js`. Prueba: `python3 test/run.py`.

## Limitaciones

- Sin servidor: el progreso vive en cada celular y no se impide entrar con otro nombre.
- Las respuestas y pistas están ofuscadas, no cifradas: alguien con conocimientos podría leerlas desde el código.
