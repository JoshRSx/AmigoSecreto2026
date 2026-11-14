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

module.exports = {
  intentos: 2, // intentos para adivinar al amigo secreto
  participantes: [
    {
      nombre: 'Joshua', icono: '😀', juego: 'El desafío de los emojis',
      desc: 'Descifra qué palabra representan los emojis.',
      niveles: [
        { tipo: 'texto', enunciado: '¿Qué palabra forman estos emojis?', visual: emojis('☀️ + 🌻'), ayuda: 'Es una flor que siempre mira hacia el sol.', r: ['girasol', 'girasoles'] },
        { tipo: 'texto', enunciado: '¿Qué parte de la casa es?', visual: emojis('🏠 + 🔥 + 🧦'), ayuda: 'Por aquí baja Papá Noel… o eso dicen.', r: ['chimenea'] },
        { tipo: 'texto', enunciado: '¿Qué noche especial es?', visual: emojis('🌃 + 👍'), ayuda: 'La noche del 24 de diciembre.', r: ['nochebuena'] },
      ],
    },
    {
      nombre: 'Estephany', icono: '🎨', juego: 'El código de colores',
      desc: 'Cada color es una letra. Usa la clave para leer el mensaje.',
      niveles: [
        { tipo: 'texto', enunciado: 'Descubre la palabra oculta', visual: tablaColores([['🟡', 'V'], ['🔴', 'N'], ['🟢', 'E'], ['🔵', 'I'], ['🟣', 'S']]) + codigo(['🔴', '🔵', '🟢', '🟡', '🟢']), ayuda: 'Cae del cielo cuando hace mucho frío.', r: ['nieve'] },
        { tipo: 'texto', enunciado: 'Descubre la palabra oculta', visual: tablaColores([['🟠', 'O'], ['🔴', 'R'], ['🟣', 'L'], ['🔵', 'E'], ['🟤', 'T'], ['🟢', 'G'], ['🟡', 'A']]) + codigo(['🔴', '🔵', '🟢', '🟡', '🟣', '🟠']), ayuda: 'Lo que todos esperan recibir hoy.', r: ['regalo'] },
        { tipo: 'texto', enunciado: 'Descubre la palabra oculta', visual: tablaColores([['🟠', 'A'], ['🟣', 'L'], ['🔴', 'E'], ['⚫', 'N'], ['🟡', 'R'], ['🔵', 'S'], ['🟢', 'T']]) + codigo(['🔴', '🔵', '🟢', '🟡', '🔴', '🟣', '🟣', '🟠']), ayuda: 'Va en la punta del árbol.', r: ['estrella'] },
      ],
    },
    {
      nombre: 'Dante', icono: '🔢', juego: 'Código matemático',
      desc: 'Resuelve las operaciones y convierte cada resultado en una letra.',
      niveles: [
        { tipo: 'texto', enunciado: 'Cada resultado es una letra. ¿Qué palabra forman?', visual: operaciones(['8 × 2', '5 − 4', '13 × 2']), ayuda: 'Lo contrario de la guerra.', r: ['paz'] },
        { tipo: 'texto', enunciado: 'Cada resultado es una letra. ¿Qué palabra forman?', visual: operaciones(['3 + 3', '10 − 5', '4 × 3', '18 ÷ 2', '20 + 6']), ayuda: '«___ Navidad»', r: ['feliz'] },
        { tipo: 'texto', enunciado: 'Cada resultado es una letra. ¿Qué palabra forman?', visual: operaciones(['4 × 5', '7 × 3', '9 × 2', '30 − 12', '45 ÷ 3', '7 + 7']), ayuda: 'Un dulce navideño muy duro.', r: ['turron'] },
      ],
    },
    {
      nombre: 'Guillermo', icono: '🕵️', juego: 'La adivinanza misteriosa',
      desc: 'Lee con atención y resuelve la adivinanza.',
      niveles: [
        { tipo: 'texto', enunciado: 'Tengo agujas y no sé coser, tengo números y no sé leer. ¿Qué soy?', ayuda: 'Lo miras para no llegar tarde.', r: ['reloj'] },
        { tipo: 'texto', enunciado: 'Tengo ciudades pero no casas, montañas pero no árboles, y agua pero no peces. ¿Qué soy?', ayuda: 'Lo usas para no perderte.', r: ['mapa', 'mapamundi'] },
        { tipo: 'texto', enunciado: 'Llego una vez al año, traigo regalos sin ser rey mago, visto de rojo y vivo en el Polo Norte. ¿Quién soy?', ayuda: 'Tiene barba blanca y renos.', r: ['papa noel', 'papanoel', 'santa claus', 'santa', 'santa clos', 'san nicolas'] },
      ],
    },
    {
      nombre: 'Josefina', icono: '🔠', juego: 'La sopa de letras secreta',
      desc: 'Encuentra todas las palabras escondidas.',
      niveles: [
        { tipo: 'sopa', enunciado: 'Encuentra las 3 palabras', palabras: ['NIEVE', 'PAZ', 'AMOR'], tam: 7, semilla: 11 },
        { tipo: 'sopa', enunciado: 'Encuentra las 3 palabras', palabras: ['REGALO', 'FAMILIA', 'ESTRELLA'], tam: 8, semilla: 22 },
        { tipo: 'sopa', enunciado: 'Encuentra las 4 palabras', palabras: ['AMISTAD', 'ALEGRIA', 'SORPRESA', 'VILLANCICO'], tam: 10, semilla: 33 },
      ],
    },
    {
      nombre: 'Gabriel', icono: '🔎', juego: 'El caso misterioso',
      desc: 'Analiza las declaraciones y descubre al culpable.',
      niveles: [
        { tipo: 'opciones', enunciado: 'Una de estas personas escondió el regalo. <b>Solo una dice la verdad.</b> ¿Quién lo escondió?', visual: lista(['Ana: «Yo no fui».', 'Luis: «Fue Pedro».', 'Pedro: «Luis está mintiendo».']), opciones: ['Ana', 'Luis', 'Pedro'], correcta: 0, ayuda: 'Prueba cada opción: imagina que fue esa persona y cuenta cuántos dicen la verdad.' },
        { tipo: 'opciones', enunciado: 'Alguien se comió las galletas de Papá Noel. <b>Solo una persona dice la verdad.</b> ¿Quién fue?', visual: lista(['Rosa: «Yo no fui».', 'Tomás: «Fue Rosa».', 'Elena: «Yo no fui».']), opciones: ['Rosa', 'Tomás', 'Elena'], correcta: 2, ayuda: 'Si fue Rosa, ¿cuántos dirían la verdad? ¿Y si fue Tomás?' },
        { tipo: 'opciones', enunciado: 'El regalo desapareció a las <b>8:00 p. m.</b> ¿Quién pudo hacerlo?', visual: lista(['Mario cocinó con la abuela de 7:00 a 9:00.', 'Lucía dice que vio una película que empezó a las 8:30.', 'Diego tiene un ticket de las 8:05 de una tienda a 30 minutos de la casa.']), opciones: ['Mario', 'Lucía', 'Diego'], correcta: 1, ayuda: '¿Quién no puede demostrar dónde estaba a las 8:00?' },
      ],
    },
    {
      nombre: 'Noemí', icono: '🃏', juego: 'Memoria fotográfica',
      desc: 'Memoriza las cartas y encuentra las parejas.',
      niveles: [
        { tipo: 'memoria', enunciado: 'Memoriza y encuentra las 3 parejas', pares: ['🎄', '⭐', '🎁'], vista: 5 },
        { tipo: 'memoria', enunciado: 'Memoriza y encuentra las 4 parejas', pares: ['🎄', '⭐', '🎁', '🔔'], vista: 5 },
        { tipo: 'memoria', enunciado: 'Memoriza y encuentra las 6 parejas', pares: ['🎄', '⭐', '🎁', '🔔', '⛄', '🦌'], vista: 6 },
      ],
    },
    {
      nombre: 'Patricia', icono: '🔀', juego: 'Letras revueltas',
      desc: 'Ordena las letras para formar la palabra.',
      niveles: [
        { tipo: 'texto', enunciado: 'Ordena las letras', visual: letras('E V I N E'), ayuda: 'Es blanca y fría.', r: ['nieve'] },
        { tipo: 'texto', enunciado: 'Ordena las letras', visual: letras('D A V I N A D'), ayuda: 'La fiesta del 25 de diciembre.', r: ['navidad'] },
        { tipo: 'texto', enunciado: 'Ordena las letras', visual: letras('C I L A V O N C I L'), ayuda: 'Una canción de Navidad.', r: ['villancico'] },
      ],
    },
    {
      nombre: 'Fernando', icono: '🗺️', juego: 'Código de coordenadas',
      desc: 'Sigue las coordenadas (fila + columna) para leer el mensaje.',
      niveles: [
        { tipo: 'texto', enunciado: 'Sigue las coordenadas', visual: coordenadas(['P M R S', 'T Z O L', 'E A N I'], 'A1 · C2 · B2'), ayuda: 'A1 es la fila A, columna 1.', r: ['paz'] },
        { tipo: 'texto', enunciado: 'Sigue las coordenadas', visual: coordenadas(['R N T E', 'V O L I', 'S A M C', 'U P D G'], 'A2 · B4 · A4 · B1 · A4'), ayuda: 'Es blanca y fría.', r: ['nieve'] },
        { tipo: 'texto', enunciado: 'Sigue las coordenadas', visual: coordenadas(['Q L M S F', 'E T R O B', 'A U N C I', 'G P H D V', 'X Y Z K J'], 'B5 · B1 · A2 · B1 · C3'), ayuda: 'Donde se arma el nacimiento.', r: ['belen'] },
      ],
    },
    {
      nombre: 'Valeria', icono: '👀', juego: 'El juego de las diferencias',
      desc: 'Toca en la imagen de abajo lo que cambió.',
      niveles: [
        { tipo: 'diferencias', enunciado: 'Encuentra las 3 diferencias', difs: ['estrella', 'luna', 'puerta'] },
        { tipo: 'diferencias', enunciado: 'Encuentra las 4 diferencias', difs: ['ventana', 'nariz', 'regalo', 'esfera'] },
        { tipo: 'diferencias', enunciado: 'Encuentra las 5 diferencias', difs: ['sombrero', 'humo', 'copo', 'bufanda', 'regalo2'] },
      ],
    },
    {
      nombre: 'Cesar', icono: '📈', juego: 'La secuencia perdida',
      desc: 'Descubre qué número sigue en la secuencia.',
      niveles: [
        { tipo: 'texto', enunciado: '¿Qué número sigue?', visual: serie('5 – 10 – 15 – 20 – ?'), ayuda: 'Fíjate cuánto aumenta cada vez.', r: ['25', 'veinticinco'] },
        { tipo: 'texto', enunciado: '¿Qué número sigue?', visual: serie('3 – 6 – 12 – 24 – ?'), ayuda: 'Cada número es el doble del anterior.', r: ['48', 'cuarentayocho', 'cuarenta y ocho'] },
        { tipo: 'texto', enunciado: '¿Qué número sigue?', visual: serie('1 – 1 – 2 – 3 – 5 – 8 – ?'), ayuda: 'Suma los dos números anteriores.', r: ['13', 'trece'] },
      ],
    },
    {
      nombre: 'Jhency', icono: '🧠', juego: 'El detective de las pistas',
      desc: 'Relaciona la información y deduce la respuesta.',
      niveles: [
        { tipo: 'opciones', enunciado: 'Ana, Luis y María tienen un color favorito distinto: rojo, azul y verde. <b>¿Qué color eligió Ana?</b>', visual: lista(['Ana no eligió el rojo.', 'Luis eligió el azul.', 'María no eligió el verde.']), opciones: ['Rojo', 'Azul', 'Verde'], correcta: 2, ayuda: 'Empieza por Luis, que es seguro.' },
        { tipo: 'opciones', enunciado: 'Leo, Mía y Sol trajeron panetón, chocolate y galletas (uno cada uno). <b>¿Quién trajo las galletas?</b>', visual: lista(['Leo no trajo chocolate ni galletas.', 'Mía no trajo galletas.']), opciones: ['Leo', 'Mía', 'Sol'], correcta: 2, ayuda: '¿Qué trajo Leo entonces?' },
        { tipo: 'opciones', enunciado: 'Hay 4 regalos en fila: rojo, verde, azul y dorado. <b>¿De qué color es el último?</b>', visual: lista(['El rojo está primero.', 'El dorado está justo después del verde.', 'El azul no está al final.']), opciones: ['Rojo', 'Verde', 'Azul', 'Dorado'], correcta: 3, ayuda: 'Si el azul no puede ir último, ¿dónde va?' },
      ],
    },
    {
      nombre: 'Juliett', icono: '🔐', juego: 'El candado misterioso',
      desc: 'Cada respuesta es un número de la combinación.',
      niveles: [
        { tipo: 'candado', enunciado: 'Abre el candado', visual: lista(['1.º ¿Cuánto es 2 + 3?', '2.º ¿Cuántos lados tiene un triángulo?', '3.º ¿Cuánto es 10 − 6?', '4.º ¿Cuántas ruedas tiene una bicicleta?']), ayuda: 'Pon un número por cada pregunta, en orden.', r: ['5342'] },
        { tipo: 'candado', enunciado: 'Abre el candado', visual: lista(['1.º Patas de una araña ÷ 4', '2.º Colores de un semáforo', '3.º Dedos de una mano', '4.º ¿Cuánto es 3 × 3?']), ayuda: 'Una araña tiene 8 patas.', r: ['2359'] },
        { tipo: 'candado', enunciado: 'Abre el candado', visual: lista(['Los dos primeros dígitos: el día de Navidad', 'Los dos últimos dígitos: el número del mes de Navidad']), ayuda: 'Diciembre es el mes número…', r: ['2512'] },
      ],
    },
    {
      nombre: 'Ashley', icono: '🎡', juego: 'La ruleta de los desafíos',
      desc: 'Gira la ruleta y supera el desafío que te toque.',
      niveles: [1, 2, 3].map((n) => ({ tipo: 'ruleta', enunciado: 'Gira la ruleta' })),
    },
  ],
};

// Desafíos de la ruleta (uno por categoría y nivel)
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
