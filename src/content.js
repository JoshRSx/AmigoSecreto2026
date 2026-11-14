// Contenido en texto plano. build.js ofusca las respuestas antes de generar index.html.
// r: respuestas aceptadas (se normalizan: sin tildes, mayúsculas, espacios ni artículos iniciales).
// correcta: índice de la opción correcta (tipo "opciones").

const tablaColores = (clave) =>
  `<table class="tabla"><tr><th>Color</th><th>Letra</th></tr>${clave
    .map(([c, l]) => `<tr><td class="emo">${c}</td><td><b>${l}</b></td></tr>`)
    .join('')}</table>`;

const codigo = (arr) =>
  `<div class="codigo">${arr.map((c) => `<span>${c}</span>`).join('')}</div>`;

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const abecedario = `<details class="abc"><summary>Ver tabla A=1 … Z=26</summary><div class="abc-grid">${ABC.map(
  (l, i) => `<span><b>${l}</b>${i + 1}</span>`
).join('')}</div></details>`;

const operaciones = (ops) =>
  `<p class="nota">Clave: A = 1, B = 2, C = 3 … Z = 26 (sin Ñ)</p><ol class="ops">${ops
    .map((o) => `<li>${o} = <span class="hueco">?</span></li>`)
    .join('')}</ol>${abecedario}`;

const coordenadas = (filas, cod) => {
  const n = filas[0].split(' ').length;
  const letras = 'ABCDE';
  let h = `<table class="tabla coord"><tr><th></th>${Array.from({ length: n }, (_, i) => `<th>${i + 1}</th>`).join('')}</tr>`;
  filas.forEach((f, r) => {
    h += `<tr><th>${letras[r]}</th>${f.split(' ').map((c) => `<td>${c}</td>`).join('')}</tr>`;
  });
  return h + `</table><div class="codigo txt">${cod}</div>`;
};

