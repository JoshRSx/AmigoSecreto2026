// Genera dist/index.html con las respuestas ofuscadas.
const fs = require('fs');
const path = require('path');
const data = require('./src/content.js');

const KEY = Buffer.from('navidad-2026', 'utf8');
const enc = (s) => {
  const b = Buffer.from(String(s), 'utf8');
  return Buffer.from(b.map((x, i) => x ^ KEY[i % KEY.length])).toString('base64');
};
const norm = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
    .replace(/^(el|la|los|las|un|una)\s+/, '').replace(/[^a-z0-9]/g, '');

function proc(n) {
  const o = { ...n };
  if (Array.isArray(n.r)) o.r = [...new Set(n.r.map(norm))].map(enc);
  if (n.tipo === 'opciones') { o.r = enc(String(n.correcta)); delete o.correcta; }
  if (n.retos) o.retos = n.retos.map(proc);
  return o;
}

const out = {
  intentos: data.intentos,
  participantes: data.participantes.map((p) => ({ ...p, niveles: p.niveles.map(proc) })),
};

const tpl = fs.readFileSync(path.join(__dirname, 'src/template.html'), 'utf8');
if (!tpl.includes('/*__DATA__*/null')) throw new Error('marcador no encontrado');
const parte = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const html = tpl
  .replace('/*__DATA__*/null', () => JSON.stringify(out))
  .replace('/*__PARTE_SERVIDOR__*/', () => parte('parte_servidor.js'))
  .replace('/*__PARTE_ADMIN__*/', () => parte('parte_admin.js'));
fs.writeFileSync(path.join(__dirname, 'hosting/index.html'), html);
console.log('OK', html.length, 'bytes');
