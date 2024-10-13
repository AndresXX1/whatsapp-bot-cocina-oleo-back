// bot.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { detectIntent } = require('./dialogFlowClient');
const Reserva = require('./models/Reserva');
const Pedido = require('./models/Pedido');
const Evento = require('./models/Evento');
const BotResponse = require('./models/botResponse'); // Importar el modelo BotResponse
const { setQRCode } = require('./controllers');
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

let dbConnected = true;

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
});

// Evento Message
client.on('message', async (message) => {
    const msg = message.body.trim();
    const from = message.from;

    try {
        console.log(`Mensaje recibido de ${from}: ${msg}`);

        // Detectar intención usando Dialogflow
        const dialogflowResponse = await detectIntent(msg, from);
        console.log('Respuesta de Dialogflow:', dialogflowResponse);

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
                const fechaReserva = dialogflowResponse.parameters.fecha_reserva?.stringValue;
                const horaReserva = dialogflowResponse.parameters.hora_reserva?.stringValue;
                const numeroPersonas = dialogflowResponse.parameters.numero_personas?.numberValue;
                const comentarioReserva = dialogflowResponse.parameters.comentario_reserva?.stringValue || '';

                if (!fechaReserva || !horaReserva || !numeroPersonas) {
                    await message.reply('Por favor, proporciona todos los detalles para la reserva (nombre, fecha, hora y número de personas).');
                    break;
                }

                // Crear una reserva con los parámetros proporcionados
                const reserva = new Reserva({
                    nombre: nombre,
                    fecha: new Date(fechaReserva),
                    hora: horaReserva,
                    numeroPersonas: numeroPersonas,
                    comentario: comentarioReserva,
                    confirmada: false, // Confirmar más adelante
                });

                await reserva.save();
                console.log('Reserva creada:', reserva);
                await message.reply('Tu reserva ha sido creada exitosamente.');
                break;

            case 'HacerPedido':
                // Validar parámetros necesarios
                const nombreCliente = dialogflowResponse.parameters.nombre_cliente?.stringValue || 'Cliente';
                const direccion = dialogflowResponse.parameters.direccion?.stringValue || '';
                const itemsList = dialogflowResponse.parameters.items_pedido?.listValue?.values;

                if (!itemsList || itemsList.length === 0) {
                    await message.reply('Por favor, proporciona al menos un ítem para tu pedido.');
                    break;
                }

                const items = itemsList.map(item => ({
                    nombre: item.structValue.fields.nombre_carta?.stringValue || 'Ítem sin nombre',
                    cantidad: item.structValue.fields.cantidad_item?.numberValue || 1,
                    precio: item.structValue.fields.precio?.numberValue || 0,
                }));

                // Calcular el total del pedido
                const total = items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);

                const pedido = new Pedido({
                    nombreCliente: nombreCliente,
                    direccion: direccion,
                    items: items,
                    total: total,
                    estado: 'pendiente',
                });

                await pedido.save();
                console.log('Pedido creado:', pedido);
                await message.reply(`Tu pedido ha sido creado exitosamente. El total es de $${total}.`);
                break;

            case 'ConsultarEventos':
                // Listar eventos disponibles
                const eventos = await Evento.find();
                if (eventos.length > 0) {
                    const eventosTexto = eventos.map((evento, index) => `${index + 1}. ${evento.titulo}`).join('\n');
                    await message.reply(`Nuestros próximos eventos son:\n${eventosTexto}. Por favor responde con el número del evento para más detalles.`);
                } else {
                    await message.reply('Actualmente no tenemos eventos programados.');
                }
                break;

            case 'DetalleEvento':
                // Proporcionar detalles de un evento específico
                const numeroEvento = dialogflowResponse.parameters.numero_opcion?.numberValue;
                if (!numeroEvento) {
                    await message.reply('Por favor, proporciona el número del evento para más detalles.');
                    break;
                }

                const eventoSeleccionado = await Evento.findOne().skip(numeroEvento - 1);
                if (eventoSeleccionado) {
                    await message.reply(`El evento "${eventoSeleccionado.titulo}" es el ${eventoSeleccionado.fecha.toLocaleDateString()} a las ${eventoSeleccionado.hora}. ${eventoSeleccionado.descripcion}. ¿Te gustaría asistir?`);
                } else {
                    await message.reply('No encontramos el evento seleccionado.');
                }
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
