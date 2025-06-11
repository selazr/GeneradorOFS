const express = require('express');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const pool = require('../db');  // Asegúrate de importar la conexión a la BD
const router = express.Router();
const projectController = require('../controllers/project.controller');

// Ruta dinámica basada en el nombre de usuario
router.get('/:username', verificarToken, async (req, res) => {
    const { username } = req.params;  // Obtener el nombre de usuario desde la URL

    try {
        const [rows] = await pool.query('SELECT id, email, nombre FROM usuarios WHERE nombre = ?', [username]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// Ruta accesible solo para administradores
router.get('/admin', verificarToken, verificarRol(['admin']), (req, res) => {
    res.json({ mensaje: 'Bienvenido, administrador.' });
});

// routes/project.routes.js o routes/ordenes.routes.js

module.exports = router;
