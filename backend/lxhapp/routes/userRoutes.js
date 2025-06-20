const express = require('express');
const { verificarToken, verificarRol } = require('../middlewares/auth');
const pool = require('../db');  // Asegúrate de importar la conexión a la BD
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const projectController = require('../controllers/project.controller');

// Lista de usuarios (excepto el propio) para iniciar conversaciones
router.get('/list', verificarToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nombre, avatar FROM usuarios WHERE id <> ?', [req.usuario.id]);
        rows.forEach(u => {
            if (!u.avatar) {
                u.avatar = '/avatars/default.jpg';
            }
        });
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
});

// Ruta dinámica basada en el nombre de usuario
router.get('/:username', verificarToken, async (req, res) => {
    const { username } = req.params;  // Obtener el nombre de usuario desde la URL

    try {
        // Buscar por nombre y verificar que corresponda al usuario autenticado
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE nombre = ? AND id = ?',
            [username, req.usuario.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        const user = rows[0];
        if (!user.avatar) {
            user.avatar = '/avatars/default.jpg';
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// Actualizar perfil
router.put('/:username', verificarToken, async (req, res) => {
    const { username } = req.params;
    const { nombre, email, password, avatar } = req.body;

    try {
        // Buscar por nombre y verificar que corresponda al usuario autenticado
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE nombre = ? AND id = ?',
            [username, req.usuario.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado o no autorizado' });
        }
        const usuario = rows[0];

        const fields = [];
        const values = [];

        if (nombre) { fields.push('nombre = ?'); values.push(nombre); }
        if (email) { fields.push('email = ?'); values.push(email); }
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            fields.push('password = ?');
            values.push(hashed);
        }

        let avatarPath = usuario.avatar;
        if (avatar) {
            const dir = path.join(__dirname, '..', 'uploads', 'avatars');
            await fs.promises.mkdir(dir, { recursive: true });
            const match = avatar.match(/^data:image\/(\w+);base64,/);
            const ext = match ? match[1] : 'png';
            const base64Data = avatar.replace(/^data:image\/\w+;base64,/, '');
            const fileName = `${usuario.id}.${ext}`;
            const filePath = path.join(dir, fileName);
            await fs.promises.writeFile(filePath, base64Data, 'base64');
            avatarPath = `/avatars/${fileName}`;
            fields.push('avatar = ?');
            values.push(avatarPath);
        }

        if (fields.length === 0) {
            return res.json({ mensaje: 'Sin cambios' });
        }
        values.push(usuario.id);
        const sql = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
        await pool.query(sql, values);

        res.json({ mensaje: 'Perfil actualizado', avatar: avatarPath });
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
