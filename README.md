# � BandVenueReview.ie

[![GitHub repo](https://img.shields.io/badge/GitHub-dmoriart%2Fband--review--website-blue?logo=github)](https://github.com/dmoriart/band-review-website)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3+-000000?logo=flask)](https://flask.palletsprojects.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql)](https://www.postgresql.org/)

**Ireland's premier platform for bands to review live music venues**

A comprehensive web application where Irish bands and artists can share their experiences performing at venues across the country. From grassroots pubs to major arenas, get the inside story from the musicians who've played there.

## 🏗️ Project Structure

```
band-review-website/                    # BandVenueReview.ie Monorepo
├── backend/                           # Flask API server
│   ├── models.py                      # SQLAlchemy database models
│   ├── app.py                         # Main Flask application
│   ├── config.py                      # Configuration management
│   ├── auth.py                        # Authentication utilities
│   ├── init_db.py                     # Database initialization script
│   ├── requirements.txt               # Python dependencies
│   ├── .env                          # Environment variables
│   └── venv/                         # Python virtual environment
├── frontend/                          # React TypeScript application
│   ├── src/                          # React source code
│   │   ├── App.tsx                   # Main application component
│   │   └── App.css                   # Application styles
│   ├── public/                       # Static assets
│   └── package.json                  # Node.js dependencies
├── database_schema.sql                # Supabase PostgreSQL schema
├── render.yaml                        # Render.com deployment config
├── .gitignore                         # Git ignore rules
└── README.md                          # This file
```

## ✨ Features

### 🎸 For Bands & Artists
- **Create detailed reviews** of venues after performances
- **Rate multiple aspects**: sound quality, hospitality, payment, crowd engagement, facilities
- **Share experiences** with fellow musicians
- **Find great venues** for future gigs
- **Build your profile** and showcase your performances

### 🏛️ For Venue Owners
- **Claim your venue** and manage your profile
- **Showcase your facilities** and capacity
- **Connect with touring acts** looking for venues
- **Build reputation** through band reviews
- **Highlight your strengths** in the Irish music scene

### 🇮🇪 Irish Focus
- **Comprehensive coverage** of venues across all 32 counties
- **Local insights** from the Irish music community
- **Support for traditional** and contemporary music venues
- **Focus on the unique** Irish live music landscape

## 🚀 Quick Start

### Prerequisites

- **Python 3.7+** - Download from [python.org](https://www.python.org/)
- **Node.js 14+** - Download from [nodejs.org](https://nodejs.org/)
- **Git** - Download from [git-scm.com](https://git-scm.com/)

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/dmoriart/band-review-website.git
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

### Backend (Render.com)

This project is configured for easy deployment to Render.com with Gunicorn as the WSGI server.

#### Option 1: Using render.yaml (Recommended)
1. Connect your GitHub repository to Render.com
2. The `render.yaml` file will automatically configure the deployment
3. Environment variables are pre-configured for production

#### Option 2: Manual Setup
1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Configure the service:
   - **Environment:** Python 3
   - **Build Command:** `cd backend && pip install -r requirements.txt`
   - **Start Command:** `cd backend && gunicorn -c gunicorn.conf.py app:app`
   - **Environment Variables:**
     - `FLASK_ENV=production`
     - `FLASK_DEBUG=false`

#### Environment Variables for Production
```bash
FLASK_ENV=production
FLASK_DEBUG=false
# Add any other environment variables as needed
```

### Frontend (Netlify)

1. Build the React app:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy options:
   - **Drag & Drop:** Upload the `build/` folder to Netlify
   - **Git Integration:** Connect your repository and set build settings:
     - **Build Command:** `cd frontend && npm run build`
     - **Publish Directory:** `frontend/build`

3. Configure environment variables in Netlify:
   ```bash
   REACT_APP_API_URL=https://your-api-service.onrender.com/api
   ```

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
