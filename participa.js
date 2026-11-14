// ============================================================
//  Renacer Estéreo — sección Participa (oyentes)
//  Juegos, concursos al aire, votaciones, reacciones, saludos,
//  intenciones, coplas, aportes, ranking y mapa de oyentes.
// ============================================================
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, onSnapshot,
  writeBatch, serverTimestamp, increment, getCountFromServer, documentId
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as J from "./juegos.js";

let C = null;          // contexto que pasa index.html
let auth = null;
const $ = s => document.querySelector(s);
const esc = s => C.esc(s);

// ---------------- Almacenamiento local (siempre protegido) ----------------
const LS = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const perfil = () => LS.get("renacer-perfil");

// ---------------- Avisos ----------------
function aviso(msg, ms = 3800) {
  let t = $("#toast-p");
  if (!t) { t = document.createElement("div"); t.id = "toast-p"; t.className = "toast-p"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false;
  clearTimeout(t._t); t._t = setTimeout(() => t.hidden = true, ms);
}
function errorTexto(e) {
  const c = e?.code || "";
  if (c.includes("permission-denied")) return "No se pudo guardar. Puede que ya lo hayas enviado antes.";
  if (c.includes("unavailable") || c.includes("network")) return "Sin conexión. Inténtalo de nuevo.";
  if (c.includes("admin-restricted") || c.includes("operation-not-allowed")) return "La participación aún no está activada en la emisora.";
  return "No se pudo completar. Inténtalo de nuevo.";
}

// ---------------- Sesión anónima ----------------
async function sesion() {
  if (!C.CONFIGURADO) throw Object.assign(new Error("sin firebase"), { code: "unavailable" });
  auth ??= getAuth(C.app);
  if (auth.currentUser) return auth.currentUser;
  const r = await signInAnonymously(auth);
  return r.user;
}

// ---------------- Diálogos ----------------
function dialogo(titulo, html, alCerrar) {
  const d = document.createElement("dialog");
  d.className = "dlg-p";
  d.innerHTML = `<div class="dlg-cab"><h2>${esc(titulo)}</h2><button type="button" aria-label="Cerrar" data-cerrar>×</button></div><div class="dlg-cuerpo">${html}</div>`;
  document.body.appendChild(d);
  d.addEventListener("click", e => { if (e.target.closest("[data-cerrar]") || e.target === d) d.close(); });
  d.addEventListener("close", () => { alCerrar?.(); d.remove(); });
  d.showModal();
  return d;
}

// ---------------- Perfil del oyente ----------------
function lugaresConfig() {
  const l = C.cfg().lugares;
  return Array.isArray(l) && l.length ? l : ["Vado Real", "Suaita"];
}
export function pedirPerfil(motivo = "") {
  return new Promise(resolve => {
    const p = perfil() || {};
    const lugares = lugaresConfig();
    const esOtro = p.lugar && !lugares.includes(p.lugar);
    let listo = false;
    const d = dialogo("¿Quién nos escucha?", `
      ${motivo ? `<p class="pp-nota" style="margin-top:0">${esc(motivo)}</p>` : ""}
      <form id="f-perfil">
        <label class="pp-nota" for="pf-alias"><b>Tu nombre o apodo</b> (así te nombramos al aire)</label>
        <input class="pp-txt" id="pf-alias" maxlength="30" required value="${esc(p.alias || "")}" autocomplete="nickname">
        <label class="pp-nota" for="pf-lugar" style="display:block;margin-top:12px"><b>¿Desde dónde nos escuchas?</b></label>
        <select class="pp-txt" id="pf-lugar">
          ${lugares.map(l => `<option ${l === p.lugar ? "selected" : ""}>${esc(l)}</option>`).join("")}
          <option value="__otro" ${esOtro ? "selected" : ""}>Otro lugar (escríbelo)</option>
        </select>
        <input class="pp-txt" id="pf-otro" maxlength="40" placeholder="Vereda o municipio" style="margin-top:8px;${esOtro ? "" : "display:none"}" value="${esOtro ? esc(p.lugar) : ""}">
        <p class="pp-nota">No pedimos teléfono ni correo. Tu nombre y tu lugar aparecen en el ranking y cuando participas.</p>
        <div class="jg-acc" style="justify-content:flex-start"><button class="pp-btn naranja">Guardar</button></div>
      </form>`, () => { if (!listo) resolve(null); });
    const sel = d.querySelector("#pf-lugar"), otro = d.querySelector("#pf-otro");
    sel.addEventListener("change", () => { otro.style.display = sel.value === "__otro" ? "" : "none"; });
    d.querySelector("#f-perfil").addEventListener("submit", async e => {
      e.preventDefault();
      const alias = d.querySelector("#pf-alias").value.trim().slice(0, 30);
      const lugar = (sel.value === "__otro" ? otro.value.trim() : sel.value).slice(0, 40) || "Sin decir";
      if (!alias) return;
      const nuevo = { alias, lugar };
      LS.set("renacer-perfil", nuevo);
      listo = true;
      d.close();
      pintarHola();
      registrarOyente(nuevo, lugares.includes(lugar) ? lugar : "Otros lugares").catch(() => {});
      resolve(nuevo);
    });
  });
}
async function asegurarPerfil(motivo) { return perfil() || await pedirPerfil(motivo); }

const slug = t => J.normalizar(t).replace(/ /g, "-").slice(0, 60) || "sin-decir";
async function registrarOyente(p, claveMapa) {
  if (!C.CONFIGURADO) return;
  const u = await sesion();
  const ref = doc(C.db, "oyentes", u.uid);
  const ya = await getDoc(ref);
  const b = writeBatch(C.db);
  if (ya.exists()) b.set(ref, { alias: p.alias, lugar: p.lugar, actualizado: serverTimestamp() }, { merge: true });
  else {
    b.set(ref, { alias: p.alias, lugar: p.lugar, creado: serverTimestamp() });
    b.set(doc(C.db, "mapa", slug(claveMapa)), { nombre: claveMapa, n: increment(1) }, { merge: true });
  }
  await b.commit();
  pintarLugares();
}

// ---------------- Mensajes a la cabina y a moderación ----------------
async function enviarMensaje(tipo, texto, extra = {}) {
  const p = await asegurarPerfil("Antes de enviar, cuéntanos quién eres.");
  if (!p) return false;
  try {
    const u = await sesion();
    const datos = { tipo, texto: String(texto).slice(0, 600), alias: p.alias, lugar: p.lugar, uid: u.uid, estado: "pendiente", cuando: serverTimestamp() };
    if (extra.ref) datos.ref = extra.ref;
    if (extra.extra) datos.extra = extra.extra;
    await setDoc(doc(collection(C.db, "mensajes")), datos);
    return true;
  } catch (e) { aviso(errorTexto(e)); return false; }
}
export async function enviarPedido({ cancion, saludo }) {
  const texto = `🎵 ${cancion}` + (saludo ? `\n${saludo}` : "");
  const ok = await enviarMensaje("pedido", texto);
  if (ok) aviso("¡Listo! Tu pedido llegó a la cabina. Escucha la emisora 📻");
  return ok;
}

// ---------------- Estructura de la sección ----------------
function esqueleto() {
  return `
  <div class="cabeza-bloque"><h2>Participa</h2><p>Juega, vota, manda saludos y gánate un lugar en el ranking de la emisora.</p></div>
  <div id="pp-hola"></div>
  <div id="pp-envivo"></div>
  <div id="pp-votaciones"></div>
  <h3 class="pp-titulo">Juegos</h3>
  <div class="pp-grid" id="pp-juegos"></div>
  <h3 class="pp-titulo">Al aire</h3>
  <div class="pp-grid">
    <div class="pp-card"><span class="pp-ico">👋</span><h3>Manda un saludo</h3><p>Lo leemos al aire durante la programación.</p>
      <textarea class="pp-txt" id="pp-saludo" maxlength="400" placeholder="¿A quién saludas y qué le quieres decir?"></textarea>
      <div class="pp-acc"><button class="pp-btn" data-enviar="saludo">Enviar saludo</button></div></div>
    <div class="pp-card"><span class="pp-ico">🙏</span><h3>Pide una oración</h3><p>Tu intención se presenta en el rosario y en la Santa Misa transmitida.</p>
      <textarea class="pp-txt" id="pp-intencion" maxlength="400" placeholder="Por la salud de…, por el alma de…, en acción de gracias por…"></textarea>
      <div class="pp-acc"><button class="pp-btn" data-enviar="intencion">Enviar intención</button></div></div>
    <div class="pp-card"><span class="pp-ico">🎵</span><h3>Pide tu canción</h3><p>Llega directo a la cabina del locutor.</p>
      <div class="pp-acc"><button class="pp-btn" data-accion="pedido">Pedir canción</button></div></div>
  </div>
  <h3 class="pp-titulo">¿Desde dónde nos escuchan?</h3>
  <div class="pp-card" id="pp-lugares"><p>Cargando…</p></div>`;
}

function pintarHola() {
  const caja = $("#pp-hola"); if (!caja) return;
  const p = perfil();
  const mes = J.mesClave();
  const pts = LS.get("renacer-puntos-" + mes, 0);
  if (!p) {
    caja.innerHTML = `<div class="pp-hola"><span class="pp-avatar">?</span><div><b>¡Hola! Cuéntanos quién eres</b><span>Tu nombre y tu vereda para el ranking y los saludos</span></div><button class="pp-mini" data-accion="perfil">Empezar</button></div>`;
    return;
  }
  caja.innerHTML = `<div class="pp-hola"><span class="pp-avatar">${esc(p.alias.trim()[0]?.toUpperCase() || "R")}</span>
    <div><b>Hola, ${esc(p.alias)}</b><span>${esc(p.lugar)} · <a href="#" data-accion="perfil" style="color:#fff">cambiar</a></span></div>
    <div class="pp-puntos"><b>${pts}</b><span>puntos en ${esc(J.nombreMes(mes).split(" ")[0])}</span></div></div>`;
}

// ---------------- Juegos ----------------
function racha() {
  let r = 0, d = J.diaNumero();
  if (!LS.get("reto-" + d)) d--;
  while (LS.get("reto-" + d)) { r++; d--; }
  return r;
}
function pintarJuegos() {
  const caja = $("#pp-juegos"); if (!caja) return;
  if (!J.banco()) { caja.innerHTML = `<div class="pp-card"><p>No se pudieron cargar los juegos. Revisa tu conexión.</p></div>`; return; }
  const dia = J.diaNumero();
  const hecho = LS.get("reto-" + dia);
  const r = racha();
  const copla = J.coplaDeLaSemana();
  caja.innerHTML = `
    <div class="pp-card destacada"><span class="pp-chip">Nuevo cada día</span><span class="pp-ico">⭐</span><h3>Reto del día</h3>
      ${hecho
        ? `<p>Hoy hiciste <b>${hecho.aciertos} de 5</b>. ${hecho.enviado ? "Tus puntos ya están en el ranking." : ""}</p>${r > 1 ? `<p>🔥 Llevas ${r} días seguidos.</p>` : ""}<p class="pp-nota">Mañana hay 5 preguntas nuevas.</p>
           <div class="pp-acc"><button class="pp-btn wa" data-accion="compartir-reto">Compartir</button>${!hecho.enviado ? `<button class="pp-btn naranja" data-accion="subir-reto">Sumar mis puntos</button>` : ""}<button class="pp-btn claro" data-accion="ranking">Ranking</button></div>`
        : `<p>5 preguntas: trivia, adivinanza o acertijo, refrán, volver al pasado y una sorpresa. Las mismas para todos.</p>${r > 0 ? `<p>🔥 Llevas ${r} ${r === 1 ? "día" : "días"} seguidos. ¡No pierdas la racha!</p>` : ""}
           <div class="pp-acc"><button class="pp-btn naranja" data-accion="reto">Jugar ahora</button><button class="pp-btn claro" data-accion="ranking">Ranking</button></div>`}
    </div>
    <div class="pp-card"><span class="pp-ico">🎲</span><h3>Juego libre</h3><p>Trivias de muchos temas, adivinanzas, refranes, acertijos, música, cálculo y palabras revueltas. Juega cuanto quieras.</p>
      <div class="pp-acc"><button class="pp-btn" data-accion="libre">Escoger juego</button></div></div>
    <div class="pp-card"><span class="pp-chip">Copla de la semana</span><h3>Termina la copla</h3>
      <div class="pp-copla">${esc(copla.v[0])}<br>${esc(copla.v[1])}<br><span class="nueva">…</span></div>
      <p>Escribe los dos versos que faltan. Las mejores se leen al aire.</p>
      <div class="pp-acc"><button class="pp-btn" data-accion="copla">Escribir mi final</button><button class="pp-btn claro" data-accion="coplas">Ver las de la gente</button></div></div>
    <div class="pp-card"><span class="pp-ico">🏆</span><h3>Ranking del mes</h3><p>Los que más puntos suman en el reto del día, y la vereda más juiciosa.</p>
      <div class="pp-acc"><button class="pp-btn" data-accion="ranking">Ver ranking</button></div></div>
    <div class="pp-card"><span class="pp-ico">🙌</span><h3>Aporta tu juego</h3><p>¿Sabes una adivinanza, un refrán o una pregunta buena? Mándala: si la aprueban, entra al juego con tu nombre.</p>
      <div class="pp-acc"><button class="pp-btn" data-accion="aporte">Enviar mi aporte</button></div></div>`;
}

// Motor de juego en pantalla
function jugar({ titulo, preguntas, alTerminar, otraRonda }) {
  let i = 0, aciertos = 0;
  const marcas = preguntas.map(() => "");
  const d = dialogo(titulo, `<div id="jg"></div>`);
  const caja = d.querySelector("#jg");
  const progreso = () => `<div class="jg-progreso">${marcas.map((m, k) => `<i class="${m || (k === i ? "act" : "")}"></i>`).join("")}</div>`;

  function mostrar() {
    const q = preguntas[i];
    caja.innerHTML = `${progreso()}<span class="pp-chip">${esc(q.etiqueta)}</span><div class="jg-pregunta">${esc(q.p)}</div>
      ${q.opciones ? q.opciones.map((o, k) => `<button class="jg-op" data-op="${k}">${esc(o)}</button>`).join("")
        : q.entrada ? `<form id="jg-f"><input class="pp-txt" id="jg-in" autocomplete="off" autocapitalize="none" placeholder="Escribe tu respuesta"><div class="jg-acc" style="justify-content:flex-start"><button class="pp-btn naranja">Comprobar</button><button type="button" class="pp-btn claro" data-pista>Pista</button></div></form><p class="pp-nota" id="jg-pista" hidden>${esc(q.x || "")}</p>`
        : `<p class="pp-nota">Piensa tu respuesta y luego mírala.</p><button class="pp-btn naranja" data-ver>Ver respuesta</button>`}
      <div id="jg-res"></div>`;
    caja.querySelectorAll("[data-op]").forEach(b => b.addEventListener("click", () => responder(q.opciones[Number(b.dataset.op)], b)));
    caja.querySelector("#jg-f")?.addEventListener("submit", e => { e.preventDefault(); responder(caja.querySelector("#jg-in").value); });
    caja.querySelector("[data-pista]")?.addEventListener("click", () => caja.querySelector("#jg-pista").hidden = false);
    caja.querySelector("[data-ver]")?.addEventListener("click", e => {
      e.target.remove();
      caja.querySelector("#jg-res").innerHTML = `<div class="jg-resultado ok">Respuesta: ${esc(q.r)}</div><p>¿Acertaste?</p>
        <div class="jg-acc" style="justify-content:flex-start"><button class="pp-btn" data-auto="1">Sí 🙌</button><button class="pp-btn claro" data-auto="0">No</button></div>`;
      caja.querySelectorAll("[data-auto]").forEach(b => b.addEventListener("click", () => cerrarPregunta(b.dataset.auto === "1", true)));
    });
  }
  function responder(valor, boton) {
    const q = preguntas[i];
    const bien = J.esCorrecta(q, valor);
    caja.querySelectorAll(".jg-op").forEach(b => {
      b.disabled = true;
      if (J.esCorrecta(q, b.textContent)) b.classList.add("ok");
    });
    if (boton && !bien) boton.classList.add("mal");
    caja.querySelector("#jg-f")?.querySelectorAll("input,button").forEach(x => x.disabled = true);
    cerrarPregunta(bien);
  }
  function cerrarPregunta(bien, sinMensaje = false) {
    const q = preguntas[i];
    if (bien) aciertos++;
    marcas[i] = bien ? "ok" : "mal";
    const ultima = i === preguntas.length - 1;
    const res = caja.querySelector("#jg-res");
    res.innerHTML = (sinMensaje ? "" : `<div class="jg-resultado ${bien ? "ok" : "mal"}">${bien ? ["¡Muy bien!", "¡Correcto!", "¡Eso es!", "¡Berraco!"][Math.floor(Math.random() * 4)] : `La respuesta era: ${esc(q.r)}`}${q.x ? `<small>${esc(q.x)}</small>` : ""}</div>`)
      + `<button class="pp-btn naranja" data-sig>${ultima ? "Ver resultado" : "Siguiente"}</button>`;
    caja.querySelector(".jg-progreso").outerHTML = progreso();
    res.querySelector("[data-sig]").addEventListener("click", () => { if (ultima) fin(); else { i++; mostrar(); caja.scrollIntoView({ block: "start" }); } });
    res.querySelector("[data-sig]").focus();
  }
  function fin() {
    const total = preguntas.length;
    const frase = aciertos === total ? "¡Perfecto! Eres un berraco." : aciertos >= total * .6 ? "¡Muy bien! Vas por buen camino." : aciertos > 0 ? "¡Bien! Mañana te va mejor." : "Hoy no fue el día… ¡a seguir jugando!";
    caja.innerHTML = `${progreso()}<div class="jg-fin"><div class="grande">${aciertos}/${total}</div><h3>${frase}</h3><div id="jg-extra"></div>
      <div class="jg-acc"><button class="pp-btn wa" data-comp>Compartir</button>${otraRonda ? `<button class="pp-btn naranja" data-otra>Otra ronda</button>` : ""}<button class="pp-btn claro" data-cerrar>Cerrar</button></div></div>`;
    caja.querySelector("[data-comp]").addEventListener("click", () => compartirResultado(titulo, aciertos, total));
    caja.querySelector("[data-otra]")?.addEventListener("click", () => { d.close(); otraRonda(); });
    alTerminar?.(aciertos, total, caja.querySelector("#jg-extra"));
  }
  mostrar();
}

function compartirResultado(titulo, aciertos, total) {
  const c = C.cfg();
  const url = location.origin + location.pathname;
  const texto = `🎉 Hice ${aciertos} de ${total} en «${titulo}» de ${c.nombre} ${c.frecuencia}. ¿Me ganas? ${url}`;
  if (navigator.share) navigator.share({ text: texto }).catch(() => {});
  else window.open(C.enlaceWhatsApp("", texto), "_blank", "noopener");
}

// Reto del día
function abrirReto() {
  const dia = J.diaNumero();
  if (LS.get("reto-" + dia)) { aviso("Ya jugaste el reto de hoy. ¡Mañana hay uno nuevo!"); return; }
  jugar({
    titulo: "Reto del día",
    preguntas: J.retoDelDia(dia),
    alTerminar: async (aciertos, total, extra) => {
      LS.set("reto-" + dia, { aciertos, enviado: false });
      pintarJuegos();
      if (!C.CONFIGURADO) return;
      if (!perfil()) {
        extra.innerHTML = `<p>¿Quieres que estos puntos cuenten en el ranking del mes?</p><button class="pp-btn naranja" data-sumar>Sí, sumar mis puntos</button>`;
        extra.querySelector("[data-sumar]").addEventListener("click", async () => { if (await subirReto(dia)) extra.innerHTML = `<p class="pp-ok">✅ Sumaste ${aciertos} puntos al ranking.</p>`; });
      } else if (await subirReto(dia)) extra.innerHTML = `<p class="pp-ok">✅ Sumaste ${aciertos} ${aciertos === 1 ? "punto" : "puntos"} al ranking del mes.</p>`;
    }
  });
}
async function subirReto(dia) {
  const reg = LS.get("reto-" + dia);
  if (!reg || reg.enviado) return true;
  const p = await asegurarPerfil("Para sumar tus puntos al ranking necesitamos tu nombre y tu lugar.");
  if (!p) return false;
  try {
    const u = await sesion();
    const mes = J.mesClave(dia);
    const retoRef = doc(C.db, "retos", String(dia), "jugadores", u.uid);
    const tablaRef = doc(C.db, "tabla", mes, "jugadores", u.uid);
    const prev = await getDoc(tablaRef);
    const pd = prev.exists() ? prev.data() : {};
    const b = writeBatch(C.db);
    b.set(retoRef, { aciertos: reg.aciertos, alias: p.alias, lugar: p.lugar, cuando: serverTimestamp() });
    b.set(tablaRef, { alias: p.alias, lugar: p.lugar, puntos: (pd.puntos || 0) + reg.aciertos, retos: (pd.retos || 0) + 1, dia, actualizado: serverTimestamp() });
    await b.commit();
    LS.set("reto-" + dia, { ...reg, enviado: true });
    LS.set("renacer-puntos-" + mes, (pd.puntos || 0) + reg.aciertos);
    pintarJuegos(); pintarHola();
    return true;
  } catch (e) {
    // Si ya estaba guardado (por ejemplo desde otro intento), lo damos por enviado
    if ((e.code || "").includes("permission-denied")) {
      try {
        const u = auth?.currentUser;
        if (u && (await getDoc(doc(C.db, "retos", String(dia), "jugadores", u.uid))).exists()) { LS.set("reto-" + dia, { ...reg, enviado: true }); pintarJuegos(); return true; }
      } catch (x) {}
    }
    aviso(errorTexto(e));
    return false;
  }
}

// Juego libre
async function cargarExtra() {
  if (!C.CONFIGURADO) return;
  try {
    const r = await getDocs(query(collection(C.db, "banco_extra"), limit(500)));
    J.ponerExtra(r.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) {}
}
function abrirLibre() {
  const conteo = J.contarBanco();
  const d = dialogo("Juego libre", `<p class="pp-nota" style="margin-top:0">Rondas de 10 preguntas. Estas no suman al ranking: son para divertirse y aprender.</p>
    <div class="jg-modos">${J.MODOS_LIBRES.filter(m => m.id !== "aporte" || conteo.aporte > 0).map(m => `<button class="jg-modo" data-modo="${m.id}"><span style="font-size:1.6rem">${m.ico}</span><b>${esc(m.nombre)}</b><span>${esc(m.desc)}</span></button>`).join("")}</div>`);
  d.querySelectorAll("[data-modo]").forEach(b => b.addEventListener("click", () => {
    const modo = b.dataset.modo;
    if (modo === "trivia") { d.close(); elegirTema(); return; }
    d.close(); rondaLibre(modo);
  }));
}
function elegirTema() {
  const d = dialogo("Trivias: escoge el tema", `<div class="jg-modos"><button class="jg-modo" data-cat=""><b>Todos los temas</b><span>Un poco de todo</span></button>
    ${J.categoriasTrivia().map(c => `<button class="jg-modo" data-cat="${esc(c)}"><b>${esc(c)}</b></button>`).join("")}</div>`);
  d.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => { d.close(); rondaLibre("trivia", b.dataset.cat); }));
}
function rondaLibre(modo, categoria = "") {
  const preguntas = J.rondaLibre(modo, 10, categoria);
  if (!preguntas.length) { aviso("Todavía no hay preguntas en este juego."); return; }
  const m = J.MODOS_LIBRES.find(x => x.id === modo);
  jugar({ titulo: categoria || m?.nombre || "Juego libre", preguntas, otraRonda: () => rondaLibre(modo, categoria) });
}

