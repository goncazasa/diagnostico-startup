# Registro de cambios

## V2.2 — revisión de contenido y simplificación (septiembre de 2026)

- El título público pasa a **Diagnóstico de startups en fases iniciales** y se retira «Revisión por expertos» de la marca.
- La bienvenida explica la tarea experta y muestra de forma directa el objetivo, la población y el alcance del diagnóstico.
- Se retiran de la bienvenida las explicaciones técnicas de Google Sheets, Vercel y Apps Script, la referencia a la hoja informativa y el aviso de telemetría. El cliente deja de enviar eventos de navegación.
- El perfil mantiene los años como campo numérico, usa «pivote» y deja de mostrar conflictos de interés.
- Los nombres del lateral coinciden con los títulos de las seis dimensiones y la numeración visible de preguntas es consecutiva.
- Se revisan los enunciados de las seis dimensiones y se retiran C3 y F5. El banco queda en 21 preguntas y 54 juicios posibles.
- «Momento perfecto para triunfar» se operacionaliza como evidencia de un buen momento para lanzar; la escalabilidad se expresa como crecimiento de ingresos sin crecimiento proporcional de horas.
- El esquema pasa a `expert-validation/2.2` y el almacenamiento local a `startup-expert-validation-v2.2` para no mezclar respuestas de bancos distintos.
- El receptor de Google Apps Script acepta V2.2 y conserva intactas las entregas históricas de versiones anteriores.

## Simplificación de bienvenida e instrucciones (septiembre de 2026)

- La portada explica de forma directa que el experto valida preguntas destinadas a personas emprendedoras en fases iniciales.
- El propósito y la población se reescriben para aclarar qué ofrece el futuro diagnóstico y a quién va dirigido.
- La pregunta inicial pide las dimensiones que el experto evaluaría antes de conocer el instrumento.
- «Cómo responder» conserva dos pasos y una aclaración breve; se retiran códigos, cribado y contexto de esta pantalla.
- Los códigos internos se mantienen en los datos para el análisis, pero la interfaz muestra números de pregunta comprensibles.
- Se elimina la estimación de tiempo y se reorganizan las notas de inicio para evitar líneas y márgenes irregulares.
- T1 pregunta por los perfiles necesarios para desarrollar la startup y conseguir clientes, con una aclaración sobre producto, operaciones y ventas.
- Las puntuaciones 1–4 incorporan tonos suaves, manteniendo siempre el número y la etiqueta para no depender del color.

## Revisión UX basada en Yablonski y Krug (septiembre de 2026)

- «Cómo responder» se reduce a dos acciones visibles y una única referencia opcional.
- Las observaciones de preguntas y dimensiones utilizan divulgación progresiva y se reabren cuando contienen texto.
- Las 23 opciones de discriminación se agrupan en seis dimensiones.
- Se simplifican los textos de omisión, discriminación y espera durante el envío, sin alterar el banco de preguntas ni sus niveles.
- La revisión y las pruebas con usuarios pendientes quedan documentadas en `docs/REVISION-UX.md`.

## Resultados visuales y datos de prueba (septiembre de 2026)

- Se añade la pestaña `Resumen`, con indicadores, resultados por dimensión y resultados por pregunta ordenados para facilitar su revisión.
- `Resumen` recibe formato visual y anchuras legibles; las tablas largas conservan una estructura estable para exportación y rendimiento.
- Los registros identificados como `DATOS DE TESTING` se etiquetan con `es_testing` y quedan excluidos de los cálculos académicos de validez de contenido.
- Se añaden `CalidadDatos`, `Comentarios` y `Metodologia` para documentar completitud, preparar el análisis cualitativo y dejar trazables las decisiones analíticas.
- `ValidezContenido` incorpora tamaño efectivo, faltantes, S-CVI/UA, probabilidad de acuerdo por azar y kappa modificado, manteniendo separados los registros de prueba.
- Se incorpora en `docs/` la memoria del proyecto: historia razonada, metodología, estructura de datos, arquitectura, despliegue, seguridad, pruebas y recuperación.

## V2.1 — retirada de T3 (septiembre de 2026)

- Retira T3 del banco y deja 23 preguntas. El esquema pasa a `expert-validation/2.1` para separar sus respuestas de versiones anteriores.

## V2.0 — copy y UX menor (septiembre de 2026)

- Simplifica las instrucciones de revisión, aclara la disponibilidad del equipo y elimina expresiones ambiguas sobre perfiles y propiedad. Sin cambios de esquema.

## Rediseño de la interfaz — septiembre de 2026

