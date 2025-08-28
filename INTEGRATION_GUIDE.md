# 🚀 Salon CRM Backend Integration Guide

This guide will help you integrate the Salon CRM frontend with the backend API.

## 📋 Overview

The integration includes:
- ✅ **Axios HTTP Client** - Installed and configured
- ✅ **API Layer** - Complete API service classes
- ✅ **Authentication** - JWT-based auth with fallback
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Backend Server** - Express.js API with all endpoints
- ✅ **Environment Configuration** - Proper setup for development

## 🏗️ Architecture

```
Frontend (Next.js) ←→ API Layer ←→ Backend (Express.js)
     ↓                    ↓              ↓
  Components         lib/api.ts      server.js
  Context           Interceptors     Routes
  Forms             Error Handling   Middleware
```

## 🔧 Setup Instructions

### 1. Frontend Setup (Already Complete)

The frontend is already configured with:
- ✅ Axios installed
- ✅ API layer created (`lib/api.ts`)
- ✅ Authentication context updated
- ✅ Client store updated
- ✅ Environment configuration

### 2. Backend Setup

#### Step 1: Navigate to Backend Directory
```bash
cd backend
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Create Environment File
```bash
cp env.example .env
```

#### Step 4: Start Backend Server
```bash
npm run dev
```

The backend will be available at `http://localhost:3001`

### 3. Frontend Environment Setup

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Development Settings
NEXT_PUBLIC_ENVIRONMENT=development
```

## 🔐 Authentication Flow

### Login Process
1. User enters credentials
2. Frontend calls `AuthAPI.login()`
3. Backend validates credentials
4. Backend returns JWT token
5. Frontend stores token in localStorage
6. Frontend redirects to dashboard

### Token Management
- **Storage**: JWT tokens stored in localStorage
- **Headers**: Automatically added to all API requests
- **Expiration**: 24-hour token lifetime
- **Refresh**: Automatic logout on token expiration

### Fallback Authentication
If the backend is unavailable, the system falls back to:
- Mock authentication
- LocalStorage-based session management
- Demo user accounts

## 📊 API Integration Status

### ✅ Completed
- [x] Authentication (Login/Logout/Profile)
- [x] Client Management (CRUD operations)
- [x] Service Management (CRUD operations)
- [x] Product Management (CRUD operations)
- [x] Appointment Management (CRUD operations)
- [x] Receipt Management (CRUD operations)
- [x] Reports (Dashboard statistics)

### 🔄 In Progress
- [ ] Staff Management
- [ ] Settings Management
- [ ] Advanced Reports

### 📋 Planned
- [ ] Database integration
- [ ] File uploads
- [ ] Email notifications
- [ ] SMS integration
- [ ] Payment processing

## 🧪 Testing the Integration

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Salon CRM API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Login Test
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@salon.com", "password": "admin123"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "name": "John Doe",
      "email": "admin@salon.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Frontend Test
1. Start the frontend: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Login with demo credentials
4. Test client creation and management

## 🔧 Configuration Options

### API Base URL
Change the API URL in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Backend Port
Change the backend port in `backend/.env`:
```env
PORT=3001
```

### JWT Secret
Change the JWT secret in `backend/.env`:
```env
JWT_SECRET=your-super-secret-jwt-key
```

## 🛠️ Development Workflow

### 1. Start Both Servers
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

### 2. Development Features
- **Hot Reload**: Both frontend and backend support hot reload
- **Error Handling**: Comprehensive error handling with fallbacks
- **Logging**: Backend includes request logging
- **CORS**: Configured for local development

### 3. Debugging
- **Frontend**: Check browser console and network tab
- **Backend**: Check terminal logs
- **API**: Use browser dev tools or Postman

## 🔒 Security Considerations

### Production Checklist
- [ ] Change JWT secret
- [ ] Use HTTPS
- [ ] Configure CORS for production domain
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Set up proper logging
- [ ] Use environment variables for secrets

### Authentication Security
- JWT tokens with 24-hour expiration
- Automatic token refresh (planned)
- Secure password hashing with bcrypt
- Role-based access control

## 📈 Performance Optimization

### Frontend
- API response caching
- Optimistic updates
- Lazy loading of components
- Image optimization

### Backend
- Response compression
- Database indexing (when implemented)
- Caching strategies
- Connection pooling

## 🐛 Troubleshooting

### Common Issues

#### 1. CORS Errors
**Problem**: Frontend can't access backend
**Solution**: Ensure backend CORS is configured correctly

#### 2. Authentication Failures
**Problem**: Login not working
**Solution**: Check JWT secret and token expiration

#### 3. API Timeouts
**Problem**: Requests timing out
**Solution**: Check network connectivity and server status

#### 4. Environment Variables
**Problem**: API URL not found
**Solution**: Ensure `.env.local` is in the root directory

### Debug Commands

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check if frontend is running
curl http://localhost:3000

# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@salon.com", "password": "admin123"}'
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Client Endpoints
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Service Endpoints
- `GET /api/services` - Get all services
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Product Endpoints
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Appointment Endpoints
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Receipt Endpoints
- `GET /api/receipts` - Get all receipts
- `POST /api/receipts` - Create receipt
- `GET /api/receipts/client/:clientId` - Get receipts by client

## 🚀 Next Steps

### Immediate
1. Test all CRUD operations
2. Verify authentication flow
3. Test error handling
4. Check fallback functionality

### Short Term
1. Add database integration
2. Implement file uploads
3. Add email notifications
4. Enhance error handling

### Long Term
1. Add real-time features
2. Implement advanced reporting
3. Add payment processing
4. Mobile app development

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check browser console and network tab
4. Verify environment configuration

## 🎉 Success!

You now have a fully integrated Salon CRM system with:
- ✅ Frontend with API integration
- ✅ Backend with all endpoints
- ✅ Authentication system
- ✅ Error handling and fallbacks
- ✅ Development environment
- ✅ Documentation and guides

The system is ready for development and testing! 