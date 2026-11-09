# Participa: juegos, concursos y participación de los oyentes

## Activar (una sola vez)
1. Firebase → Authentication → Sign-in method → Agregar proveedor → **Anónimo** → Habilitar → Guardar.
   (Así la gente participa sin crear cuenta.)
2. Firebase → Firestore Database → Reglas → borrar todo, pegar `firestore.rules` → **Publicar**.
3. GitHub → subir y reemplazar: `index.html`, `admin.html`, `sw.js`, `js/comun.js`,
   y las nuevas: `js/juegos.js`, `js/participa.js`, `js/cabina.js`, la carpeta `css` y `datos/juegos/banco.json`.
   NO subas `datos/noticias-auto.json` (lo llena GitHub solo).
4. Panel → Portada, textos y alerta → «Participación de los oyentes»: escribe las veredas de la parroquia.

## En el panel (sección Participación)
- **Cabina en vivo**: lanzar concursos al aire, ver quién responde primero, anunciar ganador;
  votación «¿Cuál suena después?»; saludos, pedidos e intenciones para leer al aire; reacciones y oyentes.
- **Moderación**: aprobar comentarios, coplas y aportes. Nada escrito se publica sin aprobación.
- **Encuestas**: preguntas a la comunidad con resultados en porcentaje.
- **Juegos y ranking**: cuántas preguntas hay, agregar preguntas, ranking del mes y coplas más queridas.

## Banco de juegos (datos/juegos/banco.json)
358 trivias en 10 temas, 65 adivinanzas, 42 acertijos, 114 refranes, 108 de «Volver al pasado»,
45 de música, 62 de ortografía, 52 coplas (una por semana, un año completo) y 145 palabras.
Cálculo mental y palabras revueltas se generan solos. El reto del día no repite preguntas
en meses; el juego libre es ilimitado; los aportes aprobados de la gente se suman al juego.
