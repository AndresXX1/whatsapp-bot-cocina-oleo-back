// dialogflowclient.js

const dialogflow = require('@google-cloud/dialogflow');
const path = require('path');

require('dotenv').config();

// Configurar el cliente de Dialogflow
const sessionClient = new dialogflow.SessionsClient({
    keyFilename: path.join(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS),
});

const projectId = process.env.DIALOGFLOW_PROJECT_ID;

const detectIntent = async (text, sessionId) => {
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'es', // Considera usar 'es-ES' para español de España o 'es-MX' para México
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
