// ============================================================
//  Renacer Estéreo — módulo común (web pública y panel)
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const CONFIGURADO = !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PEGA");
export const app = CONFIGURADO ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

// ---------- Configuración por defecto (lo que el panel puede cambiar) ----------
export const CONFIG_BASE = {
  nombre: "Renacer Estéreo",
  frecuencia: "107.7 FM",
  eslogan: "Tu radio, nuestra radio, la radio de todos",
  municipio: "Vado Real, Suaita – Santander",
  logo: "img/logo.png",
  colores: {
    primario: "#1F5FBF",   // azul torre
    oscuro:   "#0E3A7A",   // azul profundo
    acento:   "#EE6A2C",   // naranja amanecer
    sol:      "#F5A830",   // amarillo sol
    fondo:    "#F5F7FB",
    texto:    "#16223A"
  },
  fuenteTitulos: "Asap Condensed",
  fuenteTexto: "Atkinson Hyperlegible",
  // Señal en vivo (AzuraCast). Si "streamUrl" queda vacío, se toma de la API.
  azuracastServidor: "https://virtual4.emisorasvirtuales.com",
  azuracastEstacion: "renacer_stereo",
  streamUrl: "",
  // Contacto
  whatsapp: "573137183458",
  telefono: "313 718 3458",
  correo: "emisorarenacer@hotmail.com",
  direccion: "Carrera 6 # 5-50, corregimiento de Vado Real, Suaita, Santander",
  redes: { facebook: "", instagram: "", youtube: "", tiktok: "", x: "https://x.com/emisorarenacer1" },
  // Textos editables
  textos: {
    portada: "Música, noticias y voces del sur de Santander. Dale play y acompáñanos desde donde estés.",
    paute: "¿Tienes un negocio, una institución o un evento? Llega a toda la provincia con cuñas, menciones y programas patrocinados.",
    pideCancion: "Pide tu canción o manda un saludo. Te leemos al aire."
  },
  alerta: { activa: false, texto: "", enlace: "" },
  secciones: { noticias: true, clasificados: true, programacion: true, podcasts: true, ranking: true, aliados: true, paute: true }
};

export const FUENTES = [
  "Asap Condensed", "Barlow Condensed", "Oswald", "Fira Sans Condensed", "Archivo Narrow",
  "Atkinson Hyperlegible", "Source Sans 3", "Nunito Sans", "Lato", "Merriweather", "Roboto", "Open Sans"
];

export const CAT_NOTICIAS = ["Comunidad", "Campo", "Salud", "Educación", "Deportes", "Fe y parroquia", "Cultura", "Avisos oficiales"];
export const CAT_CLASIFICADOS = ["Empleo", "Ventas", "Arriendos", "Servicios", "Mascotas", "Eventos", "Servicio social", "Salud comunitaria", "Otros"];
export const DIAS = [
  { n: 1, c: "Lun", l: "Lunes" }, { n: 2, c: "Mar", l: "Martes" }, { n: 3, c: "Mié", l: "Miércoles" },
  { n: 4, c: "Jue", l: "Jueves" }, { n: 5, c: "Vie", l: "Viernes" }, { n: 6, c: "Sáb", l: "Sábado" }, { n: 0, c: "Dom", l: "Domingo" }
];

