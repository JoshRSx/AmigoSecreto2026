/* ---------- conexión con el servidor ---------- */
const API_URL = 'api.php';
// #demo: simula el servidor dentro del navegador (para probar sin hosting).
// En demo, clave de jugadores: 151126 · clave de anfitrión: demo
if (location.hash === '#demo') { if (!store.get('as_demo')) { store.del('as_clave'); store.del('as_rol'); } store.set('as_demo', true); }
const DEMO = !!store.get('as_demo');
const bannerDemo = () => DEMO ? `<div class="banner">🧪 MODO DEMO · sorteo simulado en este celular <button class="link osc" id="salirDemo" style="margin-left:6px">Salir</button></div>` : '';
document.addEventListener('click', e => {
  if (e.target.id === 'salirDemo') { ['as_demo', 'as_yo', 'as_clave', 'as_rol'].forEach(k => store.del(k)); location.hash = 'juego'; location.reload(); }
});

function miToken() {
  let t = store.get('as_token');
  if (!t) { const a = new Uint8Array(16); crypto.getRandomValues(a); t = [...a].map(b => b.toString(16).padStart(2, '0')).join(''); store.set('as_token', t); }
  return t;
}

async function api(accion, datos = {}) {
  const cuerpo = { accion, clave: store.get('as_clave') || '', ...datos };
  let r, j;
  try {
    if (DEMO) j = await apiLocal(accion, cuerpo);
    else {
      try { r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo), cache: 'no-store' }); }
      catch (e) { throw Object.assign(new Error('Sin conexión. Revisa tu internet e intenta de nuevo.'), { status: 0 }); }
      try { j = await r.json(); } catch (e) { throw Object.assign(new Error(`El servidor no respondió bien (${r.status}).`), { status: r.status }); }
      if (!j.ok) throw Object.assign(new Error(j.error || 'Error del servidor'), { status: r.status });
    }
  } catch (e) {
    // Clave vencida o cambiada: volver a pedirla
    if (e.status === 401 && accion !== 'entrar') { store.del('as_clave'); store.del('as_rol'); setTimeout(ruta, 0); }
    throw e;
  }
  return j;
}
// Avisos de progreso al servidor (no bloquean el juego si fallan)
function avisar(yo, evento, desafio) { api('progreso', { nombre: yo, token: miToken(), evento, desafio }).catch(() => { }); }

