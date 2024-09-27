const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    telefono: { type: String, required: true, unique: true },
    correo: { type: String },
    // Otros campos relevantes
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);