const dialogflow = require('@google-cloud/dialogflow');
const fs = require('fs');
require('dotenv').config();

// Verificar que la variable de entorno GOOGLE_APPLICATION_CREDENTIALS esté definida
let credentials;
try {
    // Intentar obtener las credenciales de la variable de entorno
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!credentialsPath) {
        throw new Error('La variable de entorno GOOGLE_APPLICATION_CREDENTIALS no está definida.');
    }

    // Leer las credenciales desde el archivo
    const credentialsData = fs.readFileSync(credentialsPath, 'utf8');
    credentials = JSON.parse(credentialsData);
} catch (error) {
    console.error('Error al leer o parsear las credenciales:', error);
    
    // Aquí podrías decidir cómo manejar el error, pero asegurémonos de que se lance si no hay credenciales
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
