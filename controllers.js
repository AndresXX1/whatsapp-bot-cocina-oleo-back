// controllers/botController.js
const { ObjectId } = require('mongodb');
const RespuestaBot = require('./models/botResponse');
const Reserva = require('./models/Reserva');
const Pedido = require('./models/Pedido');
const Evento = require('./models/Evento');
const Horario = require('./models/Horarios');
const Usuario = require('./models/Usuario');
const Propina = require('./models/Propina');
const InventarioCocina = require('./models/InventarioCocina');
const InventarioBebidas = require('./models/InventarioBebidas');

// Obtener el código QR
let lastQRCode = '';

const setQRCode = (qr) => {
    lastQRCode = qr;
};

const getQRCode = (req, res) => {
    if (lastQRCode) {
        res.status(200).json({ qrCode: lastQRCode });
    } else {
        res.status(404).send({ message: 'No hay QR disponible en este momento' });
    }
};

//////////////////////////////// Reservas ////////////////////////////////

const crearReserva = async (req, res) => {
    const { nombre, fecha_reserva, hora_reserva, numero_personas, comentario } = req.body;

    if (!nombre || !fecha_reserva || !hora_reserva || !numero_personas) {
        return res.status(400).json({ message: 'Faltan datos para la reserva.' });
    }

    try {
        const reserva = new Reserva({
            nombre,
            fecha: new Date(fecha_reserva),
            hora: hora_reserva,
            numeroPersonas: numero_personas,
            comentario: comentario || '',
        });

        await reserva.save();
        return res.status(201).json({ message: 'Reserva creada exitosamente.', reserva });
    } catch (error) {
        console.error('Error al crear la reserva:', error);
        return res.status(500).json({ message: 'Error al crear la reserva.' });
    }
};

// Obtener todas las reservas (opcional, para administración)
const obtenerReservas = async (req, res) => {
    try {
        const reservas = await Reserva.find();
        return res.status(200).json(reservas);
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        return res.status(500).json({ message: 'Error al obtener reservas.' });
    }
};

////////////////////// Pedidos //////////////////////////

const handleOrder = async (dialogflowResponse, message) => {
    const { nombre, apellido } = dialogflowResponse.parameters;

    // Buscar si ya hay un pedido existente
    const existingOrder = await Pedido.findOne({ nombre, apellido });

    if (!existingOrder) {
        // Preguntar por el pedido
        await message.reply(`Hola ${nombre}, ¿qué te gustaría pedir de la carta?`);
        // Aquí puedes manejar la lógica para capturar el pedido y almacenarlo
        // por ejemplo, creando un nuevo pedido y esperando la respuesta del usuario.

    } else {
        await message.reply(`Hola ${nombre}, ya tienes un pedido en curso: ${existingOrder.pedido}.`);
    }

    // Preguntar por el método de entrega
    const metodo_entrega = dialogflowResponse.parameters.metodo_entrega;
    if (metodo_entrega === 'delivery') {
        await message.reply('Por favor, indícame tu dirección para el delivery.');
        // Aquí puedes capturar la dirección y continuar con el flujo
    }

    // Preguntar por el método de pago
    const metodo_pago = dialogflowResponse.parameters.metodo_pago;
    await message.reply(`Tu método de pago es: ${metodo_pago}.`);

    // Confirmar el pedido
    await message.reply(`¡Gracias por tu pedido, ${nombre}! Un agente se comunicará contigo para cerrar detalles.`);
};

module.exports = { crearReserva, obtenerReservas, getQRCode, setQRCode, handleOrder };

