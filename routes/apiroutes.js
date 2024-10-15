// routes/apiroutes.js
const express = require('express');
const router = express.Router();
const { getQRCode,crearReserva, obtenerReservas, handleOrder} = require('../controllers');




// Ruta para obtener el código QR
router.get('/get-qr', getQRCode);

//Ruta para crear una reserva
router.post('/reservas', crearReserva);

// Ruta para obtener todas las reservas (opcional)
router.get('/reservas', obtenerReservas);

router.post('/pedidos', handleOrder);

module.exports = router;