const lista = (items) => `<ul class="lista">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const emojis = (s) => `<div class="emojis">${s}</div>`;
const letras = (s) => `<div class="letras">${s.split(' ').map((l) => `<span>${l}</span>`).join('')}</div>`;
const serie = (s) => `<div class="serie">${s}</div>`;


// Cada juego está inspirado en la profesión o actividad de la persona.
module.exports = {
  intentos: 2,
  participantes: [
    {
      nombre: 'Joshua', icono: '💻', juego: 'Depurando la Navidad',
      desc: 'Retos de programador: código, binario y mensajes cifrados.',
      niveles: [
        { tipo: 'opciones', enunciado: '¿Qué muestra este código?', visual: '<div class="serie" style="font-family:monospace;font-size:22px">console.log(2 + 3 * 2)</div>', opciones: ['10', '8', '12', '7'], correcta: 1, ayuda: 'La multiplicación va antes que la suma.' },
        { tipo: 'texto', enunciado: 'Convierte de binario a decimal', visual: serie('1100₂ = ?'), ayuda: '8 + 4 + 0 + 0', r: ['12', 'doce'] },
        { tipo: 'texto', enunciado: 'Mensaje cifrado: cada letra se corrió una posición hacia adelante (A→B). Descífralo.', visual: letras('O B W J E B E'), ayuda: 'Retrocede una letra: O→N, B→A…', r: ['navidad'] },
      ],
    },
    {
      nombre: 'Estephany', icono: '📚', juego: 'Examen sorpresa navideño',
      desc: 'Preguntas de colegio con espíritu navideño.',
      niveles: [
        { tipo: 'texto', enunciado: 'Papá Noel resolvió esta ecuación. ¿Cuánto vale x?', visual: serie('3x + 5 = 20'), ayuda: 'Primero resta 5 a ambos lados.', r: ['5', 'cinco', 'x5'] },
        { tipo: 'opciones', enunciado: 'La estrella del árbol es dorada. ¿Cuál es el símbolo químico del oro?', opciones: ['Ag', 'Au', 'Or', 'O'], correcta: 1, ayuda: 'Viene del latín «aurum».' },
        { tipo: 'sopa', enunciado: 'Encuentra los 3 cursos escondidos', palabras: ['QUIMICA', 'HISTORIA', 'ARTE'], tam: 8, semilla: 41 },
      ],
    },
    {
      nombre: 'Dante', icono: '📊', juego: 'Auditoría navideña',
      desc: 'Cuadra las cuentas de Papá Noel y encuentra el error.',
      niveles: [
        { tipo: 'texto', enunciado: 'Libro de Papá Noel. ¿Cuál es el saldo?', visual: lista(['Debe: S/ 500 + S/ 300', 'Haber: S/ 200']), ayuda: 'Saldo = total del Debe − total del Haber.', r: ['600', 's600', 'seiscientos'] },
        { tipo: 'opciones', enunciado: 'Un regalo cuesta S/ 200 sin IGV. ¿Cuánto es el IGV (18 %)?', opciones: ['S/ 18', 'S/ 36', 'S/ 20', 'S/ 38'], correcta: 1, ayuda: '10 % de 200 es 20; 8 % es 16.' },
        { tipo: 'opciones', enunciado: 'Auditoría: <b>una</b> de estas sumas está mal. ¿Cuál?', opciones: ['120 + 80 = 200', '45 + 55 = 100', '230 + 70 = 310', '15 + 35 = 50'], correcta: 2, ayuda: 'Revisa las decenas con calma.' },
      ],
    },
    {
      nombre: 'Guillermo', icono: '📹', juego: 'Central de monitoreo',
      desc: 'Revisa las cámaras, activa la alarma y ubica al intruso.',
      niveles: [
        { tipo: 'diferencias', enunciado: 'Cámara 1: encuentra las 4 cosas que cambiaron', difs: ['ventana', 'nariz', 'regalo', 'esfera'] },
        { tipo: 'candado', enunciado: 'Desactiva la alarma con el código', visual: lista(['1.º ¿Cuánto es 10 − 9?', '2.º Colores de un semáforo', '3.º Ruedas de un auto', '4.º Lados de un hexágono']), ayuda: 'Un hexágono tiene 6 lados.', r: ['1346'] },
        { tipo: 'opciones', enunciado: 'Un intruso pasó por 3 cámaras. La cámara 2 lo vio primero. La cámara 1 lo vio después que la 3. <b>¿Cuál lo vio al final?</b>', opciones: ['Cámara 1', 'Cámara 2', 'Cámara 3'], correcta: 0, ayuda: 'Ordena: primero la 2, luego…' },
      ],
    },
    {
      nombre: 'Josefina', icono: '🍲', juego: 'La cocina navideña',
      desc: 'Juegos de la cocina y la casa. ¡Tómate tu tiempo!',
      niveles: [
        { tipo: 'memoria', enunciado: 'Memoriza y encuentra las 3 parejas', pares: ['🍳', '🥄', '🍲'], vista: 8 },
        { tipo: 'opciones', enunciado: '¿Qué ingrediente <b>NO</b> va en el chocolate caliente?', opciones: ['Leche', 'Cacao', 'Azúcar', 'Cebolla'], correcta: 3 },
        { tipo: 'opciones', enunciado: '¿Qué preparamos con esto en Navidad?', visual: emojis('🥛 + 🍫'), opciones: ['Chocolatada', 'Ensalada', 'Sopa'], correcta: 0 },
      ],
    },
    {
      nombre: 'Gabriel', icono: '🩺', juego: 'Consulta médica navideña',
      desc: 'Diagnostica, ordena y resuelve el caso clínico.',
      niveles: [
        { tipo: 'opciones', enunciado: '¿Cuántos huesos tiene el cuerpo humano adulto?', opciones: ['150', '206', '300', '98'], correcta: 1, ayuda: 'Más de 200.' },
        { tipo: 'texto', enunciado: 'Ordena las letras: el órgano que más trabaja en Navidad', visual: letras('Z O N A R C O'), ayuda: 'Bombea la sangre.', r: ['corazon'] },
        { tipo: 'opciones', enunciado: 'Tres pacientes: uno con fiebre, otro con tos y otro con dolor de rodilla. <b>¿Quién tiene fiebre?</b>', visual: lista(['Ana no tiene fiebre ni tos.', 'Beto no tiene fiebre.']), opciones: ['Ana', 'Beto', 'Carla'], correcta: 2, ayuda: '¿Qué le queda a Ana?' },
      ],
    },
    {
      nombre: 'Noemí', icono: '✏️', juego: 'Clase de Navidad',
      desc: 'Ortografía, útiles y adivinanzas de la profe.',
      niveles: [
        { tipo: 'opciones', enunciado: 'Corrige la tarea: ¿cuál está bien escrita?', opciones: ['Nabidad', 'Navidad', 'Nabidat', 'Navidat'], correcta: 1 },
        { tipo: 'sopa', enunciado: 'Encuentra los 3 útiles escolares', palabras: ['LAPIZ', 'CUADERNO', 'PIZARRA'], tam: 8, semilla: 52 },
        { tipo: 'texto', enunciado: 'Tengo hojas y no soy árbol, tengo lomo y no soy caballo. ¿Qué soy?', ayuda: 'Está en la mochila y en la biblioteca.', r: ['libro', 'libros'] },
      ],
    },
    {
      nombre: 'Patricia', icono: '🍎', juego: 'Recreo navideño',
      desc: 'Letras, plurales y memoria de salón de clases.',
      niveles: [
        { tipo: 'texto', enunciado: 'Ordena las letras', visual: letras('L A U C E S E'), ayuda: 'Ahí trabajas de lunes a viernes.', r: ['escuela'] },
        { tipo: 'opciones', enunciado: '¿Cuál es el plural correcto de «lápiz»?', opciones: ['Lápizes', 'Lápices', 'Lápiz', 'Lapises'], correcta: 1 },
        { tipo: 'memoria', enunciado: 'Memoriza y encuentra las 6 parejas', pares: ['🍎', '📚', '✏️', '🎒', '📏', '🖍️'], vista: 6 },
      ],
    },
    {
      nombre: 'Fernando', icono: '🖥️', juego: 'Soporte técnico navideño',
      desc: 'Redes, puertos y coordenadas para el jefe de sistemas.',
      niveles: [
        { tipo: 'opciones', enunciado: '¿Qué significan las siglas «WWW»?', opciones: ['World Wide Web', 'Wireless Web Window', 'World Web Wire', 'Wide Wireless Web'], correcta: 0 },
        { tipo: 'candado', enunciado: 'Abre el rack del servidor', visual: lista(['Los dos primeros dígitos: el puerto de HTTP', 'Los dos últimos dígitos: el puerto de SSH']), ayuda: 'HTTP usa el 80.', r: ['8022'] },
        { tipo: 'texto', enunciado: 'Sigue las coordenadas: ¿dónde guardamos los archivos?', visual: coordenadas(['N X T R', 'Q U M B', 'E L O P', 'K S D I'], 'A1 · B2 · B4 · C1'), ayuda: 'A1 es la fila A, columna 1.', r: ['nube', 'lanube'] },
      ],
    },
    {
      nombre: 'Valeria', icono: '🧸', juego: 'El taller de Papá Noel',
      desc: 'Juegos con dibujos. ¡Pide ayuda si la necesitas!',
      niveles: [
        { tipo: 'memoria', enunciado: 'Encuentra las parejas', pares: ['🎄', '⭐', '🎁'], vista: 6 },
        { tipo: 'diferencias', enunciado: 'Encuentra las 3 diferencias', difs: ['estrella', 'luna', 'puerta'] },
        { tipo: 'opciones', enunciado: '¿Cuántos regalos hay?', visual: emojis('🎁🎁🎁🎁🎁'), opciones: ['3', '4', '5', '6'], correcta: 2 },
      ],
    },
    {
      nombre: 'Cesar', icono: '🔬', juego: 'Laboratorio navideño',
      desc: 'Muestras, palabras y secuencias de laboratorio.',
      niveles: [
        { tipo: 'opciones', enunciado: '¿Qué grupo sanguíneo es el donante universal?', opciones: ['O−', 'AB+', 'A+', 'B−'], correcta: 0 },
        { tipo: 'texto', enunciado: 'Ordena las letras', visual: letras('R O T A L O B I R A O'), ayuda: 'Donde trabajas con muestras.', r: ['laboratorio'] },
        { tipo: 'texto', enunciado: 'Un cultivo crece así. ¿Qué número sigue?', visual: serie('2 – 6 – 18 – 54 – ?'), ayuda: 'Cada número se multiplica por 3.', r: ['162'] },
      ],
    },
    {
      nombre: 'Jhency', icono: '🏥', juego: 'Guardia en pediatría',
      desc: 'Retos del hospital del niño.',
      niveles: [
        { tipo: 'opciones', enunciado: '¿Cuál es la temperatura normal del cuerpo?', opciones: ['36,5 °C', '40 °C', '30 °C', '42 °C'], correcta: 0 },
        { tipo: 'opciones', enunciado: 'Tres niños en pediatría: uno con yeso, otro con vendaje y otro con curita. <b>¿Quién tiene yeso?</b>', visual: lista(['Leo no tiene yeso ni vendaje.', 'Mía no tiene yeso.']), opciones: ['Leo', 'Mía', 'Sol'], correcta: 2, ayuda: '¿Qué tiene Leo entonces?' },
        { tipo: 'memoria', enunciado: 'Memoriza y encuentra las 6 parejas', pares: ['🩺', '💉', '🌡️', '🧸', '💊', '🩹'], vista: 6 },
      ],
    },
    {
      nombre: 'Juliett', icono: '🍳', juego: 'La tienda de utensilios',
      desc: 'Atiende a los clientes de la tienda navideña.',
      niveles: [
        { tipo: 'opciones', enunciado: 'Un cliente quiere servir la sopa de Navidad. ¿Qué le recomiendas?', opciones: ['Cucharón', 'Tenedor', 'Espátula', 'Pinza'], correcta: 0 },
        { tipo: 'candado', enunciado: 'Caja registradora: escribe el precio final con 4 dígitos', visual: lista(['Un juego de ollas cuesta S/ 1000.', 'Tiene 20 % de descuento.']), ayuda: 'El 20 % de 1000 es 200. Ej.: S/ 950 se escribe 0950.', r: ['0800'] },
        { tipo: 'sopa', enunciado: 'Encuentra los 4 utensilios', palabras: ['OLLA', 'SARTEN', 'CUCHARA', 'TAZA'], tam: 8, semilla: 63 },
      ],
    },
    {
      nombre: 'Ashley', icono: '🎒', juego: 'La ruleta de los desafíos',
      desc: 'Gira la ruleta y supera el desafío que te toque.',
      niveles: [1, 2, 3].map(() => ({ tipo: 'ruleta', enunciado: 'Gira la ruleta' })),
    },
  ],
};

// Desafíos de la ruleta de Ashley (uno por categoría y nivel)
const R = [
  [
    { tipo: 'texto', enunciado: 'Blanca por dentro, verde por fuera; si quieres que te lo diga, espera. ¿Qué es?', r: ['pera'] },
    { tipo: 'texto', enunciado: '¿Cuál es la capital del Perú?', r: ['lima'] },
    { tipo: 'texto', enunciado: '¿Cuánto es 7 × 8?', r: ['56', 'cincuentayseis', 'cincuenta y seis'] },
    { tipo: 'texto', enunciado: 'Ordena estas letras:', visual: letras('R O G A L E'), r: ['regalo'] },
    { tipo: 'opciones', enunciado: '¿Cuál sobra?', opciones: ['🍎', '🍌', '🚗', '🍇'], correcta: 2 },
    { tipo: 'texto', enunciado: 'Si hoy es domingo, ¿qué día será pasado mañana?', r: ['martes'] },
  ],
  [
    { tipo: 'texto', enunciado: 'Oro parece, plata no es. ¿Qué es?', r: ['platano', 'banana', 'banano'] },
    { tipo: 'texto', enunciado: '¿En qué país está Machu Picchu?', r: ['peru'] },
    { tipo: 'texto', enunciado: '¿Cuánto es 15 + 27?', r: ['42', 'cuarentaydos', 'cuarenta y dos'] },
    { tipo: 'texto', enunciado: 'Ordena estas letras:', visual: letras('Z A P'), r: ['paz'] },
    { tipo: 'opciones', enunciado: '¿Cuál NO es un color?', opciones: ['Rojo', 'Azul', 'Mesa', 'Verde'], correcta: 2 },
    { tipo: 'texto', enunciado: 'Tengo 3 manzanas y me como una. ¿Cuántas me quedan?', r: ['2', 'dos'] },
  ],
  [
    { tipo: 'texto', enunciado: 'Vuela sin alas, silba sin boca y no lo puedes ver. ¿Qué es?', r: ['viento', 'aire'] },
    { tipo: 'texto', enunciado: '¿Cuántos días tiene diciembre?', r: ['31', 'treintayuno', 'treinta y uno'] },
    { tipo: 'texto', enunciado: '¿Cuánto es 100 − 37?', r: ['63', 'sesentaytres', 'sesenta y tres'] },
    { tipo: 'texto', enunciado: 'Ordena estas letras:', visual: letras('A L E V'), r: ['vela'] },
    { tipo: 'opciones', enunciado: '¿Qué NO llevarías a la playa?', opciones: ['Sombrilla', 'Toalla', 'Bufanda', 'Bloqueador'], correcta: 2 },
    { tipo: 'texto', enunciado: 'Un padre y su hijo suman 36 años. El padre tiene 30 años más que el hijo. ¿Cuántos años tiene el hijo?', r: ['3', 'tres'] },
  ],
];
module.exports.participantes.find((p) => p.nombre === 'Ashley').niveles.forEach((n, i) => (n.retos = R[i]));
