const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ message: 'No se proporcionó un token de autenticación válido.' });
    }

    console.log('Middleware ejecutado, token válido.');
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, 'secreto');
        req.user = decoded;  // El token contiene la información del usuario
        console.log('User ID desde el token:', req.user.userId);  // Esto debería mostrar el ID del usuario

        // Verificar que el userId en el token sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
            return res.status(400).json({ message: 'ID de usuario inválido en el token.' });
        }

        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

module.exports = authMiddleware;