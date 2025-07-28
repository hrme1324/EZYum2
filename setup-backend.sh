#!/bin/bash

echo "🚀 Setting up Ezyum Food App Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Navigate to server directory
cd server

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✅ .env file created!"
    echo "⚠️  Please edit server/.env and add your API keys:"
    echo "   - OPENAI_API_KEY"
    echo "   - HUGGINGFACE_API_KEY"
    echo "   - MEALDB_API_KEY (optional)"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit server/.env with your API keys"
echo "2. Run: cd server && npm run dev"
echo "3. Backend will be available at http://localhost:3001"
echo ""
echo "🔗 Test the backend:"
echo "   curl http://localhost:3001/api/health"
echo ""