// Ranking
async function abrirRanking() {
  const mesActual = J.mesClave();
  const d = dialogo("Ranking del mes", `<div class="rk-tabs"><button class="pp-btn" data-rk="personas">Personas</button><button class="pp-btn claro" data-rk="lugares">Veredas y pueblos</button>
    <select class="pp-txt" id="rk-mes" style="width:auto;padding:6px 10px"><option value="${mesActual}">${esc(J.nombreMes(mesActual))}</option><option value="${J.mesClave(J.diaNumero() - 31)}">${esc(J.nombreMes(J.mesClave(J.diaNumero() - 31)))}</option></select></div>
    <div id="rk"><p>Cargando…</p></div><p class="pp-nota">Cada pregunta acertada del reto del día vale 1 punto. El ranking empieza de cero cada mes.</p>`);
  if (!C.CONFIGURADO) { d.querySelector("#rk").innerHTML = "<p>El ranking se activa cuando la emisora conecte la participación.</p>"; return; }
  let vista = "personas", datos = [];
  const yo = auth?.currentUser?.uid;
  async function cargar() {
    d.querySelector("#rk").innerHTML = "<p>Cargando…</p>";
    try {
      const r = await getDocs(query(collection(C.db, "tabla", d.querySelector("#rk-mes").value, "jugadores"), orderBy("puntos", "desc"), limit(500)));
      datos = r.docs.map(x => ({ uid: x.id, ...x.data() }));
      pintar();
    } catch (e) { d.querySelector("#rk").innerHTML = `<p>${esc(errorTexto(e))}</p>`; }
  }
  function pintar() {
    const caja = d.querySelector("#rk");
    if (!datos.length) { caja.innerHTML = "<p>Todavía nadie ha sumado puntos este mes. ¡Sé el primero!</p>"; return; }
    if (vista === "personas") {
      caja.innerHTML = datos.slice(0, 50).map((x, k) => `<div class="rk-fila ${x.uid === yo ? "yo" : ""}"><span class="pos">${k < 3 ? ["🥇", "🥈", "🥉"][k] : k + 1}</span><div><b>${esc(x.alias)}</b><span>${esc(x.lugar)} · ${x.retos || 1} ${x.retos === 1 ? "reto" : "retos"}</span></div><span class="pts">${x.puntos}</span></div>`).join("");
    } else {
      const g = {};
      datos.forEach(x => { const k = x.lugar || "Sin decir"; g[k] ??= { puntos: 0, gente: 0 }; g[k].puntos += x.puntos || 0; g[k].gente++; });
      caja.innerHTML = Object.entries(g).sort((a, b) => b[1].puntos - a[1].puntos).map(([l, v], k) => `<div class="rk-fila"><span class="pos">${k < 3 ? ["🥇", "🥈", "🥉"][k] : k + 1}</span><div><b>${esc(l)}</b><span>${v.gente} ${v.gente === 1 ? "jugador" : "jugadores"}</span></div><span class="pts">${v.puntos}</span></div>`).join("");
    }
  }
  d.querySelectorAll("[data-rk]").forEach(b => b.addEventListener("click", () => {
    vista = b.dataset.rk;
    d.querySelectorAll("[data-rk]").forEach(x => x.classList.toggle("claro", x !== b));
    pintar();
  }));
  d.querySelector("#rk-mes").addEventListener("change", cargar);
  cargar();
}

