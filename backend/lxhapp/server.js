require('dotenv').config();
const express = require('express');
const pool = require('./db'); // Conexión a MySQL
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const userRoutes = require('./routes/userRoutes');
const ordenesRoutes = require('./routes/ordenes');
const pdfRoutes = require("./routes/pdf"); // PDF
const ordenesExternasRoutes = require('./routes/ordenesExternas');
const bodyParser = require("body-parser");
const { verificarToken, verificarRol } = require('./middlewares/auth');

const app = express();
const httpServer = http.createServer(app);

// Permitir múltiples orígenes (producción y desarrollo local)
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['https://lxhwork.com', 'http://localhost:3000'];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    }
};

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins
    }
});

// 📌 **Aumentar el límite de `body-parser` para permitir imágenes en Base64**
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());
app.use(cors(corsOptions)); // CORS habilitado antes de rutas
app.use('/avatars', express.static(path.join(__dirname, 'uploads', 'avatars')));
// Carpeta para imágenes de órdenes
app.use('/ordenes-img', express.static(path.join(__dirname, 'uploads', 'ordenes')));

// 📌 **Rutas**
app.use('/usuarios', userRoutes);
app.use('/ordenes', ordenesRoutes);
app.use('/ordenes', pdfRoutes); // PDF
app.use('/ordenes-externas', ordenesExternasRoutes);
app.use('/externas', express.static(path.join(__dirname, 'uploads', 'externas')));

// Devuelve historial de mensajes
app.get('/mensajes', verificarToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT m.mensaje, u.email as user FROM mensajes m JOIN usuarios u ON m.usuario_id = u.id ORDER BY m.id ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al cargar mensajes' });
    }
});

// Crear o recuperar una conversación privada
app.post('/conversaciones', verificarToken, async (req, res) => {
    const { usuarioId } = req.body;
    const miId = req.usuario.id;
    if (!usuarioId) return res.status(400).json({ mensaje: 'Usuario requerido' });
    try {
        const [rows] = await pool.query(
            'SELECT id FROM conversaciones WHERE (usuario_a=? AND usuario_b=?) OR (usuario_a=? AND usuario_b=?)',
            [miId, usuarioId, usuarioId, miId]
        );
        let convId;
        if (rows.length > 0) {
            convId = rows[0].id;
        } else {
            const [result] = await pool.query('INSERT INTO conversaciones (usuario_a, usuario_b) VALUES (?, ?)', [miId, usuarioId]);
            convId = result.insertId;
        }
        res.json({ id: convId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear conversación' });
    }
});

// Obtener mensajes de una conversación
app.get('/conversaciones/:id/mensajes', verificarToken, async (req, res) => {
    const convId = req.params.id;
    const miId = req.usuario.id;
    try {
        const [conv] = await pool.query('SELECT * FROM conversaciones WHERE id=? AND (usuario_a=? OR usuario_b=?)', [convId, miId, miId]);
        if (conv.length === 0) return res.status(403).json({ mensaje: 'Acceso denegado' });
        const [rows] = await pool.query('SELECT mensaje, remitente_id, leido FROM mensajes_privados WHERE conversacion_id=? ORDER BY id ASC', [convId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener mensajes' });
    }
});

// Marcar mensajes como leídos en una conversación
app.put('/conversaciones/:id/read', verificarToken, async (req, res) => {
    const convId = req.params.id;
    const userId = req.usuario.id;
    try {
        await pool.query('UPDATE mensajes_privados SET leido=1, read_at=NOW() WHERE conversacion_id=? AND remitente_id<>? AND leido=0', [convId, userId]);
        res.json({ mensaje: 'Mensajes marcados como leídos' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al marcar mensajes' });
    }
});

// Obtener conteo de mensajes no leídos por remitente
app.get('/conversaciones/unread', verificarToken, async (req, res) => {
    const userId = req.usuario.id;
    try {
        const [rows] = await pool.query(
            `SELECT CASE WHEN c.usuario_a=? THEN c.usuario_b ELSE c.usuario_a END AS usuario_id,
                    COUNT(mp.id) AS total
             FROM mensajes_privados mp
             JOIN conversaciones c ON mp.conversacion_id=c.id
             WHERE (c.usuario_a=? OR c.usuario_b=?)
               AND mp.remitente_id<>?
               AND mp.leido=0
             GROUP BY usuario_id`,
            [userId, userId, userId, userId]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener no leídos' });
    }
});

// Socket.io auth con JWT
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = payload;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.user.email}`);
    socket.join(`user:${socket.user.id}`);

    socket.on('chat message', async (msg) => {
        const data = { user: socket.user.email, mensaje: msg };
        io.emit('chat message', data);
        try {
            await pool.query('INSERT INTO mensajes (usuario_id, mensaje) VALUES (?, ?)', [socket.user.id, msg]);
        } catch (err) {
            console.error('Error guardando mensaje:', err);
        }
    });

    socket.on('private message', async ({ to, conversacionId, mensaje }) => {
        const payload = { conversacion_id: conversacionId, remitente_id: socket.user.id, mensaje };
        io.to(`user:${to}`).to(`user:${socket.user.id}`).emit('private message', payload);
        try {
            await pool.query('INSERT INTO mensajes_privados (conversacion_id, remitente_id, mensaje, leido) VALUES (?, ?, ?, 0)', [conversacionId, socket.user.id, mensaje]);
        } catch (err) {
            console.error('Error guardando mensaje privado:', err);
        }
    });
});

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


// ✅ Ruta protegida por rol de Admin
app.get('/admin', verificarToken, verificarRol(['admin']), (req, res) => {
    res.json({ mensaje: 'Bienvenido al panel de administrador' });
});


// ✅ **Servidor en ejecución**
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log('✅ Hola LXH, el backend funciona correctamente');
    console.log(`🚀 Servidor corriendo en https://lxhwork.com`);
});
