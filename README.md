# Generador OFS

Este proyecto contiene un backend en **Node.js** y un frontend en **React** para administrar órdenes de fabricación y generar archivos PDF.

## Inicio rápido

```bash
# Backend
cd backend/lxhapp
npm install
node server.js
```

```bash
# Frontend
cd frontend/frontend
npm install
npm start
```

El backend necesita un archivo `.env` con la configuración de la base de datos y la clave `JWT_SECRET`.

Copia `backend/lxhapp/.env.example` a `backend/lxhapp/.env` y completa los valores de:
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`

