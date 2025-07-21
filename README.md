# 🎵 BandVenueRevie## 🚀 **Quick Start**

### **Try the Live Application**
1. **Visit**: [bandvenuereview.netlify.app](https://bandvenuereview.netlify.app)
2. **Browse Venues**: Explore Irish music venues across Dublin, Cork, and Galway
3. **Admin Access**: Click "🛠️ Admin" and login with:
   - Email: `admin@bandvenuereview.ie`
   - Password: `admin123`
4. **Test Features**: Try venue management, user verification, and review moderation

### **Local Development Setup**
```bash
# Clone the repository
git clone https://github.com/dmoriart/band-review-website.git
cd band-review-website

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app_simple.py      # Starts on http://localhost:5000

# Frontend setup (new terminal)
cd frontend
npm install
npm start                  # Starts on http://localhost:3000
```

## 📊 **Technical Stack**

### **Frontend Technologies**
- **React 18+** with TypeScript for type safety
- **Custom CSS** with responsive design and dark theme
- **Fetch API** for backend communication
- **React Hooks** for state management
- **Component Architecture** with modular design

### **Backend Technologies**
- **Flask 3.1.1** with Python 3.11+
- **SQLAlchemy ORM** for database operations
- **SQLite** for data persistence
- **CORS** for cross-origin requests
- **Custom Authentication** with admin decorators

### **Deployment Infrastructure**
- **Netlify**: Frontend hosting with auto-deployment
- **Render.com**: Backend hosting with zero-downtime deployment
- **GitHub**: Version control with automatic CI/CD
- **Custom Domain**: Professional domain setup ready

## 🔧 **API Endpoints**

### **Public API**
```
GET  /api/health           # API health check
GET  /api/venues           # List all venues (paginated)
GET  /api/venues/<id>      # Get specific venue details
GET  /api/genres           # List music genres
GET  /api/debug            # System debug information
```

### **Admin API** (Authentication Required)
```
POST /api/auth/login       # Admin authentication
GET  /api/admin/stats      # Dashboard statistics
GET  /api/admin/venues     # Venue management interface
PUT  /api/admin/venues/<id> # Update venue information
DELETE /api/admin/venues/<id> # Delete venue
GET  /api/admin/users      # User management interface
PUT  /api/admin/users/<id> # Update user information
GET  /api/admin/reviews    # Review moderation interface
DELETE /api/admin/reviews/<id> # Delete review
```

## 📱 **User Interface Features**

### **Responsive Design**
- **Mobile-First**: Optimized for smartphones and tablets
- **Desktop Enhanced**: Rich experience on larger screens
- **Touch-Friendly**: Large buttons and touch targets
- **Fast Loading**: Optimized assets and lazy loading

### **Visual Design**
- **Dark Theme**: Professional dark color scheme
- **Glassmorphism**: Modern glass-like UI effects
- **Irish Branding**: 🇮🇪 themed with cultural elements
- **Accessibility**: High contrast and readable fonts

### **Navigation**
- **Intuitive Menu**: Clear navigation between sections
- **Admin Toggle**: Easy access to admin panel
- **Breadcrumbs**: Clear location awareness
- **Mobile Menu**: Responsive navigation for small screense Site](https://img.shields.io/badge/Live%20Site-bandvenuereview.netlify.app-success?logo=netlify)](https://bandvenuereview.netlify.app)
[![API Status](https://img.shields.io/badge/API-band--review--website.onrender.com-success?logo=flask)](https://band-review-website.onrender.com/api/health)
[![GitHub repo](https://img.shields.io/badge/GitHub-dmoriart%2Fband--review--website-blue?logo=github)](https://github.com/dmoriart/band-review-website)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3+-000000?logo=flask)](https://flask.palletsprojects.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)

**Ireland's premier platform for bands to review live music venues** 🇮🇪

A comprehensive full-stack web application where Irish bands and artists can discover and share experiences about live music venues across the country. From grassroots pubs to major arenas, get the inside story from the musicians who've played there.

## 🚀 **Live Demo**
- **Website**: [bandvenuereview.netlify.app](https://bandvenuereview.netlify.app)
- **API**: [band-review-website.onrender.com](https://band-review-website.onrender.com/api/health)
- **Admin Panel**: Click "🛠️ Admin" → Login: `admin@bandvenuereview.ie` / `admin123`

## ✨ **Key Features**

### 🎸 **For Musicians**
- **Discover Irish Venues**: Browse 5 real venues across Dublin, Cork, and Galway
- **Venue Details**: Capacity, genre preferences, facilities, and contact information
- **Rating System**: View average ratings from fellow musicians
- **Search & Filter**: Find venues by location, genre, and capacity

### 🏛️ **For Venue Owners**
- **Venue Profiles**: Detailed venue information and facilities
- **Verification System**: Get verified status for credibility
- **Genre Matching**: Connect with bands that match your venue style

### 🛠️ **Admin Panel** (NEW!)
- **Dashboard**: Real-time statistics and activity monitoring
- **Venue Management**: Verify, edit, and moderate venue listings
- **User Management**: Verify user accounts and manage permissions
- **Review Moderation**: Remove inappropriate or fake reviews
- **Responsive Design**: Works perfectly on mobile and desktop

## 🏗️ **Architecture**

```
Frontend (React + TypeScript)     Backend (Flask + SQLAlchemy)     Database (SQLite)
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────┐
│  Netlify Hosting        │ ────►│  Render.com Hosting     │ ────►│  Production DB  │
│                         │      │                         │      │                 │
│ • React Components      │      │ • REST API Routes       │      │ • Venues        │
│ • Admin Panel           │      │ • Admin Endpoints       │      │ • Users         │
│ • Authentication        │      │ • Authentication        │      │ • Reviews       │
│ • Responsive Design     │      │ • CORS Configuration    │      │ • Genres        │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────┘
```eReview.ie

[![GitHub repo](https://img.shields.io/badge/GitHub-dmoriart%2Fband--review--website-blue?logo=github)](https://github.com/dmoriart/band-review-website)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3+-000000?logo=flask)](https://flask.palletsprojects.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql)](https://www.postgresql.org/)

**Ireland's premier platform for bands to review live music venues**

A comprehensive web application where Irish bands and artists can share their experiences performing at venues across the country. From grassroots pubs to major arenas, get the inside story from the musicians who've played there.

## 🏗️ **Project Structure**

```
band-review-website/                    # Full-Stack Irish Music Platform
├── frontend/                           # React TypeScript App (Netlify)
│   ├── src/
│   │   ├── App.tsx                    # Main application + routing
│   │   ├── AdminPanel.tsx             # Complete admin interface
│   │   └── App.css                    # Responsive styling + admin theme
│   ├── public/
│   │   └── api-test.html              # API testing interface
│   └── package.json                   # React dependencies
├── backend/                            # Flask API Server (Render.com)
│   ├── app_simple.py                  # Production Flask app
│   ├── models.py                      # SQLAlchemy database models
│   ├── auth.py                        # Authentication & admin decorators
│   ├── config.py                      # Environment configuration
│   ├── requirements.txt               # Python dependencies
│   └── bandvenuereview.db            # SQLite production database
├── TECHNICAL_DOCS.md                  # Comprehensive technical documentation
├── DEPLOYMENT.md                      # Deployment guides
└── README.md                          # This file
```

## 🎯 **Current Capabilities**

### ✅ **Fully Implemented**
- **Live Production Deployment**: Both frontend and backend deployed and working
- **Irish Venue Database**: 5 real venues (Whelan's, Cyprus Avenue, Button Factory, Monroe's, Workman's Club)
- **Responsive Web Design**: Mobile-first approach with glassmorphism effects
- **Admin Panel**: Complete management interface with authentication
- **API Health Monitoring**: Real-time backend status tracking
- **Error Handling**: Comprehensive error management and user feedback
- **CORS Configuration**: Proper cross-origin resource sharing setup

### 🛠️ **Admin Panel Features**
- **Dashboard**: Real-time statistics (venues, users, reviews)
- **Venue Management**: CRUD operations, verification system
- **User Management**: Account verification and role management  
- **Review Moderation**: Delete inappropriate content
- **Search & Filter**: Advanced filtering across all data types
- **Responsive Design**: Works on all devices and screen sizes

### � **User Features**
- **Venue Discovery**: Browse Irish music venues with detailed information
- **Venue Details**: Capacity, genres, facilities, contact information
- **Rating Display**: Average ratings and review counts
- **Location Information**: City, county, and address details
- **Genre Filtering**: Filter venues by music style preferences
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

## 🏛️ **Featured Irish Venues**

The platform includes real venues from Ireland's vibrant music scene:

### **Dublin Venues**
- **Whelan's** (Wexford Street) - Legendary independent venue, capacity 300
- **Button Factory** (Temple Bar) - Electronic and alternative music hub, capacity 400  
- **The Workman's Club** (Wellington Quay) - Multi-level venue with roof terrace, capacity 180

### **Cork Venues**
- **Cyprus Avenue** (Caroline Street) - Premier Cork live music venue, capacity 250

### **Galway Venues**
- **Monroe's Tavern** (Dominick Street) - Historic pub with traditional sessions, capacity 150

Each venue includes:
- **Real Contact Information**: Phone numbers and websites
- **Detailed Facilities**: Sound systems, parking, accessibility
- **Genre Preferences**: Rock, indie, folk, traditional, electronic
- **Capacity Information**: Accurate venue sizes
- **Location Details**: Full addresses with Eircode where available

## � **Security & Authentication**

### **Admin Security**
- **Token-Based Authentication**: Secure session management
- **Route Protection**: Admin-only endpoints secured
- **Role-Based Access**: Different permission levels
- **Session Management**: Secure login/logout flow

### **Data Protection**
- **Input Validation**: All user inputs sanitized
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Output encoding and sanitization
- **CORS Security**: Controlled cross-origin requests

## 📈 **Performance & Scalability**

### **Optimization Features**
- **Efficient Database Queries**: Optimized SQLAlchemy queries
- **Pagination**: Large datasets handled efficiently
- **Caching Strategy**: Static asset caching
- **CDN Ready**: Optimized for content delivery networks

### **Monitoring & Analytics**
- **Health Checks**: Real-time API monitoring
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Response time monitoring
- **User Analytics**: Usage pattern tracking

## 🔮 **Future Roadmap**

### **Planned Features**
- **User Registration**: Band and venue owner accounts
- **Review System**: Detailed venue reviews by bands
- **Rating System**: Multi-aspect venue ratings
- **Image Uploads**: Venue photos and band images
- **Booking Integration**: Connect bands with venues
- **Email Notifications**: Updates and alerts
- **Mobile App**: Native iOS and Android applications

### **Technical Improvements**
- **PostgreSQL Migration**: Scale to larger datasets
- **Redis Caching**: Improved performance
- **JWT Authentication**: Enhanced security
- **API Rate Limiting**: Protection against abuse
- **Automated Testing**: Unit and integration tests
- **CI/CD Pipeline**: Automated deployment

## � **Documentation**

- **[Technical Documentation](TECHNICAL_DOCS.md)**: Comprehensive code documentation
- **[Deployment Guide](DEPLOYMENT.md)**: Step-by-step deployment instructions
- **[API Reference](TECHNICAL_DOCS.md#api-documentation)**: Complete API documentation
- **[Database Schema](TECHNICAL_DOCS.md#database-schema)**: Database structure and relationships

## 🤝 **Contributing**

We welcome contributions to improve BandVenueReview.ie!

### **How to Contribute**
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**
- **TypeScript**: Use strict typing for all new code
- **Documentation**: Update docs for new features
- **Testing**: Add tests for new functionality
- **Code Style**: Follow existing patterns and conventions

## 🆘 **Support & Troubleshooting**

### **Common Issues**

**Can't access admin panel:**
- Verify credentials: `admin@bandvenuereview.ie` / `admin123`
- Check network connection
- Ensure backend API is running

**API connection errors:**
- Check API status: [band-review-website.onrender.com/api/health](https://band-review-website.onrender.com/api/health)
- Verify CORS settings
- Check browser console for errors

**Local development issues:**
- Ensure Python virtual environment is activated
- Check if ports 3000 (frontend) and 5000 (backend) are available
- Verify all dependencies are installed

### **Getting Help**
- **Issues**: [GitHub Issues](https://github.com/dmoriart/band-review-website/issues)
- **Documentation**: [Technical Docs](TECHNICAL_DOCS.md)
- **Live Demo**: [bandvenuereview.netlify.app](https://bandvenuereview.netlify.app)

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Irish music community** 🎵🇮🇪

*Supporting venues, artists, and the live music scene across Ireland*
