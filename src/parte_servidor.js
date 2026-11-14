/* ---------- conexión con el servidor ---------- */
const API_URL = 'api.php';
// #demo: simula el servidor dentro del navegador (para probar sin hosting). PIN del panel en demo: demo
if (location.hash === '#demo') store.set('as_demo', true);
const DEMO = !!store.get('as_demo');
const bannerDemo = () => DEMO ? `<div class="banner">🧪 MODO DEMO · sorteo simulado en este celular <button class="link osc" id="salirDemo" style="margin-left:6px">Salir</button></div>` : '';
document.addEventListener('click', e => {
  if (e.target.id === 'salirDemo') { store.del('as_demo'); store.del('as_yo'); location.hash = 'juego'; location.reload(); }
});

function miToken() {
  let t = store.get('as_token');
  if (!t) { const a = new Uint8Array(16); crypto.getRandomValues(a); t = [...a].map(b => b.toString(16).padStart(2, '0')).join(''); store.set('as_token', t); }
  return t;
}

async function api(accion, datos = {}) {
  if (DEMO) return apiLocal(accion, datos);
  let r, j;
  try { r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion, ...datos }), cache: 'no-store' }); }
  catch (e) { throw Object.assign(new Error('Sin conexión. Revisa tu internet e intenta de nuevo.'), { status: 0 }); }
  try { j = await r.json(); } catch (e) { throw Object.assign(new Error(`El servidor no respondió bien (${r.status}).`), { status: r.status }); }
  if (!j.ok) throw Object.assign(new Error(j.error || 'Error del servidor'), { status: r.status });
  return j;
}

// Servidor simulado (misma lógica que api.php)
function apiLocal(accion, d) {
  const db = store.get('as_demo_db') || Object.fromEntries(NOMBRES.map(n => [n, { token: null, asignado: null, orden: null }]));
  const save = () => store.set('as_demo_db', db);
  const fallo = (m, s = 400) => Promise.reject(Object.assign(new Error(m), { status: s }));
  const ok = o => new Promise(r => setTimeout(() => r({ ok: true, ...o }), 250));
  const fila = db[d.nombre];
  if (['reclamar', 'resultado', 'sortear'].includes(accion) && !fila) return fallo('Ese nombre no está en la lista.', 404);
  if (['admin', 'liberar', 'anular', 'reiniciar'].includes(accion) && d.pin !== 'demo') return fallo('PIN incorrecto. (En demo es: demo)', 403);
  switch (accion) {
    case 'estado': return ok({ ahora: Date.now(), inicio: null, whatsapp: '', participantes: NOMBRES.map(n => ({ nombre: n, ocupado: !!db[n].token, termino: !!db[n].asignado })) });
    case 'reclamar':
      if (fila.token && fila.token !== d.token) return fallo('Este nombre ya se está usando en otro celular. Pídele al anfitrión que lo libere.', 409);
      fila.token = d.token; save(); return ok({ asignado: fila.asignado });
    case 'resultado':
      if (fila.token !== d.token) return fallo('Este nombre está vinculado a otro celular.', 409);
      return ok({ asignado: fila.asignado, orden: fila.orden });
    case 'sortear': {
      if (fila.token !== d.token) return fallo('Este nombre está vinculado a otro celular.', 409);
      if (fila.asignado) return ok({ asignado: fila.asignado, orden: fila.orden });
      const tomados = new Set(NOMBRES.map(n => db[n].asignado).filter(Boolean));
      const pendientes = NOMBRES.filter(n => !db[n].asignado);
      let cand = NOMBRES.filter(n => n !== d.nombre && !tomados.has(n));
      if (pendientes.length === 2) { const otro = pendientes.find(n => n !== d.nombre); if (cand.includes(otro)) cand = [otro]; }
      if (!cand.length) return fallo('No quedan personas para sortear. Avísale al anfitrión.', 409);
      fila.asignado = cand[Math.floor(Math.random() * cand.length)];
      fila.orden = Math.max(0, ...NOMBRES.map(n => db[n].orden || 0)) + 1; fila.sorteado_en = new Date().toLocaleString('es-PE'); save();
      return ok({ asignado: fila.asignado, orden: fila.orden });
    }
    case 'admin': return ok({ inicio: null, ahora: Date.now(), participantes: NOMBRES.map(n => ({ nombre: n, ocupado: !!db[n].token, asignado: db[n].asignado, orden: db[n].orden, sorteado_en: db[n].sorteado_en || null })).sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)) });
    case 'liberar': fila.token = null; save(); return ok({});
    case 'anular': Object.assign(fila, { asignado: null, orden: null, sorteado_en: null }); save(); return ok({});
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
const MENSAJES = ['¡Eres una máquina! 🎉', '¡Toda la familia te aplaude! 👏', '¡Nivel experto desbloqueado! 🧠'];

