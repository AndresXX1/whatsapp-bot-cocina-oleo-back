// dialogflowclient.js

const dialogflow = require('@google-cloud/dialogflow');
const path = require('path');

require('dotenv').config();

// Decodificar las credenciales desde base64
const credentialsJSON = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64, 'base64').toString('utf-8');

let credentials;
try {
    credentials = JSON.parse(credentialsJSON);
} catch (error) {
    console.error('Error al parsear GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64:', error);
    throw error;
}

// Configurar el cliente de Dialogflow
const sessionClient = new dialogflow.SessionsClient({
    credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
    },
    projectId: process.env.DIALOGFLOW_PROJECT_ID,
});

const projectId = process.env.DIALOGFLOW_PROJECT_ID;

const detectIntent = async (text, sessionId) => {
    if (!text || typeof text !== 'string') {
        throw new Error('El mensaje del usuario está vacío o no es una cadena.');
    }

    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'es-ES', // Ajusta según tu necesidad
            },
        },
    };

    try {
        const [response] = await sessionClient.detectIntent(request);
        const result = response.queryResult;

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
