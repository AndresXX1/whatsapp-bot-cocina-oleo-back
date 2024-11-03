const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    telefono: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    contraseña: { type: String, required: true },
    rol: { 
        type: String, 
        enum: ['cliente', 'admin', 'cocinero', 'encargado', 'superAdmin'], 
        default: 'cliente' 
    },
    age: { type: Number, required: false },         // Edad
    address: { type: String, required: false },     // Dirección
    country: { type: String, required: false },     // País
    gender: { type: String, required: false },      // Género
    fechaCreacion: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);
