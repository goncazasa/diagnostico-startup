# Historia y decisiones del proyecto

## Finalidad y alcance

El proyecto implementa el panel de expertos de un instrumento académico para diagnosticar startups en fase temprana. Primero recoge el juicio de especialistas sobre las dimensiones, preguntas, respuestas y cobertura del instrumento. El instrumento destinado a personas emprendedoras se consolidará después de analizar este panel.

La aplicación actual no diagnostica startups ni produce una puntuación de madurez para emprendedores. Evalúa el contenido y la forma del instrumento que se utilizará en una fase posterior.

## Principios que han guiado el trabajo

1. **Sencillez para quien responde.** Cada dimensión ocupa una pantalla y las instrucciones se reducen a lo necesario en el momento de uso.
2. **Trazabilidad académica.** El texto, las reglas condicionales y las fuentes forman parte del instrumento versionado; los originales recibidos se conservan.
3. **Separación entre evidencia y demostración.** Los perfiles ficticios permiten probar la presentación, pero no intervienen en los indicadores académicos.
4. **Ausencia no equivale a cero.** Una omisión o falta de experiencia se registra como tal y nunca como una puntuación baja.
5. **Privacidad por capas.** Los datos de contacto se separan de las valoraciones en las tablas analíticas, aunque todo el libro conserva un único régimen de acceso.
6. **Una fuente, varios artefactos.** El código fuente vive en `src/validacion-expertos/`; `public/index.html` y el HTML autónomo se generan y no se editan manualmente.
7. **Cambios incompatibles explícitos.** Cuando cambia el banco de preguntas se cambia el esquema y la clave de almacenamiento para impedir mezclas silenciosas.

## Evolución

### V2.8: gobierno del reparto de participaciones

La V2.8 incorpora E5 en Equipo para evaluar si el reparto de participaciones permite tomar decisiones sin bloqueos y conserva margen para incorporar personas clave o inversores. La aclaración incluye porcentajes, vesting, participaciones ajenas a la actividad diaria y la situación previa en la que todavía no existe sociedad o reparto acordado.

El banco pasa de 20 a 21 preguntas y adopta la distribución 5/7/3/4/2. El cambio es incompatible con borradores anteriores: se utilizan `expert-validation/2.8` y `startup-expert-validation-v2.8`; el receptor mantiene la lectura histórica de V2.7 y versiones previas.

### V2.7: lenguaje directo y alineación visual

La V2.7 mantiene cinco dimensiones, 20 preguntas y la distribución 4/7/3/4/2. La bienvenida evita repetir el título entre cabecera y contenido, adopta una formulación impersonal basada en la experiencia y alinea las cifras con el contenido del objetivo. El bloque ampliado del perfil permanece visible y las instrucciones aclaran que se valora relevancia, calidad y claridad.

El 17 de septiembre se incorpora la revisión editorial del libro maestro. Se actualizan cuatro descripciones y 36 textos de preguntas, aclaraciones o niveles: se refuerzan la evidencia observable del problema, la estimación de clientes alcanzables, la validación del canal y la credibilidad que aportan clientes o colaboradores. Se conservan códigos, orden, distribución y escala; las correcciones de ortografía, concordancia y puntuación no cambian el significado propuesto.

E2 simplifica la referencia al problema que el equipo desea resolver. GF2 sustituye la comparación basada en códigos por una explicación de la previsión de caja; GF3 sitúa el siguiente hito al principio; GF4 desarrolla CAC y LTV; GR2 habla de legitimidad. Como cambia texto sometido a validación, se utilizan `expert-validation/2.7` y `startup-expert-validation-v2.7`.

Las cinco ilustraciones facilitadas sustituyen a los iconos lineales de las cabeceras de dimensión. Sus fondos blancos se extrajeron mediante edición de imagen y los activos finales conservan canal alfa, de modo que se integran con el fondo de la interfaz sin un rectángulo blanco. Se mantiene el encuadre 16:9 completo porque los rótulos forman parte de la explicación; en escritorio ocupan la columna derecha y en móvil pasan debajo del título a ancho completo. Cada imagen incorpora un texto alternativo específico. El HTML autónomo las integra como datos y la publicación web las sirve como archivos separados para evitar una descarga inicial conjunta.

### V2.6: precisión editorial sin ampliar el banco

La V2.6 conserva las cinco dimensiones, las 20 preguntas y el orden de V2.5. Hace visible en la bienvenida el alcance que ya formaba parte del instrumento y concreta formulaciones sobre dedicación del equipo, mercado alcanzable y economía del cliente.

GR1 queda centrada en los recursos o ventajas que aporta directamente una colaboración; GR2, en la confianza ante terceros y las oportunidades que esa relación abre. AM8 retira la referencia a MoSCoW para medir el criterio y no una herramienta. Los niveles 0–3 conservan su progresión y MV1 no cambia porque ya separa interés, compromisos verificables y repetición comercial.

