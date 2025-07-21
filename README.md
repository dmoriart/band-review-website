# 🎸 Yelp for Bands

A full-stack web application for reviewing and rating bands, built with React (TypeScript) frontend and Flask (Python) backend.

## 🏗️ Project Structure

```
band-review-website/
├── backend/                 # Flask API server
│   ├── venv/               # Python virtual environment (ignored by git)
│   ├── app.py              # Main Flask application
│   └── requirements.txt    # Python dependencies
├── frontend/               # React TypeScript application
│   ├── src/                # React source code
│   ├── public/             # Static assets
│   ├── package.json        # Node.js dependencies
│   └── node_modules/       # Node.js packages (ignored by git)
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.7+** - Download from [python.org](https://www.python.org/)
- **Node.js 14+** - Download from [nodejs.org](https://nodejs.org/)
- **Git** - Download from [git-scm.com](https://git-scm.com/)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd band-review-website
```

### 2. Backend Setup (Flask)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

The backend will be running at: **http://localhost:5000**

#### Available API Endpoints:
- `GET /api/hello` - Test connectivity
- `GET /api/bands` - Get all bands
- `GET /api/bands/<id>` - Get specific band
- `GET /api/health` - Health check

### 3. Frontend Setup (React)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

The frontend will be running at: **http://localhost:3000**

## 🛠️ Development

### Running Both Servers

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   source venv/bin/activate
   python app.py
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm start
   ```

### Making Changes

- **Backend changes:** Edit files in `backend/` - Flask auto-reloads in debug mode
- **Frontend changes:** Edit files in `frontend/src/` - React hot-reloads automatically

## 📦 Deployment

### Frontend (Netlify)

1. Build the React app:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the `build/` folder to Netlify

### Backend (Render.com)

1. Create a `render.yaml` or use the Render dashboard
2. Set environment variables if needed
3. Deploy from Git repository

## 🔧 Environment Variables

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:5000/api  # Development
REACT_APP_API_URL=https://your-api.render.com/api  # Production
```

### Backend (.env)
```
FLASK_ENV=development  # or production
FLASK_DEBUG=True       # False in production
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
source venv/bin/activate
python -m pytest  # If you add pytest later
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📋 Features

### Current Features
- ✅ React TypeScript frontend
- ✅ Flask Python backend with CORS
- ✅ API connectivity demonstration
- ✅ Band listing with ratings
- ✅ Responsive design
- ✅ Error handling

### Planned Features
- 🔄 User authentication
- 🔄 Band search and filtering
- 🔄 User reviews and ratings
- 🔄 Image uploads
- 🔄 Database integration (PostgreSQL)
- 🔄 User profiles

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Make sure virtual environment is activated
- Check if port 5000 is already in use
- Verify Python dependencies are installed

**Frontend can't connect to backend:**
- Ensure backend is running on port 5000
- Check CORS configuration
- Verify API URLs in frontend code

**CORS errors:**
- Make sure `flask-cors` is installed
- Check CORS configuration in `app.py`
- Verify frontend is making requests to correct URL

### Useful Commands

```bash
# Check what's running on port 5000
lsof -i :5000

# Kill process on port 5000
kill -9 $(lsof -ti:5000)

# View backend logs
cd backend && python app.py

# View frontend in browser
open http://localhost:3000
```

---

**Happy coding! 🎵**