- Nombre público: **Diagnóstico de startups**, con el subtítulo «Revisión por expertos». Se retira la etiqueta de versión candidata de la cabecera.
- Jerarquía visual con un título principal por pantalla, navegación secundaria, mayor contraste y una ilustración propia para cada dimensión. Las escalas conservan números y etiquetas, sin iconos emocionales que orienten la valoración.
- Perfil antes del criterio inicial; la explicación breve de las dos escalas aparece antes de revisar las dimensiones. Cada dimensión sigue en una sola página.
- Instrucciones, ayudas de navegación y mensajes de guardado y envío más breves, con tuteo. Se retiran las referencias heredadas al envío manual por correo.
- «Otra» muestra su campo de texto en cuanto se marca y conserva los cambios pendientes del perfil. El menú móvil mantiene su posición al recibir el foco.
- Se mantienen íntegros los 21 enunciados, niveles, aclaraciones, dimensiones y criterios del instrumento. No cambian el esquema, los borradores V1.9 ni la integración con Google Sheets.

## V1.9.1 — candidata (septiembre de 2026)

Bloque de revisión aplicado sobre V1.9, centrado en comprensión y trato.

- **Tuteo en todo el formulario**, incluidos los enunciados y las aclaraciones.
  Se hace antes de validar: cambiar la persona después invalidaría las
  puntuaciones de claridad ya recogidas.
- **Aclaraciones y glosario desplegados por defecto.** Si están ocultos, el
  experto puntúa la claridad sin el texto que la persona emprendedora sí vería.
- **Fases de experiencia:** se añaden «Escalado» y «Otra» con texto libre
  (`profile.phasesOther`), propagado a la hoja de contactos. Se mantiene
  «Repetición comercial», que marca el límite superior del alcance.
- **Participación y datos:** la hoja de información puede pedirse antes o
  después de responder, y se explica que los resultados se publicarán de forma
  agregada y anonimizada.
- **Comprensión de términos:** LOI, burn neto, runway, CAC, LTV, GTM e «hito»
  se explican en castellano dentro de la aclaración. El glosario no los
  repite; se reserva para términos que no están explicados en ese texto.
- **Contenido:** T1 explicita la complementariedad técnica y comercial; T3
  nombra la coachability sin dejar de medir conducta; T5 menciona el pacto de
  socios; PM2 distingue un problema real de una mejora deseable; PM3 sustituye
  «top-down» por estimación de abajo arriba; D6 y SA2 explicitan la legitimidad;
  D4 se subtitula «tracción y go-to-market».
- **Corrección:** el glosario emparejaba por subcadena y «dedicación» activaba
  la ficha del CAC. Ahora empareja por palabra completa.

### Pendiente
Sigue sin incorporarse la hoja de información del estudio. No abras la ronda
de expertos sin ella.

## V1.9 — candidata (septiembre de 2026)

Revisión de los enunciados y anclajes de la V1.8 para alinearlos con la evidencia de
origen (revisión sistemática, paper ICQEM 2026 y entrevistas con Encomenda VC, IESE,
MIT EFS y EY). Seis dimensiones, veintiuna preguntas.

### Ítem nuevo
- **T6 · Estructura de propiedad.** Efecto del reparto sobre la agilidad de decisión y
  sobre etapas futuras. Ítem condicional, con opción de «No aplica todavía» cuando no
  hay sociedad constituida ni socios. Origen: cap table y dead equity (Encomenda),
  límites de dilución y número de fundadores (EY).

### Enunciados reformulados
- **T1.** De «capacidades necesarias para el siguiente hito» a cobertura de los perfiles
  que exige el modelo de negocio: quién construye y quién vende. El conocimiento del
  sector se traslada íntegramente a T2 para evitar colinealidad.
- **PM4.** De «condiciones de adopción» a «por qué este es el momento», incorporando el
  momentum (Encomenda) y el «por qué no antes» sostenido con datos (IESE).
- **F4.** Se retira la condición incorporada en el enunciado; toda la condición vive en
  la opción de aplicabilidad.

### Anclajes y notas
- **T2.** La nota distingue conocimiento técnico del sector y conocimiento comercial.
- **T3.** El nivel 3 exige ajuste ante evidencia contraria o criterio externo.
- **T4.** Se refuerza hacia la continuidad ante contratiempos.
- **T5.** Acotado a reglas de decisión y responsabilidades; la propiedad pasa a T6.
- **PM2.** El nivel 3 se acota a la conducta actual frente a las alternativas, para no
  solaparse con C1.
- **PM3.** Se suprime la mención al enfoque top-down, que contradecía a la fuente, y el
  nivel 3 incorpora la estructura competitiva y las barreras de entrada.
- **VB2.** El nivel 3 incorpora la coherencia entre precio, coste y duración del ciclo.
- **C1.** El nivel 3 exige soporte documental identificable.
- **C2.** El nivel 3 pide conocer tiempo y coste de conseguir un cliente por el canal.
- **SA2.** La nota incorpora el aval de un cliente o institución de referencia.

### Compatibilidad
El esquema pasa a `expert-validation/1.9` y la clave de almacenamiento local a
`startup-expert-validation-v1.9`. Las respuestas exportadas desde V1.8 no se importan:
el banco de ítems ha cambiado.

### Pendiente antes de abrir la ronda
Hoja de información del estudio (responsable del tratamiento, base jurídica,
conservación, destinatarios y derechos). El envío recoge correo electrónico.
