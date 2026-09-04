# Diagnóstico startup · Panel de expertos V1.8

Formulario de revisión por expertos, con una dimensión por página, 20 preguntas y 52 valoraciones posibles. El cierre contiene una única observación opcional y el botón **Enviar revisión**.

## Estado

La interfaz y el servidor de envío están implementados. Para que el botón envíe correos reales, hay que desplegar en Vercel y configurar Resend. **Sin esa configuración, la API devuelve un error y la página no confirma un envío.** No se ha efectuado una prueba con correo real.

El repositorio contiene código y un formulario vacío. Las respuestas de los participantes no se guardan en GitHub. El navegador mantiene un borrador local; al pulsar Enviar, el servidor remite la revisión como adjunto JSON a `luis.gonzalezc@urjc.es`. No es necesario abrir un cliente de correo. El participante puede descargar una copia de seguridad de manera opcional.

## Desplegar desde GitHub en Vercel

1. Entrar en [Vercel](https://vercel.com/new), seleccionar **Add New → Project** e importar `goncazasa/diagnostico-startup`.
2. Mantener el directorio raíz del repositorio. **No seleccionar `public` como raíz**: dejaría fuera `api/submit.mjs`, que recibe las respuestas.
3. La configuración incluida elige **Other**, ejecuta `node src/validacion-expertos/build.mjs` y publica `public/`, además de la función del directorio `api/`. No necesita dependencias de producción.
4. Crear una cuenta de [Resend](https://resend.com), verificar un dominio remitente que se controle y crear una clave con permiso para enviar. La dirección del destinatario URJC no tiene que ser la misma que la del remitente verificado. El modo de prueba de Resend tiene restricciones sobre los destinatarios.
5. Añadir en **Settings → Environment Variables**, para el entorno que se vaya a usar:

   | Variable | Valor |
   |---|---|
   | `RESEND_API_KEY` | Clave privada de Resend. |
   | `RESEND_FROM` | Remitente de un dominio verificado, por ejemplo `Panel de expertos <panel@dominio-verificado.example>`. Sustituir el ejemplo por el dominio real. |

6. Desplegar o volver a desplegar después de añadir las variables. Hacer una entrega de prueba y comprobar tanto el identificador de aceptación como la llegada del adjunto al buzón del investigador. Compartir después la URL de Vercel.

Las claves se guardan solo en Vercel; no deben ponerse en el repositorio, el HTML ni un mensaje de chat. `.env.example` solo enumera las variables. [Funciones Node.js de Vercel](https://vercel.com/docs/functions/runtimes/node-js), [API de Resend](https://resend.com/docs/api-reference/emails/send-email).

GitHub Pages puede mostrar el HTML, pero no ejecuta esta función de envío. Para el flujo completo usar Vercel con el proyecto entero.

## Comportamiento del envío

- La API admite POST JSON, valida la versión, el consentimiento, el contacto y las valoraciones, y limita el tamaño a 1 MB. Admite revisiones parciales.
- El destinatario está fijado en el servidor. El remitente lo configura el propietario; la dirección del experto se usa como `reply_to`. Los datos del navegador no eligen destinatarios ni el banco de preguntas adjunto.
- El servicio recibe texto plano y un JSON con los datos normalizados. Las puntuaciones omitidas siguen siendo `null`.
- Se envía una clave de idempotencia derivada del contenido. Reintentar una misma revisión genera la misma clave; Resend conserva estas claves durante su ventana de 24 horas. No se afirma deduplicación permanente. [Idempotencia de Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).
- Mientras se envía, el botón queda deshabilitado. Una aceptación válida produce un justificante local; editar después permite enviar una revisión actualizada.
- La aceptación del proveedor confirma que el correo se ha aceptado para envío, no que el destinatario lo haya leído ni que haya llegado a su bandeja de entrada. Revisar entregas y rebotes en Resend.
- Sin credenciales, ante un error o un tiempo de espera agotado no se confirma éxito. El borrador se conserva y el experto puede reintentar o descargar una copia.
- La ruta comprueba el origen de las peticiones de navegador. Eso no es autenticación ni protección completa frente a bots. Antes de una difusión abierta, configurar límites de solicitudes en Vercel y supervisar la cuota de Resend.

No se configura una base de datos ni un archivo central de respuestas. La conservación depende del buzón de investigación y del servicio de correo: concretarla en la hoja del estudio. El nombre y correo identifican al participante. La información sobre el tratamiento, los proveedores y la hoja del estudio debe completarse antes de una recogida formal; el consentimiento mostrado es todavía una redacción candidata.

## Desarrollo

Node.js 22. Para generar el HTML no se necesita instalar paquetes:

```sh
node src/validacion-expertos/build.mjs
```

Produce `Validacion_Expertos_Startup_V1_8.html` y `public/index.html`. La copia `file://` sirve para revisar y descargar; para enviar se necesita la URL de la aplicación desplegada.

Para ejecutar las pruebas:

```sh
npm install
npm test
```

JSDOM es exclusivamente una dependencia de pruebas. Las pruebas de servidor sustituyen el transporte de correo, de modo que no envían mensajes reales ni necesitan claves. Se comprueban los datos adjuntos, destinatario fijo, idempotencia, errores, límites, navegación, campos, guardado, resumen y envío del cliente.

## Datos y versiones

Instrumento `1.8.0`; esquema `expert-validation/1.8`. Mantiene los criterios `relevance` y `usability` por pregunta, y relevancia/cobertura por dimensión. `usability` es el juicio conjunto sobre claridad y respuestas, no dos medidas independientes.

El bloque global conserva solo `v2` y `v3` en el resumen y `v9` como observación final. Se retiran las otras seis preguntas globales. `submission` guarda el identificador y la revisión aceptada, separado de `exportedRevision`, que solo registra la descarga. Los registros de navegador pueden ser alterados por el usuario; la API no confía en sus justificantes, resúmenes ni copia del instrumento.

Las versiones anteriores no se convierten automáticamente. Las formulaciones siguen siendo candidatas: se necesita pilotaje con expertos y emprendedores. Las pruebas DOM no sustituyen la revisión visual en navegador ni verifican la entrega real del correo.
