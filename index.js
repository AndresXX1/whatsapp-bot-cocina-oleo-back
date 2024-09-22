const { MongoClient, ObjectId } = require('mongodb');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
}));

// URL de conexión de MongoDB
const uri = 'mongodb+srv://av5328881:6HCygxqVzrmD10AD@semilla.40ntl.mongodb.net/?retryWrites=true&w=majority&appName=Semilla';
const clientDB = new MongoClient(uri);

// Inicializar el cliente de WhatsApp
const client = new Client();

// Variable para almacenar el último código QR generado
let lastQRCode = ''; 
let collection; // Almacena la referencia de la colección para reutilizarla

// Función para conectar a MongoDB y configurar la colección solo una vez
async function initializeDB() {
    try {
        await clientDB.connect();
        console.log("Conectado a MongoDB");
        const db = clientDB.db();
        collection = db.collection('respuestas');
        
        // Verificar si la colección tiene documentos, si no, insertar respuestas iniciales
        const existingDocs = await collection.find({}).toArray();
        if (existingDocs.length === 0) {
            const respuestasIniciales = [
                {
                    opcion: "inicio",
                    mensaje: "Hola! Soy el asistente virtual de Oleo Sabores! Por favor indícame en qué te puedo ayudar hoy respondiendo con alguna de estas opciones:\n- Horarios y Ubicación\n- Reservas\n- Menú del día\n- Hacer un pedido\n- Eventos\n- Carta"
                },
                {
                    opcion: "horarios",
                    mensaje: "DIRECCIÓN: O'Higgins 5450, X5014 Córdoba. HORARIOS: lunes a lunes de 8:00 am a 1:00 am. Tenemos otros servicios que podrían interesarte."
                },
                {
                    opcion: "menu del dia",
                    mensaje: "El menú del día elaborado por nuestro Chef Nelson es Pechuga de cerdo a la pastera. ¿Te gustaría realizar un pedido o volver al menú anterior?"
                },
                {
                    opcion: "realizar pedido",
                    mensaje: "Por favor indique si le gustaría hacer una observación a los ingredientes del menú. Ej: sin chimichurri."
                },
                {
                    opcion: "envio domicilio",
                    mensaje: "Genial, los envíos a domicilio tienen un costo extra de $100, también puede retirarlo en el local. ¿Cómo deseas recibir tu pedido?\n- Envío a domicilio\n- Retiro en el local"
                },
                {
                    opcion: "retirar local",
                    mensaje: "Perfecto, puedes retirarlo en O'Higgins 5450. ¿Te gustaría hacer una observación a los ingredientes?"
                },
                {
                    opcion: "direccion domicilio",
                    mensaje: "Perfecto, ¿a qué dirección enviamos el pedido?"
                },
                {
                    opcion: "reservas",
                    mensaje: "Perfecto, las reservas pueden hacerse con una anticipación máxima de 3 días. ¿Para qué fecha y hora estás buscando?"
                },
                {
                    opcion: "eventos",
                    mensaje: "Nuestros próximos eventos son estos:\n- Evento 1\n- Evento 2\n- Evento 3. Si quieres saber más de estos eventos por favor respóndeme con el número de opción."
                },
                {
                    opcion: "carta",
                    mensaje: "Tenemos una carta muy variada. Por favor elige una sección:\n- Carnes\n- Tablas\n- Ensaladas\n- Hamburguesas y lomos\n- Tacos\n- Wraps\n- Postres\n- Bebidas"
                },
                {
                    opcion: "carta bebidas",
                    mensaje: "Aquí tienes nuestras opciones de bebidas:\n1. Coca Cola\n2. Sprite\n3. Fanta\n4. Agua mineral\n5. Agua con gas\n6. Vino tinto\n7. Cerveza artesanal\n8. Jugo natural\n9. Café expreso\n10. Té verde. ¿Te gustaría realizar el pedido o volver al menú principal?"
                }
            ];
            
            await collection.insertMany(respuestasIniciales);
            console.log("Respuestas iniciales insertadas en la base de datos");
        } else {
            console.log("La base de datos ya contiene respuestas.");
        }
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
    }
}


// Inicializar conexión a la base de datos solo una vez al iniciar el servidor
initializeDB();

// Eventos de WhatsApp
client.on('qr', (qr) => {
    lastQRCode = qr; // Guardar el último código QR recibido
    console.log('Código QR generado:', qr);
});

client.on('ready', () => {
    console.log('Bot de WhatsApp listo!');
});

client.on('message', async (message) => {
    const msg = message.body.toLowerCase();
    
    const respuesta = await collection.findOne({ keyword: msg });

    if (respuesta) {
        message.reply(respuesta.response);
    } else {
        message.reply('Lo siento, no entendí tu mensaje. Puedes preguntarme sobre el menú, horarios, promociones, ingredientes o contacto.');
    }
});

// Rutas del API

// Ruta para obtener las respuestas
app.get('/api/get-responses', async (req, res) => {
    try {
        const responses = await collection.find({}).toArray();
        res.status(200).json(responses);
    } catch (error) {
        console.error('Error obteniendo las respuestas:', error);
        res.status(500).send({ message: 'Error obteniendo las respuestas' });
    }
});

// Ruta para actualizar una respuesta
app.post('/api/update-response', async (req, res) => {
    const { id, newResponse } = req.body;
    try {
        // Asegúrate de que el id sea correcto al convertirlo en ObjectId
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: { response: newResponse } });
        res.status(200).send({ message: 'Respuesta actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar la respuesta:', error);
        res.status(500).send({ message: 'Error al actualizar la respuesta' });
    }
});

// Ruta para obtener el código QR
app.get('/api/get-qr', (req, res) => {
    if (lastQRCode) {
        qrcode.toDataURL(lastQRCode, (err, url) => {
            if (err) {
                console.error('Error generando el código QR:', err);
                res.status(500).send({ message: 'Error generando el código QR' });
                return;
            }
            res.status(200).json({ qrCode: url });
        });
    } else {
        res.status(404).send({ message: 'No hay QR disponible en este momento' });
    }
});

// Iniciar el servidor Express en el puerto 3000
app.listen(3000, () => {
    console.log('Servidor iniciado en el puerto 3000');
});

// Inicializar el cliente de WhatsApp
client.initialize();
