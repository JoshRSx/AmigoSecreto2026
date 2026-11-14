# 🎄 Amigo Secreto Familiar 2026

App web móvil: cada participante juega 3 rondas de su minijuego, gana 3 pistas y adivina quién es su amigo secreto.

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
| Después del sorteo | Cada regalador | Abre `https://TU-SITIO.netlify.app/#pistas`, escribe 3 pistas sobre sí mismo y envía el código al anfitrión |
| Cuando lleguen todos | Anfitrión | Abre `/#organizador`, pega los códigos, (opcional) pone la hora de inicio y toca **Generar config.js** |
| Igual | Anfitrión | En GitHub edita `public/config.js`, reemplaza todo con lo generado y haz commit. Netlify publica en ~1 min |
| Domingo | Todos | Abren el link, eligen su nombre y juegan |

- Sin `paquete` en `config.js`, la app muestra "¡Ya casi empieza!" (nadie juega con pistas falsas). `/#demo` permite probar con pistas de prueba; ese progreso no se mezcla con el juego real.
- `/#organizador` nunca muestra pistas ni parejas, solo quién falta.

## Cambiar acertijos

Edita `src/content.js` y ejecuta `node build.js`. Prueba: `python3 test/run.py`.

## Limitaciones

- Sin servidor: el progreso vive en cada celular y no se impide entrar con otro nombre.
- Las respuestas y pistas están ofuscadas, no cifradas: alguien con conocimientos podría leerlas desde el código.
