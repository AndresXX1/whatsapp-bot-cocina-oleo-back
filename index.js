// index.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const apiroutes = require('./routes/apiroutes');
const bot = require('./bot'); // Asegúrate de que bot.js se ejecuta al ser importado
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // Cambia esto por la URL de tu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Conectar a la base de datos
connectDB().then(() => {
    console.log('Conectado a MongoDB');

    // Rutas del API
    app.use('/api', apiroutes);

    // Iniciar servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor iniciado en el puerto ${PORT}`);
    });

    // Iniciar el bot de WhatsApp
    // El bot ya se inicializa en bot.js, así que no es necesario llamarlo aquí
}).catch(err => {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
});
