# Registro de cambios

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
  se explican en castellano dentro de la aclaración y del glosario.
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
