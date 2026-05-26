# Despliegue en Vercel

Este proyecto ahora se despliega en Vercel como sitio estatico prerenderizado.

## Configuracion incluida en el repositorio

- `vercel.json` fija `buildCommand` en `npm run build`.
- `vercel.json` fija `outputDirectory` en `dist/client`.
- `vite.config.ts` activa `prerender` para que el build genere `dist/client/index.html`.

## Pasos en Vercel

1. Importa el repositorio en Vercel.
2. Verifica que el proyecto use Node.js 22.x o 24.x.
3. Si Vercel detecta configuracion previa, deja estos valores:
   - Build Command: `npm run build`
   - Output Directory: `dist/client`
4. Vuelve a desplegar.

## Que corrige esto

El error `404: NOT_FOUND` aparecia porque el proyecto estaba generando assets cliente y bundle SSR, pero no una pagina estatica raiz que Vercel pudiera publicar por defecto.

Con el prerender activado, el build genera `dist/client/index.html`, que es el archivo que Vercel necesita para servir la ruta `/`.

## Nota local

En este entorno de terminal aparecio un error final de cierre de `vite preview` durante el post-build (`process.stdin.off is not a function`), pero el prerender ya se habia completado y `dist/client/index.html` fue generado correctamente.

Ese cierre anomalo no cambia el artefacto que Vercel publica.