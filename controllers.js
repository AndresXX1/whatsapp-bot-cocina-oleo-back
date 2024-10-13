// controllers/botController.js
const { ObjectId } = require('mongodb');
const RespuestaBot = require('./models/botResponse');
const Reserva = require('./models/Reserva');
const Pedido = require('./models/Pedido');
const Evento = require('./models/Evento');
const Horario = require('./models/Horarios');
const Usuario = require('./models/Usuario');
const Propina = require('./models/Propina');
const InventarioCocina = require('./models/InventarioCocina');
const InventarioBebidas = require('./models/InventarioBebidas');
const dialogflow = require('@google-cloud/dialogflow');
const { SessionsClient } = dialogflow.v2;

const sessionsClient = new SessionsClient({
    projectId: process.env.DIALOGFLOW_PROJECT_ID,
});

async function getDialogflowIntents() {
    const intentsClient = new dialogflow.IntentsClient();
    const parent = intentsClient.projectAgentPath(process.env.DIALOGFLOW_PROJECT_ID);
    const request = { parent };
    const [response] = await intentsClient.listIntents(request);
    return response.intents.map(intent => ({
        id: intent.name.split('/').pop(),
        displayName: intent.displayName,
        trainingPhrases: intent.trainingPhrases.map(phrase => phrase.parts[0].text),
        messageTexts: intent.messages && intent.messages[0] ? intent.messages[0].text.text : []
    }));
}

async function updateDialogflowIntent(intentId, displayName, trainingPhrases, messageTexts) {
    const intentsClient = new dialogflow.IntentsClient();
    const intentPath = intentsClient.intentPath(process.env.DIALOGFLOW_PROJECT_ID, intentId);
    const intent = {
        displayName,
        trainingPhrases: trainingPhrases.map(phrase => ({ parts: [{ text: phrase }] })),
        messages: [{
            text: {
                text: messageTexts
            }
        }]
    };

    const request = { intent, intentPath };
    await intentsClient.updateIntent(request);
}

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
