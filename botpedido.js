// botPedido.js
const { guardarPedido } = require('./controllers');

/**
 * Función para manejar la lógica de hacer un pedido.
 * @param {Object} dialogflowResponse - Respuesta de Dialogflow.
 * @param {Object} message - Objeto del mensaje recibido.
 * @returns {Promise<void>}
 */
const handlePedido = async (dialogflowResponse, message) => {
    try {
        // Extraer parámetros de la respuesta de Dialogflow
        const nombre = dialogflowResponse.parameters.nombre?.stringValue || dialogflowResponse.parameters.name?.stringValue || '';
        const apellido = dialogflowResponse.parameters.apellido?.stringValue || '';
        const pedido = dialogflowResponse.parameters.pedido?.stringValue || '';
        const metodo_entrega = dialogflowResponse.parameters.metododeentrega?.stringValue || '';
        const direccion = dialogflowResponse.parameters.direccion?.stringValue || '';
        const metodo_pago = dialogflowResponse.parameters.metododepago?.stringValue || '';

        // Validar que los parámetros esenciales estén presentes
        if (!nombre || !apellido || !pedido) {
            console.error('Faltan datos esenciales para el pedido.');
            // No realizar el POST si faltan datos
            return;
        }

        // Guardar el pedido en la base de datos
        const pedidoGuardado = await guardarPedido({
            nombre,
            apellido,
            pedido,
            metodo_entrega,
            direccion,
            metodo_pago
        });

        console.log('Pedido guardado exitosamente:', pedidoGuardado);
        // No enviar respuestas aquí; se manejarán en bot.js

    } catch (error) {
        console.error('Error al guardar el pedido:', error);
        // Puedes optar por manejar el error aquí o en bot.js
    }
};

module.exports = { handlePedido };
