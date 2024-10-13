if (!process.env.DIALOGFLOW_PROJECT_ID) {
    require('dotenv').config();
}

module.exports = {
    projectId: process.env.DIALOGFLOW_PROJECT_ID,
};