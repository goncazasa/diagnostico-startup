# Plan de acción posterior a la auditoría

Actualizado el 16 de septiembre de 2026. Este plan excluye deliberadamente cambios en el texto o mecanismo de consentimiento, que quedan fuera del alcance actual.

## Objetivo

Preparar la V2.5 para un piloto cerrado y, tras evidencias de funcionamiento y usabilidad, para la recogida formal. El plan distingue cambios técnicos de decisiones de investigación para no alterar el instrumento sin trazabilidad.

## Fase 1 · Validar la cadena de datos

1. Publicar en Apps Script una nueva versión que incluya `google-apps-script/Code.gs` para el esquema `expert-validation/2.5`.
2. Confirmar en Vercel las variables privadas `GOOGLE_SHEETS_WEBHOOK_URL` y `GOOGLE_SHEETS_SECRET` de producción, sin copiarlas fuera de la configuración segura.
3. Enviar una respuesta marcada como prueba y comprobar el justificante, `Entregas`, `Valoraciones`, `CalidadDatos`, `Comentarios` y `ValidezContenido`.
4. Verificar que la prueba queda marcada como `es_testing=true` y no entra en los cálculos de validez.

**Criterio de salida:** una entrega V2.5 confirmada, archivada y reconstruida correctamente en la hoja privada.

## Fase 2 · Proteger la calidad del panel

1. Configurar una regla de rate limiting o WAF en Vercel para `POST /api/submit` y `POST /api/progress`.
2. Decidir el mecanismo de acceso del panel: invitaciones con identificador único o una lista de participantes autorizados. El correo por sí solo no evita duplicados ni respuestas ajenas.
3. Retirar `/api/progress` si no va a utilizarse; V2.5 no envía telemetría de recorrido.

**Criterio de salida:** se documenta quién puede responder, cómo se controlan duplicados y qué límite frena envíos automatizados.

## Fase 3 · Convertir calidad en una puerta de despliegue

1. Mantener el control documental local y en GitHub añadido en este repositorio.
2. Añadir CI para ejecutar construcción y pruebas unitarias en cada propuesta y antes de `main`.
3. Instalar y fijar el navegador de Playwright en CI para que el recorrido de navegador sea repetible, incluyendo móvil y envío simulado.
4. Añadir una comprobación de salud posterior al despliegue que valide la página pública y el contrato de la API sin introducir datos en la hoja real.

**Criterio de salida:** ningún cambio llega a producción sin construcción, pruebas y revisión de documentación verificables.

## Fase 4 · Pilotar el recorrido con expertos

1. Realizar entre tres y cinco sesiones moderadas con perfiles parecidos al panel objetivo.
2. Observar comprensión de las dos escalas, uso de omisiones, corrección desde el resumen y recuperación del borrador.
3. Medir el tiempo real y la fricción de la dimensión de Adaptación al mercado, que contiene siete preguntas.
4. Si hay fatiga, dividir visualmente esa dimensión en bloques breves con subprogreso, sin cambiar códigos ni contenido hasta registrar una nueva versión.

**Criterio de salida:** se priorizan y resuelven los tres problemas de mayor impacto antes de la ronda formal.

## Fase 5 · Operación y mantenimiento

1. Establecer una revisión semanal de errores de Vercel, envíos confirmados, fallos de Apps Script y `ANALYSIS_PENDING`.
2. Crear una copia periódica del libro y registrar fecha, commit y versión del instrumento en cada corte analítico.
3. Definir responsable alternativo y procedimiento de rotación del secreto para reducir dependencia de una sola persona.
4. Mantener este documento, `CHANGELOG.md` y los documentos de arquitectura alineados con cada cambio.

**Criterio de salida:** existe una rutina repetible de seguimiento, recuperación y trazabilidad.
