// bot.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { detectIntent } = require('./dialogFlowClient');
const Reserva = require('./models/Reserva');
const BotResponse = require('./models/botResponse'); // Importar el modelo BotResponse
const { setQRCode, handleOrder } = require('./controllers');
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
    console.log('Base de datos conectada a:', mongoose.connection.db.databaseName);
});

// Evento Message
client.on('message', async (message) => {
    const msg = message.body.trim();
    const from = message.from;

    try {
        console.log(`Mensaje recibido de ${from}: ${msg}`);

        // Detectar intención usando Dialogflow
        const dialogflowResponse = await detectIntent(msg, from);

        // Obtener el nombre del usuario si está disponible
        const nombre = dialogflowResponse.parameters.nombre?.stringValue || 'Cliente';

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
                // Validar la existencia de todos los parámetros necesarios
                const fechaReservaStr = dialogflowResponse.parameters.fecha_reserva?.stringValue;
                const horaReserva = dialogflowResponse.parameters.hora_reserva?.stringValue;
                const numeroPersonas = dialogflowResponse.parameters.numero_personas?.numberValue;
                const comentarioReserva = dialogflowResponse.parameters.comentario_reserva?.stringValue || '';
                
                console.log('Parámetros de reserva:', { nombre, fechaReservaStr, horaReserva, numeroPersonas, comentarioReserva });
                
                // Solo proceder si todos los parámetros necesarios están disponibles
                if (!fechaReservaStr || !horaReserva || !numeroPersonas) {
                    console.log('Faltan detalles para la reserva, se espera que Dialogflow maneje las solicitudes de información.');
                    break; // Salimos del switch para evitar responder con mensajes adicionales
                }
                
                // Comprobar si la fecha es válida (no debe ser en el pasado)
                const today = new Date();
                const dateToCompare = new Date(fechaReservaStr);
                if (dateToCompare < today) {
                    console.log('No se puede reservar en fechas pasadas.');
                    await message.reply(`Lo siento, ${nombre}. No se puede reservar en fechas pasadas. Por favor, vuelve a comenzar escribiendo la palabra "reserva".`);
                    break;
                }
                
                // Comprobar disponibilidad diaria
                const dayReservations = await Reserva.find({ fecha: dateToCompare.toISOString().split('T')[0] });
                const totalPeople = dayReservations.reduce((sum, r) => sum + r.numeroPersonas, 0);
                if (totalPeople >= 50) {
                    console.log('No hay disponibilidad para esa fecha.');
                    await message.reply(`Lo siento, ${nombre}. No hay disponibilidad para esa fecha. La capacidad máxima diaria es de 50 personas. Por favor, vuelve a comenzar escribiendo la palabra "reserva".`);
                    break;
                }
                
                // Crear una reserva con los parámetros proporcionados
                const reserva = new Reserva({
                    nombre: nombre,
                    fecha: dateToCompare,
                    hora: horaReserva,
                    numeroPersonas: numeroPersonas,
                    comentario: comentarioReserva,
                    confirmada: false, // Confirmar más adelante
                });
                
                console.log('Creando reserva:', reserva);
                
                try {
                    await reserva.save();
                    console.log('Reserva guardada exitosamente:', reserva);
                    
                    const formattedDate = moment(fechaReservaStr).format('DD/MM/YYYY');
                    const formattedTime = moment(horaReserva).format('HH:mm');
                    
                    await message.reply(`¡Gracias, ${nombre}! Tu reserva para ${numeroPersonas} personas ha sido creada exitosamente.\n` +
                                       `Fecha: ${formattedDate}\n` +
                                       `Hora: ${formattedTime}`);
                } catch (error) {
                    console.error('Error al guardar reserva:', error);
                    await message.reply(`Lo siento, ${nombre}. Ocurrió un error al guardar tu reserva. Por favor, vuelve a comenzar escribiendo la palabra "reserva".`);
                }
                
                break;
                

            case 'HacerPedido':
                await handleOrder(dialogflowResponse, message)
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
