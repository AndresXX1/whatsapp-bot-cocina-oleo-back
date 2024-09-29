// dialogflowClient.js
const dialogflow = require('@google-cloud/dialogflow');
const path = require('path');
require('dotenv').config();

// Configurar el cliente de Dialogflow
const sessionClient = new dialogflow.SessionsClient({
    keyFilename: path.resolve(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS),
});

const projectId = process.env.DIALOGFLOW_PROJECT_ID;

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

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    return {
        fulfillmentText: result.fulfillmentText,
        intent: result.intent ? result.intent.displayName : null,
        parameters: result.parameters.fields,
    };
};

module.exports = { detectIntent };
