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
const uri = 'mongodb+srv://av5328881:5kM3S2WX4yNB9U68@oleo1.swzcq.mongodb.net/?retryWrites=true&w=majority&appName=Oleo1';
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
                { keyword: 'hola', response: '¡Hola! Bienvenido al restaurante. ¿Qué te gustaría saber sobre nuestro menú, horarios o promociones?' },
                { keyword: 'menú', response: 'Nuestro menú incluye:\n- Hamburguesa: $10\n- Pizza: $8\n- Ensalada: $7\n- Pasta: $12' },
                { keyword: 'horarios', response: 'Nuestro horario de atención es de Lunes a Viernes de 9:00 AM a 10:00 PM y Sábados de 10:00 AM a 11:00 PM.' },
                { keyword: 'promociones', response: 'Promoción de la semana: 2x1 en pizzas los martes y 10% de descuento en el total de la cuenta con la palabra clave "DESC10".' },
                { keyword: 'ingredientes hamburguesa', response: 'La hamburguesa contiene carne de res, pan, lechuga, tomate, cebolla y queso.' },
                { keyword: 'ingredientes pizza', response: 'La pizza contiene masa, salsa de tomate, queso, y puedes elegir entre pepperoni, champiñones, pimientos y cebolla.' },
                { keyword: 'ingredientes ensalada', response: 'La ensalada contiene lechuga, tomate, pepino, zanahoria y aderezo de tu elección.' },
                { keyword: 'contacto', response: 'Puedes contactarnos al número +1234567890 o al correo contacto@restaurante.com.' }
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
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('Error generando el código QR:', err);
            return;
        }
        const validUrl = url.replace(/^data:image\/png;base64,/, '');
        lastQRCode = `data:image/png;base64,${validUrl}`;
    });
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
        res.status(200).json({ qrCode: lastQRCode });
    } else {
        res.status(404).send({ message: 'No hay QR disponible en este momento' });
    }
});

// Iniciar el servidor Express en el puerto 3000
app.listen(3000, () => {
    console.log('Servidor iniciado en el puerto 3000');
});
