const dialogflow = require('@google-cloud/dialogflow');
require('dotenv').config();

// Verificar que la variable de entorno esté definida
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('La variable de entorno GOOGLE_APPLICATION_CREDENTIALS_JSON no está definida.');
}

// Parsear las credenciales desde la variable de entorno
let credentials;
try {
    credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
} catch (error) {
    console.error('Error al parsear GOOGLE_APPLICATION_CREDENTIALS_JSON:', error);
    throw error;
}

// Configurar el cliente de Dialogflow con las credenciales
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
