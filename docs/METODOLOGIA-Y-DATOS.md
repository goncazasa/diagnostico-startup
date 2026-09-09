# Metodología y datos

## Objeto de validación

El panel revisa un instrumento de diagnóstico de startups tempranas. Cada experto evalúa:

- la relevancia de seis dimensiones y 21 preguntas;
- la cobertura de cada dimensión;
- la claridad del enunciado y de las respuestas de cada pregunta;
- posibles omisiones, redundancias y problemas de discriminación;
- comentarios cualitativos sobre cada bloque y sobre el conjunto.

La escala del experto va de 1 a 4. Los niveles 0–3 incluidos en el banco son las respuestas previstas para el futuro diagnóstico a emprendedores y representan otra variable. No deben mezclarse.

## Unidad de análisis

La unidad principal para validez de contenido es el juicio de relevancia emitido por una persona experta sobre una pregunta. La unidad de observación permanece identificada mediante `participante_id`, `version`, `revision` y `entrega_id`.

Una omisión explícita significa que el experto no dispone de experiencia suficiente o prefiere no valorar ese elemento. Se conserva el motivo y la puntuación queda vacía. Un vacío no es cero.

## Versionado y selección de registros

`Entregas` conserva todos los originales. Las tablas analíticas seleccionan la revisión más alta de cada combinación de participante y versión. Si dos contenidos distintos tienen la misma revisión, prevalece el último recibido en las vistas analíticas, mientras ambos originales continúan archivados.

Los registros de prueba se identifican mediante una de estas reglas:

- `participante_id` empieza por `testing-` o `testing_`;
- el nombre contiene `DATOS DE TESTING`;
- el correo empieza por `datos.testing` o por `testing` seguido de `.`, `+`, `_` o `-`.

Se etiquetan como `es_testing=true`. Pueden alimentar la vista demostrativa, pero quedan excluidos del cálculo de validez de contenido.

## Diccionario de tablas

| Tabla | Grano | Uso recomendado |
|---|---|---|
| Resumen | Indicador, dimensión o pregunta | Inspección inicial y comunicación interna. |
| Participantes | Participante y versión | Descripción del panel y revisión de posibles duplicados. Contiene datos personales. |
| Valoraciones | Participante y elemento | Análisis cuantitativo, tablas dinámicas y modelos posteriores. |
| Respuestas | Participante y versión | Opinión inicial, juicios globales y control general. |
| CalidadDatos | Participante y versión | Completitud, omisiones y decisión sobre inclusión. |
| Comentarios | Participante, campo y elemento | Codificación temática y auditoría de cambios propuestos. |
| ValidezContenido | Pregunta e indicador global | Evidencia cuantitativa de contenido. Solo datos reales. |
| RevisionDiseno | Participante y versión | Evaluación de cribado y capacidad de discriminación. |
| Diccionario | Elemento y versión | Libro de códigos y texto exacto utilizado. |
| DisenoInstrumento | Regla o metadato y versión | Trazabilidad de aplicabilidad, fuentes y diseño. |
| Metodologia | Indicador | Fórmulas, reglas e interpretación reproducible. |
| Recorrido | Día y pantalla | Fricción agregada del flujo; no contiene respuestas personales. |
| Entregas | Entrega original | Auditoría y reconstrucción. No editar ni usar como tabla de trabajo. |

## Indicadores implementados

### I-CVI

Para una pregunta `i`:

```text
I-CVI(i) = número de valoraciones de relevancia 3 o 4 / número de valoraciones válidas 1–4
```

Se muestran siempre `n_validas`, `n_relevantes`, `omisiones` y `faltantes`. La decisión automática solo se aplica desde seis valoraciones válidas. El umbral operativo configurado es `0,78`.

### S-CVI/Ave y S-CVI/UA

```text
S-CVI/Ave = media de los I-CVI de las 21 preguntas
S-CVI/UA  = preguntas con I-CVI = 1 / preguntas evaluadas
```

