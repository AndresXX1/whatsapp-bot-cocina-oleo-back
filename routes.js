const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

// URL de conexión de MongoDB
const uri = 'mongodb+srv://av5328881:Y3t3ngQjGTlZwD4Z@oleo.gjxj6.mongodb.net/?retryWrites=true&w=majority&appName=Oleo';
const clientDB = new MongoClient(uri);

// Función para conectar a MongoDB
async function connectDB() {
    try {
        await clientDB.connect();
        console.log("Conectado a MongoDB");
        const db = clientDB.db('restaurante');
        const collection = db.collection('respuestas');

        return collection;
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
    }
}

// Ruta para obtener las respuestas
router.get('/api/get-responses', async (req, res) => {
    try {
        const collection = await connectDB();
        const responses = await collection.find({}).toArray();
        res.status(200).json(responses);
    } catch (error) {
        console.error('Error obteniendo las respuestas:', error);
        res.status(500).send({ message: 'Error obteniendo las respuestas' });
    }
});

// Ruta para actualizar una respuesta
router.post('/api/update-response', async (req, res) => {
    const { id, newResponse } = req.body;
    try {
        const collection = await connectDB();
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
        console.log('QR Code:', lastQRCode); // Agrega esto para ver el contenido
        res.status(200).json({ qrCode: lastQRCode });
    } else {
        res.status(404).send({ message: 'No hay QR disponible en este momento' });
    }
});