// Termina la copla
function abrirCopla() {
  const c = J.coplaDeLaSemana();
  const d = dialogo("Termina la copla", `<div class="pp-copla" style="font-size:1.4rem">${esc(c.v[0])}<br>${esc(c.v[1])}</div>
    <form id="cp-f"><label class="pp-nota" for="cp-3">Tercer verso</label><input class="pp-txt" id="cp-3" maxlength="60" required>
    <label class="pp-nota" for="cp-4" style="display:block;margin-top:8px">Cuarto verso</label><input class="pp-txt" id="cp-4" maxlength="60" required>
    <p class="pp-nota">Consejo: que rime el cuarto verso con el segundo. Las coplas se publican después de que la emisora las revise.</p>
    <div class="jg-acc" style="justify-content:flex-start"><button class="pp-btn naranja">Enviar mi copla</button></div></form>`);
  d.querySelector("#cp-f").addEventListener("submit", async e => {
    e.preventDefault();
    const l3 = d.querySelector("#cp-3").value.trim(), l4 = d.querySelector("#cp-4").value.trim();
    if (!l3 || !l4) return;
    const btn = e.submitter; btn.disabled = true;
    if (await enviarMensaje("copla", `${l3}\n${l4}`, { ref: "copla-" + c.semana })) { d.close(); aviso("¡Gracias! Tu copla aparecerá cuando la aprueben 🎶", 5000); }
    else btn.disabled = false;
  });
}
async function verCoplas() {
  const c = J.coplaDeLaSemana();
  const d = dialogo("Las coplas de la gente", `<div class="pp-copla">${esc(c.v[0])}<br>${esc(c.v[1])}<br><span class="nueva">…</span></div><div class="cp-lista" id="cp-l"><p>Cargando…</p></div>`);
  if (!C.CONFIGURADO) { d.querySelector("#cp-l").innerHTML = "<p>Pronto.</p>"; return; }
  try {
    const r = await getDocs(query(collection(C.db, "mensajes"), where("tipo", "==", "copla"), where("ref", "==", "copla-" + c.semana), where("estado", "==", "aprobado")));
    const lista = r.docs.map(x => ({ id: x.id, ...x.data() }));
    if (!lista.length) { d.querySelector("#cp-l").innerHTML = "<p>Todavía no hay coplas publicadas esta semana. ¡Manda la tuya!</p>"; return; }
    const conteos = await Promise.all(lista.map(x => getCountFromServer(query(collection(C.db, "likes"), where("ref", "==", x.id))).then(s => s.data().count).catch(() => 0)));
    lista.forEach((x, k) => x.likes = conteos[k]);
    lista.sort((a, b) => b.likes - a.likes);
    const dados = new Set(LS.get("renacer-likes", []));
    d.querySelector("#cp-l").innerHTML = lista.map(x => `<div class="pp-card"><div class="pp-copla">${esc(c.v[0])}<br>${esc(c.v[1])}<br><span class="nueva">${esc(x.texto).replace(/\n/g, "<br>")}</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="pp-nota">${esc(x.alias)} · ${esc(x.lugar)}</span>
      <button class="btn-like ${dados.has(x.id) ? "dado" : ""}" data-like="${x.id}">❤️ <b>${x.likes}</b></button></div></div>`).join("");
    d.querySelectorAll("[data-like]").forEach(b => b.addEventListener("click", async () => {
      if (b.classList.contains("dado")) return;
      try {
        const u = await sesion();
        await setDoc(doc(C.db, "likes", `${b.dataset.like}_${u.uid}`), { ref: b.dataset.like });
        b.classList.add("dado"); b.querySelector("b").textContent = Number(b.querySelector("b").textContent) + 1;
        dados.add(b.dataset.like); LS.set("renacer-likes", [...dados]);
      } catch (e) { b.classList.add("dado"); }
    }));
  } catch (e) { d.querySelector("#cp-l").innerHTML = `<p>${esc(errorTexto(e))}</p>`; }
}

