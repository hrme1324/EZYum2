# Ezyum Food App

A modern, AI-powered food planning and pantry management app built with React, TypeScript, and Supabase.

## 🚀 Quick Start

### Frontend Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Add your Supabase credentials to .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start development server
npm run dev
```

### Backend Setup (Optional - for AI features)
```bash
# Navigate to backend directory
cd server

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Add your API keys to .env
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_API_KEY=your_huggingface_token
MEALDB_API_KEY=your_mealdb_key

# Start backend server
npm run dev
```

## 🔧 Features

### ✅ Core Features
- **User Authentication** - Google OAuth with Supabase
- **Pantry Management** - Add, edit, delete ingredients
- **Barcode Scanning** - Scan products with camera
- **Meal Planning** - Plan meals for the week
- **Settings Management** - User preferences and allergens
- **Responsive Design** - Works on mobile and desktop

### 🤖 AI Features (with backend)
- **Recipe Suggestions** - AI-powered recipe recommendations
- **Food Categorization** - Automatic ingredient classification
- **Smart Search** - Enhanced recipe search

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Zustand** - State management

### Backend
- **Express.js** - API server
- **Node.js** - Runtime
- **OpenAI API** - AI recipe suggestions
- **Hugging Face** - Food categorization
- **MealDB API** - Recipe database

### Database
- **Supabase** - PostgreSQL database
- **Row Level Security** - Data protection
- **Real-time** - Live updates

## 🔒 Security

- **Environment Variables** - Sensitive keys stored securely
- **CORS Protection** - Backend API security
- **Rate Limiting** - Prevent API abuse
- **RLS Policies** - Database security
- **HTTPS Only** - Secure connections

## 📱 Mobile Features

- **Camera Integration** - Barcode scanning
- **Touch Optimized** - Mobile-friendly UI
- **Offline Support** - Basic functionality without internet
- **Push Notifications** - Meal reminders (coming soon)

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render)
```bash
cd server
npm start
# Deploy with environment variables
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start frontend dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Scripts
```bash
cd server
npm run dev          # Start backend with nodemon
npm start           # Start backend in production
```

## 📁 Project Structure

```
├── src/
│   ├── api/           # API services
│   ├── components/    # Reusable components
│   ├── screens/       # Page components
│   ├── state/         # State management
│   └── types/         # TypeScript types
├── server/            # Backend API
│   ├── server.js      # Express server
│   └── package.json   # Backend dependencies
└── public/            # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the troubleshooting guide
- Review the documentation
- Open an issue on GitHub
