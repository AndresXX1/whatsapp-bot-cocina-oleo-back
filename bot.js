// bot.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { detectIntent } = require('./dialogFlowClient');
const Reserva = require('./models/Reserva');
const BotResponse = require('./models/botResponse'); // Asegúrate de tener este modelo si lo usas
const { setQRCode, crearReserva, guardarPedido } = require('./controllers');
const { handlePedido } = require('./botpedido');
const moment = require('moment'); // Asegúrate de tener moment instalado
const mongoose = require('mongoose'); // Importar mongoose para logs
require('dotenv').config();

// Inicializar WhatsApp client con autenticación local para mantener la sesión
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    puppeteerPoolOptions: {
        timeout: 600000 // 10 minutos en milisegundos
    }
});

// Evento QR
client.on('qr', (qr) => {
    // Generar y mostrar el QR en la terminal
    qrcode.generate(qr, { small: true });
    console.log('Escanea el QR con WhatsApp para autenticar el bot.');
    // Guardar el QR para acceder vía API si es necesario
    setQRCode(qr);
});

// Evento Ready
client.on('ready', () => {
    console.log('Bot de WhatsApp listo!');
    if (mongoose.connection.db) {
        console.log('Base de datos conectada a:', mongoose.connection.db.databaseName);
    } else {
        console.log('Base de datos no conectada.');
    }
});

// Función auxiliar para extraer parámetros
const getParamValue = (param) => {
    if (!param) return undefined;
    if (param.stringValue) return param.stringValue;
    if (param.numberValue) return param.numberValue;
    if (param.listValue && param.listValue.values && param.listValue.values.length > 0) {
        const firstValue = param.listValue.values[0];
        if (firstValue.stringValue) return firstValue.stringValue;
        if (firstValue.numberValue) return firstValue.numberValue;
    }
    return undefined;
};

// Definir el enlace a la carta
const enlaceCarta = "https://tu-carta.com"; // Reemplaza con el enlace real de tu carta

// Evento Message
client.on('message', async (message) => {
    if (message.fromMe) return; // Ignorar mensajes enviados por el bot

    const msg = message.body.trim();
    const from = message.from;

    try {
        console.log(`Mensaje recibido de ${from}: ${msg}`);

        // Detectar intención usando Dialogflow
        const dialogflowResponse = await detectIntent(msg, from);
        console.log('Respuesta de Dialogflow:', JSON.stringify(dialogflowResponse, null, 2));

        // Obtener los parámetros
        const nombre = getParamValue(dialogflowResponse.parameters.nombre) || getParamValue(dialogflowResponse.parameters.name) || 'Cliente';
        const apellido = getParamValue(dialogflowResponse.parameters.apellido) || ''; // Puede ser ''

        // Reemplazar variables en fulfillmentText
        let fulfillmentText = dialogflowResponse.fulfillmentText;
        if (fulfillmentText.includes('$nombre')) {
            fulfillmentText = fulfillmentText.replace('$nombre', nombre);
        }

        // Buscar una respuesta personalizada en la base de datos
        let customResponse = await BotResponse.findOne({ intent: dialogflowResponse.intent });
        if (customResponse && customResponse.responses.length > 0) {
            // Seleccionar una respuesta aleatoria de las disponibles
            const randomIndex = Math.floor(Math.random() * customResponse.responses.length);
            fulfillmentText = customResponse.responses[randomIndex].replace('$nombre', nombre);
        }

        // Enviar la respuesta al usuario
        if (fulfillmentText) {
            await message.reply(fulfillmentText);
            console.log(`Respuesta enviada al usuario: ${fulfillmentText}`);
        }

        // Manejar acciones basadas en la intención
        switch (dialogflowResponse.intent) {
            case 'ReservarMesa':
                // Manejar la intención de reservar mesa
                const { nombreReserva, fecha_reserva, hora_reserva, numero_personas, comentario } = {
                    nombreReserva: getParamValue(dialogflowResponse.parameters.nombre) || getParamValue(dialogflowResponse.parameters.name) || '',
                    fecha_reserva: getParamValue(dialogflowResponse.parameters.fecha_reserva),
                    hora_reserva: getParamValue(dialogflowResponse.parameters.hora_reserva),
                    numero_personas: getParamValue(dialogflowResponse.parameters.numero_personas),
                    comentario: getParamValue(dialogflowResponse.parameters.comentario) || ''
                };

                if (!nombreReserva || !fecha_reserva || !hora_reserva || !numero_personas) {
                    console.log('Faltan datos necesarios para la reserva.');
                    // El bot ya ha enviado los prompts necesarios vía Dialogflow
                    break;
                }

                try {
                    const reservaGuardada = await crearReserva({
                        nombre: nombreReserva,
                        fecha_reserva,
                        hora_reserva,
                        numero_personas,
                        comentario
                    });

                    console.log('Reserva guardada exitosamente:', reservaGuardada);
                    // No enviar respuestas desde el controlador

                } catch (error) {
                    console.error('Error al crear la reserva:', error);
                    // Puedes optar por enviar un mensaje de error al usuario si lo deseas
                }

                break;

            case 'HacerPedido':
                // Manejar la intención de hacer un pedido
                await handlePedido(dialogflowResponse, message);
                break;

            case 'ConsultarEventos':
                // ... (mantén el código existente para ConsultarEventos)
                break;

            case 'DetalleEvento':
                // ... (mantén el código existente para DetalleEvento)
                break;

            // ... otros casos para intents

            default:
                // Intención no manejada explícitamente
                console.log(`Intención no manejada: ${dialogflowResponse.intent}`);
                break;
        }

    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
        await message.reply('Lo siento, ocurrió un error al procesar tu solicitud.');
    }
});

// Inicializar el cliente de WhatsApp
client.initialize();

// Exportar el cliente si es necesario
module.exports = client;
