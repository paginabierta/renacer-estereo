// ============================================================
//  Renacer Estéreo — motor de juegos (lo usan la app y la Cabina)
//  El banco está en datos/juegos/banco.json. Para agregar preguntas
//  sin tocar el archivo, se usan los «Aportes» aprobados en el panel.
// ============================================================

export const TIPOS = {
  trivia:     { nombre: "Trivia",              ico: "❓" },
  adivinanza: { nombre: "Adivinanza",          ico: "🤔" },
  acertijo:   { nombre: "Acertijo",            ico: "🧩" },
  refran:     { nombre: "Completa el refrán",  ico: "🗣️" },
  pasado:     { nombre: "Volver al pasado",    ico: "📻" },
  musica:     { nombre: "Música",              ico: "🎶" },
  ortografia: { nombre: "Ortografía",          ico: "✍️" },
  calculo:    { nombre: "Cálculo mental",      ico: "🧮" },
  palabra:    { nombre: "Palabras revueltas",  ico: "🔤" },
  aporte:     { nombre: "De los oyentes",      ico: "🙌" }
};

// ---------------- Utilidades ----------------
export function normalizar(s) {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
}
export function esCorrecta(item, respuesta) {
  const a = normalizar(respuesta), b = normalizar(item.r);
  if (!a) return false;
  if (a === b) return true;
  // En respuestas abiertas aceptamos sin artículos («la cebolla» = «cebolla»)
  const sinArt = t => t.replace(/^(el|la|los|las|un|una|unos|unas) /, "");
  return sinArt(a) === sinArt(b);
}
export function hashTexto(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function barajar(arr, r = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const entero = (r, min, max) => min + Math.floor(r() * (max - min + 1));
const fmt = n => n.toLocaleString("es-CO");

// ---------------- Fechas (hora de Colombia) ----------------
const UN_DIA = 86400000, BOGOTA = 5 * 3600000;
export function diaNumero(fecha = new Date()) { return Math.floor((fecha.getTime() - BOGOTA) / UN_DIA); }
export function fechaDeDia(dia) { return new Date(dia * UN_DIA + BOGOTA + 12 * 3600000); }
export function mesClave(dia = diaNumero()) {
  const d = new Date(dia * UN_DIA);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
export function semanaNumero(dia = diaNumero()) { return Math.floor((dia + 3) / 7); } // semanas de lunes a domingo
export function nombreMes(clave) {
  const [a, m] = clave.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });
}

// ---------------- Banco ----------------
let BANCO = null, EXTRA = [];
export async function cargarBanco() {
  if (BANCO) return BANCO;
  const r = await fetch("datos/juegos/banco.json", { cache: "no-cache" });
  BANCO = await r.json();
  return BANCO;
}
export function ponerExtra(lista) { EXTRA = Array.isArray(lista) ? lista : []; }
export function banco() { return BANCO; }
export function contarBanco() {
  if (!BANCO) return {};
  return {
    trivia: BANCO.trivia.length, adivinanza: BANCO.adivinanzas.length, acertijo: BANCO.acertijos.length,
    refran: BANCO.refranes.length, pasado: BANCO.pasado.length, musica: BANCO.musica.length,
    ortografia: BANCO.ortografia.length, coplas: BANCO.coplas.length, palabra: BANCO.palabras.length,
    aporte: EXTRA.length
  };
}
export function categoriasTrivia() { return BANCO ? [...new Set(BANCO.trivia.map(t => t.cat))] : []; }

function subPasado(id) {
  if (id.startsWith("pa")) return "¿En qué año?";
  if (id.startsWith("po")) return "Cosas de antes";
  if (id.startsWith("pp")) return "Palabras y dichos";
  return "";
}

// Convierte un registro del banco en una pregunta lista para mostrar
function armar(tipo, it, r = Math.random) {
  if (tipo === "refran") {
    const otros = barajar(BANCO.refranes.filter(x => x.id !== it.id), r).slice(0, 3).map(x => x.r);
    return { id: it.id, tipo, etiqueta: TIPOS.refran.nombre, p: `${it.p} …`, r: it.r, opciones: barajar([it.r, ...otros], r) };
  }
  const etiqueta = tipo === "trivia" ? `Trivia · ${it.cat}` : tipo === "pasado" ? `${TIPOS.pasado.nombre} · ${subPasado(it.id)}` : TIPOS[tipo]?.nombre || "Pregunta";
  const opciones = Array.isArray(it.o) && it.o.length ? barajar([it.r, ...it.o], r) : null;
  return { id: it.id, tipo, etiqueta, p: it.p, r: it.r, x: it.x || "", opciones, abierta: !opciones };
}

// Preguntas que se inventan solas: nunca se acaban
export function generarCalculo(semilla) {
  const r = rng(semilla);
  const plantillas = [
    () => { const a = entero(r, 12, 99), b = entero(r, 12, 99); return { p: `¿Cuánto es ${a} + ${b}?`, n: a + b }; },
    () => { const a = entero(r, 60, 199), b = entero(r, 11, a - 10); return { p: `¿Cuánto es ${a} − ${b}?`, n: a - b }; },
    () => { const a = entero(r, 3, 12), b = entero(r, 3, 12); return { p: `¿Cuánto es ${a} × ${b}?`, n: a * b }; },
    () => { const per = [20, 24, 30][entero(r, 0, 2)], n = entero(r, 2, 8); return { p: `Un bulto trae ${per} panelas. ¿Cuántas panelas hay en ${n} bultos?`, n: per * n }; },
    () => { const n = entero(r, 2, 9); return { p: `Una arroba tiene 25 libras. ¿Cuántas libras hay en ${n} arrobas?`, n: 25 * n }; },
    () => { const p = [9000, 10000, 12000, 14000][entero(r, 0, 3)], n = entero(r, 2, 5); return { p: `Si la docena de huevos vale ${fmt(p)} pesos, ¿cuánto valen ${n} docenas?`, n: p * n, plata: true }; },
    () => { const x = entero(r, 18, 45), y = entero(r, 3, x - 6); return { p: `Doña Rosa tenía ${x} gallinas y vendió ${y}. ¿Cuántas le quedan?`, n: x - y }; },
    () => { const p = [1000, 1500, 2000, 2500][entero(r, 0, 3)], n = entero(r, 2, 9); return { p: `Un tinto vale ${fmt(p)} pesos. ¿Cuánto se paga por ${n} tintos?`, n: p * n, plata: true }; },
    () => { const a = entero(r, 13, 99); return { p: `¿Cuánto es el doble de ${a}?`, n: a * 2 }; },
    () => { const a = entero(r, 7, 60) * 2; return { p: `¿Cuánto es la mitad de ${a}?`, n: a / 2 }; },
    () => { const n = entero(r, 2, 9); return { p: `¿Cuántos huevos hay en ${n} docenas?`, n: 12 * n }; },
    () => { const B = [10000, 20000, 50000][entero(r, 0, 2)], c = entero(r, 2, B / 500 - 2) * 500; return { p: `Pagas con un billete de ${fmt(B)} una compra de ${fmt(c)}. ¿Cuánto te devuelven?`, n: B - c, plata: true }; },
    () => { const h = entero(r, 2, 6); return { p: `Si un programa de radio dura ${h} horas, ¿cuántos minutos son?`, n: h * 60 }; },
    () => { const v = entero(r, 3, 9), l = entero(r, 8, 15); return { p: `Si cada vaca da ${l} litros de leche al día, ¿cuántos litros dan ${v} vacas?`, n: v * l }; }
  ];
  const t = plantillas[entero(r, 0, plantillas.length - 1)]();
  const saltos = t.plata ? [500, 1000, 2000, 5000] : [1, 2, 5, 10];
  const malas = new Set();
  while (malas.size < 3) {
    const d = saltos[entero(r, 0, saltos.length - 1)] * (r() < .5 ? -1 : 1);
    const v = t.n + d;
    if (v > 0 && v !== t.n) malas.add(v);
  }
  const pon = v => fmt(v) + (t.plata ? " pesos" : "");
  return { id: `calc-${semilla}`, tipo: "calculo", etiqueta: TIPOS.calculo.nombre, p: t.p, r: pon(t.n), opciones: barajar([t.n, ...malas].map(pon), r) };
}
export function generarPalabra(semilla) {
  const r = rng(semilla);
  const lista = BANCO.palabras;
  const palabra = lista[entero(r, 0, lista.length - 1)];
  const letras = [...palabra.toUpperCase()];
  let rev = letras.join(""), intentos = 0;
  while ((rev === palabra.toUpperCase()) && intentos++ < 20) rev = barajar(letras, r).join("");
  return {
    id: `pal-${semilla}`, tipo: "palabra", etiqueta: TIPOS.palabra.nombre,
    p: `Ordena las letras y escribe la palabra: ${rev.split("").join(" ")}`,
    r: palabra, opciones: null, entrada: true,
    x: palabra[0].toUpperCase() === palabra[0] ? "Es el nombre de un lugar de Santander." : "Es una palabra del campo, la casa o la región."
  };
}

// Lista de un tipo
function lista(tipo) {
  return {
    trivia: BANCO.trivia, adivinanza: BANCO.adivinanzas, acertijo: BANCO.acertijos, refran: BANCO.refranes,
    pasado: BANCO.pasado, musica: BANCO.musica, ortografia: BANCO.ortografia
  }[tipo] || [];
}

// Elige siempre el mismo registro para un día dado. El orden es fijo y barajado:
// no se repite nada hasta que se recorre toda la lista.
const ORDENES = {};
function delDia(tipo, dia) {
  const l = lista(tipo), n = l.length;
  const clave = tipo + n;
  ORDENES[clave] ??= barajar(l.map((_, i) => i), rng(hashTexto("orden-" + tipo)));
  return l[ORDENES[clave][((dia % n) + n) % n]];
}

// ---------------- Reto del día: 5 preguntas iguales para todos ----------------
export function retoDelDia(dia = diaNumero()) {
  const r = rng(hashTexto("reto" + dia));
  const quinta = ["musica", "ortografia", "calculo", "palabra"][dia % 4];
  const preguntas = [
    armar("trivia", delDia("trivia", dia), r),
    dia % 2 === 0 ? armar("adivinanza", delDia("adivinanza", Math.floor(dia / 2)), r) : armar("acertijo", delDia("acertijo", Math.floor(dia / 2)), r),
    armar("refran", delDia("refran", dia), r),
    armar("pasado", delDia("pasado", dia), r),
    quinta === "calculo" ? generarCalculo(hashTexto("c" + dia)) : quinta === "palabra" ? generarPalabra(hashTexto("p" + dia)) : armar(quinta, delDia(quinta, Math.floor(dia / 4)), r)
  ];
  // Las palabras revueltas también se pueden contestar con opciones en el reto, para que sea parejo
  return preguntas.map(q => q.tipo === "palabra" ? conOpcionesPalabra(q, r) : q);
}
function conOpcionesPalabra(q, r) {
  const parecidas = barajar(BANCO.palabras.filter(p => p !== q.r && Math.abs(p.length - q.r.length) <= 2), r).slice(0, 3);
  return { ...q, opciones: barajar([q.r, ...parecidas], r), entrada: false };
}

// ---------------- Juego libre (aleatorio, ilimitado) ----------------
export const MODOS_LIBRES = [
  { id: "mezcla", nombre: "De todo un poco", ico: "🎲", desc: "Preguntas de todos los juegos" },
  { id: "trivia", nombre: "Trivias", ico: "❓", desc: "Escoge el tema que más te guste" },
  { id: "adivinanza", nombre: "Adivinanzas", ico: "🤔", desc: "Las de la abuela y muchas más" },
  { id: "refran", nombre: "Refranes", ico: "🗣️", desc: "Completa el dicho" },
  { id: "pasado", nombre: "Volver al pasado", ico: "📻", desc: "Años, cosas y palabras de antes" },
  { id: "musica", nombre: "Música colombiana", ico: "🎶", desc: "Compositores, cantantes y ritmos" },
  { id: "acertijo", nombre: "Acertijos", ico: "🧩", desc: "Para pensar con calma" },
  { id: "ortografia", nombre: "Ortografía", ico: "✍️", desc: "¿Cuál está bien escrita?" },
  { id: "calculo", nombre: "Cálculo mental", ico: "🧮", desc: "Cuentas del día a día · nunca se acaba" },
  { id: "palabra", nombre: "Palabras revueltas", ico: "🔤", desc: "Ordena las letras · nunca se acaba" },
  { id: "aporte", nombre: "Aportes de los oyentes", ico: "🙌", desc: "Preguntas que mandó la gente" }
];

const VISTOS_KEY = "renacer-vistos";
function vistos() { try { return new Set(JSON.parse(localStorage.getItem(VISTOS_KEY) || "[]")); } catch (e) { return new Set(); } }
function guardarVistos(s) { try { localStorage.setItem(VISTOS_KEY, JSON.stringify([...s].slice(-1500))); } catch (e) {} }

function extraComoPregunta(e) {
  const it = { id: "x-" + e.id, p: e.p, r: e.r, o: Array.isArray(e.o) && e.o.length === 3 ? e.o : null };
  const q = armar("aporte", it);
  q.etiqueta = `${TIPOS.aporte.nombre}${e.autor ? " · " + e.autor : ""}${e.lugar ? " de " + e.lugar : ""}`;
  return q;
}

/** Devuelve una ronda de preguntas para el juego libre. */
export function rondaLibre(modo, cantidad = 10, categoria = "") {
  const ya = vistos();
  const tomar = (tipo, filtro) => {
    let l = lista(tipo);
    if (filtro) l = l.filter(filtro);
    if (!l.length) return null;
    const nuevos = l.filter(x => !ya.has(x.id));
    const fuente = nuevos.length ? nuevos : l;
    const it = fuente[Math.floor(Math.random() * fuente.length)];
    ya.add(it.id);
    return armar(tipo, it);
  };
  const out = [];
  let intentos = 0;
  while (out.length < cantidad && intentos++ < cantidad * 4) {
    let q = null;
    const m = modo === "mezcla" ? ["trivia", "adivinanza", "refran", "pasado", "musica", "acertijo", "ortografia", "calculo", "palabra"][Math.floor(Math.random() * 9)] : modo;
    if (m === "calculo") q = generarCalculo((Math.random() * 2 ** 32) >>> 0);
    else if (m === "palabra") q = generarPalabra((Math.random() * 2 ** 32) >>> 0);
    else if (m === "aporte") {
      if (!EXTRA.length) break;
      const l = EXTRA.filter(e => !ya.has("x-" + e.id) && !out.some(o => o.id === "x-" + e.id));
      if (!l.length) break;
      const e = l[Math.floor(Math.random() * l.length)];
      ya.add("x-" + e.id);
      q = extraComoPregunta(e);
    }
    else if (m === "trivia" && categoria) q = tomar("trivia", t => t.cat === categoria);
    else q = tomar(m);
    if (q && !out.some(o => o.id === q.id)) out.push(q);
  }
  guardarVistos(ya);
  return out;
}

/** Una pregunta al azar para la Cabina (concurso al aire). */
export function preguntaParaCabina(tipo, categoria = "") {
  if (tipo === "calculo") return generarCalculo((Math.random() * 2 ** 32) >>> 0);
  if (tipo === "palabra") return generarPalabra((Math.random() * 2 ** 32) >>> 0);
  if (tipo === "aporte") {
    if (!EXTRA.length) return null;
    return extraComoPregunta(EXTRA[Math.floor(Math.random() * EXTRA.length)]);
  }
  let l = lista(tipo);
  if (tipo === "trivia" && categoria) l = l.filter(t => t.cat === categoria);
  if (!l.length) return null;
  return armar(tipo, l[Math.floor(Math.random() * l.length)]);
}

/** Copla de la semana para «Termina la copla». */
export function coplaDeLaSemana(semana = semanaNumero()) {
  const l = BANCO.coplas, n = l.length;
  const orden = barajar(l.map((_, i) => i), rng(hashTexto("coplas" + Math.floor(semana / n))));
  return { ...l[orden[semana % n]], semana };
}
