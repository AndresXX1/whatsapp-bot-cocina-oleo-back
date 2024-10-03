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
                languageCode: 'es',
            },
        },
    };

    const [response] = await sessionClient.detectIntent({session: sessionPath, queryInput: request});
    const result = response.queryResult;

    return {
        fulfillmentText: result.fulfillmentText,
        intent: result.intent ? result.intent.displayName : null,
        parameters: result.parameters.fields,
    };
};

//dsadsad

module.exports = { detectIntent };