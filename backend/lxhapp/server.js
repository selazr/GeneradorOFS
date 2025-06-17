require('dotenv').config();
const express = require('express');
const pool = require('./db'); // Conexión a MySQL
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const ordenesRoutes = require('./routes/ordenes');
const pdfRoutes = require("./routes/pdf"); // PDF
const ordenesExternasRoutes = require('./routes/ordenesExternas');
const bodyParser = require("body-parser");

const app = express();

// 📌 **Aumentar el límite de `body-parser` para permitir imágenes en Base64**
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());
app.use(cors()); // CORS habilitado antes de rutas
app.use('/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));
// Carpeta para imágenes de órdenes
app.use('/ordenes-img', express.static(path.join(__dirname, 'uploads', 'ordenes')));

// 📌 **Rutas**
app.use('/usuarios', userRoutes);
app.use('/ordenes', ordenesRoutes);
app.use('/ordenes', pdfRoutes); // PDF
app.use('/ordenes-externas', ordenesExternasRoutes);
app.use('/externas', express.static(path.join(__dirname, 'uploads', 'externas')));

// ✅ REGISTRO DE USUARIOS
app.post('/register', async (req, res) => {
    const { nombre, email, password, rol = 'usuario' } = req.body;

    if (!['admin', 'usuario', 'moderador'].includes(rol)) {
        return res.status(400).json({ mensaje: 'Rol no válido' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO usuarios (nombre, email, password, rol, avatar) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, hashedPassword, rol, null]);

        res.json({ mensaje: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// ✅ LOGIN DE USUARIOS (MODIFICADO: ahora envía también el nombre)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario no encontrado' });
        }

        const usuario = rows[0];

        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // 🔥 Ahora enviamos el "nombre" y el avatar en la respuesta JSON
        res.json({ mensaje: 'Login exitoso', token, rol: usuario.rol, nombre: usuario.nombre, avatar: usuario.avatar });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// ✅ Middleware para verificar tokens
const verificarToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(403).json({ mensaje: 'Acceso denegado, token requerido' });

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

// ✅ Middleware para verificar roles
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ mensaje: 'No tienes permisos para acceder a esta ruta' });
        }
        next();
    };
};

// ✅ Ruta protegida por rol de Admin
app.get('/admin', verificarToken, verificarRol(['admin']), (req, res) => {
    res.json({ mensaje: 'Bienvenido al panel de administrador' });
});


// ✅ **Servidor en ejecución**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('✅ Hola LXH, el backend funciona correctamente');
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
