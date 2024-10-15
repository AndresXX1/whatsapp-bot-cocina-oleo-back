// models/Pedido.js
const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    apellido: {
        type: String,
        required: true,
    },
    pedido: {
        type: String,
        required: true,
    },
    metodo_entrega: {
        type: String,
        enum: ['delivery', 'recogida'],
        required: true,
    },
    direccion: {
        type: String,
        required: function () {
            return this.metodo_entrega === 'delivery';
        },
    },
    metodo_pago: {
        type: String,
        enum: ['efectivo', 'tarjeta'],
        required: true,
    },
    estado: {
        type: String,
        enum: ['pendiente', 'en_proceso', 'completado', 'cancelado'],
        default: 'pendiente',
    },
    fecha_creacion: {
        type: Date,
        default: Date.now,
    },
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

module.exports = Pedido;
