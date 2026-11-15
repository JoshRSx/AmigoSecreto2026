/* ---------- panel del anfitrión (se abre con la clave de administrador) ---------- */
const hace = ms => {
  if (!ms) return '—';
  const s = Math.max(0, Math.round((ahoraServidor() - ms) / 1000));
  if (s < 60) return 'ahora';
  const m = Math.round(s / 60); if (m < 60) return `hace ${m} min`;
  return `hace ${Math.floor(m / 60)} h ${m % 60} min`;
};
const hora = ms => ms ? new Date(ms).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—';
const duracion = (a, b) => { if (!a) return '—'; const s = Math.round(((b || ahoraServidor()) - a) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function estadoJugador(f) {
  if (f.asignado) return { txt: `✅ Sorteó (#${f.orden})`, cls: 'ok' };
  if (f.completados >= 3) return { txt: '🎁 Listo para sortear', cls: 'oro' };
  if (f.desafio_actual) return { txt: `🎮 Jugando desafío ${f.desafio_actual}/3`, cls: 'juega' };
  if (f.completados > 0) return { txt: `🎮 Superó ${f.completados}/3`, cls: 'juega' };
  if (f.ocupado) return { txt: '👋 Eligió su nombre', cls: 'entro' };
  return { txt: '⚪ Sin entrar', cls: 'nada' };
}

async function vistaAdmin() {
  let datos;
  try { datos = await api('admin'); }
  catch (e) {
    if (e.status === 403) { store.del('as_clave'); store.del('as_rol'); return ruta(); }
    return vistaError(e.message, vistaAdmin);
  }
  if (store.get('as_rol') !== 'admin') return;
  DESFASE = datos.ahora - Date.now();
  const ver = !!vistaAdmin.ver, filtro = vistaAdmin.filtro || 'todos';
  const L = datos.participantes;
  const enLinea = f => f.ultima_actividad && ahoraServidor() - f.ultima_actividad < 3 * 60 * 1000;
  const sortearon = L.filter(f => f.asignado), listos = L.filter(f => !f.asignado && f.completados >= 3);
  const jugando = L.filter(f => !f.asignado && f.completados < 3 && (f.desafio_actual || f.completados > 0));
  const sinEntrar = L.filter(f => !f.ocupado && !f.asignado && !f.completados);
  const recibidos = new Set(sortearon.map(f => f.asignado));
  const sinRegalador = NOMBRES.filter(n => !recibidos.has(n));
  const filtros = { todos: L, jugando: [...jugando, ...listos], sortearon, sin: sinEntrar };
  const visibles = [...filtros[filtro]].sort((a, b) => (b.ultima_actividad || 0) - (a.ultima_actividad || 0) || a.nombre.localeCompare(b.nombre));
  const tarjeta = (num, txt, f) => `<button class="kpi ${filtro === f ? 'act' : ''}" data-filtro="${f}"><b>${num}</b><span>${txt}</span></button>`;

  pantalla(`
    <div class="topbar"><span>👑 Anfitrión</span><button id="salir">Salir</button></div>
    ${bannerDemo()}
    <section class="card">
      <h2>Panel de moderación</h2>
      <div class="kpis">
        ${tarjeta(L.length, 'Todos', 'todos')}
        ${tarjeta(jugando.length + listos.length, 'Jugando', 'jugando')}
        ${tarjeta(`${sortearon.length}/${L.length}`, 'Sortearon', 'sortearon')}
        ${tarjeta(sinEntrar.length, 'Sin entrar', 'sin')}
      </div>
      <div class="barra-total"><div style="width:${Math.round(sortearon.length / L.length * 100)}%"></div></div>
      <p class="nota">${L.filter(enLinea).length} en línea ahora · se actualiza cada 10 s · ${datos.inicio ? 'inicio ' + new Date(datos.inicio).toLocaleString('es-PE') : 'juego abierto'}</p>
      <div class="fila">
        <button class="btn sec chico" id="toggle">${ver ? '🙈 Ocultar amigos' : '👁 Ver amigos secretos'}</button>
        <button class="btn sec chico" id="refrescar">🔄 Actualizar</button>
      </div>
    </section>

    ${visibles.map(f => {
      const e = estadoJugador(f), P = participante(f.nombre);
      return `<section class="card jug">
        <div class="jug-top">
          <div class="jug-nom"><span class="punto ${enLinea(f) ? 'on' : ''}"></span>${P ? P.icono : ''} <b>${esc(f.nombre)}</b></div>
          <button class="link osc menu" data-menu="${esc(f.nombre)}" aria-label="Opciones">⋯</button>
        </div>
        <div class="estado-tag ${e.cls}">${e.txt}</div>
        <div class="pasos">${[1, 2, 3].map(k => `<span class="${f.completados >= k ? 'hecho' : f.desafio_actual === k ? 'actual' : ''}"></span>`).join('')}</div>
        <div class="jug-datos">
          <span>📱 ${f.ocupado ? 'Eligió ' + hora(f.reclamado_en) : 'Sin celular'}</span>
          <span>🕒 ${hace(f.ultima_actividad)}</span>
          <span>⏱️ ${f.inicio_juego ? duracion(f.inicio_juego, f.sorteado_en) : '—'}</span>
          <span>💡 ${f.ayudas} ayudas</span>
          <span>⏭️ ${f.saltos} saltos</span>
        </div>
        <div class="jug-amigo">🎁 Amigo secreto: ${f.asignado ? (ver ? `<b>${esc(f.asignado)}</b> <small>(${hora(f.sorteado_en)})</small>` : '••••••') : '<span class="nota">aún no sortea</span>'}</div>
      </section>`;
    }).join('') || '<section class="card"><p class="desc">Nadie en este grupo.</p></section>'}

    <section class="card">
      <h2 class="peq">📋 Control del sorteo</h2>
      <p class="desc">Faltan sortear (${L.length - sortearon.length}): ${L.filter(f => !f.asignado).map(f => esc(f.nombre)).join(', ') || '¡nadie! 🎉'}</p>
      <p class="desc">Aún sin regalador (${sinRegalador.length}): ${ver ? (sinRegalador.map(esc).join(', ') || '—') : '<i>visible con «Ver amigos secretos»</i>'}</p>
      ${sortearon.length ? `<button class="btn sec" id="copiarLista">📋 Copiar lista de parejas</button>` : ''}
    </section>
    <section class="card">
      <h2 class="peq">⚠️ Zona de peligro</h2>
      <button class="btn sec" id="reiniciar">♻️ Reiniciar todo el sorteo</button>
    </section>`);

  $('#salir').onclick = async () => {
    const i = await modal('<h3>¿Salir del panel?</h3><p>Tendrás que volver a ingresar la clave.</p>', [{ t: 'Cancelar', cls: 'sec' }, { t: 'Salir' }]);
    if (i === 1) { store.del('as_clave'); store.del('as_rol'); clearTimeout(vistaAdmin.t); ruta(); }
  };
  $('#toggle').onclick = () => { vistaAdmin.ver = !ver; vistaAdmin(); };
  $('#refrescar').onclick = vistaAdmin;
  $$('[data-filtro]').forEach(b => b.onclick = () => { vistaAdmin.filtro = b.dataset.filtro; vistaAdmin(); });
  $('#copiarLista') && ($('#copiarLista').onclick = () => {
    const txt = '🎄 Amigo Secreto 2026\n' + sortearon.sort((a, b) => a.orden - b.orden).map(f => `${f.orden}. ${f.nombre} → ${f.asignado}`).join('\n');
    copiar(txt);
  });
  $$('[data-menu]').forEach(b => b.onclick = async () => {
    const n = b.dataset.menu;
    const i = await modal(`<h3>${esc(n)}</h3>
      <p style="text-align:left;font-size:15px"><b>📱 Liberar celular:</b> se equivocó de nombre o cambió de celular (conserva su avance).<br><br>
      <b>🎲 Anular sorteo:</b> su amigo secreto vuelve al bombo y puede sortear otra vez.<br><br>
      <b>♻️ Reiniciar jugador:</b> borra celular, avance y sorteo de esta persona.</p>`,
      [{ t: 'Cerrar', cls: 'sec' }, { t: '📱 Liberar', cls: 'verde' }, { t: '🎲 Anular' }, { t: '♻️ Reiniciar' }]);
    if (!i) return;
    const accion = ['', 'liberar', 'anular', 'reiniciar_jugador'][i];
    if (i >= 2) { const c = await modal(`<h3>¿Seguro?</h3><p>${i === 2 ? 'Anular' : 'Reiniciar'} a <b>${esc(n)}</b> no se puede deshacer.</p>`, [{ t: 'No', cls: 'sec' }, { t: 'Sí' }]); if (c !== 1) return; }
    try { await api(accion, { nombre: n }); toast('Listo ✅'); } catch (e) { toast(e.message); }
    vistaAdmin();
  });
  $('#reiniciar').onclick = async () => {
    const a = await modal('<h3>¿Reiniciar TODO?</h3><p>Se borran todos los sorteos, avances y celulares vinculados.</p>', [{ t: 'Cancelar', cls: 'sec' }, { t: 'Reiniciar' }]);
    if (a !== 1) return;
    const b = await modal('<h3>¿Seguro, seguro?</h3><p>Todos tendrán que volver a jugar y sortear.</p>', [{ t: 'No', cls: 'sec' }, { t: 'Sí, borrar todo' }]);
    if (b !== 1) return;
    try { await api('reiniciar'); toast('Sorteo reiniciado'); } catch (e) { toast(e.message); }
    vistaAdmin();
  };
  clearTimeout(vistaAdmin.t);
  vistaAdmin.t = setTimeout(() => { if (store.get('as_rol') === 'admin' && $('.kpis') && $('#modal').hidden) vistaAdmin(); }, 10000);
}

/* ---------- router ---------- */
let RUTA_ID = 0; // evita que una respuesta tardía pise una pantalla más nueva
async function ruta() {
  const id = ++RUTA_ID;
  if (!store.get('as_clave')) return vistaClave();
  if (store.get('as_rol') === 'admin') return vistaAdmin();
  vistaCargando();
  try { await cargarEstado(); } catch (e) { if (id === RUTA_ID && store.get('as_clave')) vistaError(e.message); return; }
  if (id !== RUTA_ID) return;
  const enBase = ESTADO.participantes.map(x => x.nombre);
  const faltan = NOMBRES.filter(n => !enBase.includes(n));
  if (faltan.length) return vistaError(`La base de datos no tiene estos nombres (o tienen la tilde mal guardada): ${faltan.join(', ')}. Reimporta instalar.sql en phpMyAdmin.`);
  if (ESTADO.inicio && ESTADO.inicio > ahoraServidor()) return vistaCuenta();
  const yo = store.get('as_yo');
  if (yo && NOMBRES.includes(yo)) return vistaHub(yo);
  vistaInicio();
}
addEventListener('hashchange', ruta);
ruta();
