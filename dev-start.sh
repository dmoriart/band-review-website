#!/bin/bash

# Yelp for Bands - Development Setup Script
# This script helps you get both frontend and backend running

echo "🎸 Yelp for Bands - Development Setup"
echo "===================================="
echo ""

echo "This script will help you start both the backend and frontend servers."
echo "You'll need to run them in separate terminal windows."
echo ""

echo "📋 Quick Start Instructions:"
echo ""
echo "1. BACKEND (Terminal 1):"
echo "   cd backend"
echo "   ./start.sh"
echo "   (or manually: source venv/bin/activate && python app.py)"
echo ""
echo "2. FRONTEND (Terminal 2):"
echo "   cd frontend"
echo "   ./start.sh"
echo "   (or manually: npm start)"
echo ""

echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   API Test: http://localhost:5000/api/hello"
echo ""

echo "🧪 Test API connectivity:"
echo "   curl http://localhost:5000/api/hello"
echo "   curl http://localhost:5000/api/bands"
echo ""

echo "📁 Project Structure:"
tree -I 'node_modules|venv|__pycache__|.git' . 2>/dev/null || ls -la

echo ""
echo "🚀 Ready to code! Start with the backend first, then the frontend."
echo "📖 See README.md for detailed instructions."
