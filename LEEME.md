# Zona XR — Biblioteca Tec

Catálogo web de las **76 experiencias** de realidad extendida de la Zona XR, más la
infografía imprimible con los 6 códigos QR.

El contenido salió de los seis PDF de catálogo a los que apuntan los QR del flyer
original: nombres, escuela, licencia y descripciones están tal cual, sin inventar nada.

## Qué hay aquí

| Archivo | Para qué sirve |
|---|---|
| `flyer.html` | Infografía A4 con los 6 QR. Es la que se pega en la Biblioteca. |
| `ZonaXR-flyer-A4.pdf` | La misma infografía ya exportada, lista para mandar a imprimir. |
| `index.html` | Portada web: las 6 escuelas con sus cifras y experiencias estrella. |
| `universal.html` · `negocios.html` · `ingenieria.html` · `humanidades.html` · `ciencias-sociales.html` · `arquitectura.html` | Una landing por escuela. |
| `assets/` | CSS, JS, portadas de las experiencias y los QR en vectorial. |

Se abren con doble clic, sin servidor ni internet. La única cosa que necesita red es
la tipografía Plus Jakarta Sans; sin conexión cae a la del sistema y se ve bien igual.

## Cada landing de escuela

- **Portada** con la portada de la experiencia estrella difuminada al fondo y las cifras animadas.
- **"Empieza por aquí"**: las 3-4 experiencias más recomendables de esa escuela, con su calificación real de la Meta Store.
- **Catálogo completo** con buscador en vivo (tecla `/`) y filtro por licencia completa / demo.
- **Detalle** de cada experiencia al tocar una tarjeta, con enlace a la Meta Store cuando existe.
- **Cómo reservar un visor** y navegación a las otras cinco escuelas.

Cada escuela tiene su color: Universal violeta, Negocios ámbar, Ingeniería cian,
Humanidades rosa, Ciencias Sociales verde, Arquitectura naranja. Los mismos colores
se usan en la infografía, para que el color del QR y el de la página coincidan.

## Modo visor (efecto VR)

Las 7 páginas web (no la infografía) se navegan como si llevaras puesto un visor.
Todo vive en `assets/css/zonaxr-vr.css` y `assets/js/zonaxr-vr.js`:

- **Galaxia en 3D** dibujada en canvas: nebulosas con el color de la escuela, una
  banda tipo Vía Láctea, una galaxia espiral girando y estrellas en profundidad que
  se mueven con el ratón y el scroll. Al hacer scroll rápido, las estrellas se
  estiran como en un salto al hiperespacio.
- **HUD del visor**: viñeta de lente con aberración cromática solo en los bordes,
  esquinas de encuadre, líneas de escaneo y telemetría real (fps, profundidad de
  scroll, sección actual y posición de la mirada). Se apaga con el botón **Visor**
  de la barra superior y el navegador recuerda la elección.
- **Interfaz curva**: las tarjetas se inclinan según su lugar en pantalla, como si
  la página estuviera proyectada en una pantalla cilíndrica. Llegan desde el fondo
  y, al apuntarlas, se inclinan en 3D con borde holográfico y capas en paralaje.
- **Hero en capas**: la experiencia estrella es una pantalla curva que flota en el
  espacio (en escritorio) y cada texto flota a una distancia distinta.
- **Vista de cada app**: se abre como ventana holográfica que llega volando desde
  el fondo, sobre un piso de cuadrícula, con barra de carga, haz de proyección y la
  portada separada en canales RGB que se "materializa".
- **Video de fondo en cada escuela**: el tráiler o gameplay de la experiencia
  estrella corre en silencio y en bucle detrás del título, curvado como una pantalla
  envolvente. Tiene botones de **Sonido** y **Pausa**, y se pausa solo al bajar o al
  abrir una app. Los videos son de YouTube (se cambian en el atributo `data-yt` del
  `<div class="hero-video">` de cada página; `data-start` es el segundo de inicio):

  | Escuela | Video |
  |---|---|
  | Universal | First Steps, gameplay (canal Gamotein) |
  | Negocios | Bodyswaps Platform Trailer (Bodyswaps) |
  | Ingeniería | Mission:ISS (Meta VR) |
  | Humanidades | Oculus VR for Good: Anne Frank House (Meta VR) |
  | Ciencias Sociales | Becoming Homeless, tráiler oficial (Stanford VHIL) |
  | Arquitectura | Gravity Sketch en Meta Quest Pro (Gravity Sketch) |

  **Ojo:** YouTube no reproduce videos en páginas abiertas con doble clic. Para
  verlos en tu compu usa **`Abrir Zona XR.bat`** (levanta un servidor local con
  Python y abre Chrome). Con doble clic todo funciona igual, pero se queda la imagen
  fija en vez del video. Subidas a un servidor web, los videos funcionan sin más.
- **Iris** que se abre al cargar y se cierra al cambiar de página.

Si el sistema tiene activado "reducir movimiento", todo queda estático.
Para quitar el modo visor de una página, borra `class="vr"` de su etiqueta `<html>`.

## Sobre las imágenes

- **46** experiencias usan su portada oficial de la Meta Horizon Store.
- **30** usan una portada generada con el color de su escuela, porque no están en la
  tienda pública (vienen del Sistema Arbor) o porque la búsqueda devolvía otro producto.
  Preferí una portada genérica a poner la carátula equivocada.

Si consigues capturas propias de alguna de esas 30, basta con reemplazar el archivo
en `assets/img/` conservando el nombre; no hay que tocar el HTML.

## Los códigos QR

Siguen apuntando a los mismos PDF de Google Drive que el flyer original, así que
nada deja de funcionar. Ahora están en vectorial y con corrección de error alta,
que aguanta mejor la impresión y los roces del papel.

Si más adelante subes estas páginas a algún lado (GitHub Pages, el sitio de la
Biblioteca, etc.) y quieres que los QR lleven a la landing en vez del PDF, hay que
regenerarlos con las URL nuevas y volver a construir el flyer.

## Imprimir la infografía

Usa el PDF, o abre `flyer.html` y dale a **Imprimir**. Está armada a A4 exacto, a una
sola página. En el diálogo de impresión hay que dejar activado "Gráficos de fondo",
si no sale en blanco.
