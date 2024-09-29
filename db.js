const mongoose = require('mongoose');
require('dotenv').config();
const config = require('./config/mogoDb');

const connectDB = async () => {
  try {
    console.log('Valor de MONGODB_URI:', config.uri);
    await mongoose.connect(config.uri, {});
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    console.error('Variables de entorno:', process.env);
    process.exit(1);
  }
};

module.exports = connectDB;
