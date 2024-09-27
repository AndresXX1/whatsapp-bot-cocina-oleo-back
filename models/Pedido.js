// models/Pedido.js
const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    nombreCliente: { type: String, required: true },
    direccion: { type: String },
    items: [{
        nombre: { type: String, required: true },
        cantidad: { type: Number, required: true },
        precio: { type: Number, required: true },
    }],
    total: { type: Number, required: true },
    estado: { type: String, default: 'pendiente' },
}, { timestamps: true });

module.exports = mongoose.model('Pedido', pedidoSchema);
