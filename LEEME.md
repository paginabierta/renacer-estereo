# Renacer Estéreo 107.7 FM — Página web con panel

Página pública (`index.html`) + panel de administración (`admin.html`), alojada en GitHub Pages y con el contenido en Firebase (Firestore). La app Android leerá **las mismas colecciones**, así que todo lo que publiques desde el panel aparece en la web y en la app.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Página pública: señal en vivo, noticias, clasificados, programación, audio a la carta, ranking, pide tu canción, aliados, contacto |
| `admin.html` | Panel: contenido, colores, letras, logo, textos, alerta, señal y contacto |
| `js/firebase-config.js` | Aquí pegas los datos de tu proyecto de Firebase |
| `js/comun.js` | Configuración por defecto, contenido de ejemplo y funciones compartidas |
| `firestore.rules` | Reglas de seguridad: todos leen, solo los correos autorizados editan |
| `manifest.json`, `sw.js` | Permiten instalar la página como app en el celular |
| `img/` | Logo e íconos |

## Puesta en marcha (una sola vez)

1. **Crear el proyecto.** Entra a https://console.firebase.google.com, crea un proyecto nuevo (por ejemplo `renacer-estereo`). El plan gratuito (Spark) es suficiente: no se usa Firebase Storage.
2. **Usuarios del panel.** Authentication → Comenzar → Correo electrónico/contraseña → Habilitar. En la pestaña Usuarios, «Agregar usuario» con `emisorarenacer@hotmail.com` y una contraseña. En Configuración → Acciones de usuario, desmarca «Habilitar creación (registro)» para que nadie más pueda crear cuentas.
3. **Base de datos.** Firestore Database → Crear base de datos → modo producción. En la pestaña **Reglas**, borra lo que hay, pega el contenido de `firestore.rules` y publica. Si vas a dar acceso a otra persona, agrega su correo en la lista de `esAdmin()` y crea su usuario en el paso 2.
4. **Conectar la página.** Configuración del proyecto (engranaje) → Tus apps → ícono `</>` (Web) → registra la app → copia el bloque `firebaseConfig` y pégalo en `js/firebase-config.js`.
5. **Dominios autorizados.** Authentication → Configuración → Dominios autorizados → agrega `paginabierta.github.io` (o la cuenta que uses) y, si lo compras, el dominio propio.
6. **Publicar en GitHub Pages.** Crea un repositorio (por ejemplo `renacer-estereo`), sube todos los archivos manteniendo las carpetas, y en Settings → Pages elige la rama `main` y la carpeta raíz.
7. **Primer ingreso.** Abre `…/admin.html`, entra con el correo y la contraseña, ve a **Herramientas** → «Guardar configuración inicial». Si quieres ver la página llena, usa también «Cargar contenido de ejemplo» (después lo editas o borras).
8. **Verificar la señal.** En **Emisora y señal en vivo** toca «Consultar canción actual»: debe mostrar la canción que suena y el enlace de la señal. Luego «Escuchar».

## Señal en vivo

La emisora transmite por AzuraCast (`virtual4.emisorasvirtuales.com`, estación `renacer_stereo`). La página consulta cada 25 segundos la canción que suena, la carátula y los oyentes conectados, y toma de ahí el enlace de la señal. Si algún día cambias de proveedor, pega el enlace directo en «Enlace directo de la señal».

## Imágenes

Las fotos se comprimen en el navegador (WebP, máximo 1000 px) y se guardan dentro del mismo registro. Así no se necesita el plan de pago de Firebase. Cada foto queda alrededor de 60–150 KB.

## Audio a la carta

Para que el audio suene dentro de la página y la app, usa un enlace directo a un `.mp3` (archive.org, la sección de podcasts de AzuraCast, etc.). Los enlaces de YouTube, Spotify o Facebook funcionan como botón que abre esa plataforma.

## Estructura de datos (la usa también la app)

- `config/sitio` — nombre, frecuencia, eslogan, logo, colores, fuentes, señal (AzuraCast), contacto, redes, textos, alerta, secciones visibles.
- `noticias` — titulo, resumen, contenido, imagen, categoria, enlace, fecha, destacada, publicada.
- `clasificados` — titulo, categoria, descripcion, imagen, contacto, enlace, fecha, vence, publicado.
- `programacion` — programa, locutor, dias (0 = domingo … 6 = sábado), horaInicio, horaFin, descripcion, imagen.
- `podcasts` — titulo, descripcion, audioUrl, enlace, imagen, fecha, publicado.
- `ranking` — posicion, cancion, artista.
- `aliados` — nombre, logo, enlace.

Cada noticia tiene su propio enlace para compartir: `…/index.html#noticia-ID`.
