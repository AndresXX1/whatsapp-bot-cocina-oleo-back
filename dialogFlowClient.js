// dialogFlowClient.js
const dialogflow = require('@google-cloud/dialogflow');
const path = require('path');
const fs = require('fs');
const config = require('./config/mongoDb'); // Importa la configuración

// Verificar que el archivo de credenciales existe
if (!fs.existsSync(config.googleApplicationCredentials)) {
    console.error(`El archivo de credenciales de Dialogflow no existe en la ruta: ${config.googleApplicationCredentials}`);
    process.exit(1);
}

// Configurar el cliente de Dialogflow
const sessionClient = new dialogflow.SessionsClient({
    keyFilename: config.googleApplicationCredentials,
});

const projectId = config.dialogflowProjectId;

const detectIntent = async (text, sessionId) => {
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'es', // Define el idioma
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;

        return {
            fulfillmentText: result.fulfillmentText,
            intent: result.intent ? result.intent.displayName : null,
            parameters: result.parameters.fields,
        };
    } catch (error) {
        console.error('Error en detectIntent:', error);
        throw error;
    }
};

module.exports = { detectIntent };
