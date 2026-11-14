/* ---------- panel del anfitrión (#organizador) ---------- */
let PIN = '';
async function vistaAdmin() {
  if (!PIN) {
    pantalla(`
      <div class="topbar"><a href="#juego" style="color:#fff;font-weight:800">← Inicio</a><span>Anfitrión</span></div>
      ${bannerDemo()}
      <section class="card"><h2>Panel del anfitrión</h2>
        <form class="resp" id="fpin"><input type="password" inputmode="text" placeholder="PIN" autocomplete="current-password" required><button class="btn">Entrar</button></form>
      </section>`);
    $('#fpin').onsubmit = async e => {
      e.preventDefault(); const v = $('#fpin input').value.trim();
      try { await api('admin', { pin: v }); PIN = v; if (location.hash === '#organizador') vistaAdmin(); } catch (err) { fallo($('#fpin input'), err.message); }
    };
    return;
  }
  let datos;
  try { datos = await api('admin', { pin: PIN }); } catch (e) { if (e.status === 403) PIN = ''; return location.hash === '#organizador' && vistaError(e.message, vistaAdmin); }
  if (location.hash !== '#organizador') return;
  const ver = !!vistaAdmin.ver;
  const lista = datos.participantes;
  const hechos = lista.filter(f => f.asignado).length, conectados = lista.filter(f => f.ocupado).length;
  pantalla(`
    <div class="topbar"><a href="#juego" style="color:#fff;font-weight:800">← Inicio</a><span>Anfitrión</span></div>
    ${bannerDemo()}
    <section class="card">
      <h2>Panel del anfitrión</h2>
      <p class="desc"><b>${hechos} de ${lista.length}</b> ya sortearon · ${conectados} celulares conectados</p>
      ${datos.inicio ? `<p class="nota">Inicio: ${new Date(datos.inicio).toLocaleString('es-PE')}</p>` : ''}
      <div class="fila"><button class="btn sec chico" id="toggle">${ver ? '🙈 Ocultar parejas' : '👁 Mostrar parejas'}</button><button class="btn sec chico" id="refrescar">🔄 Actualizar</button></div>
      <table class="tabla-admin">
        <tr><th>#</th><th>Nombre</th><th>📱</th><th>Le regala a</th><th></th></tr>
        ${lista.map(f => `<tr>
          <td>${f.orden ?? ''}</td>
          <td><b>${esc(f.nombre)}</b>${f.sorteado_en ? `<br><small>${esc(String(f.sorteado_en).slice(11, 16) || f.sorteado_en)}</small>` : ''}</td>
          <td>${f.ocupado ? '✅' : '—'}</td>
          <td>${f.asignado ? (ver ? `<b>${esc(f.asignado)}</b>` : '••••••') : '<span class="nota">pendiente</span>'}</td>
          <td><button class="link osc" data-menu="${esc(f.nombre)}">⋯</button></td></tr>`).join('')}
      </table>
      <p class="nota">Se actualiza solo cada 10 segundos.</p>
    </section>
    <section class="card">
      <h2 class="peq">Zona de peligro</h2>
      <button class="btn sec" id="reiniciar">♻️ Reiniciar todo el sorteo</button>
    </section>`);
  $('#toggle').onclick = () => { vistaAdmin.ver = !ver; vistaAdmin(); };
  $('#refrescar').onclick = vistaAdmin;
  $$('[data-menu]').forEach(b => b.onclick = async () => {
    const n = b.dataset.menu;
    const i = await modal(`<h3>${esc(n)}</h3><p><b>Liberar celular:</b> si entró con el nombre equivocado o cambió de celular.<br><b>Anular sorteo:</b> su persona vuelve al bombo y puede sortear otra vez.</p>`, [{ t: 'Cerrar', cls: 'sec' }, { t: 'Liberar', cls: 'verde' }, { t: 'Anular' }]);
    if (!i) return;
    if (i === 2) { const c = await modal(`<h3>¿Anular el sorteo de ${esc(n)}?</h3><p>Esto no se puede deshacer.</p>`, [{ t: 'No', cls: 'sec' }, { t: 'Sí, anular' }]); if (c !== 1) return; }
    try { await api(i === 1 ? 'liberar' : 'anular', { pin: PIN, nombre: n }); toast('Listo ✅'); } catch (e) { toast(e.message); }
    vistaAdmin();
  });
  $('#reiniciar').onclick = async () => {
    const a = await modal('<h3>¿Reiniciar TODO?</h3><p>Se borran todos los sorteos y celulares vinculados.</p>', [{ t: 'Cancelar', cls: 'sec' }, { t: 'Reiniciar' }]);
    if (a !== 1) return;
    const b = await modal('<h3>¿Seguro, seguro?</h3><p>Todos tendrán que volver a sortear.</p>', [{ t: 'No', cls: 'sec' }, { t: 'Sí, borrar todo' }]);
    if (b !== 1) return;
    try { await api('reiniciar', { pin: PIN }); toast('Sorteo reiniciado'); } catch (e) { toast(e.message); }
    vistaAdmin();
  };
  clearTimeout(vistaAdmin.t);
  vistaAdmin.t = setTimeout(() => { if (location.hash === '#organizador' && $('.tabla-admin') && $('#modal').hidden) vistaAdmin(); }, 10000);
}

/* ---------- router ---------- */
let RUTA_ID = 0; // evita que una respuesta tardía pise una pantalla más nueva
async function ruta() {
  const id = ++RUTA_ID;
  const h = location.hash.slice(1);
  if (h === 'organizador') return vistaAdmin();
  vistaCargando();
  try { await cargarEstado(); } catch (e) { if (id === RUTA_ID) vistaError(e.message); return; }
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
