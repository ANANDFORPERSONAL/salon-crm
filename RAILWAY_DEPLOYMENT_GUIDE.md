# Railway Deployment Guide

## 🚀 Deploy Backend to Railway

### Step 1: Create New Railway Service
1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `ease-my-salon` repository
5. **Important**: Set the root directory to `backend`

### Step 2: Configure Environment Variables
In Railway dashboard, go to your backend service → Variables tab and add:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-for-production

# MongoDB Atlas (recommended for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ease-my-salon?retryWrites=true&w=majority

# Frontend URL (update with your actual frontend URL)
FRONTEND_URL=https://your-frontend-app.railway.app

# CORS Origins
CORS_ORIGINS=https://your-frontend-app.railway.app
```

### Step 3: Add MongoDB Service (Recommended)
1. In Railway dashboard, click "New" → "Database" → "MongoDB"
2. This will automatically create a MongoDB instance
3. Copy the connection string from the MongoDB service
4. Update the `MONGODB_URI` environment variable with this connection string

### Step 4: Update Frontend API URL
1. Go to your frontend service in Railway
2. Add environment variable:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend-app.railway.app/api
   ```

### Step 5: Deploy
1. Railway will automatically deploy when you push to GitHub
2. Or manually trigger deployment from Railway dashboard

## 🔧 Alternative: Use MongoDB Atlas

If you prefer MongoDB Atlas (free tier available):

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Whitelist Railway's IP addresses (or use 0.0.0.0/0 for development)
6. Get the connection string
7. Update `MONGODB_URI` in Railway environment variables

## 📋 Environment Variables Summary

### Backend Service:
- `PORT` (auto-set by Railway)
- `NODE_ENV=production`
- `JWT_SECRET` (your secret key)
- `MONGODB_URI` (MongoDB connection string)
- `FRONTEND_URL` (your frontend URL)
- `CORS_ORIGINS` (your frontend URL)

### Frontend Service:
- `NEXT_PUBLIC_API_URL` (your backend URL + /api)

## 🎯 After Deployment

1. **Test the backend**: Visit `https://your-backend-app.railway.app/api/health`
2. **Test the frontend**: Visit your frontend URL
3. **Test login**: Use admin@saloncrm.com / admin123
4. **Test password reset**: Use the forgot password feature

## 🔍 Troubleshooting

- **Connection refused**: Check if backend is deployed and running
- **CORS errors**: Verify CORS_ORIGINS matches your frontend URL
- **Database errors**: Check MongoDB connection string
- **Auth errors**: Verify JWT_SECRET is set

## 📞 Support

If you encounter issues:
1. Check Railway logs in the dashboard
2. Verify all environment variables are set
3. Ensure MongoDB is accessible
4. Check that both services are running
