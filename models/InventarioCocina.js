const mongoose = require('mongoose');

const inventarioCocinaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true },
    unidad: { type: String }, // e.g., kg, litros
}, { timestamps: true });

module.exports = mongoose.model('InventarioCocina', inventarioCocinaSchema);