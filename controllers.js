const { ObjectId } = require('mongodb');
const RespuestaBot = require('./models/botResponse');
const Reserva = require('./models/Reserva');
const Pedido = require('./models/Pedido');
// ... otros imports

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

// Obtener todas las reservas
const obtenerReservas = async (req, res) => {
    try {
        const reservas = await Reserva.find();
        return res.status(200).json(reservas);
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        return res.status(500).json({ message: 'Error al obtener reservas.' });
    }
};

// Actualizar el estado de confirmación de una reserva
const actualizarConfirmacionReserva = async (req, res) => {
    const { id } = req.params; // Obtener el ID de la reserva desde los parámetros
    const { confirmada } = req.body; // Obtener el nuevo estado de confirmación

    try {
        const reserva = await Reserva.findByIdAndUpdate(id, { confirmada }, { new: true });
        if (!reserva) {
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }
        return res.status(200).json({ message: 'Reserva actualizada exitosamente.', reserva });
    } catch (error) {
        console.error('Error al actualizar la reserva:', error);
        return res.status(500).json({ message: 'Error al actualizar la reserva.' });
    }
};

// Eliminar una reserva
const eliminarReserva = async (req, res) => {
    const { id } = req.params; // Obtener el ID de la reserva desde los parámetros

    try {
        const reserva = await Reserva.findByIdAndDelete(id);
        if (!reserva) {
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }
        return res.status(200).json({ message: 'Reserva eliminada exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar la reserva:', error);
        return res.status(500).json({ message: 'Error al eliminar la reserva.' });
    }
};

////////////////////// Pedidos //////////////////////////

// Obtener todos los pedidos
const obtenerPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.find();
        return res.status(200).json(pedidos);
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        return res.status(500).json({ message: 'Error al obtener pedidos.' });
    }
};

// Actualizar un pedido
const actualizarPedido = async (req, res) => {
    const { id } = req.params; // Obtener el ID del pedido desde los parámetros
    const { nombre, apellido, pedido, metodo_entrega, direccion, metodo_pago, estado } = req.body; // Obtener los datos del pedido

    try {
        const pedidoActualizado = await Pedido.findByIdAndUpdate(id, { nombre, apellido, pedido, metodo_entrega, direccion, metodo_pago, estado }, { new: true });
        if (!pedidoActualizado) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        return res.status(200).json({ message: 'Pedido actualizado exitosamente.', pedido: pedidoActualizado });
    } catch (error) {
        console.error('Error al actualizar el pedido:', error);
        return res.status(500).json({ message: 'Error al actualizar el pedido.' });
    }
};

// Eliminar un pedido
const eliminarPedido = async (req, res) => {
    const { id } = req.params; // Obtener el ID del pedido desde los parámetros

    try {
        const pedidoEliminado = await Pedido.findByIdAndDelete(id);
        if (!pedidoEliminado) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        return res.status(200).json({ message: 'Pedido eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar el pedido:', error);
        return res.status(500).json({ message: 'Error al eliminar el pedido.' });
    }
};

/**
 * Función para guardar un pedido en la base de datos.
 * @param {Object} pedidoData - Datos del pedido.
 * @param {string} pedidoData.nombre - Nombre del cliente.
 * @param {string} pedidoData.apellido - Apellido del cliente.
 * @param {string} pedidoData.pedido - Producto pedido.
 * @param {string} [pedidoData.metodo_entrega] - Método de entrega.
 * @param {string} [pedidoData.direccion] - Dirección de entrega.
 * @param {string} [pedidoData.metodo_pago] - Método de pago.
 * @returns {Promise<Object>} - Pedido guardado.
 */
const guardarPedido = async ({ nombre, apellido, pedido, metodo_entrega, direccion, metodo_pago }) => {
    if (!nombre || !apellido || !pedido) {
        throw new Error('Faltan datos necesarios para crear el pedido.');
    }

    const newPedido = new Pedido({
        nombre,
        apellido,
        pedido,
        metodo_entrega: metodo_entrega || '',
        direccion: direccion || '',
        metodo_pago: metodo_pago || '',
        estado: 'pendiente'
    });

    await newPedido.save();

    return newPedido;
};

module.exports = {
    crearReserva,
    obtenerReservas,
    actualizarConfirmacionReserva,
    eliminarReserva,
    obtenerPedidos,
    getQRCode,
    setQRCode,
    guardarPedido,
    eliminarPedido,
    actualizarPedido,
};
