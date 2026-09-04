# Diagnóstico startup · Panel de expertos

Formulario con una dimensión por página, veinte preguntas, 52 juicios posibles y una observación final opcional. **Enviar revisión** guarda los datos en Google Sheets mediante una función de Vercel y un receptor de Google Apps Script. No necesita un servicio de correo ni un dominio propio.

## Configuración

El código incluye la integración. Su activación requiere desplegar el receptor en una cuenta de Google y añadir dos variables privadas en Vercel; sin ellas, el formulario conserva el borrador y no confirma el envío. Ver [instrucciones de conexión](google-apps-script/LEEME.md).

Importar `goncazasa/diagnostico-startup` en Vercel, manteniendo la raíz del repositorio. `vercel.json` ejecuta el generador, sirve `public/` y despliega `api/submit.mjs`. No elegir `public` como raíz. GitHub Pages y abrir el HTML local permiten revisar la encuesta, pero no ejecutan la API de envío.

## Datos para analizar

| Pestaña | Contenido |
|---|---|
| Valoraciones | Una fila por participante y elemento: seis dimensiones y veinte preguntas; puntuaciones numéricas, omisiones y observaciones. |
| Respuestas | Una fila por participante y versión: opinión inicial, respuestas globales, observación final y número de juicios contestados. |
| Participantes | Contacto y perfil, separados de las puntuaciones mediante un identificador. |
| Diccionario | Texto exacto del instrumento, niveles y criterios de cada versión. |
| Entregas | Historial original íntegro; permite reconstruir las tablas y auditar cambios. No editar. |

Las tablas de análisis muestran la revisión más alta de cada identificador y versión. Si llegan dos contenidos diferentes con igual revisión, prevalece el último recibido; ambos quedan archivados. Los reintentos idénticos no añaden entregas. La deduplicación depende de conservar `Entregas` intacta. Un nuevo navegador o un borrador reiniciado genera otro identificador: revisar posibles participantes repetidos mediante el correo antes del análisis; no se fusionan automáticamente.

Las omisiones se exportan vacías, nunca como cero. `claridad_y_respuestas` es un juicio conjunto, no dos variables independientes. Las puntuaciones 1–4 son valoraciones de los expertos sobre el instrumento; no confundirlas con los niveles 0–3 propuestos a los emprendedores. No se calculan indicadores de validez sin definir antes el procedimiento analítico. Exportar las pestañas como CSV o el libro como XLSX permite usar Excel, R, SPSS o Python.

## Guardado y privacidad

- La API valida consentimiento, correo, versión y puntuaciones; utiliza el instrumento del servidor y firma la entrega con HMAC-SHA256. El navegador nunca recibe la clave ni la dirección del receptor.
- Google comprueba la firma y bloquea escrituras simultáneas. El justificante es la huella del contenido original; la API exige que coincida antes de confirmar éxito.
- El original se conserva como JSON codificado en Base64 y dividido entre celdas. **Base64 no cifra los datos**. Las tablas derivadas protegen el texto libre frente a su interpretación como fórmulas.
- Una entrega solo se confirma después de guardar y vaciar las escrituras pendientes. Si falla la actualización de las tablas, el original permanece; el siguiente reintento o el menú **Validación de expertos → Actualizar tablas de análisis** reconstruye los datos. La propiedad `ANALYSIS_PENDING` indica una actualización pendiente.
- El libro y el proyecto de Apps Script deben ser privados. Separar contactos en otra pestaña no crea permisos separados: quien acceda al libro puede ver todos sus datos. Las observaciones también pueden identificar personas. Compartir únicamente exportaciones revisadas de las tablas necesarias.
- El identificador del navegador no autentica a un experto. La comprobación de origen no impide bots; la API pública sigue consumiendo cuota. Esta integración está pensada para un panel acotado, no para una encuesta masiva. Apps Script tiene [cuotas de ejecución](https://developers.google.com/apps-script/guides/services/quotas); se reconstruyen las tablas al recibir cambios.
- Concretar la información del estudio, conservación y tratamiento de datos antes de la recogida formal. Las preguntas y el consentimiento siguen siendo candidatos para pilotaje.

## Desarrollo y verificación

Node.js 22. El generador no necesita dependencias de producción:

```sh
node src/validacion-expertos/build.mjs
npm install
npm test
```

Genera `Validacion_Expertos_Startup_V1_8.html` y `public/index.html`. JSDOM se usa solo en las pruebas. Las pruebas del servidor y de Apps Script usan transportes y hojas simulados: verifican validación, firma, justificantes, reintentos, historial, omisiones, Unicode, fallos de escritura y recuperación de tablas. No sustituyen una prueba real del despliegue.

Aplicación `1.8.1`; instrumento `1.8.0`; esquema `expert-validation/1.8`. El cambio de transporte conserva los borradores de V1.8. Un justificante antiguo de correo no cuenta como un guardado en Sheets. Los HTML de versiones anteriores se conservan localmente como antecedentes.
