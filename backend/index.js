import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { sendMessage } from './gemini.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Routy Backend!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gemini AI endpoint
app.post('/api/gemini', async (req, res) => {
  try {
    const { promptType } = req.body;
    
    if (!promptType) {
      return res.status(400).json({ error: 'promptType is required' });
    }
    
    const response = await sendMessage(promptType);
    res.json({ response });
  } catch (error) {
    console.error('Error in /api/gemini:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Gemini API: http://localhost:${PORT}/api/gemini`);
}); 