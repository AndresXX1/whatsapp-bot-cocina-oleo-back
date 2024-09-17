const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { connectDB } = require('./index.js'); // Archivo donde está la función de conexión

const client = new Client();

let respuestasCollection;

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('Bot de WhatsApp listo!');
    respuestasCollection = await connectDB(); // Conectar a la base de datos y obtener la colección
});

client.on('message', async (message) => {
    const msg = message.body.toLowerCase();

    // Buscar la respuesta en la base de datos
    const respuesta = await respuestasCollection.findOne({ pregunta: msg });
    
    if (respuesta) {
        message.reply(respuesta.respuesta);
    } else {
        message.reply('Lo siento, no entendí tu mensaje. Puedes preguntarme sobre el menú, horarios, promociones, ingredientes o contacto.');
    }
});

client.initialize();