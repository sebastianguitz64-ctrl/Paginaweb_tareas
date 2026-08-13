# Ayuda con Tareas

Sitio estatico para recibir solicitudes de tareas y backend en Rust para
registrarlas en PostgreSQL. Instagram sigue siendo el canal de coordinacion:
`@h44i2026`.

## Estructura

- `index.html`, `css/`, `js/`: frontend publicable como sitio estatico.
- `js/runtime-config.js`: URL publica de la API. No contiene secretos.
- `backend/`: API REST con Axum, SQLx, CORS y migraciones.

## Frontend local

Desde la carpeta del proyecto:

```powershell
python -m http.server 8080
```

Abrir `http://localhost:8080`.

El sitio puede funcionar solo con Instagram. Para guardar solicitudes en la
base de datos, editar `js/runtime-config.js` con la URL publica de la API:

```js
window.APP_CONFIG = {
  apiBase: "https://tu-api.com/api",
};
```

Para desarrollo local con el backend corriendo en el puerto por defecto:

```js
window.APP_CONFIG = {
  apiBase: "http://localhost:3001/api",
};
```

## Backend local

1. Crear la base de datos PostgreSQL:

```sql
CREATE DATABASE task_requests;
```

2. Configurar variables:

```powershell
cd backend
Copy-Item .env.example .env
```

Editar `.env` con tu `DATABASE_URL`. Ese archivo no se sube al repositorio.

3. Ejecutar la API:

```powershell
cargo run
```

El backend corre por defecto en `http://127.0.0.1:3001`, aplica las migraciones
automaticamente y expone:

- `GET /api/health`
- `POST /api/requests`

Ejemplo de solicitud:

```json
{
  "name": "Gerson",
  "subject": "Matematica",
  "description": "Necesito apoyo con ejercicios de algebra.",
  "deadline": "2026-08-20"
}
```

`deadline` puede ser `null` u omitirse.

## CORS

`FRONTEND_ORIGIN` debe coincidir exactamente con el origen donde publicas la
pagina, por ejemplo:

```env
FRONTEND_ORIGIN=https://tusitio.com
```

## Despliegue

Frontend:

- Subir los archivos estaticos a Netlify, Vercel, Cloudflare Pages, GitHub Pages
  o un hosting similar.
- Actualizar `js/runtime-config.js` con la URL publica del backend.

Backend:

- Crear una base PostgreSQL en el proveedor elegido.
- Configurar `DATABASE_URL`, `FRONTEND_ORIGIN`, `HOST`, `PORT` y `RUST_LOG`.
- Ejecutar el binario Rust. Al iniciar, la API corre las migraciones de
  `backend/migrations`.

Para produccion, usa HTTPS en frontend y backend. Si sirves ambos bajo el mismo
dominio, puedes publicar la API bajo `/api` mediante un proxy inverso.
