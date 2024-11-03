const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    comentario: { type: String, required: true },
    calificacion: { type: Number, required: true, min: 1, max: 5 },
    fechaCreacion: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);