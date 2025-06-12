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

## Gestión de imágenes de las OF

Las imágenes de cada orden se almacenan en la tabla `orden_imagenes`. Ejecuta el
siguiente script para crearla:

```bash
mysql -u <usuario> -p <basedatos> < backend/lxhapp/sql/add_imagenes_table.sql
```

Usa las rutas `/ordenes/:id/imagenes` para guardar y obtener las imágenes en
formato Base64.

