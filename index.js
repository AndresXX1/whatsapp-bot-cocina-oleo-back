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
            const respuestasIniciales = [  ]; // Tus respuestas semillas
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