Aunque no cambia el número de preguntas, sí cambia el texto que el panel debe validar. Para evitar mezclar valoraciones se utilizan `expert-validation/2.6` y `startup-expert-validation-v2.6`; V2.5 permanece histórica.

### V2.5: banco de 20 preguntas y devolución al experto

La V2.5 retira AM7 y AM9, conserva sus identificadores como huecos históricos y presenta AM5 antes de AM4. AM4 se centra en monitorizar cambios del mercado, MV2 explicita el canal de venta y GR2 distingue la legitimidad y el acceso que pueden generar clientes o colaboradores. El banco queda en 20 preguntas con distribución 4/7/3/4/2.

Las aclaraciones se muestran únicamente cuando contienen información útil. Se retira la hora del último cambio, que no ayudaba a responder. Tras una entrega confirmada se ofrece una devolución visual: media de relevancia de cada dimensión y sus preguntas, radar accesible, puntuaciones textuales y recomendaciones para dimensiones inferiores a 3. Esta devolución evalúa el cuestionario; no debe interpretarse como desempeño o madurez de una startup.

El cambio es incompatible con V2.4. Se utilizan `expert-validation/2.5` y `startup-expert-validation-v2.5`, mientras el receptor conserva la capacidad de archivar entregas históricas.

### V2.4: banco universal de 22 preguntas

La V2.4 mantiene las cinco dimensiones y adopta los IDs funcionales E, AM, MV, GF y GR. El cambio es incompatible con V2.3 y se acompaña de `expert-validation/2.4` y una clave de almacenamiento nueva; por tanto, los borradores, exportaciones y análisis V2.3 permanecen históricos y no se reinterpretan.

El banco retira estructura de propiedad e incorpora aprendizaje del equipo, conocimiento directo del cliente y sector, validación de solución, priorización por evidencia, competencia y defensibilidad, evolución del mercado y cuellos de botella. Marketing y ventas distingue compromiso, llegada y seguimiento; finanzas conserva caja, previsión, recursos y economía del cliente; GR1 y GR2 mantienen separadas colaboración y confianza.

No se incluyen reparto de participaciones, propiedad intelectual, dependencia de proveedores, NPS ni productos alternativos puntuables. Son decisiones del investigador para un MVP universal y no resultados científicos. Se documentó la revisión de Blitz Canvas / iVenture como fuente de ideas y contraste conceptual, sin presentarla como validación científica ni adaptación del instrumento.

### Base funcional y simplificación inicial

**Commits:** `bfa1dcd`, `fa128d2`.

Se sustituyó una experiencia de revisión extensa por un recorrido guiado y validado. Se añadieron guardado local, importación y exportación, control de navegación, estados de omisión y una página final con justificante real de entrega.

El envío por correo se descartó porque obligaba al experto a descargar un archivo, abrir otra aplicación y completar manualmente la entrega. Se eligió una función de Vercel que valida la respuesta y la remite a Google Sheets mediante un receptor de Apps Script. La decisión redujo pasos para el participante y dejó una fuente de datos estructurada para el análisis.

Apps Script conserva cada entrega original en `Entregas`, genera un justificante basado en la huella del contenido y reconstruye las tablas derivadas. La firma HMAC permite recibir respuestas desde una web pública sin hacer pública la hoja ni exponer el secreto en el navegador.

### V1.9: revisión del contenido

**Commit:** `7e144dd`.

La revisión se apoyó en los insumos declarados del proyecto: revisión sistemática, trabajo ICQEM 2026 y entrevistas con Encomenda VC, IESE, MIT EFS y EY. El repositorio conserva la trazabilidad disponible en los metadatos de cada pregunta; las fuentes completas deben mantenerse también en el archivo documental de la investigación.

Cambios principales:

- T1 pasó de preguntar por capacidades para un hito inmediato a comprobar la cobertura de perfiles que exige el modelo de negocio.
- Se añadió T6 sobre estructura de propiedad, con una ruta condicional cuando todavía no existe sociedad o reparto formal.
- PM4 pasó a preguntar por qué el momento actual favorece la oportunidad.
- F4 separó el enunciado principal de su condición de aplicabilidad.
- Se ajustaron los niveles de T2, T3, T4, T5, PM2, PM3, VB2, C1, C2 y SA2 para reducir solapamientos y acercarlos a evidencia observable.

Como cambió el banco, el esquema pasó a `expert-validation/1.9` y los archivos V1.8 dejaron de ser compatibles. Esta ruptura evitó analizar conjuntamente respuestas obtenidas con instrumentos distintos.

### V1.9.1: comprensión y lenguaje