// Servidor simulado (misma lógica que api.php)
function apiLocal(accion, d) {
  const vacio = () => ({ token: null, reclamado_en: null, desafio_actual: null, completados: 0, ayudas: 0, saltos: 0, inicio_juego: null, ultima_actividad: null, asignado: null, orden: null, sorteado_en: null });
  const db = store.get('as_demo_db') || Object.fromEntries(NOMBRES.map(n => [n, vacio()]));
  const save = () => store.set('as_demo_db', db);
  const fallo = (m, s = 400) => Promise.reject(Object.assign(new Error(m), { status: s }));
  const ok = o => new Promise(r => setTimeout(() => r({ ok: true, ...o }), 200));
  const esAdmin = d.clave === 'demo', esJugador = esAdmin || d.clave === '151126', t = Date.now();
  const fila = db[d.nombre];
  if (accion === 'entrar') return esAdmin ? ok({ rol: 'admin' }) : esJugador ? ok({ rol: 'jugador' }) : fallo('Clave de ingreso incorrecta. (En demo: 151126, o «demo» para el anfitrión)', 401);
  if (['admin', 'liberar', 'anular', 'reiniciar', 'reiniciar_jugador'].includes(accion)) { if (!esAdmin) return fallo('Clave de anfitrión incorrecta.', 403); }
  else if (!esJugador) return fallo('Clave de ingreso incorrecta.', 401);
  if (['reclamar', 'resultado', 'sortear', 'progreso'].includes(accion) && !fila) return fallo('Ese nombre no está en la lista.', 404);
  if (['resultado', 'sortear', 'progreso'].includes(accion) && fila.token !== d.token) return fallo('Este nombre está vinculado a otro celular.', 409);
  switch (accion) {
    case 'estado': return ok({ ahora: t, inicio: null, participantes: NOMBRES.map(n => ({ nombre: n, ocupado: !!db[n].token, termino: !!db[n].asignado })) });
    case 'reclamar':
      if (fila.token && fila.token !== d.token) return fallo('Este nombre ya se está usando en otro celular. Pídele al anfitrión que lo libere.', 409);
      if (!fila.token) Object.assign(fila, { token: d.token, reclamado_en: t, ultima_actividad: t });
      save(); return ok({ asignado: fila.asignado, completados: fila.completados });
    case 'resultado': return ok({ asignado: fila.asignado, orden: fila.orden, completados: fila.completados });
    case 'progreso':
      fila.ultima_actividad = t;
      if (d.evento === 'inicio') { fila.desafio_actual = d.desafio; fila.inicio_juego = fila.inicio_juego || t; }
      if (d.evento === 'completo') { fila.completados = Math.max(fila.completados, d.desafio); fila.desafio_actual = null; fila.inicio_juego = fila.inicio_juego || t; }
      if (d.evento === 'ayuda') fila.ayudas++;
      if (d.evento === 'salto') fila.saltos++;
      save(); return ok({});
    case 'sortear': {
      if (fila.asignado) return ok({ asignado: fila.asignado, orden: fila.orden });
      const tomados = new Set(NOMBRES.map(n => db[n].asignado).filter(Boolean));
      const pendientes = NOMBRES.filter(n => !db[n].asignado);
      let cand = NOMBRES.filter(n => n !== d.nombre && !tomados.has(n));
      if (pendientes.length === 2) { const otro = pendientes.find(n => n !== d.nombre); if (cand.includes(otro)) cand = [otro]; }
      if (!cand.length) return fallo('No quedan personas para sortear. Avísale al anfitrión.', 409);
      Object.assign(fila, { asignado: cand[Math.floor(Math.random() * cand.length)], orden: Math.max(0, ...NOMBRES.map(n => db[n].orden || 0)) + 1, sorteado_en: t, completados: Math.max(fila.completados, 2), desafio_actual: 3, ultima_actividad: t });
      save(); return ok({ asignado: fila.asignado, orden: fila.orden });
    }
    case 'admin': return ok({ inicio: null, ahora: t, participantes: NOMBRES.map(n => ({ nombre: n, ocupado: !!db[n].token, ...db[n], token: undefined })) });
    case 'liberar': Object.assign(fila, { token: null, reclamado_en: null }); save(); return ok({});
    case 'anular': Object.assign(fila, { asignado: null, orden: null, sorteado_en: null }); save(); return ok({});
    case 'reiniciar_jugador': db[d.nombre] = vacio(); save(); return ok({});
    case 'reiniciar': store.del('as_demo_db'); return ok({});
  }
  return fallo('Acción desconocida.');
}

let ESTADO = null, DESFASE = 0; // DESFASE: diferencia entre el reloj del servidor y el del celular
const ahoraServidor = () => Date.now() + DESFASE;
async function cargarEstado() { ESTADO = await api('estado'); DESFASE = ESTADO.ahora - Date.now(); return ESTADO; }

/* ---------- progreso local (rondas jugadas en este celular) ---------- */
const nuevoProg = () => ({ inicio: null, rondas: [false, false, false], fin: null, asignado: null });
const claveProg = yo => 'as_prog_' + (DEMO ? 'demo_' : '') + yo;
const prog = yo => Object.assign(nuevoProg(), store.get(claveProg(yo)) || {});
const guardar = (yo, p) => store.set(claveProg(yo), p);
// Frases navideñas: cada jugador ve 3 distintas (y cambian entre jugadores)
const FRASES = [
  'La Navidad no está debajo del árbol, sino alrededor de la mesa.',
  'El mejor regalo no cabe en una caja: es el tiempo que compartimos.',
  'Una luz pequeña basta para vencer la noche más larga.',
  'Dar con el corazón vale más que dar con las manos llenas.',
  'En Navidad, cada abrazo es un regalo que no necesita envoltura.',
  'Lo que hace brillar una casa no son las luces, sino quienes la habitan.',
  'La paz del mundo empieza con una sonrisa en casa.',
  'Quien guarda la Navidad en el corazón, la tiene todo el año.',
  'Los recuerdos son los adornos que nunca se guardan en la caja.',
  'La familia es la estrella que guía nuestro camino.',
  'No importa cuántos regalos haya, sino cuántos estemos juntos.',
  'Un gesto amable es la tradición navideña más bonita.',
  'La magia de la Navidad está en los pequeños detalles.',
  'Cada Navidad es una nueva oportunidad para empezar de nuevo.',
  'El amor es lo único que crece cuando se reparte.',
];
const frase = (yo, i) => FRASES[(NOMBRES.indexOf(yo) * 3 + i) % FRASES.length];
// WhatsApp del anfitrión (código de país + número, sin + ni espacios)
const WHATSAPP_ANFITRION = '51928504589';

