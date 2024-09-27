const mongoose = require('mongoose');

const horarioSchema = new mongoose.Schema({
    nombreEmpleado: { type: String, required: true },
    dia: { type: String, required: true }, // e.g., Lunes
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Horario', horarioSchema);