// Aporte
function abrirAporte() {
  const d = dialogo("Aporta tu juego", `<form id="ap-f">
    <label class="pp-nota" for="ap-tipo"><b>¿Qué vas a mandar?</b></label>
    <select class="pp-txt" id="ap-tipo"><option value="adivinanza">Una adivinanza</option><option value="refran">Un refrán o dicho</option><option value="trivia">Una pregunta de trivia</option><option value="pasado">Una pregunta de «volver al pasado»</option></select>
    <label class="pp-nota" for="ap-p" style="display:block;margin-top:10px"><b>La adivinanza o la pregunta</b></label>
    <textarea class="pp-txt" id="ap-p" maxlength="400" required></textarea>
    <label class="pp-nota" for="ap-r" style="display:block;margin-top:10px"><b>La respuesta</b></label>
    <input class="pp-txt" id="ap-r" maxlength="120" required>
    <p class="pp-nota">La emisora la revisa antes de publicarla. Si entra al juego, aparece con tu nombre.</p>
    <div class="jg-acc" style="justify-content:flex-start"><button class="pp-btn naranja">Enviar</button></div></form>`);
  d.querySelector("#ap-f").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = e.submitter; btn.disabled = true;
    const ok = await enviarMensaje("aporte", d.querySelector("#ap-p").value.trim(), { extra: { clase: d.querySelector("#ap-tipo").value, respuesta: d.querySelector("#ap-r").value.trim().slice(0, 120) } });
    if (ok) { d.close(); aviso("¡Gracias por tu aporte! 🙌"); } else btn.disabled = false;
  });
}

