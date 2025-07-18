const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Available models to try (in order of preference)
const availableModels = [
    'gemini-1.5-flash',
    'gemini-1.5-pro', 
    'gemini-2.5-flash',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro'
];

// Chat endpoint
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        // Validate input
        if (!userMessage || userMessage.trim() === '') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not configured');
            return res.status(500).json({ error: 'API configuration error' });
        }

        let lastError = null;
        
        // Try each model until one works
        for (const modelName of availableModels) {
            try {
                console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                // Generate content
                const result = await model.generateContent(userMessage);
                const response = result.response;
                const text = response.text();

                // Send successful response
                console.log(`✅ Successfully used model: ${modelName}`);
                return res.json({ reply: text });
                
            } catch (modelError) {
                console.log(`❌ Model ${modelName} failed:`, modelError.message);
                lastError = modelError;
                continue; // Try next model
            }
        }
        
        // If we get here, all models failed
        throw lastError || new Error('All available models failed');
        
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        
        // Handle specific API errors
        if (error.message.includes('API key not valid')) {
            res.status(401).json({ error: 'Invalid API key. Please check your configuration.' });
        } else if (error.message.includes('quota exceeded')) {
            res.status(429).json({ error: 'API quota exceeded. Please try again later.' });
        } else if (error.message.includes('not found') || error.message.includes('not supported')) {
            res.status(503).json({ error: 'AI model temporarily unavailable. Please try again later.' });
        } else {
            res.status(500).json({ error: 'Error communicating with AI service' });
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 Gemini API Key configured: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
});