/* ---------- vistas ---------- */
function pantalla(html) { app.innerHTML = SVG_GUIRNALDA + html; scrollTo(0, 0); }
const HERO = `<header class="hero">${SVG_ARBOL}<h1>Amigo Secreto</h1><p class="sub">Familiar · Navidad 2026</p></header>`;

function vistaCargando() { pantalla(`${HERO}<p class="saludo">Conectando… 🎄</p>`); }

function vistaError(msg, reintentar) {
  pantalla(`${HERO}<section class="card centro"><h2>¡Ups!</h2><p class="desc">${esc(msg)}</p><p style="margin-top:14px"><button class="btn" id="reint">🔄 Reintentar</button></p></section>`);
  $('#reint').onclick = reintentar || ruta;
}

function vistaInicio() {
  const yoToken = miToken();
  const estado = Object.fromEntries((ESTADO?.participantes || []).map(p => [p.nombre, p]));
  pantalla(`
    ${HERO}${bannerDemo()}
    <section class="card"><h2>¿Quién eres?</h2>
      <p class="nota">Elige tu nombre. Supera tus 3 desafíos y descubrirás a quién le regalas.</p>
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
      if (r.asignado) { const p = prog(n); p.asignado = r.asignado; p.rondas = [true, true, true]; guardar(n, p); }
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
      <div class="ronda-txt"><b>Desafío ${i + 1}</b><small>${hecha ? '¡Superado!' : abierta ? 'Listo para jugar' : 'Bloqueado'}</small></div>
      ${!hecha && abierta ? `<button class="btn chico" data-ronda="${i}">Jugar</button>` : ''}</div>`;
  }).join('');
  const todas = p.rondas.every(Boolean);
  pantalla(`
    <div class="saludo"><h1>¡Hola, ${esc(yo)}!</h1></div>
    ${bannerDemo()}
    <section class="card">
      <div class="juego-tit">${P.icono} Tu juego</div>
      <h2>${esc(P.juego)}</h2>
      <p class="desc">${esc(P.desc)} Supera los 3 desafíos para descubrir a quién le regalas.</p>
      ${rondas}
      ${todas ? `<button class="btn oro" id="sortear">${p.asignado ? '🎁 Ver a quién le regalo' : '🎁 ¡Descubre a quién le regalas!'}</button>` : ''}
    </section>
    <p class="enlace"><button class="link" id="cambiar">¿No eres ${esc(yo)}? Cambiar</button></p>`);
  $$('[data-ronda]').forEach(b => b.onclick = () => vistaReto(yo, +b.dataset.ronda));
  $('#sortear') && ($('#sortear').onclick = () => p.asignado ? vistaResultado(yo, false) : vistaSorteo(yo));
  $('#cambiar').onclick = async () => {
    const i = await modal(`<h3>¿Cambiar de jugador?</h3><p>${esc(yo)} seguirá vinculado a este celular. Si te equivocaste de nombre, pídele al anfitrión que lo libere.</p>`, [{ t: 'Cancelar', cls: 'sec' }, { t: 'Cambiar' }]);
    if (i === 1) { store.del('as_yo'); ruta(); }
  };
  // Verifica en segundo plano que este celular sigue siendo dueño del nombre y si ya sorteó
  api('resultado', { nombre: yo, token: miToken() }).then(r => {
    if (r.asignado && !p.asignado) { p.asignado = r.asignado; p.rondas = [true, true, true]; guardar(yo, p); vistaHub(yo); }
  }).catch(async e => {
    if (e.status === 409) { store.del('as_yo'); await modal(`<h3>Nombre liberado</h3><p>${esc(e.message)}</p>`, [{ t: 'OK' }]); ruta(); }
  });
}

function vistaReto(yo, i) {
  const P = participante(yo), nivel = P.niveles[i];
  pantalla(`
    <div class="topbar"><button id="volver">← Volver</button><span>Desafío ${i + 1} de 3</span></div>
    <section class="card reto">
      <div class="juego-tit">${P.icono} ${esc(P.juego)}</div>
      <h2>${nivel.enunciado}</h2>
      <div id="zona"></div>
      ${nivel.ayuda ? `<button class="ayuda-btn" id="ayudaBtn">💡 Pedir ayuda</button><p class="ayuda" id="ayuda" hidden>${nivel.ayuda}</p>` : ''}
    </section>`);
  $('#volver').onclick = () => vistaHub(yo);
  if (nivel.ayuda) $('#ayudaBtn').onclick = () => { $('#ayuda').hidden = false; $('#ayudaBtn').remove(); };
  RENDER[nivel.tipo]($('#zona'), nivel, () => completarRonda(yo, i));
}

function completarRonda(yo, i) {
  const p = prog(yo); p.rondas[i] = true;
  if (p.rondas.every(Boolean) && !p.fin) p.fin = Date.now();
  guardar(yo, p);
  sonido('bien'); fiesta(false);
  setTimeout(() => vistaRegalo(yo, i), 700);
}