/* ---------- vistas ---------- */
function pantalla(html) { app.innerHTML = SVG_GUIRNALDA + html; scrollTo(0, 0); }
const HERO = `<header class="hero">${SVG_ARBOL}<h1>Amigo Secreto</h1><p class="sub">Familiar · Navidad 2026</p></header>`;

function vistaCargando() { pantalla(`${HERO}<p class="saludo">Conectando… 🎄</p>`); }

function vistaError(msg, reintentar) {
  pantalla(`${HERO}<section class="card centro"><h2>¡Ups!</h2><p class="desc">${esc(msg)}</p><p style="margin-top:14px"><button class="btn" id="reint">🔄 Reintentar</button></p></section>`);
  $('#reint').onclick = reintentar || ruta;
}

function vistaClave() {
  pantalla(`
    ${HERO}${bannerDemo()}
    <section class="card centro">
      <h2>¡Bienvenido!</h2>
      <p class="desc">Ingresa la clave del Amigo Secreto</p>
      <form class="resp" id="fclave">
        <input type="password" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="• • • • • •" required style="text-align:center;letter-spacing:.3em;font-size:26px">
        <button class="btn">Entrar 🎄</button>
      </form>
    </section>`);
  $('#fclave').onsubmit = async e => {
    e.preventDefault();
    const inp = $('#fclave input'), v = inp.value.trim();
    try {
      const r = await api('entrar', { clave: v });
      store.set('as_clave', v); store.set('as_rol', r.rol); sonido('bien');
      ruta();
    } catch (err) { fallo(inp, err.message); inp.value = ''; }
  };
}

function vistaInicio() {
  const yoToken = miToken();
  const estado = Object.fromEntries((ESTADO?.participantes || []).map(p => [p.nombre, p]));
  pantalla(`
    ${HERO}${bannerDemo()}
    <section class="card"><h2>¿Quién eres?</h2>
      <p class="nota">Elige tu nombre. Supera tus 3 desafíos y descubrirás quién es tu amigo secreto.</p>
      <div class="nombres">${DATA.participantes.map(p => {
        const e = estado[p.nombre] || {};
        return `<button class="nombre" data-n="${esc(p.nombre)}" ${e.ocupado ? 'data-ocupado="1"' : ''}><span class="emo">${p.icono}</span>${esc(p.nombre)}${e.termino ? '<span class="est">✅</span>' : e.ocupado ? '<span class="est">🔒</span>' : ''}</button>`;
      }).join('')}</div>
      <p class="nota" style="margin-top:10px">🔒 = ya se está jugando en otro celular · ✅ = ya sorteó</p>
    </section>`);
  $$('.nombre').forEach(b => b.onclick = async () => {
    const n = b.dataset.n;
    const i = await modal(`<h3>¿Eres ${esc(n)}?</h3><p>Este nombre quedará vinculado a este celular.</p>`, [{ t: 'No', cls: 'sec' }, { t: '¡Sí, soy yo!', cls: 'verde' }]);
    if (i !== 1) return;
    try {
      const r = await api('reclamar', { nombre: n, token: yoToken });
      store.set('as_yo', n);
      const p = prog(n);
      if (r.asignado) p.asignado = r.asignado;
      if (r.completados) p.rondas = p.rondas.map((x, k) => x || k < r.completados);
      guardar(n, p);
      vistaHub(n);
    } catch (e) { await modal(`<h3>No se pudo</h3><p>${esc(e.message)}</p>`, [{ t: 'OK' }]); ruta(); }
  });
}

