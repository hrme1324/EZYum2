# Vercel Full-Stack Deployment Guide

## 🚀 Overview

This project is configured for full-stack deployment on Vercel with:
- **Frontend**: React + Vite static build
- **Backend**: Vercel serverless functions (converted from Express.js)
- **Database**: Supabase (external)

## 📁 Project Structure

```
/
├── src/                    # Frontend React app
├── api/                    # Vercel serverless functions
│   ├── health.js          # Health check endpoint
│   ├── ai/                # AI-powered endpoints
│   │   ├── recipe-suggestions.js
│   │   └── food-categorization.js
│   └── recipes/           # Recipe endpoints
│       ├── search.js
│       └── random.js
├── server/                 # Express.js server (local development only)
├── vercel.json            # Vercel configuration
└── package.json           # Frontend dependencies
```

## 🔧 API Endpoints

### Health Check
- **GET** `/api/health` - Server health check

### AI Services
- **POST** `/api/ai/recipe-suggestions` - OpenAI recipe suggestions
- **POST** `/api/ai/food-categorization` - Hugging Face food classification

### Recipe Services
- **GET** `/api/recipes/search?query=...` - MealDB recipe search
- **GET** `/api/recipes/random` - MealDB random recipe

## 🌍 Environment Variables

### Required for Production
```bash
# OpenAI API (for recipe suggestions)
OPENAI_API_KEY=your_openai_api_key

# Hugging Face API (for food categorization)
HUGGINGFACE_API_KEY=your_huggingface_api_key

# MealDB API (optional, uses public API by default)
MEALDB_API_KEY=your_mealdb_api_key
```

### Frontend Environment
```bash
# For custom backend URL (optional)
VITE_BACKEND_URL=https://your-custom-backend.com/api
```

## 🚀 Deployment Steps

### 1. Set Environment Variables
In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the required API keys

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect to GitHub for automatic deployments
vercel --prod
```

### 3. Verify Deployment
- Frontend: `https://your-app.vercel.app`
- API Health: `https://your-app.vercel.app/api/health`

## 🔄 Development vs Production

### Local Development
- **Frontend**: `http://localhost:3000` (Vite dev server)
- **Backend**: `http://localhost:3001` (Express.js server)
- **API Calls**: Use `http://localhost:3001/api/*`

### Production (Vercel)
- **Frontend**: Static build served by Vercel
- **Backend**: Serverless functions at `/api/*`
- **API Calls**: Use relative paths `/api/*`

## 🛠️ Troubleshooting

### Common Issues

1. **API Routes Not Working**
   - Check that `vercel.json` has the correct API route configuration
   - Verify environment variables are set in Vercel dashboard

2. **CORS Errors**
   - API functions include CORS headers
   - Frontend uses relative paths in production

3. **Environment Variables**
   - Ensure all required API keys are set in Vercel
   - Check function logs for missing environment variables

### Debugging
```bash
# Check Vercel function logs
vercel logs

# Test API endpoints locally
curl https://your-app.vercel.app/api/health
```

## 📊 Monitoring

### Health Checks
- Monitor `/api/health` endpoint
- Set up uptime monitoring for critical endpoints

### Logs
- Vercel function logs available in dashboard
- Real-time logs with `vercel logs --follow`

## 🔒 Security

### API Key Protection
- All sensitive keys stored as environment variables
- Keys only accessible in serverless function context
- No client-side exposure of API keys

### CORS Configuration
- Proper CORS headers in all API functions
- Origin validation for production domains

## 📈 Performance

### Optimization
- Serverless functions auto-scale
- Static assets served from CDN
- API responses cached where appropriate

### Limits
- Vercel function timeout: 10 seconds
- Payload size: 4.5MB
- Concurrent executions: Based on plan

## 🔄 Migration from Express.js

### What Changed
- Express.js server → Vercel serverless functions
- Middleware → Individual function CORS handling
- Route handlers → Export default functions

### Benefits
- No server management
- Auto-scaling
- Global CDN
- Integrated with frontend deployment

## 📚 Additional Resources

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Deployment](https://vercel.com/docs/deployments)
