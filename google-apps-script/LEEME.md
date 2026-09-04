# Conectar Google Sheets

Configuración una sola vez. Los expertos no necesitan una cuenta de Google ni acceso a la hoja.

1. Crear una hoja privada. Abrir **Extensiones → Apps Script**, sustituir el archivo inicial por `Code.gs` de esta carpeta y guardar. Nombrar el proyecto «Receptor de validación de expertos».
2. Seleccionar y ejecutar `configurar`. Revisar y autorizar el acceso a las hojas de cálculo que solicita Google. El script usa exclusivamente el identificador de esta hoja, aunque el permiso de Google puede abarcar las hojas de la cuenta. Si no se acepta ese alcance, no autorizar y usar otra cuenta destinada al estudio.
3. En **Configuración del proyecto → Propiedades de la secuencia de comandos** aparecerán `SHEET_ID` y `SHARED_SECRET`. Copiar el valor de `SHARED_SECRET` directamente a Vercel como `GOOGLE_SHEETS_SECRET`. No compartirlo por chat ni guardarlo en GitHub.
4. **Implementar → Nueva implementación → Aplicación web**. Ejecutar como propietario y permitir acceso a **Cualquier usuario** (incluido quien no haya iniciado sesión). La hoja no se hace pública: el receptor solo admite entregas firmadas y no ofrece lectura de respuestas. Las políticas de una cuenta institucional pueden impedir este despliegue.
5. Copiar la URL de la aplicación terminada en `/exec` a Vercel como `GOOGLE_SHEETS_WEBHOOK_URL`. No usar `/dev` ni la URL del editor. Añadir ambas variables al entorno de producción y volver a desplegar Vercel. No usar prefijos `PUBLIC` o `NEXT_PUBLIC`.
6. Completar una entrega claramente marcada **PRUEBA**, comprobar el justificante y buscarla en `Entregas`, `Valoraciones`, `Respuestas` y `Participantes`. Reintentar debe conservar una sola entrega. Corregir debe guardar otra revisión y mostrar la última en análisis. Excluir los identificadores de prueba del análisis del estudio.

Si se modifica `Code.gs`, actualizar la implementación a una **nueva versión**, manteniendo la misma URL. Guardar el editor no cambia por sí solo el código publicado.

Las pestañas de análisis se generan tras la primera entrega. Se pueden reconstruir desde la hoja con **Validación de expertos → Actualizar tablas de análisis** (recargar la hoja para ver el menú). No escribir anotaciones propias en estas pestañas porque se reemplazan; usar otra pestaña. No modificar ni borrar `Entregas`.

Las dos variables sustituyen a `RESEND_API_KEY` y `RESEND_FROM`, que ya no se usan. El envío no genera correos: guarda datos. Si posteriormente se quieren avisos, se pueden añadir sin cambiar la experiencia del encuestado.

[Documentación de aplicaciones web de Google](https://developers.google.com/apps-script/guides/web) · [Funciones Node.js de Vercel](https://vercel.com/docs/functions/runtimes/node-js).
