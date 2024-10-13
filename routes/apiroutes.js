// routes/apiroutes.js
const express = require('express');
const router = express.Router();
const { getResponses, updateResponse, getQRCode } = require('../controllers');
const BotResponse = require('../models/botResponse');

// Ruta para obtener las respuestas
router.get('/get-responses', getResponses);

// Ruta para actualizar una respuesta
router.post('/update-response', updateResponse);

// Ruta para obtener el código QR
router.get('/get-qr', getQRCode);

router.get('/bot-responses', async (req, res) => {
    try {
        const responses = await BotResponse.find();
        res.json(responses);
    } catch (error) {
        console.error('Error obteniendo las respuestas del bot:', error);
        res.status(500).json({ message: 'Error obteniendo las respuestas del bot' });
    }
});

// Obtener una respuesta específica por intent
router.get('/bot-responses/:intent', async (req, res) => {
    try {
        const response = await BotResponse.findOne({ intent: req.params.intent });
        if (!response) {
            return res.status(404).json({ message: 'Respuesta del bot no encontrada' });
        }
        res.json(response);
    } catch (error) {
        console.error('Error obteniendo la respuesta del bot:', error);
        res.status(500).json({ message: 'Error obteniendo la respuesta del bot' });
    }
});

// Crear o actualizar una respuesta del bot
router.post('/bot-responses', async (req, res) => {
    const { intent, responses } = req.body;
    if (!intent || !responses || !Array.isArray(responses)) {
        return res.status(400).json({ message: 'Datos inválidos' });
    }

    try {
        let botResponse = await BotResponse.findOne({ intent });
        if (botResponse) {
            // Actualizar las respuestas existentes
            botResponse.responses = responses;
        } else {
            // Crear una nueva respuesta
            botResponse = new BotResponse({ intent, responses });
        }
        await botResponse.save();
        res.status(200).json(botResponse);
    } catch (error) {
        console.error('Error creando/actualizando la respuesta del bot:', error);
        res.status(500).json({ message: 'Error creando/actualizando la respuesta del bot' });
    }
});

// Eliminar una respuesta del bot
router.delete('/bot-responses/:intent', async (req, res) => {
    try {
        const response = await BotResponse.findOneAndDelete({ intent: req.params.intent });
        if (!response) {
            return res.status(404).json({ message: 'Respuesta del bot no encontrada' });
        }
        res.json({ message: 'Respuesta del bot eliminada exitosamente' });
    } catch (error) {
        console.error('Error eliminando la respuesta del bot:', error);
        res.status(500).json({ message: 'Error eliminando la respuesta del bot' });
    }
});

// Obtener todos los intents de Dialogflow
router.get('/dialogflow/intents', async (req, res) => {
    try {
        const intents = await getDialogflowIntents(); // Implementar esta función
        res.json(intents);
    } catch (error) {
        console.error('Error obteniendo intents de Dialogflow:', error);
        res.status(500).json({ message: 'Error obteniendo intents de Dialogflow' });
    }
});

// Actualizar un intent en Dialogflow
router.put('/dialogflow/intents/:intentId', async (req, res) => {
    const { intentId } = req.params;
    const { displayName, trainingPhrases, messageTexts } = req.body;

    try {
        await updateDialogflowIntent(intentId, displayName, trainingPhrases, messageTexts); // Implementar esta función
        res.status(200).json({ message: 'Intent actualizado correctamente' });
    } catch (error) {
        console.error('Error actualizando intent en Dialogflow:', error);
        res.status(500).json({ message: 'Error actualizando intent en Dialogflow' });
    }
});

module.exports = router;