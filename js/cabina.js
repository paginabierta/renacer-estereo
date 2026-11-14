// ============================================================
//  Renacer Estéreo — Cabina, moderación, encuestas y juegos (panel)
// ============================================================
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, orderBy, limit,
  getDocs, onSnapshot, serverTimestamp, Timestamp, getCountFromServer, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as J from "./juegos.js";

let X = null;                 // contexto: { db, esc, aviso, errorTexto, cfg }
let limpiezas = [];
const $ = s => document.querySelector(s);
const esc = s => X.esc(s);
export function limpiarCabina() { limpiezas.forEach(f => { try { f(); } catch (e) {} }); limpiezas = []; }
const alSalir = f => limpiezas.push(f);
const hora = t => t?.toDate ? t.toDate().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "";
const haceRato = t => {
  if (!t?.toMillis) return "";
  const m = Math.round((Date.now() - t.toMillis()) / 60000);
  return m < 1 ? "ahora" : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} días`;
};
const NOMBRE_TIPO = { saludo: "👋 Saludo", pedido: "🎵 Pedido", intencion: "🙏 Intención", comentario: "💬 Comentario", copla: "🎶 Copla", aporte: "🙌 Aporte" };

const ESTILO = `<style>
.cab-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:18px;align-items:start}
.cab-grid .tarjeta{margin:0}
.cab-preg{background:#F3F5F9;border-radius:12px;padding:14px;margin:12px 0}
.cab-preg .resp{background:#DFF3E4;color:#14612B;border-radius:8px;padding:8px 10px;font-weight:700;margin-top:8px}
.cab-fila{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;padding:8px 6px;border-bottom:1px solid #DDE3EE}
.cab-fila.bien{background:#EEF9F1}
.cab-fila small{color:#5B6780}
.cab-msg{border:1px solid #DDE3EE;border-radius:12px;padding:12px;margin-bottom:10px;background:#fff}
.cab-msg p{margin:6px 0;white-space:pre-line;font-size:1.05rem}
.cab-msg .meta{font-size:.85rem;color:#5B6780}
.cab-chip{display:inline-block;font-size:.78rem;font-weight:700;border-radius:999px;padding:2px 10px;background:#FDE7DA;color:#9A3A0B}
.cab-chip.rojo{background:#E53935;color:#fff}
.cab-bar{position:relative;background:#F3F5F9;border-radius:8px;margin:6px 0;overflow:hidden}
.cab-bar i{position:absolute;inset:0 auto 0 0;background:#FBD7C2}
.cab-bar span{position:relative;display:flex;justify-content:space-between;padding:8px 10px;font-weight:700}
.cab-filtros{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.cab-filtros button{border:1.5px solid #DDE3EE;background:#fff;border-radius:999px;padding:5px 12px;font-weight:700}
.cab-filtros button[aria-pressed="true"]{background:#0E3A7A;color:#fff;border-color:#0E3A7A}
.cab-big{font:700 2.2rem/1 "Asap Condensed",sans-serif;color:#0E3A7A}
.cab-reac{display:flex;gap:14px;flex-wrap:wrap;font-size:1.3rem}
.cab-tabla td,.cab-tabla th{padding:6px 8px;border-bottom:1px solid #DDE3EE;text-align:left}
.cab-tabla{width:100%;border-collapse:collapse}
.pp-nota{font-size:.85rem;color:#5B6780}
.cab-copla{font:600 1.15rem/1.35 "Asap Condensed",sans-serif;border-left:4px solid #F5A830;padding-left:10px;margin:6px 0}
</style>`;

const TIPOS_CABINA = [
  ["trivia", "Trivia"], ["adivinanza", "Adivinanza"], ["acertijo", "Acertijo"], ["refran", "Completa el refrán"],
  ["pasado", "Volver al pasado"], ["musica", "Música"], ["ortografia", "Ortografía"], ["calculo", "Cálculo mental"],
  ["palabra", "Palabras revueltas"], ["aporte", "Aportes de los oyentes"]
];

async function cargarExtra() {
  try { const r = await getDocs(query(collection(X.db, "banco_extra"), limit(500))); J.ponerExtra(r.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) {}
}

// ======================= CABINA EN VIVO =======================
async function vistaCabina(main) {
  await J.cargarBanco(); await cargarExtra();
  main.innerHTML = ESTILO + `<div class="cabeza"><h2>Cabina en vivo</h2></div>
  <div class="cab-grid">
    <div class="tarjeta"><h3>🎤 Concurso al aire</h3>
      <div class="fila"><div class="campo"><label for="cb-tipo">Tipo de pregunta</label><select id="cb-tipo">${TIPOS_CABINA.map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select></div>
      <div class="campo" id="cb-cat-c"><label for="cb-cat">Tema</label><select id="cb-cat"><option value="">Todos los temas</option>${J.categoriasTrivia().map(c => `<option>${esc(c)}</option>`).join("")}</select></div></div>
      <div class="acciones"><button class="btn" id="cb-sacar">Sacar pregunta</button><button class="btn sec" id="cb-propia">Escribir mi pregunta</button></div>
      <div id="cb-preg"></div>
      <div id="cb-ronda"></div>
    </div>
    <div class="tarjeta"><h3>📨 Para leer al aire</h3>
      <div class="cab-filtros" id="cb-filtros"><button data-f="todos" aria-pressed="true">Todos</button><button data-f="saludo" aria-pressed="false">Saludos</button><button data-f="pedido" aria-pressed="false">Pedidos</button><button data-f="intencion" aria-pressed="false">Intenciones</button></div>
      <div id="cb-msgs"><p>Cargando…</p></div>
    </div>
    <div class="tarjeta"><h3>🎵 ¿Cuál suena después?</h3>
      <p class="pp-nota">Escribe de 2 a 4 canciones. La gente vota desde la app y ves el resultado aquí en vivo.</p>
      ${[1, 2, 3, 4].map(i => `<div class="campo"><input type="text" id="cb-c${i}" placeholder="Canción ${i}${i > 2 ? " (opcional)" : ""} — artista"></div>`).join("")}
      <div class="acciones"><select id="cb-min" style="width:auto"><option value="3">3 minutos</option><option value="5" selected>5 minutos</option><option value="10">10 minutos</option><option value="15">15 minutos</option></select><button class="btn naranja" id="cb-votar">Lanzar votación</button></div>
      <div id="cb-votos" style="margin-top:14px"></div>
    </div>
    <div class="tarjeta"><h3>📊 En este momento</h3>
      <p>Oyentes conectados por internet: <span class="cab-big" id="cb-oyentes">—</span></p>
      <p style="margin-bottom:4px">Reacciones de hoy:</p><div class="cab-reac" id="cb-reac">—</div>
      <p class="pp-nota" style="margin-top:14px">El reto del día de hoy, por si quieres comentarlo al aire:</p><div id="cb-reto"></div>
    </div>
  </div>`;

  // ---- Concurso ----
  const tipoSel = $("#cb-tipo");
  const verCat = () => $("#cb-cat-c").style.display = tipoSel.value === "trivia" ? "" : "none";
  tipoSel.addEventListener("change", verCat); verCat();
  let actual = null;
  function mostrarPregunta(q) {
    actual = q;
    if (!q) { $("#cb-preg").innerHTML = `<div class="cab-preg">No hay preguntas de este tipo todavía.</div>`; return; }
    $("#cb-preg").innerHTML = `<div class="cab-preg"><span class="cab-chip">${esc(q.etiqueta)}</span>
      <div class="campo" style="margin-top:8px"><label for="cb-p">Pregunta (puedes corregirla)</label><textarea id="cb-p">${esc(q.p)}</textarea></div>
      ${q.opciones ? `<ol>${q.opciones.map(o => `<li>${esc(o)}</li>`).join("")}</ol><label class="check"><input type="checkbox" id="cb-mostrar" checked> Mostrar las opciones en la app</label>` : `<p class="pp-nota">Sin opciones: la gente escribe la respuesta.</p>`}
      <div class="resp">Respuesta: ${esc(q.r)} <small>(solo la ves tú)</small></div>
      <div class="acciones" style="margin-top:10px"><button class="btn naranja" id="cb-lanzar">🔴 Lanzar al aire</button><button class="btn sec" id="cb-otra">Otra pregunta</button></div></div>`;
    $("#cb-lanzar").onclick = lanzar;
    $("#cb-otra").onclick = sacar;
  }
  function sacar() { mostrarPregunta(J.preguntaParaCabina(tipoSel.value, $("#cb-cat").value)); }
  $("#cb-sacar").onclick = sacar;
  $("#cb-propia").onclick = () => {
    $("#cb-preg").innerHTML = `<div class="cab-preg"><div class="campo"><label for="pr-p">Pregunta</label><textarea id="pr-p"></textarea></div>
      <div class="campo"><label for="pr-r">Respuesta correcta</label><input type="text" id="pr-r"></div>
      <div class="campo"><label>Opciones incorrectas (opcional: si las dejas vacías, la gente escribe la respuesta)</label>
      <input type="text" id="pr-o1" placeholder="Incorrecta 1"><input type="text" id="pr-o2" placeholder="Incorrecta 2" style="margin-top:6px"><input type="text" id="pr-o3" placeholder="Incorrecta 3" style="margin-top:6px"></div>
      <button class="btn naranja" id="pr-ok">Usar esta pregunta</button></div>`;
    $("#pr-ok").onclick = () => {
      const p = $("#pr-p").value.trim(), r = $("#pr-r").value.trim();
      if (!p || !r) return X.aviso("Escribe la pregunta y la respuesta", "error");
      const malas = ["#pr-o1", "#pr-o2", "#pr-o3"].map(s => $(s).value.trim()).filter(Boolean);
      mostrarPregunta({ id: "propia", tipo: "propia", etiqueta: "Pregunta de la cabina", p, r, opciones: malas.length ? J.barajar([r, ...malas]) : null });
    };
  };
  async function lanzar() {
    const q = actual; if (!q) return;
    const ronda = Date.now().toString(36);
    const mostrar = q.opciones && ($("#cb-mostrar")?.checked ?? true);
    try {
      await setDoc(doc(X.db, "envivo_privado", "actual"), { ronda, r: q.r, opciones: q.opciones || [] });
      await setDoc(doc(X.db, "envivo", "actual"), { ronda, visible: true, abierta: true, etiqueta: q.etiqueta, pregunta: $("#cb-p")?.value.trim() || q.p, opciones: mostrar ? q.opciones : [], ganador: "", respuesta: "", lanzada: serverTimestamp() });
      X.aviso("¡Pregunta al aire! Ya aparece en la app.", "ok");
      $("#cb-preg").innerHTML = "";
    } catch (e) { X.aviso(X.errorTexto(e), "error"); }
  }

  // Ronda en curso (se escucha en tiempo real)
  let quitarResp = null, rondaActual = null, privado = null, ultimas = null;
  alSalir(onSnapshot(doc(X.db, "envivo", "actual"), async s => {
    const c = s.exists() ? s.data() : null;
    const caja = $("#cb-ronda"); if (!caja) return;
    if (!c || !c.visible) { caja.innerHTML = ""; quitarResp?.(); quitarResp = null; rondaActual = null; return; }
    if (c.ronda !== rondaActual) {
      rondaActual = c.ronda; ultimas = null;
      try { const p = await getDoc(doc(X.db, "envivo_privado", "actual")); privado = p.exists() && p.data().ronda === c.ronda ? p.data() : null; } catch (e) { privado = null; }
      quitarResp?.();
      quitarResp = onSnapshot(query(collection(X.db, "respuestas"), where("ronda", "==", c.ronda)), r => pintarRespuestas(r.docs.map(d => d.data())), () => {});
    }
    caja.innerHTML = `<div class="cab-preg" style="background:#FFF0F0"><span class="cab-chip rojo">${c.abierta ? "● AL AIRE · recibiendo respuestas" : "Respuestas cerradas"}</span>
      <p style="font-weight:700;margin:8px 0">${esc(c.pregunta)}</p>${privado ? `<div class="resp">Respuesta: ${esc(privado.r)}</div>` : ""}
      ${c.ganador ? `<p>🏆 Ganador anunciado: <b>${esc(c.ganador)}</b></p>` : ""}
      <div class="acciones" style="margin:10px 0">${c.abierta ? `<button class="btn" id="cb-cerrar">Cerrar respuestas</button>` : ""}<button class="btn sec" id="cb-quitar">Quitar de la app</button></div>
      <div id="cb-resp"><p class="pp-nota">Esperando respuestas…</p></div></div>`;
    $("#cb-cerrar")?.addEventListener("click", () => updateDoc(doc(X.db, "envivo", "actual"), { abierta: false }).catch(e => X.aviso(X.errorTexto(e), "error")));
    $("#cb-quitar").addEventListener("click", () => updateDoc(doc(X.db, "envivo", "actual"), { visible: false, abierta: false }).catch(e => X.aviso(X.errorTexto(e), "error")));
    if (ultimas) pintarRespuestas(ultimas);
  }, () => {}));
  alSalir(() => quitarResp?.());
  function pintarRespuestas(lista) {
    ultimas = lista;
    const caja = $("#cb-resp"); if (!caja) return;
    if (!lista.length) { caja.innerHTML = `<p class="pp-nota">Esperando respuestas…</p>`; return; }
    lista.sort((a, b) => (a.cuando?.toMillis?.() || 0) - (b.cuando?.toMillis?.() || 0));
    const bien = r => privado ? J.esCorrecta({ r: privado.r }, r.respuesta) : false;
    const nBien = lista.filter(bien).length;
    caja.innerHTML = `<p><b>${lista.length}</b> respuestas · <b>${nBien}</b> correctas</p>` + lista.map((r, k) => `<div class="cab-fila ${bien(r) ? "bien" : ""}"><b>${k + 1}</b>
      <div>${bien(r) ? "✅ " : ""}<b>${esc(r.alias)}</b> · ${esc(r.lugar)}<br><small>«${esc(r.respuesta)}» · ${hora(r.cuando)}</small></div>
      <button class="btn sec" style="padding:5px 10px" data-gana="${k}">🏆</button></div>`).join("");
    caja.querySelectorAll("[data-gana]").forEach(b => b.addEventListener("click", () => {
      const r = lista[Number(b.dataset.gana)];
      updateDoc(doc(X.db, "envivo", "actual"), { abierta: false, ganador: `${r.alias} de ${r.lugar}`, respuesta: privado?.r || "" })
        .then(() => X.aviso("Ganador anunciado en la app", "ok")).catch(e => X.aviso(X.errorTexto(e), "error"));
    }));
  }

  // ---- Mensajes para el aire ----
  let filtro = "todos", mensajes = [];
  $("#cb-filtros").addEventListener("click", e => {
    const b = e.target.closest("[data-f]"); if (!b) return;
    filtro = b.dataset.f;
    $("#cb-filtros").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
    pintarMensajes();
  });
  function pintarMensajes() {
    const caja = $("#cb-msgs"); if (!caja) return;
    const l = mensajes.filter(m => ["saludo", "pedido", "intencion"].includes(m.tipo) && (filtro === "todos" || m.tipo === filtro))
      .sort((a, b) => (a.cuando?.toMillis?.() || 0) - (b.cuando?.toMillis?.() || 0));
    caja.innerHTML = l.length ? l.map(m => `<div class="cab-msg"><span class="cab-chip">${NOMBRE_TIPO[m.tipo]}</span> <span class="meta">${haceRato(m.cuando)}</span>
      <p>${esc(m.texto)}</p><div class="meta">— ${esc(m.alias)}, ${esc(m.lugar)}</div>
      <div class="acciones" style="margin-top:8px"><button class="btn" style="padding:6px 14px" data-leido="${m.id}">✔ Leído al aire</button><button class="btn peligro" style="padding:6px 14px" data-borrar="${m.id}">Borrar</button></div></div>`).join("")
      : `<p class="pp-nota">No hay mensajes pendientes. 🙌</p>`;
  }
  $("#cb-msgs").addEventListener("click", e => {
    const l = e.target.closest("[data-leido]"), b = e.target.closest("[data-borrar]");
    if (l) updateDoc(doc(X.db, "mensajes", l.dataset.leido), { estado: "leido", leido: serverTimestamp() }).catch(err => X.aviso(X.errorTexto(err), "error"));
    if (b && confirm("¿Borrar este mensaje?")) deleteDoc(doc(X.db, "mensajes", b.dataset.borrar)).catch(err => X.aviso(X.errorTexto(err), "error"));
  });
  alSalir(onSnapshot(query(collection(X.db, "mensajes"), where("estado", "==", "pendiente")), s => {
    mensajes = s.docs.map(d => ({ id: d.id, ...d.data() })); pintarMensajes();
  }, e => { $("#cb-msgs").innerHTML = `<p>${esc(X.errorTexto(e))}</p>`; }));

  // ---- Votación de canciones ----
  $("#cb-votar").onclick = async () => {
    const opciones = [1, 2, 3, 4].map(i => $("#cb-c" + i).value.trim()).filter(Boolean);
    if (opciones.length < 2) return X.aviso("Escribe al menos 2 canciones", "error");
    const min = Number($("#cb-min").value);
    try {
      await addDoc(collection(X.db, "votaciones"), { tipo: "cancion", pregunta: "¿Cuál suena después?", opciones, activa: true, cierra: Timestamp.fromMillis(Date.now() + min * 60000), creada: serverTimestamp() });
      [1, 2, 3, 4].forEach(i => $("#cb-c" + i).value = "");
      X.aviso("¡Votación al aire!", "ok");
    } catch (e) { X.aviso(X.errorTexto(e), "error"); }
  };
  let votacionesVivas = [];
  async function pintarVotos() {
    const caja = $("#cb-votos"); if (!caja) return;
    const l = votacionesVivas.filter(v => v.tipo === "cancion");
    if (!l.length) { caja.innerHTML = ""; return; }
    const html = await Promise.all(l.map(async v => {
      const n = await Promise.all(v.opciones.map((_, i) => getCountFromServer(query(collection(X.db, "votos"), where("votacion", "==", v.id), where("opcion", "==", i))).then(s => s.data().count).catch(() => 0)));
      const t = n.reduce((a, b) => a + b, 0), max = Math.max(...n);
      const cerrada = v.cierra && v.cierra.toMillis() < Date.now();
      return `<div class="cab-preg"><span class="cab-chip ${cerrada ? "" : "rojo"}">${cerrada ? "Votación cerrada" : "● Votando · cierra " + hora(v.cierra)}</span>
        ${v.opciones.map((o, i) => `<div class="cab-bar"><i style="width:${t ? n[i] / t * 100 : 0}%"></i><span><span>${n[i] === max && t ? "🏆 " : ""}${esc(o)}</span><span>${n[i]}</span></span></div>`).join("")}
        <p class="pp-nota">${t} votos</p><button class="btn sec" data-fin="${v.id}">${cerrada ? "Archivar" : "Cerrar ya"}</button></div>`;
    }));
    if ($("#cb-votos")) $("#cb-votos").innerHTML = html.join("");
  }
  $("#cb-votos").addEventListener("click", e => {
    const b = e.target.closest("[data-fin]");
    if (b) updateDoc(doc(X.db, "votaciones", b.dataset.fin), { activa: false }).catch(err => X.aviso(X.errorTexto(err), "error"));
  });
  alSalir(onSnapshot(query(collection(X.db, "votaciones"), where("activa", "==", true)), s => {
    votacionesVivas = s.docs.map(d => ({ id: d.id, ...d.data() })); pintarVotos();
  }, () => {}));
  const iv = setInterval(pintarVotos, 6000); alSalir(() => clearInterval(iv));

  // ---- En este momento ----
  const emo = { corazon: "❤️", fuego: "🔥", aplauso: "👏", oracion: "🙏" };
  alSalir(onSnapshot(doc(X.db, "reacciones", String(J.diaNumero())), s => {
    const d = s.exists() ? s.data() : {};
    if ($("#cb-reac")) $("#cb-reac").innerHTML = Object.entries(emo).map(([k, e]) => `<span>${e} <b>${d[k] || 0}</b></span>`).join("");
  }, () => {}));
  async function oyentes() {
    const c = X.cfg();
    try {
      const r = await fetch(`${String(c.azuracastServidor).replace(/\/$/, "")}/api/nowplaying/${c.azuracastEstacion}`, { cache: "no-store" });
      const d = await r.json();
      if ($("#cb-oyentes")) $("#cb-oyentes").textContent = d?.listeners?.current ?? "—";
    } catch (e) {}
  }
  oyentes(); const io = setInterval(oyentes, 30000); alSalir(() => clearInterval(io));
  $("#cb-reto").innerHTML = J.retoDelDia().map((q, i) => `<div class="cab-preg" style="margin:6px 0;padding:10px"><b>${i + 1}.</b> ${esc(q.p)}<br><small>✅ ${esc(q.r)}</small></div>`).join("");
}

// ======================= MODERACIÓN =======================
async function vistaModeracion(main) {
  await J.cargarBanco();
  main.innerHTML = ESTILO + `<div class="cabeza"><h2>Moderación</h2></div>
    <p class="pp-nota">Comentarios, coplas y aportes que mandó la gente. Nada se publica hasta que lo apruebes.</p>
    <div class="tarjeta"><h3>Pendientes</h3><div id="md-pend"><p>Cargando…</p></div></div>
    <div class="tarjeta"><h3>Publicados</h3><div class="cab-filtros" id="md-pub-f"><button data-t="comentario" aria-pressed="true">Comentarios</button><button data-t="copla" aria-pressed="false">Coplas</button></div><div id="md-pub"><p>Cargando…</p></div></div>`;
  const titulos = {};
  async function tituloNoticia(id) {
    if (titulos[id] != null) return titulos[id];
    try { const s = await getDoc(doc(X.db, "noticias", id)); titulos[id] = s.exists() ? s.data().titulo : "(noticia borrada)"; } catch (e) { titulos[id] = ""; }
    return titulos[id];
  }
  async function detalle(m) {
    if (m.tipo === "comentario") return `<div class="meta">En la noticia: «${esc(await tituloNoticia(m.ref))}»</div><p>${esc(m.texto)}</p>`;
    if (m.tipo === "copla") {
      const sem = Number(String(m.ref || "").replace("copla-", ""));
      const c = Number.isFinite(sem) ? J.coplaDeLaSemana(sem) : null;
      return `<div class="cab-copla">${c ? esc(c.v[0]) + "<br>" + esc(c.v[1]) + "<br>" : ""}<span style="color:#EE6A2C">${esc(m.texto).replace(/\n/g, "<br>")}</span></div>`;
    }
    if (m.tipo === "aporte") return `<div class="meta">Tipo: ${esc(m.extra?.clase || "")}</div><p>${esc(m.texto)}</p><div class="meta">Respuesta: <b>${esc(m.extra?.respuesta || "")}</b></div>`;
    return `<p>${esc(m.texto)}</p>`;
  }
  async function pintarPend(lista) {
    const l = lista.filter(m => ["comentario", "copla", "aporte"].includes(m.tipo)).sort((a, b) => (a.cuando?.toMillis?.() || 0) - (b.cuando?.toMillis?.() || 0));
    const caja = $("#md-pend"); if (!caja) return;
    if (!l.length) { caja.innerHTML = `<p class="pp-nota">No hay nada pendiente. 🙌</p>`; return; }
    const html = await Promise.all(l.map(async m => `<div class="cab-msg"><span class="cab-chip">${NOMBRE_TIPO[m.tipo]}</span> <span class="meta">${esc(m.alias)} · ${esc(m.lugar)} · ${haceRato(m.cuando)}</span>${await detalle(m)}
      <div class="acciones">${m.tipo === "aporte" ? `<button class="btn" data-ok-banco="${m.id}">Aprobar y agregar al juego</button>` : `<button class="btn" data-ok="${m.id}">Aprobar y publicar</button>`}<button class="btn peligro" data-no="${m.id}">Rechazar</button></div></div>`));
    if ($("#md-pend")) $("#md-pend").innerHTML = html.join("");
  }
  let pend = [];
  alSalir(onSnapshot(query(collection(X.db, "mensajes"), where("estado", "==", "pendiente")), s => {
    pend = s.docs.map(d => ({ id: d.id, ...d.data() })); pintarPend(pend);
  }, e => { $("#md-pend").innerHTML = `<p>${esc(X.errorTexto(e))}</p>`; }));
  $("#md-pend").addEventListener("click", async e => {
    const ok = e.target.closest("[data-ok]"), okb = e.target.closest("[data-ok-banco]"), no = e.target.closest("[data-no]");
    try {
      if (ok) await updateDoc(doc(X.db, "mensajes", ok.dataset.ok), { estado: "aprobado", aprobado: serverTimestamp() });
      if (okb) {
        const m = pend.find(x => x.id === okb.dataset.okBanco);
        await addDoc(collection(X.db, "banco_extra"), { tipo: m.extra?.clase || "trivia", p: m.texto, r: m.extra?.respuesta || "", autor: m.alias, lugar: m.lugar, creado: serverTimestamp() });
        await updateDoc(doc(X.db, "mensajes", m.id), { estado: "aprobado", aprobado: serverTimestamp() });
        X.aviso("Agregado al juego con el nombre de " + m.alias, "ok");
      }
      if (no && confirm("¿Rechazar y borrar?")) await deleteDoc(doc(X.db, "mensajes", no.dataset.no));
    } catch (err) { X.aviso(X.errorTexto(err), "error"); }
  });
  let tipoPub = "comentario";
  async function cargarPub() {
    const caja = $("#md-pub"); caja.innerHTML = "<p>Cargando…</p>";
    try {
      const r = await getDocs(query(collection(X.db, "mensajes"), where("tipo", "==", tipoPub), where("estado", "==", "aprobado"), limit(200)));
      const l = r.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.cuando?.toMillis?.() || 0) - (a.cuando?.toMillis?.() || 0));
      const html = await Promise.all(l.map(async m => `<div class="cab-msg"><span class="meta">${esc(m.alias)} · ${esc(m.lugar)} · ${haceRato(m.cuando)}</span>${await detalle(m)}<button class="btn peligro" style="padding:5px 12px" data-quitar="${m.id}">Quitar</button></div>`));
      caja.innerHTML = html.join("") || `<p class="pp-nota">Nada publicado todavía.</p>`;
    } catch (e) { caja.innerHTML = `<p>${esc(X.errorTexto(e))}</p>`; }
  }
  $("#md-pub-f").addEventListener("click", e => {
    const b = e.target.closest("[data-t]"); if (!b) return;
    tipoPub = b.dataset.t; $("#md-pub-f").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); cargarPub();
  });
  $("#md-pub").addEventListener("click", async e => {
    const b = e.target.closest("[data-quitar]"); if (!b || !confirm("¿Quitar esta publicación?")) return;
    try { await deleteDoc(doc(X.db, "mensajes", b.dataset.quitar)); cargarPub(); } catch (err) { X.aviso(X.errorTexto(err), "error"); }
  });
  cargarPub();
}

// ======================= ENCUESTAS =======================
async function vistaEncuestas(main) {
  main.innerHTML = ESTILO + `<div class="cabeza"><h2>Encuestas</h2></div>
    <div class="tarjeta"><h3>Nueva encuesta</h3>
      <div class="campo"><label for="en-p">Pregunta</label><input type="text" id="en-p" maxlength="160" placeholder="Ej.: ¿Qué programa quieren los sábados en la tarde?"></div>
      <div class="campo"><label for="en-o">Opciones (una por línea, de 2 a 6)</label><textarea id="en-o"></textarea></div>
      <div class="campo"><label for="en-d">Duración</label><select id="en-d" style="width:auto"><option value="1">1 día</option><option value="3">3 días</option><option value="7" selected>1 semana</option><option value="15">15 días</option><option value="30">1 mes</option></select></div>
      <button class="btn naranja" id="en-crear">Publicar encuesta</button></div>
    <div id="en-lista"><p>Cargando…</p></div>`;
  $("#en-crear").onclick = async () => {
    const pregunta = $("#en-p").value.trim();
    const opciones = $("#en-o").value.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 6);
    if (!pregunta || opciones.length < 2) return X.aviso("Escribe la pregunta y al menos 2 opciones", "error");
    try {
      await addDoc(collection(X.db, "votaciones"), { tipo: "encuesta", pregunta, opciones, activa: true, cierra: Timestamp.fromMillis(Date.now() + Number($("#en-d").value) * 86400000), creada: serverTimestamp() });
      $("#en-p").value = ""; $("#en-o").value = ""; X.aviso("Encuesta publicada", "ok"); cargar();
    } catch (e) { X.aviso(X.errorTexto(e), "error"); }
  };
  async function cargar() {
    const caja = $("#en-lista");
    try {
      const r = await getDocs(query(collection(X.db, "votaciones"), where("tipo", "==", "encuesta"), limit(60)));
      const l = r.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.creada?.toMillis?.() || 0) - (a.creada?.toMillis?.() || 0));
      if (!l.length) { caja.innerHTML = `<div class="tarjeta"><p class="pp-nota">Aún no hay encuestas.</p></div>`; return; }
      const html = await Promise.all(l.map(async v => {
        const n = await Promise.all(v.opciones.map((_, i) => getCountFromServer(query(collection(X.db, "votos"), where("votacion", "==", v.id), where("opcion", "==", i))).then(s => s.data().count).catch(() => 0)));
        const t = n.reduce((a, b) => a + b, 0);
        const viva = v.activa && (!v.cierra || v.cierra.toMillis() > Date.now());
        return `<div class="tarjeta"><span class="cab-chip ${viva ? "rojo" : ""}">${viva ? "Abierta · cierra " + v.cierra.toDate().toLocaleDateString("es-CO") : "Cerrada"}</span><h3 style="margin-top:8px">${esc(v.pregunta)}</h3>
          ${v.opciones.map((o, i) => `<div class="cab-bar"><i style="width:${t ? n[i] / t * 100 : 0}%"></i><span><span>${esc(o)}</span><span>${n[i]} · ${t ? Math.round(n[i] / t * 100) : 0}%</span></span></div>`).join("")}
          <p class="pp-nota">${t} votos</p><div class="acciones">${viva ? `<button class="btn sec" data-cerrar="${v.id}">Cerrar</button>` : ""}<button class="btn peligro" data-borrar="${v.id}">Borrar</button></div></div>`;
      }));
      caja.innerHTML = html.join("");
    } catch (e) { caja.innerHTML = `<p>${esc(X.errorTexto(e))}</p>`; }
  }
  $("#en-lista").addEventListener("click", async e => {
    const c = e.target.closest("[data-cerrar]"), b = e.target.closest("[data-borrar]");
    try {
      if (c) await updateDoc(doc(X.db, "votaciones", c.dataset.cerrar), { activa: false });
      if (b && confirm("¿Borrar la encuesta?")) await deleteDoc(doc(X.db, "votaciones", b.dataset.borrar));
      if (c || b) cargar();
    } catch (err) { X.aviso(X.errorTexto(err), "error"); }
  });
  cargar();
}

// ======================= JUEGOS Y RANKING =======================
async function vistaJuegos(main) {
  await J.cargarBanco(); await cargarExtra();
  const n = J.contarBanco();
  const mes = J.mesClave();
  main.innerHTML = ESTILO + `<div class="cabeza"><h2>Juegos y ranking</h2></div>
    <div class="tarjeta"><h3>Lo que hay en el banco</h3>
      <table class="cab-tabla"><tr><th>Juego</th><th>Preguntas</th></tr>
      <tr><td>Trivias (${J.categoriasTrivia().length} temas)</td><td>${n.trivia}</td></tr><tr><td>Adivinanzas</td><td>${n.adivinanza}</td></tr>
      <tr><td>Acertijos</td><td>${n.acertijo}</td></tr><tr><td>Refranes</td><td>${n.refran}</td></tr><tr><td>Volver al pasado</td><td>${n.pasado}</td></tr>
      <tr><td>Música</td><td>${n.musica}</td></tr><tr><td>Ortografía</td><td>${n.ortografia}</td></tr><tr><td>Coplas para terminar (una por semana)</td><td>${n.coplas}</td></tr>
      <tr><td>Palabras revueltas y cálculo mental</td><td>Se inventan solas, no se acaban</td></tr><tr><td>Aportes aprobados y preguntas tuyas</td><td>${n.aporte}</td></tr></table></div>
    <div class="tarjeta"><h3>Agregar una pregunta</h3><p class="pp-nota">Sale en el juego libre («Aportes de los oyentes») y en la Cabina.</p>
      <div class="fila"><div class="campo"><label for="ag-t">Tipo</label><select id="ag-t"><option value="trivia">Trivia</option><option value="adivinanza">Adivinanza</option><option value="refran">Refrán</option><option value="pasado">Volver al pasado</option></select></div></div>
      <div class="campo"><label for="ag-p">Pregunta</label><textarea id="ag-p"></textarea></div>
      <div class="campo"><label for="ag-r">Respuesta</label><input type="text" id="ag-r"></div>
      <div class="campo"><label>Tres respuestas incorrectas (opcional)</label><input type="text" id="ag-o1"><input type="text" id="ag-o2" style="margin-top:6px"><input type="text" id="ag-o3" style="margin-top:6px"></div>
      <button class="btn naranja" id="ag-ok">Agregar</button></div>
    <div class="tarjeta"><h3>Aportes y preguntas agregadas</h3><div id="ag-lista"></div></div>
    <div class="tarjeta"><h3>Ranking de ${esc(J.nombreMes(mes))}</h3><div id="rk-adm"><p>Cargando…</p></div></div>
    <div class="tarjeta"><h3>Coplas de esta semana (las más queridas)</h3><div id="cp-adm"><p>Cargando…</p></div></div>`;

  $("#ag-ok").onclick = async () => {
    const p = $("#ag-p").value.trim(), r = $("#ag-r").value.trim();
    const o = ["#ag-o1", "#ag-o2", "#ag-o3"].map(s => $(s).value.trim()).filter(Boolean);
    if (!p || !r) return X.aviso("Escribe la pregunta y la respuesta", "error");
    try {
      await addDoc(collection(X.db, "banco_extra"), { tipo: $("#ag-t").value, p, r, ...(o.length === 3 ? { o } : {}), autor: "La emisora", lugar: "", creado: serverTimestamp() });
      ["#ag-p", "#ag-r", "#ag-o1", "#ag-o2", "#ag-o3"].forEach(s => $(s).value = "");
      X.aviso("Pregunta agregada", "ok"); lista();
    } catch (e) { X.aviso(X.errorTexto(e), "error"); }
  };
  async function lista() {
    await cargarExtra();
    try {
      const r = await getDocs(query(collection(X.db, "banco_extra"), limit(500)));
      const l = r.docs.map(d => ({ id: d.id, ...d.data() }));
      $("#ag-lista").innerHTML = l.length ? l.map(x => `<div class="cab-msg"><span class="cab-chip">${esc(x.tipo)}</span> <span class="meta">${esc(x.autor || "")}${x.lugar ? " · " + esc(x.lugar) : ""}</span><p>${esc(x.p)}</p><div class="meta">Respuesta: <b>${esc(x.r)}</b></div><button class="btn peligro" style="padding:5px 12px;margin-top:6px" data-bx="${x.id}">Borrar</button></div>`).join("") : `<p class="pp-nota">Todavía no hay.</p>`;
    } catch (e) { $("#ag-lista").innerHTML = `<p>${esc(X.errorTexto(e))}</p>`; }
  }
  $("#ag-lista").addEventListener("click", async e => {
    const b = e.target.closest("[data-bx]"); if (!b || !confirm("¿Borrar esta pregunta?")) return;
    try { await deleteDoc(doc(X.db, "banco_extra", b.dataset.bx)); lista(); } catch (err) { X.aviso(X.errorTexto(err), "error"); }
  });
  lista();

  try {
    const r = await getDocs(query(collection(X.db, "tabla", mes, "jugadores"), orderBy("puntos", "desc"), limit(500)));
    const l = r.docs.map(d => d.data());
    const g = {}; l.forEach(x => { const k = x.lugar || "Sin decir"; g[k] ??= { p: 0, n: 0 }; g[k].p += x.puntos || 0; g[k].n++; });
    $("#rk-adm").innerHTML = l.length ? `<div class="fila"><div><h4>Personas</h4><table class="cab-tabla">${l.slice(0, 20).map((x, i) => `<tr><td>${i + 1}</td><td><b>${esc(x.alias)}</b><br><small>${esc(x.lugar)}</small></td><td>${x.puntos}</td></tr>`).join("")}</table></div>
      <div><h4>Veredas y pueblos</h4><table class="cab-tabla">${Object.entries(g).sort((a, b) => b[1].p - a[1].p).map(([k, v], i) => `<tr><td>${i + 1}</td><td><b>${esc(k)}</b><br><small>${v.n} jugadores</small></td><td>${v.p}</td></tr>`).join("")}</table></div></div>
      <p class="pp-nota">${l.length} personas han jugado este mes. El ranking empieza de cero el primer día de cada mes.</p>` : `<p class="pp-nota">Nadie ha jugado todavía este mes.</p>`;
  } catch (e) { $("#rk-adm").innerHTML = `<p>${esc(X.errorTexto(e))}</p>`; }

  try {
    const c = J.coplaDeLaSemana();
    const r = await getDocs(query(collection(X.db, "mensajes"), where("tipo", "==", "copla"), where("ref", "==", "copla-" + c.semana), where("estado", "==", "aprobado")));
    const l = r.docs.map(d => ({ id: d.id, ...d.data() }));
    const k = await Promise.all(l.map(x => getCountFromServer(query(collection(X.db, "likes"), where("ref", "==", x.id))).then(s => s.data().count).catch(() => 0)));
    l.forEach((x, i) => x.likes = k[i]); l.sort((a, b) => b.likes - a.likes);
    $("#cp-adm").innerHTML = `<div class="cab-copla">${esc(c.v[0])}<br>${esc(c.v[1])}<br>…</div>` + (l.length ? l.slice(0, 10).map(x => `<div class="cab-msg"><div class="cab-copla">${esc(x.texto).replace(/\n/g, "<br>")}</div><span class="meta">${esc(x.alias)} · ${esc(x.lugar)} · ❤️ ${x.likes}</span></div>`).join("") : `<p class="pp-nota">Todavía no hay coplas aprobadas esta semana.</p>`);
  } catch (e) { $("#cp-adm").innerHTML = `<p>${esc(X.errorTexto(e))}</p>`; }
}


// ======================= REACCIONES =======================
const REAC_K = [["corazon", "❤️"], ["oracion", "🙏"], ["aplauso", "👏"], ["asombro", "😮"], ["triste", "😢"]];
const TIPO_ITEM = { noticia: ["noticias", "📰 Noticia"], aviso: ["clasificados", "📌 Aviso"], audio: ["podcasts", "🎧 Audio"] };
async function vistaReacciones(main) {
  main.innerHTML = ESTILO + `<div class="cabeza"><h2>❤️ Reacciones</h2></div>
  <p>Así reacciona la gente. Te sirve para saber qué gusta más y para mostrarles a los pautantes que sus avisos sí se ven.</p>
  <div class="cab-grid">
    <div class="tarjeta"><h3>En vivo hoy</h3><p class="pp-nota">Los botones debajo del play. Se reinician cada día.</p><div class="cab-reac" id="rx-hoy">…</div>
      <h3 style="margin-top:18px">Escuchando ahora</h3><div><span class="cab-big" id="rx-oy">—</span> <span class="pp-nota">personas conectadas a la señal por internet</span></div></div>
    <div class="tarjeta"><h3>Totales</h3><div id="rx-tot"><p>Cargando…</p></div></div>
  </div>
  <div class="tarjeta" style="margin-top:18px"><h3>Publicaciones con más reacciones</h3>
    <div class="cab-filtros" id="rx-fil"><button data-f="todo" aria-pressed="true">Todo</button><button data-f="noticia" aria-pressed="false">Noticias</button><button data-f="aviso" aria-pressed="false">Avisos</button><button data-f="audio" aria-pressed="false">Audios</button></div>
    <div id="rx-lista"><p>Cargando…</p></div></div>`;
  const hoy = String(J.diaNumero());
  alSalir(onSnapshot(doc(X.db, "reacciones", hoy), s => {
    const d = s.exists() ? s.data() : {};
    $("#rx-hoy").innerHTML = [["corazon", "❤️"], ["fuego", "🔥"], ["aplauso", "👏"], ["oracion", "🙏"]].map(([k, e]) => `<span>${e} <b>${d[k] || 0}</b></span>`).join("");
  }, e => $("#rx-hoy").innerHTML = `<p>${esc(X.errorTexto(e))}</p>`));
  const oyentes = async () => {
    const c = X.cfg(); if (!c.azuracastServidor || !c.azuracastEstacion) return;
    try { const r = await (await fetch(`${String(c.azuracastServidor).replace(/\/$/, "")}/api/nowplaying/${c.azuracastEstacion}`, { cache: "no-store" })).json();
      if ($("#rx-oy")) $("#rx-oy").textContent = r?.is_online === false ? "0" : (r?.listeners?.current ?? r?.listeners?.total ?? "—"); } catch (e) {}
  };
  oyentes(); const t = setInterval(oyentes, 30000); alSalir(() => clearInterval(t));
  let filas = [];
  try {
    const r = await getDocs(collection(X.db, "reac_total"));
    filas = r.docs.map(d => { const v = d.data(), tot = REAC_K.reduce((s, [k]) => s + (v[k] || 0), 0); return { id: d.id, v, tot }; }).filter(f => f.tot > 0).sort((a, b) => b.tot - a.tot);
  } catch (e) { $("#rx-lista").innerHTML = `<p>${esc(X.errorTexto(e))}</p>`; $("#rx-tot").innerHTML = ""; return; }
  const suma = k => filas.reduce((s, f) => s + (f.v[k] || 0), 0), total = filas.reduce((s, f) => s + f.tot, 0);
  $("#rx-tot").innerHTML = `<div><span class="cab-big">${total}</span> <span class="pp-nota">reacciones en ${filas.length} publicaciones</span></div>
    <div class="cab-reac" style="margin-top:10px">${REAC_K.map(([k, e]) => `<span>${e} <b>${suma(k)}</b></span>`).join("")}</div>`;
  // Títulos de las publicaciones (solo de las que salen en la lista)
  const titulos = {};
  await Promise.all(filas.slice(0, 60).map(async f => {
    const [tipo, ...resto] = f.id.split("_"), col = TIPO_ITEM[tipo]?.[0]; if (!col) return;
    try { const d = await getDoc(doc(X.db, col, resto.join("_"))); titulos[f.id] = d.exists() ? (d.data().titulo || "(sin título)") : "(ya no existe)"; } catch (e) {}
  }));
  let filtro = "todo";
  const pintar = () => {
    const l = filas.filter(f => filtro === "todo" || f.id.startsWith(filtro + "_")).slice(0, 40);
    $("#rx-lista").innerHTML = l.length ? `<table class="cab-tabla"><tr><th>Publicación</th>${REAC_K.map(([, e]) => `<th>${e}</th>`).join("")}<th>Total</th></tr>
      ${l.map(f => `<tr><td><small>${TIPO_ITEM[f.id.split("_")[0]]?.[1] || ""}</small><br>${esc(titulos[f.id] || f.id)}</td>${REAC_K.map(([k]) => `<td>${f.v[k] || ""}</td>`).join("")}<td><b>${f.tot}</b></td></tr>`).join("")}</table>`
      : `<p class="pp-nota">Todavía no hay reacciones aquí.</p>`;
  };
  pintar();
  $("#rx-fil").addEventListener("click", e => {
    const b = e.target.closest("[data-f]"); if (!b) return; filtro = b.dataset.f;
    $("#rx-fil").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); pintar();
  });
}

// ======================= Diagnóstico de la participación =======================
// Prueba, como si fuera un oyente cualquiera, cada paso que necesitan las reacciones y los juegos.
export async function diagnosticoParticipacion(caja) {
  const pasos = [];
  const poner = (ok, txt, ayuda = "") => { pasos.push(`<li style="margin-bottom:8px">${ok ? "✅" : "❌"} ${txt}${ayuda ? `<br><small style="color:#5B6780">${ayuda}</small>` : ""}</li>`); caja.innerHTML = `<ul style="list-style:none;padding:0">${pasos.join("")}</ul>`; };
  caja.innerHTML = "<p>Revisando…</p>";
  const V = "10.12.2", base = `https://www.gstatic.com/firebasejs/${V}/`;
  const [{ initializeApp, deleteApp }, { getAuth, signInAnonymously, signOut }, F, { firebaseConfig }] = await Promise.all([
    import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js"), import("./firebase-config.js")]);
  const app = initializeApp(firebaseConfig, "diagnostico-" + Date.now());
  try {
    const auth = getAuth(app), db = F.getFirestore(app);
    try { await signInAnonymously(auth); poner(true, "Los oyentes pueden entrar sin cuenta (inicio anónimo activado)."); }
    catch (e) {
      const c = e?.code || "";
      if (c.includes("operation-not-allowed") || c.includes("admin-restricted")) poner(false, "El inicio de sesión <b>Anónimo</b> no está activado.", "Firebase → Authentication → Sign-in method → Agregar proveedor nuevo → Anónimo → Habilitar → Guardar.");
      else if (c.includes("unauthorized-domain") || c.includes("requests-from-referer")) poner(false, `El dominio <b>${esc(location.hostname)}</b> no está autorizado.`, "Firebase → Authentication → Settings → Dominios autorizados → agrega renacerestereo.org y www.renacerestereo.org.");
      else poner(false, "No se pudo entrar como oyente (" + esc(c || e.message) + ").");
      return;
    }
    const dia = String(J.diaNumero());
    try { await F.getDoc(F.doc(db, "reacciones", dia)); poner(true, "Se pueden leer las reacciones en vivo."); }
    catch (e) { poner(false, "Las reglas de Firebase son las viejas: no dejan leer las reacciones.", "Firestore Database → Reglas → pega completo el archivo de reglas nuevo → Publicar."); return; }
    try { await F.setDoc(F.doc(db, "reacciones", dia), { aplauso: F.increment(1) }, { merge: true }); poner(true, "Se pueden enviar reacciones en vivo (quedó un 👏 de prueba hoy)."); }
    catch (e) { poner(false, "Las reglas no dejan enviar reacciones en vivo (" + esc(e?.code || "") + ").", "Vuelve a publicar las reglas nuevas completas."); }
    try { await F.getDocs(F.query(F.collection(db, "reac_total"), F.limit(1))); poner(true, "Las reglas ya tienen las reacciones de noticias, avisos y audios."); }
    catch (e) { poner(false, "Faltan las reglas de las reacciones de noticias, avisos y audios.", "Publica el archivo de reglas que viene en este paquete."); }
    try { await F.getDocs(F.query(F.collection(db, "mapa"), F.limit(1))); poner(true, "Las reglas de juegos y participación están publicadas."); }
    catch (e) { poner(false, "Faltan las reglas de juegos y participación.", "Publica el archivo de reglas completo."); }
    try { await signOut(auth); } catch (e) {}
  } finally { try { await deleteApp(app); } catch (e) {} }
}

// ======================= Contadores en el menú =======================
export function iniciarAvisosPanel(ctx) {
  X = ctx;
  onSnapshot(query(collection(X.db, "mensajes"), where("estado", "==", "pendiente")), s => {
    const l = s.docs.map(d => d.data());
    const aire = l.filter(m => ["saludo", "pedido", "intencion"].includes(m.tipo)).length;
    const mod = l.length - aire;
    const poner = (vista, n) => { const b = document.querySelector(`[data-vista="${vista}"]`); if (!b) return; b.querySelector(".etq-n")?.remove(); if (n) b.insertAdjacentHTML("beforeend", ` <span class="etq etq-n" style="background:#E53935;color:#fff">${n}</span>`); };
    poner("cabina", aire); poner("moderacion", mod);
  }, () => {});
}

export const VISTAS_CABINA = {
  cabina: m => vistaCabina(m),
  moderacion: m => vistaModeracion(m),
  encuestas: m => vistaEncuestas(m),
  "juegos-admin": m => vistaJuegos(m),
  "reacciones-admin": m => vistaReacciones(m)
};
export function ponerContexto(ctx) { X = ctx; }