**Commits:** `a45c961`, `37caf11`.

Todo el formulario pasó a segunda persona. Las aclaraciones dejaron de estar plegadas para que el experto valorase exactamente el texto que vería la persona emprendedora. Se añadieron fases de experiencia y un campo libre para «Otra».

Se explicaron términos especializados dentro de la pregunta correspondiente y se corrigió el glosario para que emparejara palabras completas. Después se retiraron ayudas redundantes: una explicación dejó de mostrarse cuando el término ya no aparecía en el enunciado. El criterio fue mantener la ayuda solo cuando resolvía una duda real.

### Rediseño profesional de la interfaz

**Commit:** `cd149fb`.

La aplicación adoptó el nombre público **Diagnóstico de startups** y dejó de mostrarse como una candidata o borrador. Se rehízo la jerarquía visual, se aumentó el contraste, se incorporó una ilustración por dimensión y se reorganizó la navegación.

El correo y el perfil se situaron antes del criterio inicial; la explicación de las escalas aparece antes de comenzar las dimensiones. Se conservaron números y etiquetas neutrales en las escalas para no orientar emocionalmente la valoración. Los iconos e ilustraciones se usan para facilitar orientación y ritmo, no para sugerir respuestas.

Se simplificaron la introducción, «Cómo responder», los mensajes de guardado y el cierre. Se mantuvo una dimensión por página porque reduce la fragmentación sin convertir el formulario completo en una sola pantalla extensa.

### V2.0: estructura futura y trazabilidad

**Commits:** `6cb96d2`, `c4049a6`.

Se incorporó el bloque estructural de V2: cribado inicial, metadatos de contexto, reglas explícitas de aplicabilidad, campos de diseño y fuentes por pregunta. Apps Script comenzó a exportar estas definiciones a `DisenoInstrumento` y `Diccionario`.

Se añadió telemetría agregada de recorrido por pantalla. Solo registra fecha y pantalla, sin correo, nombre, respuestas ni identificador personal. Su función es detectar abandono o fricción, no evaluar a participantes individuales.

Se revisaron instrucciones y textos de equipo. Expresiones ambiguas como «tiempo reservado», formulaciones extensas sobre complementariedad y explicaciones de propiedad se sustituyeron por lenguaje directo. El cambio buscó que personas expertas en áreas distintas interpretasen el enunciado de forma comparable.

### V2.1: retirada de T3

**Commit:** `522141b`.

T3 se eliminó por decisión del investigador. Se retiraron también sus ayudas, reglas especiales, campos de exportación y pruebas, evitando dejar referencias huérfanas. El instrumento quedó en seis dimensiones y 23 preguntas:

| Dimensión | Preguntas |
|---|---:|
| D1 · Equipo y gobernanza | 5 |
| D2 · Problema y mercado | 4 |
| D3 · Propuesta de valor y modelo de negocio | 4 |
| D4 · Evidencia comercial | 3 |
| D5 · Evidencia financiera | 5 |
| D6 · Recursos estratégicos y legitimidad | 2 |

El esquema pasó a `expert-validation/2.1` y el almacenamiento local a `startup-expert-validation-v2.1`. Los borradores y JSON anteriores no se importan porque contienen un banco diferente.

### V2.2: revisión editorial y simplificación del instrumento

La revisión se hizo desde tres perspectivas: comprensión de la persona experta, correspondencia con el diagnóstico que contestará la startup y calidad del juicio académico. El título público pasó a **Diagnóstico de startups en fases iniciales** y la bienvenida explica de forma directa que el panel debe valorar la relevancia, claridad y suficiencia del contenido.

Se igualaron los nombres de las dimensiones en la navegación y en cada página. El perfil sustituyó intervalos por un campo numérico de años de experiencia, adoptó «pivote» y retiró la pregunta sobre conflictos de interés. También se redujo el texto de privacidad mostrado antes de comenzar y se desactivaron los eventos de navegación del cliente, ya que su explicación dejó de formar parte de la interfaz.

Se revisaron los enunciados para que cada uno señale una evidencia concreta y use términos habituales en emprendimiento. Cuando una propuesta podía inducir la respuesta, se conservó su intención con una formulación neutral. Por ejemplo, «momento perfecto para que el proyecto triunfe» pasó a «buen momento para lanzar el proyecto», y la escalabilidad se expresó como la capacidad de aumentar ingresos sin que las horas de trabajo crezcan al mismo ritmo.

C3 y F5 se retiraron por decisión del investigador. El instrumento quedó en seis dimensiones y 21 preguntas:

| Dimensión | Preguntas |
|---|---:|
| D1 · Equipo | 5 |
| D2 · Problema y mercado | 4 |
| D3 · Propuesta de valor y modelo de negocio | 4 |
| D4 · Evidencia comercial (tracción y go-to-market) | 2 |
| D5 · Evidencia financiera | 4 |
| D6 · Recursos estratégicos y legitimidad | 2 |

