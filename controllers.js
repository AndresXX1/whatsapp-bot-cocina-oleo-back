// controllers/botController.js
const { ObjectId } = require('mongodb');
const RespuestaBot = require('./models/RespuestaBot');
const Reserva = require('./models/Reserva');
const Pedido = require('./models/Pedido');
const Evento = require('./models/Evento');
const Horario = require('./models/Horarios');
const Usuario = require('./models/Usuario');
const Propina = require('./models/Propina');
const InventarioCocina = require('./models/InventarioCocina');
const InventarioBebidas = require('./models/InventarioBebidas');

// Obtener todas las respuestas
const getResponses = async (req, res) => {
    try {
        const responses = await RespuestaBot.find();
        res.status(200).json(responses);
    } catch (error) {
        console.error('Error obteniendo las respuestas:', error);
        res.status(500).send({ message: 'Error obteniendo las respuestas' });
    }
};

// Actualizar una respuesta
const updateResponse = async (req, res) => {
    const { id, newResponse } = req.body;
    try {
        await RespuestaBot.updateOne({ _id: ObjectId(id) }, { $set: { mensaje: newResponse } });
        res.status(200).send({ message: 'Respuesta actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar la respuesta:', error);
        res.status(500).send({ message: 'Error al actualizar la respuesta' });
    }
};

// Obtener el código QR
let lastQRCode = '';

const setQRCode = (qr) => {
    lastQRCode = qr;
};

const getQRCode = (req, res) => {
    if (lastQRCode) {
        res.status(200).json({ qrCode: lastQRCode });
    } else {
        res.status(404).send({ message: 'No hay QR disponible en este momento' });
    }
};

module.exports = {
    getResponses,
    updateResponse,
    getQRCode,
    setQRCode, // Para ser usado en bot.js
};
