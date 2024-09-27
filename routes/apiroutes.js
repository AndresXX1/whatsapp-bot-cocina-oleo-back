// routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const { getResponses, updateResponse, getQRCode } = require('../controllers');

// Ruta para obtener las respuestas
router.get('/get-responses', getResponses);

// Ruta para actualizar una respuesta
router.post('/update-response', updateResponse);

// Ruta para obtener el código QR
router.get('/get-qr', getQRCode);

module.exports = router;