// bot.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { detectIntent } = require('./dialogFlowClient');
const Reserva = require('./models/Reserva');
const Pedido = require('./models/Pedido');
const Evento = require('./models/Evento');
const RespuestaBot = require('./models/RespuestaBot');
const { setQRCode } = require('./controllers');
require('dotenv').config();

// Inicializar WhatsApp client con autenticación local para mantener la sesión
const client = new Client({
    authInfo: {
      phoneNumber: '+1234567890',
      session: 'YOUR_SESSION'
    },
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
    const msg = message.body;
    const from = message.from;

    try {
        // Detectar intención usando Dialogflow
        const dialogflowResponse = await detectIntent(msg, from);

        // Enviar la respuesta de Dialogflow al usuario
        if (dialogflowResponse.fulfillmentText) {
            message.reply(dialogflowResponse.fulfillmentText);
        }

        // Manejar acciones basadas en la intención
        switch (dialogflowResponse.intent) {
            case 'ReservarMesa':
                // Crear una reserva con los parámetros proporcionados
                const reserva = new Reserva({
                    nombre: dialogflowResponse.parameters.nombre.stringValue,
                    fecha: new Date(dialogflowResponse.parameters.fecha_reserva.stringValue),
                    hora: dialogflowResponse.parameters.hora_reserva.stringValue,
                    numeroPersonas: dialogflowResponse.parameters.numero_personas.numberValue,
                    comentario: dialogflowResponse.parameters.comentario_reserva.stringValue || '',
                    confirmada: false, // Confirmar más adelante
                });
                await reserva.save();
                console.log('Reserva creada:', reserva);
                break;

            case 'ConfirmarReserva':
                // Confirmar la reserva más reciente no confirmada
                const reservasPendientes = await Reserva.find({ confirmada: false }).sort({ createdAt: -1 }).limit(1);
                if (reservasPendientes.length > 0) {
                    reservasPendientes[0].confirmada = true;
                    await reservasPendientes[0].save();
                    message.reply(`Tu reserva ha sido confirmada para el ${reservasPendientes[0].fecha.toLocaleDateString()} a las ${reservasPendientes[0].hora}. ¡Te esperamos!`);
                } else {
                    message.reply('No tienes reservas pendientes para confirmar.');
                }
                break;

            case 'HacerPedido':
                // Crear un pedido con los parámetros proporcionados
                const pedido = new Pedido({
                    nombreCliente: dialogflowResponse.parameters.nombre_cliente.stringValue,
                    direccion: dialogflowResponse.parameters.direccion.stringValue || '',
                    items: dialogflowResponse.parameters.items_pedido.listValue.values.map(item => ({
                        nombre: item.structValue.fields.nombre_carta.stringValue,
                        cantidad: item.structValue.fields.cantidad_item.numberValue,
                        precio: item.structValue.fields.precio.numberValue, // Asegúrate de manejar el precio correctamente
                    })),
                    total: dialogflowResponse.parameters.total.numberValue, // Necesitarás calcular esto
                    estado: 'pendiente',
                });
                await pedido.save();
                console.log('Pedido creado:', pedido);
                break;

            case 'ConfirmarPedido':
                // Confirmar el pedido más reciente pendiente
                const pedidosPendientes = await Pedido.find({ estado: 'pendiente' }).sort({ createdAt: -1 }).limit(1);
                if (pedidosPendientes.length > 0) {
                    pedidosPendientes[0].estado = 'confirmado';
                    await pedidosPendientes[0].save();
                    message.reply(`Tu pedido ha sido confirmado y se enviará a ${pedidosPendientes[0].direccion}. ¡Gracias por tu compra!`);
                } else {
                    message.reply('No tienes pedidos pendientes para confirmar.');
                }
                break;

            case 'ConsultarEventos':
                // Listar eventos disponibles
                const eventos = await Evento.find();
                if (eventos.length > 0) {
                    const eventosTexto = eventos.map((evento, index) => `${index + 1}. ${evento.titulo}`).join('\n');
                    message.reply(`Nuestros próximos eventos son:\n${eventosTexto}. Por favor responde con el número del evento para más detalles.`);
                } else {
                    message.reply('Actualmente no tenemos eventos programados.');
                }
                break;

            case 'DetalleEvento':
                // Proporcionar detalles de un evento específico
                const numeroEvento = dialogflowResponse.parameters.numero_opcion.numberValue;
                const eventoSeleccionado = await Evento.findOne().skip(numeroEvento - 1);
                if (eventoSeleccionado) {
                    message.reply(`El evento "${eventoSeleccionado.titulo}" es el ${eventoSeleccionado.fecha.toLocaleDateString()} a las ${eventoSeleccionado.hora}. ${eventoSeleccionado.descripcion}. ¿Te gustaría asistir?`);
                } else {
                    message.reply('No encontramos el evento seleccionado.');
                }
                break;

            case 'ConsultarCarta':
                // Listar secciones de la carta
                const secciones = [
                    "Carnes",
                    "Tablas",
                    "Ensaladas",
                    "Hamburguesas y lomos",
                    "Tacos",
                    "Wraps",
                    "Postres",
                    "Bebidas"
                ];
                const seccionesTexto = secciones.map((seccion, index) => `${index + 1}. ${seccion}`).join('\n');
                message.reply(`Tenemos una carta muy variada. Por favor elige una sección:\n${seccionesTexto}`);
                break;

            case 'DetalleSeccionCarta':
                // Proporcionar detalles de una sección específica de la carta
                const seccionSeleccionada = dialogflowResponse.parameters.seccion_carta.stringValue;
                // Supongamos que RespuestaBot almacena los productos por sección
                const productos = await RespuestaBot.find({ opcion: seccionSeleccionada });
                if (productos.length > 0) {
                    const productosTexto = productos.map((producto, index) => `${index + 1}. ${producto.mensaje}`).join('\n');
                    message.reply(`Aquí tienes nuestras opciones de ${seccionSeleccionada}:\n${productosTexto}. ¿Te gustaría realizar el pedido o volver al menú principal?`);
                } else {
                    message.reply(`No encontramos productos para la sección ${seccionSeleccionada}.`);
                }
                break;

            // Agrega más casos según tus intents definidos en Dialogflow
            default:
                // Intención no manejada explícitamente
                break;
        }

    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
        message.reply('Lo siento, ocurrió un error al procesar tu solicitud.');
    }
});

// Inicializar el cliente de WhatsApp
client.initialize();
