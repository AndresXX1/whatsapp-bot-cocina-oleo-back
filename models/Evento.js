const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String },
    fecha: { type: Date, required: true },
    hora: { type: String, required: true },
    lugar: { type: String },
    capacidadMaxima: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Evento', eventoSchema);