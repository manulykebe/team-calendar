# Team Calendar

[![Netlify Status](https://api.netlify.com/api/v1/badges/resonant-cupcake-77b900/deploy-status)](https://app.netlify.com/sites/resonant-cupcake-77b900/deploys)
[![Render Status](https://img.shields.io/badge/dynamic/json?url=https://api.render.com/v1/services/prj-cu8go823esus73avqtcg&query=$.status&label=render&color=green)](https://dashboard.render.com/project/prj-cu8go823esus73avqtcg)

A comprehensive team calendar application for managing availability, scheduling, and team coordination with real-time collaboration features.

## 🌐 Live Application

**Frontend**: https://dainty-frangollo-38ce07.netlify.app/  
**Backend**: https://team-calendar.onrender.com

## ✨ Features

### Core Functionality
- **User Management**: Role-based access control with admin and user roles
- **Calendar Management**: 5-week rolling view with configurable start days
- **Availability Management**: Complex scheduling with alternate week patterns and exceptions
- **Event Management**: Multiple event types including holidays and desiderata requests
- **Multi-site Support**: Site-specific configurations and user management
- **Holiday Management**: Country-specific holiday calendars (Belgium & UK)

### Advanced Features
- **Real-time Collaboration**: WebSocket-powered live updates across all connected users
- **Period Management**: Admin-controlled editing periods for holiday and desiderata requests
- **Export & Subscription**: iCal calendar subscriptions and CSV exports
- **Drag & Drop**: Intuitive event creation and management
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Performance Optimized**: Efficient data loading and caching strategies

### User Experience
- **Colleague Management**: Customizable display settings, colors, and visibility controls
- **Availability Reports**: Detailed yearly availability reports with interactive editing
- **Calendar Subscriptions**: Subscribe to personal calendars in Outlook, Google Calendar, Apple Calendar
- **Export Functionality**: Export events to CSV with date range filtering
- **Settings Management**: Comprehensive user and admin settings panels

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Lucide React** for icons
- **React DnD** for drag-and-drop functionality
- **Socket.IO Client** for real-time updates
- **Date-fns** for date manipulation

### Backend
- **Express.js** with TypeScript
- **Socket.IO** for real-time communication
- **JWT** authentication
- **File-based storage** with S3 support for production
- **CORS** enabled for cross-origin requests
- **Comprehensive API** with RESTful endpoints

### Infrastructure
- **Frontend**: Deployed on Netlify with automatic builds
- **Backend**: Deployed on Render with health checks
- **Storage**: AWS S3 for production data persistence
- **Real-time**: WebSocket connections for live collaboration

## 🚀 Deployment

### Frontend (Netlify)
The frontend is automatically deployed to Netlify from the main branch:
- **URL**: https://dainty-frangollo-38ce07.netlify.app/
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**: Automatically configured for production API endpoints

### Backend (Render)
The backend is deployed on Render with the following configuration:
- **URL**: https://team-calendar.onrender.com
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/server/index.js`
- **Health Check**: `/api/health`

#### Required Environment Variables
```bash
# Authentication
JWT_SECRET=your-secure-random-string

# AWS S3 Configuration (Production)
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-s3-bucket-name

# Server Configuration
NODE_ENV=production
PORT=10000
```

## 🏃‍♂️ Local Development

### Prerequisites
- Node.js 18+ 
- npm 8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd team-calendar-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```bash
   # Development settings
   NODE_ENV=development
   JWT_SECRET=your-development-secret
   PORT=3000
   
   # Optional: Force S3 usage in development
   FORCE_S3=false
   
   # AWS Configuration (if using S3)
   AWS_REGION=eu-north-1
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_BUCKET_NAME=your-s3-bucket-name
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```
   This starts both the backend server (port 3000) and frontend development server (port 5173).

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api
   - Health Check: http://localhost:3000/api/health

### Build for Production

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

## 🔄 Version Management

The application uses automatic version bumping:
- Version is automatically incremented on each deployment
- Version number is displayed in the bottom-right corner of the application
- Build information is tracked in `src/version.json`

To manually bump version:
```bash
npm run version:bump
```

## 📡 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

### Core Endpoints
- `GET /api/events` - Get user events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### User Management
- `GET /api/users` - Get users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Availability Management
- `GET /api/availability/:userId` - Get user availability
- `POST /api/availability/:userId/:index` - Add availability schedule
- `PUT /api/availability/:userId/:index` - Update availability schedule
- `DELETE /api/availability/:userId/:index` - Delete availability schedule

### Additional Endpoints
- `GET /api/holidays/:year` - Get holidays for year
- `GET /api/sites/:site` - Get site configuration
- `GET /api/report/availability/:site/:userId/:year` - Get availability report
- `GET /api/export/:site` - Export events to CSV
- `GET /api/agenda/:site/:userId/subscribe` - Get calendar subscription URL

### WebSocket Events
- `event:changed` - Real-time event updates
- `availability:changed` - Availability updates
- `user:settings:changed` - User settings updates
- `user:connected/disconnected` - User presence updates

## 🔧 Configuration

### Site Configuration
Each site has its own configuration file defining:
- Work week days and day parts (AM/PM)
- Default weekly schedules
- Week start preferences
- Location for holiday calendars
- Event types and their constraints

### User Settings
Users can customize:
- Week start day preferences
- Week number display (left/right/none)
- Colleague visibility and display order
- Color coding for colleagues
- Custom abbreviations

### Admin Features
Administrators can:
- Manage users and their roles
- Define editing periods for holiday requests
- Configure site-wide settings
- Access comprehensive user management tools

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and user role separation
- **Site Isolation**: Data is isolated per site
- **Input Validation**: Comprehensive validation using Zod schemas
- **CORS Protection**: Configured for specific origins
- **Environment-based Configuration**: Sensitive data in environment variables

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
1. Check the application's built-in help documentation
2. Review the API documentation above
3. Contact the development team

---

**Last Updated**: January 2025  
**Version**: 1.0.1  
**Status**: Production Ready ✅