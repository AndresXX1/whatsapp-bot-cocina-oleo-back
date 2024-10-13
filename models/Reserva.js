const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    fecha: { type: Date, required: true },
    hora: { type: String, required: true },
    numeroPersonas: { type: Number, required: true },
    comentario: { type: String, default: '' },
    confirmada: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Reserva', reservaSchema);