const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Check for required API keys
const requiredKeys = ['OPENAI_API_KEY', 'HUGGINGFACE_API_KEY'];
const missingKeys = requiredKeys.filter(
  (key) => !process.env[key] || process.env[key].includes('your_')
);
if (missingKeys.length > 0) {
  console.warn('⚠️  Missing or placeholder API keys:', missingKeys.join(', '));
  console.warn('   Add your actual API keys to server/.env for full functionality');
}

// Initialize OpenAI only if key is valid
let openai = null;
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_')) {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// OpenAI API endpoint
app.post('/api/ai/recipe-suggestions', async (req, res) => {
  try {
    const { ingredients, preferences, dietary } = req.body;

    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured or invalid' });
    }

    const prompt = `Given these ingredients: ${ingredients.join(', ')},
    preferences: ${preferences}, and dietary restrictions: ${dietary},
    suggest 3 creative recipes. Format as JSON with name, ingredients, instructions, and cook time.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful cooking assistant. Provide recipe suggestions in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const suggestions = completion.choices[0].message.content;
    res.json({ suggestions: JSON.parse(suggestions) });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate recipe suggestions' });
  }
});

// Hugging Face API endpoint
app.post('/api/ai/food-categorization', async (req, res) => {
  try {
    const { foodItems } = req.body;

    if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY.includes('your_')) {
      return res.status(500).json({ error: 'Hugging Face API key not configured or invalid' });
    }

    const axios = require('axios');

    // Use a food classification model
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/nateraw/food101',
      { inputs: foodItems },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ categories: response.data });
  } catch (error) {
    console.error('Hugging Face API error:', error);
    res.status(500).json({ error: 'Failed to categorize food items' });
  }
});

// MealDB API endpoint (proxy for better security)
app.get('/api/recipes/search', async (req, res) => {
  try {
    const { query } = req.query;

    const axios = require('axios');
    const apiKey = process.env.MEALDB_API_KEY || '';

    const url = apiKey
      ? `https://www.themealdb.com/api/json/v2/${apiKey}/search.php?s=${query}`
      : `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('MealDB API error:', error);
    res.status(500).json({ error: 'Failed to search recipes' });
  }
});

app.get('/api/recipes/random', async (req, res) => {
  try {
    const axios = require('axios');
    const apiKey = process.env.MEALDB_API_KEY || '';

    const url = apiKey
      ? `https://www.themealdb.com/api/json/v2/${apiKey}/random.php`
      : 'https://www.themealdb.com/api/json/v1/1/random.php';

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('MealDB API error:', error);
    res.status(500).json({ error: 'Failed to get random recipe' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
