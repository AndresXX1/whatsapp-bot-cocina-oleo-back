// routes/apiroutes.js
const express = require('express');
const router = express.Router();
const { getResponses, updateResponse, getQRCode } = require('../controllers');
const BotResponse = require('../models/botResponse');
const dialogflow = require('@google-cloud/dialogflow');
const { projectId } = require('../config'); // Asegúrate de tener el projectId en tu configuración
const client = new dialogflow.IntentsClient();

// Ruta para obtener las respuestas
router.get('/get-responses', getResponses);

// Ruta para actualizar una respuesta
router.post('/update-response', updateResponse);

// Ruta para obtener el código QR
router.get('/get-qr', getQRCode);

// Ruta para obtener todos los intents de Dialogflow y guardarlos en MongoDB
router.post('/save-intents', async (req, res) => {
    try {
        const projectPath = client.projectPath(projectId);
        const [intents] = await client.listIntents({ parent: projectPath });

        const botResponses = intents.map(intent => ({
            intent: intent.displayName,
            responses: intent.responses.map(response => response.fulfillmentText || 'No response provided')
        }));

        // Insertar o actualizar cada intent en MongoDB
        for (const botResponse of botResponses) {
            await BotResponse.findOneAndUpdate(
                { intent: botResponse.intent },
                { responses: botResponse.responses },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({ message: 'Intents guardados correctamente', botResponses });
    } catch (error) {
        console.error('Error guardando intents:', error);
        res.status(500).json({ message: 'Error guardando intents', error });
    }
});

// Ruta para obtener todas las respuestas
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

module.exports = router;