// ---------- Contenido de ejemplo (se ve mientras no haya Firebase) ----------
const hoy = new Date();
const haceDias = d => new Date(hoy.getTime() - d * 86400000);
export const DEMO = {
  noticias: [
    { id: "d1", titulo: "¡Cuidemos nuestro campo! Suspendidas las quemas en zona rural",
      resumen: "En tiempos de Fenómeno de El Niño, el fuego no es nuestro aliado. Conoce las medidas vigentes.",
      contenido: "Las autoridades ambientales recuerdan que durante la temporada seca están suspendidas las quemas agrícolas en las veredas del municipio.\n\nSi ves humo o un incendio forestal, llama de inmediato a los bomberos o a la línea 123. Cuidar el agua y el monte es tarea de todos.",
      categoria: "Campo", imagen: "", enlace: "", fecha: haceDias(1), destacada: true, publicada: true },
    { id: "d2", titulo: "Abiertas inscripciones para la Escuela de Jesús",
      resumen: "La parroquia San Pedro Apóstol invita a jóvenes y adultos a los encuentros de formación.",
      contenido: "Los encuentros se realizan en el templo parroquial de Vado Real. Inscripciones en el despacho parroquial.",
      categoria: "Fe y parroquia", imagen: "", enlace: "", fecha: haceDias(3), destacada: false, publicada: true },
    { id: "d3", titulo: "Jornada de vacunación en el puesto de salud",
      resumen: "Niños, adultos mayores y gestantes pueden acercarse con su documento.",
      contenido: "La jornada es gratuita. Lleva el carné de vacunas si lo tienes.",
      categoria: "Salud", imagen: "", enlace: "", fecha: haceDias(5), destacada: false, publicada: true }
  ],
  clasificados: [
    { id: "c1", titulo: "Ayúdanos a encontrar a su dueño", categoria: "Mascotas",
      descripcion: "Perrito encontrado en la casa de Don Azael Díaz, sector Las Cascadas, vía Vado Real–Gámbita.",
      contacto: "313 718 3458", imagen: "", enlace: "", fecha: haceDias(1), publicado: true },
    { id: "c2", titulo: "Oferta de empleo: Coomuldesa", categoria: "Empleo",
      descripcion: "Se busca asesor(a) comercial externo(a) para la oficina de Suaita, con cubrimiento en Gámbita. Salario base más comisiones.",
      contacto: "", imagen: "", enlace: "", fecha: haceDias(2), publicado: true },
    { id: "c3", titulo: "Jornada de salud visual", categoria: "Salud comunitaria",
      descripcion: "Frente al terminal de transportes de Suaita. Consulta gratis por la compra de tus gafas.",
      contacto: "", imagen: "", enlace: "", fecha: haceDias(2), publicado: true }
  ],
  programacion: [
    { id: "p1", programa: "Amanecer campesino (ejemplo)", locutor: "Equipo Renacer", dias: [1,2,3,4,5,6], horaInicio: "05:00", horaFin: "08:00", descripcion: "Música de carrilera, saludos y el estado de las vías." },
    { id: "p2", programa: "Noticiero Renacer (ejemplo)", locutor: "Mesa de noticias", dias: [1,2,3,4,5], horaInicio: "12:00", horaFin: "13:00", descripcion: "Lo que pasa en Suaita, Vado Real y la provincia." },
    { id: "p3", programa: "La hora de la rumba (ejemplo)", locutor: "", dias: [5,6], horaInicio: "19:00", horaFin: "23:00", descripcion: "Los éxitos que ustedes piden." },
    { id: "p4", programa: "Santa Misa (ejemplo)", locutor: "Parroquia San Pedro Apóstol", dias: [0], horaInicio: "08:00", horaFin: "09:00", descripcion: "Transmisión desde Vado Real." }
  ],
  podcasts: [
    { id: "a1", titulo: "Voces que el campo no ha contado", descripcion: "Crónicas sonoras sobre la diversidad humana de Suaita.", audioUrl: "", enlace: "", imagen: "", fecha: haceDias(4), publicado: true },
    { id: "a2", titulo: "Conozcamos la Biblia", descripcion: "Curso bíblico radial.", audioUrl: "", enlace: "", imagen: "", fecha: haceDias(18), publicado: true }
  ],
  ranking: [
    { id: "r1", posicion: 1, cancion: "De qué me presumes", artista: "Freddy Burbano" },
    { id: "r2", posicion: 2, cancion: "Coqueta", artista: "Heredero" },
    { id: "r3", posicion: 3, cancion: "Rompí la copa", artista: "Rómulo Caicedo" },
    { id: "r4", posicion: 4, cancion: "Te amo", artista: "Uriel Henao" },
    { id: "r5", posicion: 5, cancion: "Mi ruego", artista: "Charrito Negro" }
  ],
  aliados: []
};

// ---------- Utilidades ----------
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export function urlSegura(u) {
  const s = String(u || "").trim();
  if (/^(https?:|mailto:|tel:)/i.test(s) || s.startsWith("data:image/") || s.startsWith("img/")) return s;
  return "";
}
export function mezclar(base, extra) {
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(extra || {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && !(v.toDate) && typeof out[k] === "object" && out[k] !== null) {
      out[k] = mezclar(out[k], v);
    } else if (v !== undefined) out[k] = v;
  }
  return out;
}
export function aDate(v) {
  if (!v) return null;
  if (v.toDate) return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + "T12:00:00");
  const d = new Date(v); return isNaN(d) ? null : d;
}
export function fechaTexto(v) {
  const d = aDate(v); if (!d) return "";
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}
export function aMinutos(h) {
  const [a, b] = String(h || "0:0").split(":").map(Number); return (a || 0) * 60 + (b || 0);
}
export function cargarFuentes(lista) {
  const fams = [...new Set(lista.filter(Boolean))].map(f => "family=" + f.trim().replace(/ /g, "+") + ":wght@400;600;700");
  let link = document.getElementById("fuentes-google");
  if (!link) { link = document.createElement("link"); link.id = "fuentes-google"; link.rel = "stylesheet"; document.head.appendChild(link); }
  link.href = "https://fonts.googleapis.com/css2?" + fams.join("&") + "&display=swap";
}
export function aplicarTema(cfg, raiz = document.documentElement) {
  const c = cfg.colores || {};
  const set = (k, v) => v && raiz.style.setProperty(k, v);
  set("--c-primario", c.primario); set("--c-oscuro", c.oscuro); set("--c-acento", c.acento);
  set("--c-sol", c.sol); set("--c-fondo", c.fondo); set("--c-texto", c.texto);
  raiz.style.setProperty("--f-titulos", `"${cfg.fuenteTitulos}", "Arial Narrow", sans-serif`);
  raiz.style.setProperty("--f-texto", `"${cfg.fuenteTexto}", system-ui, sans-serif`);
  cargarFuentes([cfg.fuenteTitulos, cfg.fuenteTexto]);
}
export function enlaceWhatsApp(numero, texto = "") {
  const n = String(numero || "").replace(/\D/g, "");
  return `https://wa.me/${n}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;
}
