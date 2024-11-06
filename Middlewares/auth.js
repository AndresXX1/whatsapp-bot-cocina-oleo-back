const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ message: 'No se proporcionó un token de autenticación válido.' });
    }
    
    console.log('Middleware ejecutado, token válido.');
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, 'secreto');
        req.user = decoded; // Guardamos la información del usuario en req.user
        console.log('User ID desde el token:', req.user.userId); // Agrega esto para verificar
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

module.exports = authMiddleware;