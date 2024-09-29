// mongoDb.js
const path = require('path');

module.exports = {
    uri: 'mongodb+srv://av5328881:6HCygxqVzrmD10AD@semilla.40ntl.mongodb.net/?retryWrites=true&w=majority&appName=Semilla',
    port: process.env.PORT || 3000,
    mongodbUri: process.env.MONGODB_URI || 'mongodb+srv://av5328881:6HCygxqVzrmD10AD@semilla.40ntl.mongodb.net/restaurante?retryWrites=true&w=majority&appName=Semilla',
    dialogflowProjectId: process.env.DIALOGFLOW_PROJECT_ID || 'oleo-sabores',
    GOOGLE_APPLICATION_CREDENTIALS: path.resolve(__dirname, './config/oleo-sabores.json'),
};
