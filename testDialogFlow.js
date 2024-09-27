const { detectIntent } = require('./dialogFlowClient');

(async () => {
    try {
        const response = await detectIntent('Hola', 'test-session');
        console.log('Fulfillment Text:', response.fulfillmentText);
        console.log('Intent:', response.intent);
        console.log('Parameters:', response.parameters);
    } catch (error) {
        console.error('Error en la prueba de Dialogflow:', error);
    }
})();