// ---------------- Lugares ----------------
async function pintarLugares() {
  const caja = $("#pp-lugares"); if (!caja) return;
  if (!C.CONFIGURADO) { caja.innerHTML = "<p>Pronto verás aquí desde qué veredas y pueblos nos escuchan.</p>"; return; }
  try {
    const r = await getDocs(collection(C.db, "mapa"));
    const l = r.docs.map(d => [d.data().nombre || d.id, d.data().n || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
    const total = l.reduce((t, [, n]) => t + n, 0);
    if (!total) { caja.innerHTML = `<p>¡Sé el primero en decirnos desde dónde nos escuchas!</p><div class="pp-acc"><button class="pp-btn" data-accion="perfil">Contarles</button></div>`; return; }
    const max = l[0][1];
    caja.innerHTML = `<p><b>${total}</b> ${total === 1 ? "oyente nos ha contado" : "oyentes nos han contado"} desde dónde escuchan.</p>
      ${l.slice(0, 15).map(([n, v]) => `<div class="pp-lugar"><span>${esc(n)}</span><b>${v}</b><span class="b"><i style="width:${Math.max(4, v / max * 100)}%"></i></span></div>`).join("")}
      ${perfil() ? "" : `<div class="pp-acc"><button class="pp-btn" data-accion="perfil">Yo también escucho</button></div>`}`;
  } catch (e) { caja.innerHTML = "<p>No se pudo cargar en este momento.</p>"; }
}

// ---------------- Concurso al aire ----------------
let concurso = null;
function escucharEnVivo() {
  onSnapshot(doc(C.db, "envivo", "actual"), s => {
    concurso = s.exists() ? s.data() : null;
    pintarEnVivo();
  }, () => {});
}
function pintarEnVivo() {
  const caja = $("#pp-envivo"); if (!caja) return;
  const c = concurso;
  const flotante = $("#aviso-concurso");
  if (!c || !c.visible) { caja.innerHTML = ""; if (flotante) flotante.hidden = true; return; }
  const yaResp = LS.get("resp-" + c.ronda);
  if (flotante) flotante.hidden = !(c.abierta && !yaResp && C.tabActual() !== "participa");
  let cuerpo = "";
  if (c.abierta && !yaResp) {
    cuerpo = c.opciones?.length
      ? c.opciones.map((o, k) => `<button class="pp-opcion" data-resp="${k}">${esc(o)}</button>`).join("")
      : `<form id="ev-f" style="display:flex;gap:8px;flex-wrap:wrap"><input class="pp-txt" id="ev-in" maxlength="120" placeholder="Tu respuesta" style="flex:1;min-width:180px" required><button class="pp-btn naranja">Responder</button></form>`;
    cuerpo += `<p class="pp-nota">Solo cuenta tu primera respuesta. Gana quien acierte primero.</p>`;
  } else if (c.abierta && yaResp) {
    cuerpo = `<p class="pp-ok">✅ Respondiste: «${esc(yaResp)}». Escucha la emisora para saber quién ganó.</p>`;
  } else {
    cuerpo = `${c.respuesta ? `<p>Respuesta correcta: <b>${esc(c.respuesta)}</b></p>` : ""}${c.ganador ? `<p>🏆 Ganó: <b>${esc(c.ganador)}</b></p>` : "<p>Ya se cerraron las respuestas.</p>"}`;
  }
  caja.innerHTML = `<div class="pp-card envivo" style="margin-bottom:16px"><span class="pp-chip rojo">● Concurso en vivo</span>${c.etiqueta ? `<span class="pp-nota">${esc(c.etiqueta)}</span>` : ""}<h3>${esc(c.pregunta)}</h3>${cuerpo}</div>`;
  caja.querySelectorAll("[data-resp]").forEach(b => b.addEventListener("click", () => responderEnVivo(c.opciones[Number(b.dataset.resp)])));
  caja.querySelector("#ev-f")?.addEventListener("submit", e => { e.preventDefault(); responderEnVivo(caja.querySelector("#ev-in").value.trim()); });
}
async function responderEnVivo(respuesta) {
  if (!respuesta || !concurso?.abierta) return;
  const p = await asegurarPerfil("Para concursar, dinos tu nombre y desde dónde escuchas, así el locutor te puede nombrar.");
  if (!p) return;
  try {
    const u = await sesion();
    await setDoc(doc(C.db, "respuestas", `${concurso.ronda}_${u.uid}`), {
      ronda: concurso.ronda, uid: u.uid, alias: p.alias, lugar: p.lugar, respuesta: respuesta.slice(0, 120), cuando: serverTimestamp()
    });
    LS.set("resp-" + concurso.ronda, respuesta);
    aviso("¡Respuesta enviada! 🍀");
  } catch (e) {
    if ((e.code || "").includes("permission-denied")) { LS.set("resp-" + concurso.ronda, respuesta); aviso("Ya habías respondido, o se cerraron las respuestas."); }
    else aviso(errorTexto(e));
  }
  pintarEnVivo();
}

// ---------------- Votaciones y encuestas ----------------
let votaciones = [], refrescoVotos = null;
function escucharVotaciones() {
  onSnapshot(query(collection(C.db, "votaciones"), where("activa", "==", true)), s => {
    votaciones = s.docs.map(d => ({ id: d.id, ...d.data() }));
    pintarVotaciones();
  }, () => {});
  clearInterval(refrescoVotos);
  refrescoVotos = setInterval(() => { if (votaciones.some(v => LS.get("voto-" + v.id) != null)) pintarVotaciones(); }, 20000);
}
async function conteoVotos(v) {
  const n = await Promise.all(v.opciones.map((_, i) => getCountFromServer(query(collection(C.db, "votos"), where("votacion", "==", v.id), where("opcion", "==", i))).then(s => s.data().count).catch(() => 0)));
  return n;
}
async function pintarVotaciones() {
  const caja = $("#pp-votaciones"); if (!caja) return;
  const ahora = Date.now();
  const vivas = votaciones.filter(v => !v.cierra || v.cierra.toMillis() > ahora).sort((a, b) => (a.tipo === "cancion" ? -1 : 1));
  if (!vivas.length) { caja.innerHTML = ""; return; }
  const html = await Promise.all(vivas.map(async v => {
    const mio = LS.get("voto-" + v.id);
    const faltan = v.cierra ? Math.max(1, Math.round((v.cierra.toMillis() - ahora) / 60000)) : null;
    const cierre = faltan ? (faltan < 120 ? `Se cierra en ${faltan} min` : `Se cierra en ${Math.round(faltan / 1440) || 1} ${Math.round(faltan / 1440) > 1 ? "días" : "día"}`) : "";
    let cuerpo;
    if (mio == null) cuerpo = v.opciones.map((o, i) => `<button class="pp-opcion" data-votar="${v.id}" data-op="${i}">${esc(o)}</button>`).join("");
    else {
      const n = await conteoVotos(v); const t = n.reduce((a, b) => a + b, 0) || 1;
      cuerpo = v.opciones.map((o, i) => `<div class="pp-barra ${i === mio ? "mio" : ""}"><i style="width:${Math.round(n[i] / t * 100)}%"></i><span><span>${esc(o)}${i === mio ? " ✔" : ""}</span><span>${Math.round(n[i] / t * 100)}%</span></span></div>`).join("") + `<p class="pp-nota">${n.reduce((a, b) => a + b, 0)} votos</p>`;
    }
    return `<div class="pp-card ${v.tipo === "cancion" ? "destacada" : ""}" style="margin-bottom:14px"><span class="pp-chip">${v.tipo === "cancion" ? "🎵 Votación en vivo" : "📊 Encuesta"}</span><h3>${esc(v.pregunta)}</h3>${cuerpo}<p class="pp-nota">${cierre}</p></div>`;
  }));
  caja.innerHTML = html.join("");
  caja.querySelectorAll("[data-votar]").forEach(b => b.addEventListener("click", () => votar(b.dataset.votar, Number(b.dataset.op))));
}
async function votar(id, op) {
  try {
    const u = await sesion();
    await setDoc(doc(C.db, "votos", `${id}_${u.uid}`), { votacion: id, opcion: op });
    LS.set("voto-" + id, op);
  } catch (e) {
    if ((e.code || "").includes("permission-denied")) LS.set("voto-" + id, op);
    else { aviso(errorTexto(e)); return; }
  }
  pintarVotaciones();
}

// ---------------- Reacciones en vivo ----------------
const REACCIONES = [["corazon", "❤️"], ["fuego", "🔥"], ["aplauso", "👏"], ["oracion", "🙏"]];
let ultimaReaccion = 0, conteoReacciones = {};
function notaReacciones(t) {
  let n = $("#reacciones-nota");
  if (!n) { n = document.createElement("div"); n.id = "reacciones-nota"; n.className = "reacciones-nota"; $("#reacciones")?.after(n); }
  n.textContent = t || "";
  clearTimeout(n._t); if (t) n._t = setTimeout(() => n.textContent = "", 6000);
}
function motivoFallo(x) {
  const c = x?.code || "";
  console.warn("[Renacer] Reacciones:", c, x?.message || x);
  if (c.includes("operation-not-allowed") || c.includes("admin-restricted")) return "Las reacciones aún no están activadas en la emisora.";
  if (c.includes("permission-denied")) return "Las reacciones aún no están activadas en la emisora.";
  if (c.includes("unavailable") || c.includes("network")) return "Sin conexión. Inténtalo de nuevo.";
  return "No se pudo enviar tu reacción. Inténtalo de nuevo.";
}
function pintarReacciones() {
  const caja = $("#reacciones"); if (!caja) return;
  caja.innerHTML = REACCIONES.map(([k, e]) => `<button class="reaccion" data-reac="${k}" aria-label="Reaccionar ${k}">${e} <b>${conteoReacciones[k] || 0}</b></button>`).join("");
}
function escucharReacciones() {
  pintarReacciones();
  const caja = $("#reacciones"); if (!caja) return;
  let dia = J.diaNumero(), quitar = null;
  const escuchar = () => {
    quitar?.();
    quitar = onSnapshot(doc(C.db, "reacciones", String(dia)),
      s => { conteoReacciones = s.exists() ? s.data() : {}; pintarReacciones(); },
      x => console.warn("[Renacer] No se pueden leer las reacciones:", x?.code || x));
  };
  escuchar();
  setInterval(() => { if (J.diaNumero() !== dia) { dia = J.diaNumero(); conteoReacciones = {}; escuchar(); } }, 60000);
  caja.addEventListener("click", async e => {
    const b = e.target.closest("[data-reac]"); if (!b) return;
    b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
    const espera = 4000 - (Date.now() - ultimaReaccion);
    if (espera > 0) { notaReacciones("¡Gracias! Espera un momentico para reaccionar otra vez."); return; }
    ultimaReaccion = Date.now();
    const k = b.dataset.reac;
    // Se ve de una vez; si falla, se devuelve
    conteoReacciones = { ...conteoReacciones, [k]: (conteoReacciones[k] || 0) + 1 }; pintarReacciones();
    try { await sesion(); await setDoc(doc(C.db, "reacciones", String(J.diaNumero())), { [k]: increment(1) }, { merge: true }); }
    catch (x) {
      conteoReacciones = { ...conteoReacciones, [k]: Math.max(0, (conteoReacciones[k] || 1) - 1) }; pintarReacciones();
      notaReacciones(motivoFallo(x));
    }
  });
}

// ---------------- Reacciones a noticias, avisos y audios (una por persona) ----------------
export const REAC_ITEM = [["corazon", "❤️", "Me encanta"], ["oracion", "🙏", "En oración"], ["aplauso", "👏", "Aplauso"], ["asombro", "😮", "Asombro"], ["triste", "😢", "Triste"]];
const totalesReac = {};               // item -> { corazon: n, ... }
let misReac = LS.get("renacer-misreac", {}) || {};
const EMO = Object.fromEntries(REAC_ITEM.map(([k, e]) => [k, e]));
function resumenReac(item) {
  const t = totalesReac[item] || {};
  return REAC_ITEM.filter(([k]) => (t[k] || 0) > 0).sort((a, b) => (t[b[0]] || 0) - (t[a[0]] || 0)).map(([k, e]) => `${e} ${t[k]}`).join("  ");
}
// HTML de la fila de reacciones de una publicación
export function barraReac(item, titulo = "") {
  const t = totalesReac[item] || {}, mia = misReac[item];
  return `<div class="reac-item" data-item="${C?.esc ? esc(item) : item}" role="group" aria-label="Reacciones${titulo ? " a " + (C?.esc ? esc(titulo) : "") : ""}">
    ${REAC_ITEM.map(([k, e, l]) => `<button type="button" data-ri="${k}" class="${mia === k ? "mia" : ""}" aria-pressed="${mia === k}" title="${l}" aria-label="${l}">${e}<b>${t[k] || ""}</b></button>`).join("")}
  </div>`;
}
// Resumen pequeño (solo lectura) para tarjetas que son botones
export function resumenReacHTML(item) { return `<span class="reac-res" data-res="${item}">${resumenReac(item)}</span>`; }
function refrescarReac() {
  document.querySelectorAll(".reac-item[data-item]").forEach(el => {
    const it = el.dataset.item, t = totalesReac[it] || {}, mia = misReac[it];
    el.querySelectorAll("[data-ri]").forEach(b => {
      const k = b.dataset.ri; b.classList.toggle("mia", mia === k); b.setAttribute("aria-pressed", mia === k);
      b.querySelector("b").textContent = t[k] || "";
    });
  });
  document.querySelectorAll(".reac-res[data-res]").forEach(el => el.textContent = resumenReac(el.dataset.res));
}
// Trae los totales de las publicaciones que están en pantalla (solo las que faltan)
export async function cargarReac(db, items, forzar = false) {
  const faltan = [...new Set(items)].filter(i => forzar || !(i in totalesReac));
  if (!db || !faltan.length) { refrescarReac(); return; }
  faltan.forEach(i => totalesReac[i] ??= {});
  try {
    for (let i = 0; i < faltan.length; i += 30) {
      const r = await getDocs(query(collection(db, "reac_total"), where(documentId(), "in", faltan.slice(i, i + 30))));
      r.forEach(d => totalesReac[d.id] = d.data());
    }
  } catch (x) { console.warn("[Renacer] No se pueden leer las reacciones de las publicaciones:", x?.code || x); }
  refrescarReac();
}
document.addEventListener("click", async e => {
  const b = e.target.closest(".reac-item [data-ri]"); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  if (!C?.CONFIGURADO) return;
  const caja = b.closest(".reac-item"), item = caja.dataset.item, k = b.dataset.ri;
  if (misReac[item]) { aviso(misReac[item] === k ? "Ya reaccionaste a esta publicación. ¡Gracias!" : "Solo se puede una reacción por publicación."); return; }
  if (caja._enviando) return; caja._enviando = true;
  b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
  const antes = { ...(totalesReac[item] || {}) };
  totalesReac[item] = { ...antes, [k]: (antes[k] || 0) + 1 }; misReac[item] = k; refrescarReac();
  try {
    const u = await sesion();
    const lote = writeBatch(C.db);
    lote.set(doc(C.db, "reac", `${item}_${u.uid}`), { item, r: k, uid: u.uid });
    lote.set(doc(C.db, "reac_total", item), { [k]: increment(1) }, { merge: true });
    await lote.commit();
    LS.set("renacer-misreac", misReac);
  } catch (x) {
    totalesReac[item] = antes; delete misReac[item];
    // ¿Ya había reaccionado desde este teléfono antes?
    try { const u = await sesion(), d = await getDoc(doc(C.db, "reac", `${item}_${u.uid}`)); if (d.exists()) { misReac[item] = d.data().r; LS.set("renacer-misreac", misReac); } else aviso(motivoFallo(x)); }
    catch (y) { aviso(motivoFallo(x)); }
    refrescarReac();
  }
  caja._enviando = false;
});

// ---------------- Comentarios de noticias ----------------
export async function comentariosNoticia(contenedor, noticiaId) {
  if (!C?.CONFIGURADO || !noticiaId) return;
  contenedor.innerHTML = `<div class="cm-lista"><h3>Comentarios</h3><div id="cm-l"><p class="pp-nota">Cargando…</p></div>
    <form id="cm-f"><textarea class="pp-txt" id="cm-t" maxlength="500" placeholder="Escribe tu comentario con respeto" required></textarea>
    <div class="jg-acc" style="justify-content:flex-start"><button class="pp-btn">Comentar</button></div>
    <p class="pp-nota">Los comentarios se publican después de que la emisora los revise.</p></form></div>`;
  try {
    const r = await getDocs(query(collection(C.db, "mensajes"), where("tipo", "==", "comentario"), where("ref", "==", noticiaId), where("estado", "==", "aprobado")));
    const l = r.docs.map(d => d.data()).sort((a, b) => (a.cuando?.toMillis?.() || 0) - (b.cuando?.toMillis?.() || 0));
    contenedor.querySelector("#cm-l").innerHTML = l.length ? l.map(c => `<div class="cm"><b>${esc(c.alias)}</b><span>${esc(c.lugar)}${c.cuando?.toDate ? " · " + c.cuando.toDate().toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : ""}</span><p>${esc(c.texto)}</p></div>`).join("") : `<p class="pp-nota">Sé el primero en comentar.</p>`;
  } catch (e) { contenedor.querySelector("#cm-l").innerHTML = ""; }
  contenedor.querySelector("#cm-f").addEventListener("submit", async e => {
    e.preventDefault();
    const t = contenedor.querySelector("#cm-t");
    const btn = e.submitter; btn.disabled = true;
    if (await enviarMensaje("comentario", t.value.trim(), { ref: noticiaId })) { t.value = ""; aviso("¡Gracias! Tu comentario aparecerá cuando lo aprueben."); }
    btn.disabled = false;
  });
}

// ---------------- Arranque ----------------
export async function iniciarParticipa(contexto) {
  C = contexto;
  const raiz = $("#participa-raiz"); if (!raiz) return;
  raiz.innerHTML = esqueleto();
  pintarHola();
  try { await J.cargarBanco(); } catch (e) {}
  pintarJuegos();
  pintarLugares();
  if (C.CONFIGURADO) {
    escucharEnVivo(); escucharVotaciones(); escucharReacciones(); cargarExtra();
  } else {
    $("#reacciones")?.remove();
  }
  raiz.addEventListener("click", async e => {
    const a = e.target.closest("[data-accion]");
    if (a) {
      e.preventDefault();
      const acc = a.dataset.accion;
      if (acc === "perfil") pedirPerfil();
      else if (acc === "reto") abrirReto();
      else if (acc === "libre") abrirLibre();
      else if (acc === "ranking") abrirRanking();
      else if (acc === "copla") abrirCopla();
      else if (acc === "coplas") verCoplas();
      else if (acc === "aporte") abrirAporte();
      else if (acc === "pedido") C.irA("#form-cancion");
      else if (acc === "subir-reto") subirReto(J.diaNumero());
      else if (acc === "compartir-reto") { const h = LS.get("reto-" + J.diaNumero()); if (h) compartirResultado("Reto del día", h.aciertos, 5); }
      return;
    }
    const env = e.target.closest("[data-enviar]");
    if (env) {
      const tipo = env.dataset.enviar;
      const t = $(tipo === "saludo" ? "#pp-saludo" : "#pp-intencion");
      if (!t.value.trim()) { t.focus(); return; }
      env.disabled = true;
      if (await enviarMensaje(tipo, t.value.trim())) { t.value = ""; aviso(tipo === "saludo" ? "¡Saludo enviado! Pendiente de la emisora 📻" : "Tu intención llegó. Oramos contigo 🙏", 4500); }
      env.disabled = false;
    }
  });
  document.addEventListener("cambio-tab", () => pintarEnVivo());
  $("#aviso-concurso")?.addEventListener("click", () => { C.irTab("participa"); });
}
