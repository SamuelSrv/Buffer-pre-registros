const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa o cliente FORA do handler
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// Define o modelo globalmente
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return { statusCode: 400, body: JSON.stringify({ error: 'O prompt é obrigatório.' }) };
        }
        
        // Usa o modelo já inicializado
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ text: text }),
        };

    } catch (error) {
        console.error('Erro na função Netlify:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Ocorreu um erro ao processar sua solicitação.' }),
        };
    }
};