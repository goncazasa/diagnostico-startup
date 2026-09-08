# Diagnóstico startup · Panel de expertos

Formulario con una dimensión por página, veintitrés preguntas, 58 juicios posibles y una observación final opcional. **Enviar revisión** guarda los datos en Google Sheets mediante una función de Vercel y un receptor de Google Apps Script. No necesita un servicio de correo ni un dominio propio.

## Documentación

- [Historia y decisiones del proyecto](docs/HISTORIA-Y-DECISIONES.md)
- [Metodología y estructura de datos](docs/METODOLOGIA-Y-DATOS.md)
- [Arquitectura, despliegue y operación](docs/ARQUITECTURA-Y-OPERACION.md)
- [Revisión UX basada en Yablonski y Krug](docs/REVISION-UX.md)
- [Registro de cambios por versión](CHANGELOG.md)

## Configuración

El código incluye la integración. Su activación requiere desplegar el receptor en una cuenta de Google y añadir dos variables privadas en Vercel; sin ellas, el formulario conserva el borrador y no confirma el envío. Ver [instrucciones de conexión](google-apps-script/LEEME.md).

Importar `goncazasa/diagnostico-startup` en Vercel, manteniendo la raíz del repositorio. `vercel.json` ejecuta el generador, sirve `public/` y despliega `api/submit.mjs`. No elegir `public` como raíz. GitHub Pages y abrir el HTML local permiten revisar la encuesta, pero no ejecutan la API de envío.

## Datos para analizar

La hoja privada vinculada a producción se abre desde **[Resultados del panel en Google Sheets](https://docs.google.com/spreadsheets/d/18ONMnSUKiRuK51pZVoy8FiaZWkiurZ_Nxsh5jBrJXpY/edit)**. Requiere iniciar sesión con la cuenta propietaria o con una cuenta a la que se haya concedido acceso. Si las tablas derivadas no reflejan la última entrega, recargar la hoja y ejecutar **Validación de expertos → Actualizar tablas de análisis**.

| Pestaña | Contenido |
|---|---|
| Resumen | Lectura visual del panel: tamaño de muestra, resultados por dimensión y preguntas ordenadas por prioridad de revisión. Si todavía no hay respuestas reales, muestra una vista demostrativa con los registros de prueba. |
| Valoraciones | Una fila por participante y elemento: seis dimensiones y veintitrés preguntas; puntuaciones numéricas, omisiones y observaciones. |
| Respuestas | Una fila por participante y versión: opinión inicial, respuestas globales, observación final y número de juicios contestados. |
| Participantes | Contacto y perfil, separados de las puntuaciones mediante un identificador. |
| CalidadDatos | Completitud de la relevancia obligatoria, cobertura, claridad y omisiones explícitas por participante. Revisar antes de calcular indicadores. |
| Comentarios | Corpus cualitativo en formato largo: una observación por fila, con ámbito, dimensión, pregunta y campo de origen. No contiene nombres ni correos. |
| ValidezContenido | I-CVI por pregunta, S-CVI/Ave, S-CVI/UA, probabilidad de acuerdo por azar y kappa modificado. Excluye automáticamente los registros de prueba. |
| Metodologia | Definición operativa, fórmula, reglas de inclusión, interpretación y referencia de cada indicador. |
| Diccionario | Texto exacto del instrumento, niveles y criterios de cada versión. |
| Entregas | Historial original íntegro; permite reconstruir las tablas y auditar cambios. No editar. |

Las tablas de análisis muestran la revisión más alta de cada identificador y versión. Si llegan dos contenidos diferentes con igual revisión, prevalece el último recibido; ambos quedan archivados. Los reintentos idénticos no añaden entregas. La deduplicación depende de conservar `Entregas` intacta. Un nuevo navegador o un borrador reiniciado genera otro identificador: revisar posibles participantes repetidos mediante el correo antes del análisis; no se fusionan automáticamente.

Las omisiones se exportan vacías, nunca como cero. `claridad_y_respuestas` es un juicio conjunto, no dos variables independientes. Las puntuaciones 1–4 son valoraciones de los expertos sobre el instrumento; no confundirlas con los niveles 0–3 propuestos a los emprendedores. Exportar las pestañas como CSV o el libro como XLSX permite usar Excel, R, SPSS o Python.

### Criterio analítico

La unidad de análisis cuantitativa es la valoración de relevancia de cada pregunta. El I-CVI es la proporción de puntuaciones 3–4 entre las valoraciones válidas 1–4. Se muestran el numerador, el denominador, las omisiones, los valores ausentes, la probabilidad de acuerdo por azar y el kappa modificado. La regla automática exige al menos seis valoraciones válidas y utiliza 0,78 como referencia para el I-CVI; el S-CVI/Ave se presenta con 0,90 como referencia global. Estos umbrales son ayudas para la decisión y deben interpretarse junto con las observaciones, el perfil del panel y la trazabilidad teórica de cada pregunta.

Los identificadores que empiezan por `testing-` o `testing_`, los nombres que contienen `DATOS DE TESTING` y los correos técnicos que empiezan por `datos.testing` o por `testing` seguido de `.`, `+`, `_` o `-` se marcan como `es_testing=true`. Se conservan para probar el sistema y pueden aparecer en la vista demostrativa, pero no entran en `ValidezContenido`. Antes del análisis formal:

1. Revisar `CalidadDatos` y documentar cualquier exclusión adicional sin borrar `Entregas`.
2. Describir el panel real mediante `Participantes`, manteniendo los datos identificativos fuera de los archivos compartidos.
3. Analizar I-CVI, S-CVI/Ave y kappa junto con el tamaño efectivo y las omisiones de cada pregunta.
4. Codificar `Comentarios` por temas y conservar un registro de las decisiones de mantener, revisar o retirar preguntas.
5. Tratar por separado los análisis confirmatorios previstos y cualquier exploración posterior.

La selección de indicadores sigue la propuesta de CVI de [Polit, Beck y Owen (2007)](https://pubmed.ncbi.nlm.nih.gov/17654487/) y la lectura conjunta de relevancia, cobertura y comprensión recomendada por la [metodología COSMIN de validez de contenido](https://pmc.ncbi.nlm.nih.gov/articles/PMC5891557/). COSMIN se desarrolló para instrumentos de resultados en salud; aquí se utiliza como marco general de razonamiento sobre contenido, no como afirmación de cumplimiento formal para este diagnóstico de emprendimiento.

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

Genera `Validacion_Expertos_Startup_V2_1.html` y `public/index.html`. JSDOM se usa solo en las pruebas. Las pruebas del servidor y de Apps Script usan transportes y hojas simulados: verifican validación, firma, justificantes, reintentos, historial, omisiones, Unicode, fallos de escritura y recuperación de tablas. No sustituyen una prueba real del despliegue.

Aplicación e instrumento `2.1.0`; esquema `expert-validation/2.1`; almacenamiento local `startup-expert-validation-v2.1`. V2.1 retira T3 del banco, por lo que no recupera borradores ni importa copias de versiones anteriores. Los HTML históricos se conservan localmente como antecedentes.