function vistaCuenta() {
  const pintar = () => {
    if (!$('#reloj')) return clearInterval(vistaCuenta.iv);
    const ms = ESTADO.inicio - ahoraServidor();
    if (ms <= 0) { clearInterval(vistaCuenta.iv); return ruta(); }
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
    $('#reloj').textContent = `${d ? d + 'd ' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };
  pantalla(`${HERO}
    <section class="card centro">
      <h2>El juego empieza en…</h2>
      <div class="final-nombre" id="reloj" style="font-family:'Nunito',system-ui,sans-serif;font-weight:900;font-size:44px">--:--:--</div>
      <p class="desc">${new Date(ESTADO.inicio).toLocaleString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
    </section>`);
  clearInterval(vistaCuenta.iv); pintar(); vistaCuenta.iv = setInterval(pintar, 1000);
}

function vistaHub(yo) {
  const P = participante(yo), p = prog(yo);
  if (!p.inicio) { p.inicio = Date.now(); guardar(yo, p); }
  const rondas = [0, 1, 2].map(i => {
    const hecha = p.rondas[i], abierta = i === 0 || p.rondas[i - 1];
    return `<div class="ronda ${hecha ? 'hecha' : abierta ? 'abierta' : 'bloq'}">
      <div class="ronda-num">${hecha ? '✅' : abierta ? '🎁' : '🔒'}</div>
      <div class="ronda-txt"><b>Desafío ${i + 1}</b><small>${i === 2 ? (hecha ? '¡Descifrado!' : 'Descifra el nombre de tu amigo secreto') : hecha ? '¡Superado!' : abierta ? 'Listo para jugar' : 'Bloqueado'}</small></div>
      ${!hecha && abierta ? `<button class="btn chico ${i === 2 ? 'oro' : ''}" data-ronda="${i}">${i === 2 ? '🔐 Descifrar' : 'Jugar'}</button>` : ''}</div>`;
  }).join('');
  const todas = p.rondas.every(Boolean);
  pantalla(`
    <div class="saludo"><h1>¡Hola, ${esc(yo)}!</h1></div>
    ${bannerDemo()}
    <section class="card">
      <div class="juego-tit">${P.icono} Tu juego</div>
      <h2>${esc(P.juego)}</h2>
      <p class="desc">${esc(P.desc)} Supera 2 desafíos y en el tercero descifra el nombre de tu amigo secreto.</p>
      ${rondas}
      ${todas && p.asignado ? `<button class="btn oro" id="sortear">🎁 Ver mi amigo secreto</button>` : ''}
    </section>
    <p class="enlace"><button class="link" id="cambiar">¿No eres ${esc(yo)}? Cambiar</button></p>`);
  $$('[data-ronda]').forEach(b => b.onclick = () => +b.dataset.ronda === 2 ? vistaSorteo(yo) : vistaReto(yo, +b.dataset.ronda));
  $('#sortear') && ($('#sortear').onclick = () => vistaResultado(yo, false));
  $('#cambiar').onclick = async () => {
    const i = await modal(`<h3>¿Cambiar de jugador?</h3><p>${esc(yo)} seguirá vinculado a este celular. Si te equivocaste de nombre, pídele al anfitrión que lo libere.</p>`, [{ t: 'Cancelar', cls: 'sec' }, { t: 'Cambiar' }]);
    if (i === 1) { store.del('as_yo'); ruta(); }
  };
  // Verifica en segundo plano que este celular sigue siendo dueño del nombre y si ya sorteó
  api('resultado', { nombre: yo, token: miToken() }).then(r => {
    if (r.asignado && !p.asignado) { p.asignado = r.asignado; guardar(yo, p); }
    if (r.completados > p.rondas.filter(Boolean).length && $('#sortear') === null && document.body.contains($('.ronda'))) { p.rondas = p.rondas.map((x, k) => x || k < r.completados); guardar(yo, p); vistaHub(yo); }
  }).catch(async e => {
    if (e.status === 409) { store.del('as_yo'); await modal(`<h3>Nombre liberado</h3><p>${esc(e.message)}</p>`, [{ t: 'OK' }]); ruta(); }
  });
}

function vistaReto(yo, i) {
  const P = participante(yo);
  if (i === 2 && !prog(yo).asignado) return vistaSorteo(yo);
  const nivel = i === 2 ? { ...P.niveles[2], asignado: prog(yo).asignado } : P.niveles[i];
  pantalla(`
    <div class="topbar"><button id="volver">← Volver</button><span>Desafío ${i + 1} de 3</span></div>
    <section class="card reto">
      <div class="juego-tit">${P.icono} ${esc(P.juego)}</div>
      <h2>${nivel.enunciado}</h2>
      <div id="zona"></div>
      <div id="extras"></div>
    </section>`);
  $('#volver').onclick = () => vistaHub(yo);
  const zona = $('#zona'), extras = $('#extras');
  let terminado = false;
  const ganar = () => { if (terminado) return; terminado = true; RETO = {}; completarRonda(yo, i); };
  RENDER[nivel.tipo](zona, nivel, ganar);
  avisar(yo, 'inicio', i + 1);
  // Pista: texto (si hay) + ayuda dentro del juego (memoria, sopa, diferencias)
  if (nivel.ayuda || zona._ayuda) {
    extras.insertAdjacentHTML('beforeend', `<button class="ayuda-btn" id="ayudaBtn">💡 Pedir ayuda</button>${nivel.ayuda ? `<p class="ayuda" id="ayuda" hidden>${nivel.ayuda}</p>` : ''}`);
    $('#ayudaBtn').onclick = () => {
      if (nivel.ayuda) $('#ayuda').hidden = false;
      avisar(yo, 'ayuda', i + 1);
      if (zona._ayuda) zona._ayuda(); else $('#ayudaBtn').remove();
    };
  }
  // Nadie se queda trabado: tras 3 fallos o 2 minutos aparece "Saltar"
  let fallos = 0;
  const ofrecerSaltar = () => {
    if (terminado || !document.body.contains(extras) || $('#saltarBtn')) return;
    extras.insertAdjacentHTML('beforeend', `<button class="ayuda-btn" id="saltarBtn" style="border-style:solid">⏭️ Saltar este desafío</button>`);
    $('#saltarBtn').onclick = async () => {
      const r = await modal('<h3>¿Saltar?</h3><p>Pasarás al siguiente desafío.</p>', [{ t: 'Seguir intentando', cls: 'sec' }, { t: 'Saltar', cls: 'verde' }]);
      if (r === 1) { avisar(yo, 'salto', i + 1); ganar(); }
    };
  };
  RETO = { onFallo: () => { if (++fallos >= 3) ofrecerSaltar(); } };
  setTimeout(ofrecerSaltar, 120000);
}

function completarRonda(yo, i) {
  const p = prog(yo); p.rondas[i] = true;
  avisar(yo, 'completo', i + 1);
  if (p.rondas.every(Boolean) && !p.fin) p.fin = Date.now();
  guardar(yo, p);
  sonido('bien'); fiesta(false);
  setTimeout(() => (i === 2 ? vistaResultado(yo, true) : vistaRegalo(yo, i)), 700);
}

function vistaRegalo(yo, i) {
  const faltan = 2 - i;
  pantalla(`
    <section class="card centro">
      <h2>¡Superaste el desafío ${i + 1}!</h2>
      <p class="desc" id="tocaRegalo">Toca el regalo 👇</p>
      <button class="regalo-btn" id="regalo" aria-label="Abrir regalo">${SVG_REGALO}</button>
      <div class="pista-grande frase" id="pista">“${frase(yo, i)}”<br><small style="font-size:16px;color:var(--gris);font-style:normal">${faltan > 1 ? 'Te faltan 2 desafíos para descubrir a tu amigo secreto.' : '¡Ahora descifra el nombre de tu amigo secreto!'}</small></div>
      <button class="btn ${faltan > 1 ? 'verde' : 'oro'}" id="seguir" hidden>${faltan > 1 ? 'Continuar' : '🔐 Ir al último desafío'}</button>
    </section>`);
  $('#regalo').onclick = () => {
    if ($('#regalo').classList.contains('abierto')) return;
    $('#regalo').classList.add('abierto'); sonido('bien'); fiesta(false);
    $('#tocaRegalo').style.visibility = 'hidden';
    $('#pista').classList.add('ver'); $('#seguir').hidden = false;
  };
  $('#seguir').onclick = () => faltan > 1 ? vistaHub(yo) : vistaSorteo(yo);
}

function vistaSorteo(yo) {
  pantalla(`
    <section class="card centro">
      <h2>¡Último desafío!</h2>
      <p class="desc" style="font-size:18px">Vas a descifrar el nombre de tu amigo secreto.<br>👀 Asegúrate de que <b>nadie más</b> vea tu pantalla.</p>
      <div style="font-size:64px;margin:10px 0">🤫</div>
      <button class="btn oro" id="listo">Estoy listo</button>
      <p style="margin-top:10px"><button class="btn sec" id="volverHub">← Volver</button></p>
    </section>`);
  $('#volverHub').onclick = () => vistaHub(yo);
  $('#listo').onclick = async () => {
    if (prog(yo).asignado) return vistaReto(yo, 2);
    pantalla(`
      <section class="card centro">
        <p class="juego-tit">🎄 Sorteando… 🎄</p>
        <h2>Eligiendo a tu amigo secreto</h2>
        <div class="tragamonedas" id="slot">🎁</div>
        <p class="desc">🥁🥁🥁</p>
      </section>`);
    const figuras = ['🎁', '🎄', '⭐', '🔔', '⛄', '🦌'];
    let k = 0, activo = true;
    const girar = () => { if (!activo || !$('#slot')) return; $('#slot').textContent = figuras[k++ % figuras.length]; setTimeout(girar, 110); };
    girar();
    try {
      const [r] = await Promise.all([api('sortear', { nombre: yo, token: miToken() }), new Promise(res => setTimeout(res, 2000))]);
      activo = false;
      const p = prog(yo); p.asignado = r.asignado; guardar(yo, p);
      vistaReto(yo, 2);
    } catch (e) {
      activo = false;
      if (e.status === 409 && /otro celular/.test(e.message)) store.del('as_yo');
      vistaError(e.message, () => (store.get('as_yo') ? vistaSorteo(yo) : ruta()));
    }
  };
}

function vistaResultado(yo, recien) {
  const p = prog(yo);
  const num = WHATSAPP_ANFITRION;
  const msg = `🎄 Hola, soy ${yo}. Mi amigo secreto es ${p.asignado}.`;
  const wa = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  pantalla(`
    <section class="card centro">
      <p class="juego-tit">🎄 ¡Lo lograste, ${esc(yo)}! 🎄</p>
      <h2 style="margin-bottom:0">Tu amigo secreto es</h2>
      <button class="final-nombre ${recien ? '' : 'oculto'}" id="nombreRes" style="background:none;border:0;cursor:pointer;width:100%">${esc(p.asignado)}</button>
      ${recien ? '' : '<p class="nota" id="tocaVer">Toca el nombre para verlo</p>'}
      <a class="btn verde wa" style="display:block;text-decoration:none;margin-top:8px" href="${wa}" target="_blank" rel="noopener">📲 Enviar por WhatsApp al anfitrión</a>
      <p class="nota">Se enviará: “${esc(msg)}”</p>
      <p class="desc" style="margin-top:12px">🤫 No se lo cuentes a nadie más.</p>
      <p style="margin-top:10px"><button class="btn sec" id="ocultar">🙈 Ocultar nombre</button></p>
    </section>`);
  $('#nombreRes').onclick = () => { $('#nombreRes').classList.toggle('oculto'); $('#tocaVer') && $('#tocaVer').remove(); };
  $('#ocultar').onclick = () => $('#nombreRes').classList.add('oculto');
  if (recien) { sonido('final'); fiesta(true); }
}
