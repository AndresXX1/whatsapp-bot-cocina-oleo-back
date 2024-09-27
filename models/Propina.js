const mongoose = require('mongoose');

const propinaSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    monto: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Propina', propinaSchema);