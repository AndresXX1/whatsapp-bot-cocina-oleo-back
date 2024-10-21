const express = require('express');
const router = express.Router();
const { getQRCode, crearReserva, obtenerReservas, actualizarConfirmacionReserva, eliminarReserva, guardarPedido, obtenerPedidos, actualizarPedido, eliminarPedido } = require('../controllers');

// Ruta para obtener el código QR
router.get('/get-qr', getQRCode);

// Ruta para crear una reserva
router.post('/reservas', crearReserva);

// Ruta para obtener todas las reservas
router.get('/reservas', obtenerReservas);

// Ruta para actualizar la confirmación de una reserva
router.put('/reservas/:id', actualizarConfirmacionReserva);

// Ruta para eliminar una reserva
router.delete('/reservas/:id', eliminarReserva);

// Ruta para crear un pedido
router.post('/pedidos', guardarPedido);

// Ruta para obtener todos los pedidos
router.get('/pedidos', obtenerPedidos);

// Ruta para actualizar un pedido
router.put('/pedidos/:id', actualizarPedido); // Añadido

// Ruta para eliminar un pedido
router.delete('/pedidos/:id', eliminarPedido); // Añadido

module.exports = router;