function vistaRegalo(yo, i) {
  const faltan = 2 - i;
  pantalla(`
    <section class="card centro">
      <h2>¡Superaste el desafío ${i + 1}!</h2>
      <p class="desc">Toca el regalo</p>
      <button class="regalo-btn" id="regalo" aria-label="Abrir regalo">${SVG_REGALO}</button>
      <div class="pista-grande" id="pista">${MENSAJES[i]}<br><small style="font-size:17px;color:var(--gris)">${faltan ? `Te falta${faltan > 1 ? 'n' : ''} ${faltan} desafío${faltan > 1 ? 's' : ''} para descubrir a quién le regalas.` : '¡Ya puedes descubrir a quién le regalas!'}</small></div>
      <button class="btn ${faltan ? 'verde' : 'oro'}" id="seguir" hidden>${faltan ? 'Continuar' : '🎁 ¡Descubrir ahora!'}</button>
    </section>`);
  $('#regalo').onclick = () => {
    if ($('#regalo').classList.contains('abierto')) return;
    $('#regalo').classList.add('abierto'); sonido('bien'); fiesta(false);
    $('#pista').classList.add('ver'); $('#seguir').hidden = false;
  };
  $('#seguir').onclick = () => faltan ? vistaHub(yo) : vistaSorteo(yo);
}

function vistaSorteo(yo) {
  pantalla(`
    <section class="card centro">
      <h2>¡Llegó el momento!</h2>
      <p class="desc" style="font-size:18px">👀 Asegúrate de que <b>nadie más</b> esté viendo tu pantalla.</p>
      <div style="font-size:64px;margin:10px 0">🤫</div>
      <button class="btn oro" id="listo">Estoy listo, ¡sortear!</button>
    </section>`);
  $('#listo').onclick = async () => {
    pantalla(`
      <section class="card centro">
        <p class="juego-tit">🎄 Sorteando… 🎄</p>
        <h2>Te toca regalarle a…</h2>
        <div class="tragamonedas" id="slot">?</div>
        <p class="desc" id="sub">🥁🥁🥁</p>
      </section>`);
    const otros = NOMBRES.filter(n => n !== yo);
    let k = 0, activo = true, vel = 70;
    const girar = () => { if (!activo) return; $('#slot').textContent = otros[k++ % otros.length]; sonido.tick && sonido.tick(); setTimeout(girar, vel); };
    girar();
    const minimo = new Promise(r => setTimeout(r, 2800));
    try {
      const [r] = await Promise.all([api('sortear', { nombre: yo, token: miToken() }), minimo]);
      // desacelera y se detiene en el resultado
      for (const v of [110, 160, 230, 320, 430]) { vel = v; await new Promise(res => setTimeout(res, v)); }
      activo = false;
      const p = prog(yo); p.asignado = r.asignado; if (!p.fin) p.fin = Date.now(); guardar(yo, p);
      vistaResultado(yo, true);
    } catch (e) {
      activo = false;
      if (e.status === 409 && /otro celular/.test(e.message)) store.del('as_yo');
      vistaError(e.message, () => (store.get('as_yo') ? vistaSorteo(yo) : ruta()));
    }
  };
}

function vistaResultado(yo, recien) {
  const p = prog(yo);
  const num = (ESTADO?.whatsapp || '').replace(/\D/g, '');
  const msg = `🎄 Amigo Secreto 2026: soy ${yo} y me tocó regalarle a ${p.asignado}.`;
  const wa = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  pantalla(`
    <section class="card centro">
      <p class="juego-tit">🎄 ${esc(yo)}, en este Amigo Secreto… 🎄</p>
      <h2 style="margin-bottom:0">Te toca regalarle a</h2>
      <button class="final-nombre ${recien ? '' : 'oculto'}" id="nombreRes" style="background:none;border:0;cursor:pointer;width:100%">${esc(p.asignado)}</button>
      ${recien ? '' : '<p class="nota" id="tocaVer">Toca el nombre para verlo</p>'}
      ${SVG_REGALO.replace('class="regalo-svg"', 'class="regalo-svg" style="width:100px;height:100px"')}
      <p class="tiempo">${p.inicio && p.fin ? `⏱️ Tus desafíos: ${fmtTiempo(p.fin - p.inicio)}` : ''}</p>
      <p class="desc"><b>🤫 Es secreto:</b> no se lo cuentes a nadie. Solo avísale al anfitrión.</p>
      <a class="btn verde" style="display:block;text-decoration:none;margin-top:12px" href="${wa}" target="_blank" rel="noopener">📲 Avisar al anfitrión por WhatsApp</a>
      <p class="nota">Si WhatsApp no abre, escríbele: “${esc(msg)}”</p>
      <p style="margin-top:10px"><button class="btn sec" id="ocultar">🙈 Ocultar nombre</button></p>
    </section>`);
  $('#nombreRes').onclick = () => { $('#nombreRes').classList.toggle('oculto'); $('#tocaVer') && $('#tocaVer').remove(); };
  $('#ocultar').onclick = () => $('#nombreRes').classList.add('oculto');
  if (recien) { sonido('final'); fiesta(true); }
}
