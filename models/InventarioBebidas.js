const mongoose = require('mongoose');

const inventarioBebidasSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true },
    unidad: { type: String }, // e.g., unidades, litros
}, { timestamps: true });

module.exports = mongoose.model('InventarioBebidas', inventarioBebidasSchema);