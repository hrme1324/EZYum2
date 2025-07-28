# Ezyum Food App Backend

Secure backend API for handling AI services and external API calls.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual API keys
nano .env
```

### 3. Add Your API Keys
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here

# Hugging Face Configuration
HUGGINGFACE_API_KEY=hf-your-huggingface-token-here

# MealDB Configuration (optional)
MEALDB_API_KEY=your-mealdb-key-here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per minute per IP
- **CORS Protection**: Only allows requests from specified origins
- **Helmet Security**: Adds security headers
- **Environment Variables**: Sensitive keys never exposed to frontend
- **Error Handling**: Graceful error responses

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### AI Recipe Suggestions
```
POST /api/ai/recipe-suggestions
Body: { ingredients: [], preferences: "", dietary: "" }
```

### Food Categorization
```
POST /api/ai/food-categorization
Body: { foodItems: [] }
```

### Recipe Search
```
GET /api/recipes/search?query=pasta
```

### Random Recipe
```
GET /api/recipes/random
```

## 🔧 Development

### Testing the API
```bash
# Health check
curl http://localhost:3001/api/health

# Recipe suggestions
curl -X POST http://localhost:3001/api/ai/recipe-suggestions \
  -H "Content-Type: application/json" \
  -d '{"ingredients":["chicken","rice"],"preferences":"quick","dietary":"none"}'
```

### Environment Variables
- `OPENAI_API_KEY`: Required for recipe suggestions
- `HUGGINGFACE_API_KEY`: Required for food categorization
- `MEALDB_API_KEY`: Optional, for enhanced MealDB access
- `PORT`: Server port (default: 3001)
- `ALLOWED_ORIGINS`: CORS origins (comma-separated)

## 🚨 Important Notes

1. **Never commit `.env` to Git** - it's in `.gitignore`
2. **Keep API keys secure** - rotate them regularly
3. **Monitor usage** - API calls can incur costs
4. **Backend must be running** - frontend needs this server

## 🔗 Frontend Integration

The frontend will automatically connect to this backend when available. If the backend is down, AI features will gracefully degrade.
