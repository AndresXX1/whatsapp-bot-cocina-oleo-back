// index.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const apiRoutes = require('./routes/apiRoutes');
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
connectDB();

// Rutas del API
app.use('/api', apiRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});

// Iniciar el bot de WhatsApp
bot;
