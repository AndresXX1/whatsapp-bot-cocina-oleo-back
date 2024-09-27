const mongoose = require('mongoose');

const respuestaBotSchema = new mongoose.Schema({
    opcion: { type: String, required: true },
    mensaje: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('RespuestaBot', respuestaBotSchema);