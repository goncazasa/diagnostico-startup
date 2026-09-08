# Revisión UX basada en Yablonski y Krug

Fecha de revisión: 8 de septiembre de 2026. Alcance: recorrido del panel de expertos V2.1 en escritorio y móvil. Esta revisión evalúa la interfaz; no modifica las 23 preguntas, sus niveles ni sus aclaraciones académicas.

## Criterio de diseño

La interfaz utiliza convenciones conocidas de formularios, una sola acción principal por pantalla, controles táctiles amplios y lenguaje directo. La identidad visual se mantiene sobria: azul institucional, fondos claros, tipografía instalada en el sistema e ilustraciones lineales por dimensión. La ilustración orienta y da ritmo; las respuestas no utilizan iconos emocionales que puedan sesgar la elección.

La complejidad esencial permanece visible cuando forma parte del objeto que se valida: enunciado, aclaración y niveles 0–3. La información auxiliar y los campos opcionales utilizan divulgación progresiva.

## Hallazgos y decisiones

| Principio | Problema observado | Decisión aplicada | Motivo |
|---|---|---|---|
| Ley de Jakob | El formulario podía requerir aprender etiquetas y recorridos propios. | Se mantienen botones, campos, radios, desplegables, pasos y resumen con patrones web convencionales. | Permite usar conocimientos adquiridos en otros formularios. |
| Ley de Fitts | Las acciones pequeñas o próximas podían favorecer errores, especialmente en móvil. | Botones principales de al menos 48 px, opciones de 44 px y separación entre acciones. | Mejora alcance táctil y reduce pulsaciones accidentales. |
| Ley de Miller | «Cómo responder» distribuía la referencia en tres desplegables y demasiados subtítulos. | Se reduce a dos acciones visibles y un único desplegable opcional para códigos y reglas. | Forma dos bloques fáciles de escanear y evita memorizar instrucciones. |
| Ley de Hick | La revisión de discriminación mostraba 23 casillas a la vez. | Las preguntas se agrupan en seis dimensiones desplegables y se abren automáticamente si contienen una selección. | Reduce opciones simultáneas sin retirar ninguna. |
| Principio de Postel | Los estados inesperados podían perder trabajo. | Persistencia local, importación, reintento, prevención de sobrescritura entre pestañas y mensajes que explican la recuperación. El campo de correo acepta espacios exteriores que el navegador normaliza. | El sistema absorbe errores frecuentes y conserva el trabajo. |
| Estética–usabilidad | Las primeras versiones parecían candidatas y mostraban jerarquías débiles. | Nombre definitivo, jerarquía única por pantalla, contraste, ritmo espacial e ilustraciones coherentes. | Refuerza confianza sin convertir la estética en decoración. |
| Ley de Tesler | Cada pregunta repetía campos opcionales que alargaban seis páginas ya densas. | «Observaciones» permanece como un único campo, pero se abre solo cuando se necesita y vuelve a abrirse si contiene texto. Los comentarios globales siguen la misma regla. | El sistema gestiona la complejidad opcional y conserva visible lo que debe evaluarse. |
| Umbral de Doherty | Guardado y envío pueden tardar más que una respuesta inmediata. | La selección cambia visualmente al instante, el guardado local informa de su estado y el envío cambia el botón y muestra «Guardando… No cierres esta página». | Mantiene la conversación entre persona y sistema durante operaciones lentas. |
| «No me hagas pensar» | Algunos textos explicaban el mecanismo en vez de la tarea. | «Valora el cuestionario, no una startup», «Solo la relevancia es obligatoria» y acciones con verbos concretos. | Cada texto responde a la decisión inmediata. |
| Diseño para escaneo | La página de instrucciones y el resumen contenían bloques largos. | Instrucciones en dos columnas en escritorio, una en móvil; resumen agrupado por dimensión; datos secundarios en desplegables. | Favorece búsqueda visual y lectura no lineal. |
| Prueba del maletero | Una pantalla profunda debía explicar ubicación y siguiente paso. | Marca persistente, título de página, navegación lateral, estado actual, progreso y CTA específico. | Permite reconocer sitio, pantalla, avance y acción desde cualquier punto. |

## Resultado de la revisión visual

- «Cómo responder» cabe completa en una ventana de escritorio de 1320 × 900 sin abrir la referencia opcional.
- Cada dimensión conserva todas sus preguntas en una página, con aclaraciones y respuestas previstas visibles.
- Los campos de observación cerrados reducen altura sin perder datos existentes.
- En móvil, las valoraciones se organizan en una matriz 2 × 2 y la revisión de discriminación presenta seis grupos, no 23 opciones simultáneas.
- El resumen permite volver directamente a una pregunta o dimensión.
- El foco de teclado, el enlace para saltar al contenido, las etiquetas y los mensajes con regiones de estado se conservan.
- `prefers-reduced-motion` se respeta y no se añaden animaciones automáticas.

## Comprobaciones automatizadas

Las pruebas verifican, entre otros puntos:

- un único bloque de referencia opcional en las instrucciones;
- dos pasos esenciales visibles;
- una observación por pregunta, cerrada si está vacía y abierta si contiene texto;
- seis grupos de discriminación y reapertura del grupo seleccionado;
- etiquetas, identificadores únicos y navegación por foco;
- comportamiento en móvil y ausencia de desbordamiento horizontal;
- conservación de respuestas, errores y reintentos.

## Validación pendiente con personas

Las leyes de UX orientan decisiones, pero no demuestran usabilidad. Antes de abrir la ronda formal se recomienda una prueba moderada con tres personas similares al panel objetivo:

1. Pedir que expliquen con sus palabras qué están valorando y qué significan 0–3 y 1–4.
2. Observar cómo localizan una omisión, añaden una observación, corrigen desde el resumen y envían.
3. Registrar tiempo total, dudas, retrocesos, errores y puntos de abandono.
4. Preguntar qué texto o control les obligó a detenerse.
5. Corregir los tres problemas de mayor impacto y repetir la prueba.

La estimación visible de 20–30 minutos debe confirmarse empíricamente. También conviene probar al menos un móvil, un portátil y navegación únicamente por teclado.