El esquema pasó a `expert-validation/2.2` y el almacenamiento local a `startup-expert-validation-v2.2`. Esta separación impide combinar silenciosamente respuestas obtenidas con bancos de preguntas distintos.

### V2.3: reorganización aprobada del banco

Se retiró T5 y se fusionaron las anteriores dimensiones **Problema y mercado** y **Propuesta de valor y modelo de negocio** bajo **Adaptación al mercado**. Dentro de la dimensión fusionada se mantuvieron PM1, PM2, VB1 y VB2 antes de PM3 y PM4. También se retiraron VB3 y VB4.

La dimensión comercial pasó a llamarse **Marketing y ventas** e incorporó C4, que pregunta por el registro de oportunidades comerciales y las razones por las que avanzan, se detienen o se pierden. **Evidencia financiera** pasó a **Gestión financiera** y **Recursos estratégicos y legitimidad** a **Gestión de recursos y relaciones**.

T6 dejó de usar el anglicismo «cap table» y formula directamente el efecto del reparto de participaciones. No se modificó el contenido de las demás preguntas conservadas. El banco resultante contiene cinco dimensiones y 19 preguntas, con 48 juicios posibles. El esquema pasó a `expert-validation/2.3` y el almacenamiento local a `startup-expert-validation-v2.3`.

### Presentación y análisis de resultados

**Commits:** `080b75d`, `ddef449`, `976aa40`.

Se creó `Resumen` para ofrecer una lectura comprensible del panel y se cargaron doce perfiles ficticios identificados como `DATOS DE TESTING`. La primera versión aplicaba formato a todas las tablas en cada envío y superó el tiempo de espera del servidor. Se corrigió limitando el formato automático a la vista de resumen y ampliando de forma controlada el tiempo del receptor. Las tablas analíticas mantienen una estructura simple para exportación.

Los datos ficticios se detectan por identificador, nombre o correo técnico, se marcan con `es_testing` y se excluyen de `ValidezContenido`. Cuando no existen respuestas reales, `Resumen` los utiliza únicamente como demostración visual.

La salida académica se amplió con:

- `CalidadDatos`, para revisar completitud y omisiones antes del análisis;
- `Comentarios`, para codificar el material cualitativo sin incluir nombres ni correos;
- `Metodologia`, para dejar fórmulas y reglas junto a los resultados;
- I-CVI, S-CVI/Ave, S-CVI/UA, acuerdo esperado por azar y kappa modificado;
- tamaño efectivo, faltantes y omisiones por pregunta.

## Decisiones descartadas o corregidas

| Alternativa | Decisión | Motivo |
|---|---|---|
| Entrega manual por correo | Sustituida por envío automático | Reducía abandonos y evitaba archivos dispersos. |
| Supabase como primera base de datos | Google Sheets para el panel acotado | Menor configuración y acceso inmediato para análisis exploratorio. La arquitectura permite migrar si aumentan volumen, permisos o complejidad. |
| Una pantalla por pregunta | Una pantalla por dimensión | Reducía el número de pasos y conservaba contexto. |
| Varias cajas de matices | Un campo «Observaciones» | Evitaba repetición y carga innecesaria. |
| Ayudas plegadas | Aclaraciones visibles | El juicio de claridad debe considerar el texto realmente presentado. |
| Iconos emocionales en respuestas | Escala numérica neutral | Evita inducir una valoración positiva o negativa. |
| Formato completo en cada envío | Formato automático del resumen | El formato masivo provocaba tiempos de espera; las tablas largas priorizan exportación y rendimiento. |
| Mezclar pruebas y panel real | Etiqueta y exclusión automática | Protege los indicadores académicos y conserva la capacidad de probar producción. |

## Estado y trabajo pendiente antes de la recogida formal

- Incorporar y aprobar la hoja de información del estudio: responsable, finalidad, base jurídica, conservación, destinatarios y ejercicio de derechos.
- Confirmar el procedimiento con la dirección de tesis y, cuando corresponda, con el órgano ético o de protección de datos de la URJC.
- Fijar antes de analizar las reglas de inclusión del panel, tratamiento de duplicados, criterio ante datos incompletos y proceso de decisión por pregunta.
- Pilotar comprensión y duración con personas similares al panel objetivo.
- Congelar versión, código, instrumento y plan de análisis antes de abrir la ronda.
- Conservar una exportación fechada del libro y del commit utilizado para cada corte analítico.

El historial de Git constituye la evidencia técnica de cambios. Este documento explica sus motivos, pero no sustituye el diario de investigación, las actas de decisión ni el archivo de fuentes de la tesis.
