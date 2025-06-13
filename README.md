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

## Tabla para almacenar imágenes

Para guardar las imágenes asociadas a cada orden en la base de datos se utiliza la tabla `orden_imagenes`:

```sql
CREATE TABLE orden_imagenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orden_id INT NOT NULL,
  posicion INT NOT NULL,
  imagen LONGBLOB NOT NULL,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE
);
```

