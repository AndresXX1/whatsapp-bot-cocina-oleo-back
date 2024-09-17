const { ObjectId } = require('mongodb');
const { connectDB } = require('./index'); // Asegúrate de que este path sea correcto

// Obtener todas las respuestas
async function getResponses(req, res) {
    try {
        const collection = await connectDB();
        const responses = await collection.find({}).toArray();
        res.status(200).json(responses);
    } catch (error) {
        console.error('Error obteniendo las respuestas:', error);
        res.status(500).send({ message: 'Error obteniendo las respuestas' });
    }
}

// Actualizar una respuesta
async function updateResponse(req, res) {
    const { id, newResponse } = req.body;
    try {
        const collection = await connectDB();
        await collection.updateOne({ _id: new ObjectId(id) }, { $set: { response: newResponse } });
        res.status(200).send({ message: 'Respuesta actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar la respuesta:', error);
        res.status(500).send({ message: 'Error al actualizar la respuesta' });
    }
}

// Obtener el código QR
async function getQRCode(req, res) {
    try {
        // Asumiendo que el código QR se guarda en un archivo temporal
        const qrCode = await getQRCodeFromFile();
        if (qrCode) {
            res.status(200).json({ qrCode });
        } else {
            res.status(404).send({ message: 'No hay QR disponible en este momento' });
        }
    } catch (error) {
        console.error('Error obteniendo el código QR:', error);
        res.status(500).send({ message: 'Error obteniendo el código QR' });
    }
}

// Función auxiliar para obtener el QR desde el archivo
async function getQRCodeFromFile() {
    // Implementa la lógica para leer el QR desde el archivo
    // Por ejemplo, puedes usar fs para leer el archivo del QR si lo estás guardando
    // Retorna el contenido del QR como un string
    return 'Aquí iría el contenido del QR'; // Placeholder
}

module.exports = {
    getResponses,
    updateResponse,
    getQRCode
};
