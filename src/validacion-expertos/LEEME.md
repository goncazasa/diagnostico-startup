# Fuentes del panel V2.7

Documentación vigente en `../../README.md`. El envío usa `../../api/submit.mjs` y `../../google-apps-script/Code.gs`; las instrucciones están en `../../google-apps-script/LEEME.md`.

El instrumento vigente contiene cinco dimensiones, 20 preguntas y 50 juicios posibles. El generador crea el HTML autónomo y `public/index.html`. Para enviar se necesita el proyecto completo desplegado en Vercel y el receptor de Google configurado. La suite incluye las pruebas del modelo, la interfaz, la API, el receptor y el contrato del instrumento. La memoria completa está en [`../../docs/`](../../docs/README.md).

Las ilustraciones finales están en `assets/dimensions/` como PNG 1672 × 941 con transparencia. El generador las copia a `public/assets/dimensions/` para la web y las incrusta como datos en el HTML autónomo. Los archivos recibidos se preservaron como referencia fuera del repositorio; la edición se limitó a extraer el fondo y conservar el contenido ilustrado.
