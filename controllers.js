const { ObjectId } = require('mongodb');
const RespuestaBot = require('./models/botResponse');
const Reserva = require('./models/Reserva');
const Pedido = require('./models/Pedido');
const Usuario = require('./models/Usuario');
const Review = require('./models/reviews');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

////////////////////// Usuarios //////////////////////////


// Registrar un nuevo usuario
const registrarUsuario = async (req, res) => {
    const { nombre, apellido, telefono, email, contraseña, rol } = req.body;

    if (!nombre || !apellido || !telefono || !email || !contraseña) {
        return res.status(400).json({ message: 'Faltan datos para el registro.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(contraseña, 10);
        const usuario = new Usuario({
            nombre,
            apellido,
            telefono,
            email,
            contraseña: hashedPassword,
            rol: rol || 'cliente'
        });

        await usuario.save();
        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error al registrar usuario.' });
    }
};

// Iniciar sesión de usuario
const loginUsuario = async (req, res) => {
    const { email, contraseña } = req.body;

    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const validPassword = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!validPassword) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }

        // Aquí es donde se genera el token
        const token = jwt.sign({
            userId: usuario._id,
            nombre: usuario.nombre,      // Agrega el nombre
            apellido: usuario.apellido,   // Agrega el apellido
            telefono: usuario.telefono,   // Agrega el teléfono
            rol: usuario.rol,
            age: usuario.age,
            address: usuario.address,
            country: usuario.country,
            gender: usuario.gender,
            imagen: usuario.imagen
                      
        }, 'secreto', { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error al iniciar sesión.' });
    }
};

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios.' });
    }
};

// Modificar datos del usuario
const modificarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, telefono, email, rol, age, address, country, gender, contraseña, imagen } = req.body;

    try {
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Actualizar datos del usuario
        if (nombre) usuario.nombre = nombre;
        if (apellido) usuario.apellido = apellido;
        if (telefono) usuario.telefono = telefono;
        if (email) usuario.email = email; 
        if (rol) usuario.rol = rol;
        if (age) usuario.age = age;
        if (address) usuario.address = address;
        if (country) usuario.country = country;
        if (gender) usuario.gender = gender;
        if (imagen) usuario.imagen = imagen; // Actualizar la imagen

        // Verificar y actualizar la contraseña
        if (contraseña) {
            usuario.contraseña = await bcrypt.hash(contraseña, 10);
        }

        await usuario.save();

        const token = jwt.sign({
            userId: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            telefono: usuario.telefono,
            email: usuario.email,
            rol: usuario.rol,
            age: usuario.age,
            address: usuario.address,
            country: usuario.country,
            gender: usuario.gender,
            imagen: usuario.imagen, // Incluir la imagen en el token
        }, 'secreto', { expiresIn: '1h' });

        res.status(200).json({
            message: 'Usuario actualizado exitosamente.',
            usuario,
            token
        });
    } catch (error) {
        console.error('Error al modificar usuario:', error);
        res.status(500).json({ message: 'Error al modificar usuario.' });
    }
};



////////////////////// Reseñas //////////////////////////


// Crear una nueva reseña
const crearReview = async (req, res) => {
    const { nombre, apellido, comentario, calificacion } = req.body;

    if (!nombre || !apellido || !comentario || !calificacion) {
        return res.status(400).json({ message: 'Faltan datos para la reseña.' });
    }

    try {
        const review = new Review({
            nombre,
            apellido,
            comentario,
            calificacion
        });

        await review.save();
        res.status(201).json({ message: 'Reseña creada exitosamente.', review });
    } catch (error) {
        console.error('Error al crear la reseña:', error);
        res.status(500).json({ message: 'Error al crear la reseña.' });
    }
};

// Obtener todas las reseñas
const obtenerReviews = async (req, res) => {
    try {
        const reviews = await Review.find();
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error al obtener reseñas:', error);
        res.status(500).json({ message: 'Error al obtener reseñas.' });
    }
};


// Actualizar una reseña
const actualizarReview = async (req, res) => {
    const { id } = req.params; // Obtener el ID de la reseña desde los parámetros
    const { comentario } = req.body; // Obtener el comentario del cuerpo de la solicitud

    if (!comentario) {
        return res.status(400).json({ message: 'Falta el comentario para actualizar la reseña.' });
    }

    try {
        const updatedReview = await Review.findByIdAndUpdate(id, { comentario }, { new: true });
        if (!updatedReview) {
            return res.status(404).json({ message: 'Reseña no encontrada.' });
        }
        res.status(200).json({ message: 'Reseña actualizada exitosamente.', review: updatedReview });
    } catch (error) {
        console.error('Error al actualizar la reseña:', error);
        res.status(500).json({ message: 'Error al actualizar la reseña.' });
    }
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
    registrarUsuario,
    loginUsuario,
    obtenerUsuarios,
    crearReview,
    obtenerReviews,
    modificarUsuario,
    actualizarReview
};
