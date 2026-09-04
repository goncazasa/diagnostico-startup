# Fuentes del panel V1.8

La documentación vigente está en `../../README.md`. Esta versión conserva 20 preguntas en seis páginas de dimensión y 52 juicios. El cierre tiene una observación opcional y un botón de envío. El servidor es `../../api/submit.mjs`.

Para publicar, usar el repositorio completo con su `vercel.json` de la raíz, no solo `public/`. El envío real requiere configurar `RESEND_API_KEY` y `RESEND_FROM` en Vercel. No se ha probado correo real en esta sesión.

El generador `build.mjs` crea el HTML autónomo V1.8 y `public/index.html`. Las pruebas `core.check.cjs`, `app.check.cjs` y `submit.check.cjs` se ejecutan con `npm test` desde la raíz tras instalar las dependencias de pruebas.

Las versiones V1.5, V1.6 y V1.7 se conservan localmente. Los documentos de esas versiones son antecedentes; su entrega manual y las antiguas preguntas finales ya no describen V1.8.
