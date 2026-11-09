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
  // Lugares para «¿Desde dónde nos escuchas?» (se editan en el panel)
  lugares: ["Vado Real", "Suaita (casco urbano)", "San José de Suaita", "Gámbita", "Oiba", "El Socorro", "San Gil", "Barbosa", "Otro municipio de Santander", "Otra parte de Colombia", "Fuera del país"],
  // Periódico aliado que solo publica en Facebook: se muestra como botón
  regional: { nombre: "El Regional", url: "https://www.facebook.com/share/1C28WMXukW/" },
  secciones: { noticias: true, noticiasAuto: true, participa: true, clasificados: true, programacion: true, podcasts: true, ranking: true, aliados: true, paute: true }
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
    {"id": "p1", "programa": "Himno de Colombia · Inicio de emisión", "dias": [0, 1, 2, 3, 4, 5, 6], "horaInicio": "04:28", "horaFin": "04:30", "categoria": "Institucional", "descripcion": "", "locutor": ""},
    {"id": "p2", "programa": "Alegre Despertar", "dias": [1, 2, 3, 4, 5, 6], "horaInicio": "04:30", "horaFin": "06:00", "categoria": "Entretenimiento", "descripcion": "Música campesina (carranga, llanera, popular, norteño, merengue y vallenato); reportes de sintonía, llamadas, avisos comerciales y sociales; resultados de loterías; cumpleaños (5:00 a 5:15 am); noticias rápidas (5:30 am) y avisos eucarísticos (5:45 am).", "locutor": ""},
    {"id": "p3", "programa": "Alegre Despertar", "dias": [0], "horaInicio": "04:30", "horaFin": "05:00", "categoria": "Entretenimiento", "descripcion": "Música campesina para empezar el domingo.", "locutor": ""},
    {"id": "p4", "programa": "Eucaristía", "dias": [0], "horaInicio": "05:00", "horaFin": "06:00", "categoria": "Evangelización", "descripcion": "Santa Misa de las 5:00 am.", "locutor": ""},
    {"id": "p5", "programa": "Himno de Colombia", "dias": [0, 1, 2, 3, 4, 5, 6], "horaInicio": "06:00", "horaFin": "06:01", "categoria": "Institucional", "descripcion": "", "locutor": ""},
    {"id": "p6", "programa": "En sintonía con Dios", "dias": [1, 2, 3, 4, 5, 6], "horaInicio": "06:01", "horaFin": "06:31", "categoria": "Evangelización", "descripcion": "Programa religioso de las parroquias de Vado Real, Suaita, Olival y San José de Suaita.", "locutor": ""},
    {"id": "p7", "programa": "Siempre Domingo", "dias": [0], "horaInicio": "06:01", "horaFin": "06:31", "categoria": "Evangelización", "descripcion": "Programa religioso.", "locutor": ""},
    {"id": "p8", "programa": "Colombianísimo", "dias": [1, 2, 3, 4, 5], "horaInicio": "06:31", "horaFin": "07:01", "categoria": "Entretenimiento", "descripcion": "Música colombiana: bambuco, cumbia, porro, guabina, joropo, llanera…", "locutor": ""},
    {"id": "p9", "programa": "Ecos al corazón", "dias": [6, 0], "horaInicio": "06:31", "horaFin": "07:01", "categoria": "Entretenimiento", "descripcion": "Música romántica y pop moderna.", "locutor": ""},
    {"id": "p10", "programa": "Renacer Romántico", "dias": [1, 2, 3, 4, 5], "horaInicio": "07:01", "horaFin": "07:31", "categoria": "Entretenimiento", "descripcion": "Música de planchar y romántica (viejitas).", "locutor": ""},
    {"id": "p11", "programa": "Espacio del Colegio", "dias": [1], "horaInicio": "07:31", "horaFin": "07:55", "categoria": "Participación", "descripcion": "Espacio institucional de la comunidad.", "locutor": ""},
    {"id": "p12", "programa": "Espacio PIC", "dias": [2], "horaInicio": "07:31", "horaFin": "07:55", "categoria": "Participación", "descripcion": "Espacio institucional de la comunidad.", "locutor": ""},
    {"id": "p13", "programa": "Espacio del Hospital", "dias": [3], "horaInicio": "07:31", "horaFin": "07:55", "categoria": "Participación", "descripcion": "Espacio institucional de la comunidad.", "locutor": ""},
    {"id": "p14", "programa": "Espacio de la Alcaldía", "dias": [4], "horaInicio": "07:31", "horaFin": "07:55", "categoria": "Participación", "descripcion": "Espacio institucional de la comunidad.", "locutor": ""},
    {"id": "p15", "programa": "Espacio de las Juntas de Acción Comunal", "dias": [5], "horaInicio": "07:31", "horaFin": "07:55", "categoria": "Participación", "descripcion": "Espacio institucional de la comunidad.", "locutor": ""},
    {"id": "p16", "programa": "Carrangueando", "dias": [6, 0], "horaInicio": "07:01", "horaFin": "08:01", "categoria": "Entretenimiento", "descripcion": "Música carranguera y saludos de cumpleaños.", "locutor": ""},
    {"id": "p17", "programa": "Susurros del corazón", "dias": [1, 2, 3, 4, 5], "horaInicio": "07:55", "horaFin": "08:01", "categoria": "Formación", "descripcion": "Espacio de reflexión con poemas y poesía literaria (pregrabado).", "locutor": ""},
    {"id": "p18", "programa": "Rancherísimo", "dias": [1, 2, 3, 4, 5], "horaInicio": "08:01", "horaFin": "10:00", "categoria": "Entretenimiento", "descripcion": "El espacio más popular de Renacer: música ranchera, norteña, de banda y popular; artistas invitados; complacencias; notas de interés general; noticias; clasificados (9:00 am) y avisos eucarísticos (9:45 a 10:00 am).", "locutor": ""},
    {"id": "p19", "programa": "Sábado de Rumba", "dias": [6], "horaInicio": "08:01", "horaFin": "10:00", "categoria": "Entretenimiento", "descripcion": "Top de las canciones más pedidas, éxitos musicales y llamadas.", "locutor": ""},
    {"id": "p20", "programa": "Ranchenato", "dias": [0], "horaInicio": "08:01", "horaFin": "09:00", "categoria": "Entretenimiento", "descripcion": "Vallenato y ranchera.", "locutor": ""},
    {"id": "p21", "programa": "Resumen Informativo", "dias": [0], "horaInicio": "09:00", "horaFin": "10:00", "categoria": "Información", "descripcion": "Lo más importante de la semana.", "locutor": ""},
    {"id": "p22", "programa": "Espacios de la comunidad · Colegios", "dias": [1], "horaInicio": "10:00", "horaFin": "10:31", "categoria": "Participación", "descripcion": "Espacio de las instituciones y organizaciones de la comunidad.", "locutor": ""},
    {"id": "p23", "programa": "Espacios de la comunidad · PIC", "dias": [2], "horaInicio": "10:00", "horaFin": "10:31", "categoria": "Participación", "descripcion": "Espacio de las instituciones y organizaciones de la comunidad.", "locutor": ""},
    {"id": "p24", "programa": "Espacios de la comunidad · Cooperativismo", "dias": [3], "horaInicio": "10:00", "horaFin": "10:31", "categoria": "Participación", "descripcion": "Espacio de las instituciones y organizaciones de la comunidad.", "locutor": ""},
    {"id": "p25", "programa": "Espacios de la comunidad · Alcaldía", "dias": [4], "horaInicio": "10:00", "horaFin": "10:31", "categoria": "Participación", "descripcion": "Espacio de las instituciones y organizaciones de la comunidad.", "locutor": ""},
    {"id": "p26", "programa": "Espacios de la comunidad · JAC", "dias": [5], "horaInicio": "10:00", "horaFin": "10:31", "categoria": "Participación", "descripcion": "Espacio de las instituciones y organizaciones de la comunidad.", "locutor": ""},
    {"id": "p27", "programa": "Espacios de la comunidad · Policía", "dias": [6], "horaInicio": "10:00", "horaFin": "10:31", "categoria": "Participación", "descripcion": "Espacio de las instituciones y organizaciones de la comunidad.", "locutor": ""},
    {"id": "p28", "programa": "Eucaristía Mayor", "dias": [0], "horaInicio": "10:00", "horaFin": "11:00", "categoria": "Evangelización", "descripcion": "Santa Misa dominical de las 10:00 am.", "locutor": ""},
    {"id": "p29", "programa": "Avance Informativo", "dias": [1, 2, 3, 4, 5, 6], "horaInicio": "10:31", "horaFin": "10:40", "categoria": "Información", "descripcion": "Las noticias de la mañana.", "locutor": ""},
    {"id": "p30", "programa": "Ritmo Alegre", "dias": [1, 2, 3, 4, 5], "horaInicio": "10:40", "horaFin": "12:00", "categoria": "Entretenimiento", "descripcion": "Carranga, llanera, merengue, vallenato, popular, pop, urbano, reguetón y rock; tips para la vida; chistes y cumpleaños (10:45 am).", "locutor": ""},
    {"id": "p31", "programa": "Sábado de Rumba", "dias": [6], "horaInicio": "10:40", "horaFin": "12:00", "categoria": "Entretenimiento", "descripcion": "Top de las canciones más pedidas.", "locutor": ""},
    {"id": "p32", "programa": "Ranchenato", "dias": [0], "horaInicio": "11:00", "horaFin": "12:00", "categoria": "Entretenimiento", "descripcion": "Vallenato y ranchera.", "locutor": ""},
    {"id": "p33", "programa": "Himno de Santander / Himno de Suaita", "dias": [0, 1, 2, 3, 4, 5, 6], "horaInicio": "12:00", "horaFin": "12:05", "categoria": "Institucional", "descripcion": "", "locutor": ""},
    {"id": "p34", "programa": "Ángelus", "dias": [0, 1, 2, 3, 4, 5, 6], "horaInicio": "12:05", "horaFin": "12:10", "categoria": "Evangelización", "descripcion": "Saludo a la Virgen María.", "locutor": ""},
    {"id": "p35", "programa": "Informativo Renacer", "dias": [1, 2, 3, 4, 5], "horaInicio": "12:10", "horaFin": "13:00", "categoria": "Información", "descripcion": "Noticias locales, regionales, nacionales e internacionales.", "locutor": ""},
    {"id": "p36", "programa": "Colombianísimo", "dias": [6], "horaInicio": "12:10", "horaFin": "13:00", "categoria": "Entretenimiento", "descripcion": "Música colombiana.", "locutor": ""},
    {"id": "p37", "programa": "Domingo Sabroso", "dias": [0], "horaInicio": "12:10", "horaFin": "15:00", "categoria": "Entretenimiento", "descripcion": "Música crossover, todos los ritmos (programación automática).", "locutor": ""},
    {"id": "p38", "programa": "Parranda Vallenata", "dias": [1, 2, 3, 4, 5], "horaInicio": "13:00", "horaFin": "14:00", "categoria": "Entretenimiento", "descripcion": "El folclor de la costa norte de Colombia, saludos y artistas invitados.", "locutor": ""},
    {"id": "p39", "programa": "Vibra Musical", "dias": [6], "horaInicio": "13:00", "horaFin": "14:00", "categoria": "Entretenimiento", "descripcion": "Electrónica, urbana, pop y reguetón.", "locutor": ""},
    {"id": "p40", "programa": "Al son del sabor", "dias": [1, 2, 3, 4, 5], "horaInicio": "14:00", "horaFin": "15:00", "categoria": "Entretenimiento", "descripcion": "Viejoteca, salsa, merengue, bullerengue, vallenato viejo, música decembrina y reguetón viejo. Saludos y noticias deportivas.", "locutor": ""},
    {"id": "p41", "programa": "Universo Infantil", "dias": [6], "horaInicio": "14:00", "horaFin": "15:00", "categoria": "Participación", "descripcion": "Programa para los niños.", "locutor": ""},
    {"id": "p42", "programa": "Coronilla de la Misericordia", "dias": [0, 1, 2, 3, 4, 5, 6], "horaInicio": "15:00", "horaFin": "15:10", "categoria": "Evangelización", "descripcion": "La hora de la Misericordia.", "locutor": ""},
    {"id": "p43", "programa": "De cuento en cuento", "dias": [1, 2, 3, 4, 5, 6], "horaInicio": "15:10", "horaFin": "15:16", "categoria": "Formación", "descripcion": "Cuentos, fábulas y textos de reflexión.", "locutor": ""},
    {"id": "p44", "programa": "Domingo Sabroso", "dias": [0], "horaInicio": "15:10", "horaFin": "18:00", "categoria": "Entretenimiento", "descripcion": "Música crossover, todos los ritmos (programación automática).", "locutor": ""},
    {"id": "p45", "programa": "Al son del sabor", "dias": [1, 2, 3, 4, 5], "horaInicio": "15:16", "horaFin": "16:00", "categoria": "Entretenimiento", "descripcion": "Viejoteca, salsa, merengue, bullerengue, vallenato viejo, música decembrina y reguetón viejo; saludos y cumpleaños (3:30 pm).", "locutor": ""},
    {"id": "p46", "programa": "Conexión Juvenil", "dias": [6], "horaInicio": "15:16", "horaFin": "16:00", "categoria": "Participación", "descripcion": "Programa juvenil.", "locutor": ""},
    {"id": "p47", "programa": "De regreso a casa", "dias": [1, 2, 3, 4, 5], "horaInicio": "16:00", "horaFin": "17:00", "categoria": "Entretenimiento", "descripcion": "Música popular, carranga, llanera y norteña; reportes de sintonía, sorteos, saludos y mensajes de interés.", "locutor": ""},
    {"id": "p48", "programa": "Así es mi vereda", "dias": [6], "horaInicio": "16:00", "horaFin": "17:30", "categoria": "Participación", "descripcion": "Reportería desde las veredas de nuestro municipio.", "locutor": ""},
    {"id": "p49", "programa": "La finca en la radio", "dias": [1, 2, 3, 4], "horaInicio": "17:00", "horaFin": "17:30", "categoria": "Formación", "descripcion": "Consejos y orientaciones para los campesinos. Avance informativo.", "locutor": ""},
    {"id": "p50", "programa": "Cuéntele al Campo", "dias": [5], "horaInicio": "17:00", "horaFin": "17:30", "categoria": "Participación", "descripcion": "Espacio para el campo y sus gentes.", "locutor": ""},
    {"id": "p51", "programa": "Santo Rosario", "dias": [1, 2, 3, 4, 5, 6], "horaInicio": "17:30", "horaFin": "18:00", "categoria": "Evangelización", "descripcion": "Rezo del Santo Rosario.", "locutor": ""},
    {"id": "p52", "programa": "Himno de Colombia", "dias": [0, 1, 2, 3, 4, 5, 6], "horaInicio": "18:00", "horaFin": "18:01", "categoria": "Institucional", "descripcion": "", "locutor": ""},
    {"id": "p53", "programa": "Cierre de emisión", "dias": [0], "horaInicio": "18:01", "horaFin": "18:05", "categoria": "Institucional", "descripcion": "Los domingos la emisión termina a las 6:00 pm.", "locutor": ""},
    {"id": "p54", "programa": "Eucaristía 6 pm", "dias": [1, 2, 3, 4, 5, 6], "horaInicio": "18:01", "horaFin": "18:30", "categoria": "Evangelización", "descripcion": "Santa Misa de la tarde.", "locutor": ""},
    {"id": "p55", "programa": "Formación cultural, artística y social", "dias": [1, 2, 3, 4, 5], "horaInicio": "18:30", "horaFin": "19:00", "categoria": "Formación", "descripcion": "Programas de formación cultural, artística y social.", "locutor": ""},
    {"id": "p56", "programa": "Ecos al corazón", "dias": [6], "horaInicio": "18:30", "horaFin": "19:00", "categoria": "Entretenimiento", "descripcion": "Música romántica y pop.", "locutor": ""},
    {"id": "p57", "programa": "Del Oriente al Llano", "dias": [1], "horaInicio": "19:00", "horaFin": "20:45", "categoria": "Entretenimiento", "descripcion": "Llanera, carranga, trova y norteño.", "locutor": ""},
    {"id": "p58", "programa": "Poder Femenino", "dias": [2], "horaInicio": "19:00", "horaFin": "20:45", "categoria": "Formación", "descripcion": "Programa de mujeres.", "locutor": ""},
    {"id": "p59", "programa": "La Rokola", "dias": [3], "horaInicio": "19:00", "horaFin": "20:45", "categoria": "Entretenimiento", "descripcion": "Integración familiar y relatos.", "locutor": ""},
    {"id": "p60", "programa": "Renace la Noche", "dias": [4], "horaInicio": "19:00", "horaFin": "20:45", "categoria": "Participación", "descripcion": "Entrevistas e invitados.", "locutor": ""},
    {"id": "p61", "programa": "La Rokola Fin de Semana", "dias": [5], "horaInicio": "19:00", "horaFin": "20:45", "categoria": "Entretenimiento", "descripcion": "Concursos e integración familiar.", "locutor": ""},
    {"id": "p62", "programa": "Lo mejor de lo nuestro", "dias": [6], "horaInicio": "19:00", "horaFin": "20:45", "categoria": "Participación", "descripcion": "Resaltar el talento artístico y cultural.", "locutor": ""},
    {"id": "p63", "programa": "Cierre de emisión", "dias": [1, 2, 3, 4, 5, 6], "horaInicio": "20:45", "horaFin": "20:50", "categoria": "Institucional", "descripcion": "", "locutor": ""}
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

// ---------- Noticias automáticas (las actualiza GitHub cada hora) ----------
export const NOTICIAS_AUTO_URLS = [
  "https://raw.githubusercontent.com/paginabierta/renacer-estereo/main/datos/noticias-auto.json",
  "datos/noticias-auto.json"
];
export async function cargarNoticiasAuto(){
  for(const u of NOTICIAS_AUTO_URLS){
    try{
      const r = await fetch(u + (u.includes("?") ? "&" : "?") + "t=" + Math.floor(Date.now()/300000), { cache:"no-store" });
      if(!r.ok) continue;
      const d = await r.json();
      if(Array.isArray(d.noticias)) return d;
    }catch(e){ /* probamos el siguiente */ }
  }
  return { noticias: [] };
}
export function haceCuanto(v){
  const d = aDate(v); if(!d) return "";
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if(min < 60) return min <= 1 ? "hace un momento" : `hace ${min} min`;
  const h = Math.round(min / 60); if(h < 24) return h === 1 ? "hace 1 hora" : `hace ${h} horas`;
  const dias = Math.round(h / 24); return dias === 1 ? "ayer" : `hace ${dias} días`;
}

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