Ambos quedan sin conclusión cuando alguna pregunta tiene menos de seis juicios válidos. `0,90` se presenta como referencia para S-CVI/Ave. S-CVI/UA es un indicador descriptivo más estricto y no sustituye al promedio.

### Kappa modificado

```text
Pc = combinación(n, A) × 0,5^n
K* = (I-CVI − Pc) / (1 − Pc)
```

`n` es el número de valoraciones válidas y `A` el número de puntuaciones 3–4. El kappa complementa el I-CVI al considerar el acuerdo esperado por azar. No debe interpretarse sin el tamaño efectivo del panel.

### Calidad de respuesta

`CalidadDatos` calcula por participante:

- relevancias contestadas y esperadas;
- proporción de completitud de relevancia;
- juicios opcionales de claridad y cobertura;
- omisiones explícitas;
- estado `Completa` o `Revisar faltantes`.

La relevancia esperada excluye los bloques omitidos de forma explícita. Claridad y cobertura se informan aparte porque son criterios opcionales.

## Procedimiento recomendado

1. **Congelar el corte.** Registrar fecha, commit, versión del instrumento y copia del libro.
2. **Depurar sin borrar.** Revisar `CalidadDatos`, posibles duplicados y los criterios de exclusión definidos. Documentar las exclusiones; conservar `Entregas`.
3. **Describir el panel.** Informar experiencia, roles, fases y sectores. Las categorías multirrespuesta no deben sumar obligatoriamente el tamaño del panel.
4. **Examinar cada pregunta.** Revisar I-CVI, kappa, n efectivo, faltantes, omisiones y comentarios asociados.
5. **Examinar dimensiones y escala.** Utilizar cobertura, S-CVI/Ave y S-CVI/UA como síntesis, sin ocultar preguntas problemáticas.
6. **Analizar comentarios.** Definir un código inicial, conservar citas anonimizadas y registrar cómo cada tema conduce o no a un cambio.
7. **Tomar decisiones trazables.** Mantener, reformular, dividir, condicionar o retirar cada pregunta con una justificación explícita.
8. **Crear una nueva versión.** Cualquier cambio del banco debe producir un nuevo esquema y una nueva ronda o comprobación adecuada.

## Límites de interpretación

- El CVI aporta evidencia sobre contenido; no demuestra por sí solo estructura factorial, fiabilidad, validez convergente, capacidad predictiva ni utilidad clínica o empresarial.
- Los promedios pueden ocultar desacuerdo entre perfiles expertos. Conviene examinar distribuciones y comentarios por rol cuando el tamaño lo permita.
- Un panel pequeño produce estimaciones imprecisas. Los umbrales no sustituyen al juicio metodológico.
- La claridad valorada por expertos no reemplaza una prueba cognitiva con emprendedores de la población objetivo.
- COSMIN procede de instrumentos de resultados en salud. Se utiliza aquí como referencia conceptual para relevancia, exhaustividad y comprensibilidad, no como certificación formal.

## Referencias metodológicas

- Polit, D. F., Beck, C. T. y Owen, S. V. (2007). *Is the CVI an acceptable indicator of content validity? Appraisal and recommendations*. Research in Nursing & Health, 30(4), 459–467. [https://doi.org/10.1002/nur.20199](https://doi.org/10.1002/nur.20199)
- Terwee, C. B. et al. (2018). *COSMIN methodology for evaluating the content validity of patient-reported outcome measures: a Delphi study*. Quality of Life Research, 27, 1159–1170. [https://doi.org/10.1007/s11136-018-1829-0](https://doi.org/10.1007/s11136-018-1829-0)
- Lawshe, C. H. (1975). *A quantitative approach to content validity*. Personnel Psychology, 28(4), 563–575. [https://doi.org/10.1111/j.1744-6570.1975.tb01393.x](https://doi.org/10.1111/j.1744-6570.1975.tb01393.x). El CVR de Lawshe no está calculado en la aplicación porque la encuesta actual no recoge la clasificación específica de esencialidad que exige ese indicador.
