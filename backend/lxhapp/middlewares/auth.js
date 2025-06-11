const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(403).json({ mensaje: 'Acceso denegado, token requerido' });
    }

    // Extraer el token eliminando el prefijo "Bearer " si está presente
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;  // Guarda los datos del usuario en la request
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};


// Middleware para verificar roles
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !req.usuario.rol) {
            return res.status(403).json({ mensaje: 'No tienes permisos para acceder.' });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ mensaje: 'No tienes permisos para acceder.' });
        }

        next();
    };
};

module.exports = { verificarToken, verificarRol };
