// index.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const apiroutes = require('./routes/apiroutes');
const bot = require('./bot');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
}));

// Conectar a la base de datos
connectDB().then(() => {
    // Rutas del API
    app.use('/api', apiroutes);

    // Iniciar servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor iniciado en el puerto ${PORT}`);
    });

    // Iniciar el bot de WhatsApp
    bot.initialize();

}).catch(err => {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
});
