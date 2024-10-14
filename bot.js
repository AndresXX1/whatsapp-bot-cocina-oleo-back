// bot.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { detectIntent } = require('./dialogFlowClient');
const Reserva = require('./models/Reserva');
const BotResponse = require('./models/botResponse'); // Importar el modelo BotResponse
const { setQRCode } = require('./controllers');
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

        // Obtener el nombre del usuario si está disponible
        const nombre = getParamValue(dialogflowResponse.parameters.nombre) || 'Cliente';

        // Reemplazar variables en la fulfillmentText si existen
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
                // Extraer los parámetros usando la función auxiliar
                const fechaReservaStr = getParamValue(dialogflowResponse.parameters.fecha_reserva);
                const horaReserva = getParamValue(dialogflowResponse.parameters.hora_reserva);
                const numeroPersonas = getParamValue(dialogflowResponse.parameters.numero_personas);
                const comentarioReserva = getParamValue(dialogflowResponse.parameters.comentario_reserva) || '';

                console.log('Parámetros de reserva:', { nombre, fechaReservaStr, horaReserva, numeroPersonas, comentarioReserva });

                // Validaciones adicionales
                if (!fechaReservaStr || !horaReserva || !numeroPersonas) {
                    console.log('Faltan detalles para la reserva, se espera que Dialogflow maneje las solicitudes de información.');
                    break; // Salimos del switch para evitar responder con mensajes adicionales
                }

                // Convertir la fecha correctamente
                let fechaReserva;

                if (moment(fechaReservaStr, 'DD-MM-YYYY', true).isValid()) {
                    fechaReserva = moment(fechaReservaStr, 'DD-MM-YYYY').toDate();
                } else if (moment(fechaReservaStr, 'DD/MM/YYYY', true).isValid()) {
                    fechaReserva = moment(fechaReservaStr, 'DD/MM/YYYY').toDate();
                } else if (moment(fechaReservaStr, 'DD/MM', true).isValid()) {
                    // Asignar el año actual si no se proporciona
                    const currentYear = new Date().getFullYear();
                    fechaReserva = moment(fechaReservaStr + '/' + currentYear, 'DD/MM/YYYY').toDate();
                } else {
                    await message.reply('La fecha proporcionada no es válida. Por favor, usa el formato DD-MM-YYYY o DD/MM.');
                    break;
                }

                // Validaciones de la fecha
                const today = moment().startOf('day');
                const reservaMoment = moment(fechaReserva);

                if (!reservaMoment.isValid()) {
                    await message.reply('La fecha proporcionada no es válida. Por favor, usa el formato DD-MM-YYYY o DD/MM.');
                    break;
                }

                if (reservaMoment.isSameOrBefore(today, 'day')) {
                    await message.reply('La fecha de reserva debe ser a partir de mañana.');
                    break;
                }

                if (reservaMoment.diff(today, 'days') > 20) {
                    await message.reply('Las reservas solo pueden realizarse hasta 20 días en el futuro.');
                    break;
                }

                // Validar que la cantidad máxima de personas por día no supere 50
                const reservasDia = await Reserva.find({ fecha: reservaMoment.startOf('day').toDate() });
                const totalPersonasDia = reservasDia.reduce((total, reserva) => total + reserva.numeroPersonas, 0);

                if ((totalPersonasDia + numeroPersonas) > 50) {
                    await message.reply('Lo siento, ya no hay disponibilidad para esa fecha. Por favor, elige otra fecha.');
                    break;
                }

                // Crear una reserva con los parámetros proporcionados
                const reserva = new Reserva({
                    nombre: nombre,
                    fecha: reservaMoment.toDate(),
                    hora: horaReserva,
                    numeroPersonas: numeroPersonas,
                    comentario: comentarioReserva,
                    confirmada: false, // Confirmar más adelante
                });

                console.log('Creando reserva:', reserva);

                try {
                    await reserva.save();
                    console.log('Reserva guardada exitosamente:', reserva);
                    await message.reply(`¡Gracias, ${nombre}! Tu reserva para ${numeroPersonas} personas el ${moment(reserva.fecha).format('YYYY-MM-DD')} a las ${reserva.hora} ha sido creada exitosamente.`);
                } catch (error) {
                    console.error('Error al guardar reserva:', error);
                    await message.reply('Lo siento, ocurrió un error al guardar tu reserva. Por favor, intenta nuevamente más tarde.');
                }

                break;

            case 'HacerPedido':
                // ... (mantén el código existente)
                break;

            case 'ConsultarEventos':
                // ... (mantén el código existente)
                break;

            case 'DetalleEvento':
                // ... (mantén el código existente)
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
