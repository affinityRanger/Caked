require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Photo = require('./src/models/Photo');
const Music = require('./src/models/Music');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware for frontend requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ===== UPDATED: Serve frontend static files from root =====
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Environment variables validation
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
console.log('Environment Variables Loaded:');
console.log('MONGO_URI:', mongoUri ? '[CONNECTED]' : 'NOT SET');
console.log('DB_NAME:', dbName || 'NOT SET');

if (!mongoUri) {
  console.error('ERROR: MONGO_URI environment variable is not set');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: dbName
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Initialize models
const photoModel = new Photo();
const musicModel = new Music();

// Serve media files
app.use('/images', express.static(path.join(__dirname, 'uploads', 'images')));
app.use('/music', express.static(path.join(__dirname, 'uploads', 'music')));
app.use('/videos', express.static(path.join(__dirname, 'uploads', 'videos')));

// API Routes
app.use('/api/photos', require('./src/routes/photos'));
app.use('/api/music', require('./src/routes/music'));

// Legacy endpoint
app.get('/api/files', async (req, res) => {
  try {
    res.json({
      message: 'This endpoint has been replaced by /api/photos and /api/music',
      endpoints: {
        photos: '/api/photos',
        music: '/api/music'
      }
    });
  } catch (err) {
    console.error("Error in legacy /api/files:", err);
    res.status(500).json({ error: 'Legacy endpoint error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      dbConnected: !!mongoUri,
      dbName: dbName
    }
  });
});

// ===== UPDATED: Frontend routes - serve from root directory =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/hope', (req, res) => {
  res.sendFile(path.join(__dirname, 'hope.html'));
});

app.get('/doubt', (req, res) => {
  res.sendFile(path.join(__dirname, 'doubt.html'));
});

// Initialize database with sample data
async function initializeDatabase() {
  try {
    console.log('Initializing database with sample data...');
    await photoModel.initializeSampleData();
    await musicModel.initializeSampleData();
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Test database connection
async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    const testPhoto = new Photo();
    const testClient = await testPhoto.getConnection();
    await testClient.close();
    console.log("Database connection test successful");
    return true;
  } catch (err) {
    console.error("Database connection test failed:", err);
    return false;
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      error: 'API endpoint not found',
      message: `The endpoint ${req.originalUrl} does not exist`
    });
  } else {
    // ===== UPDATED: Serve index.html from root for all other routes (SPA behavior) =====
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Start server
async function startServer() {
  try {
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    await initializeDatabase();

    app.listen(port, () => {
      console.log(`🌹 Photo Gallery Server running at http://localhost:${port}`);
      console.log('📁 Media files being served from:');
      console.log('   - Images: /images/');
      console.log('   - Music: /music/');
      console.log('   - Videos: /videos/');
      console.log('📡 API endpoints:');
      console.log('   - GET /api/photos - Get all photos');
      console.log('   - GET /api/photos?category=roses - Get photos by category');
      console.log('   - GET /api/photos/:id - Get specific photo');
      console.log('   - GET /api/music - Get all music tracks');
      console.log('   - GET /api/health - Health check');
      console.log('🌐 Frontend routes:');
      console.log('   - GET / - Main page');
      console.log('   - GET /hope - Hope page');
      console.log('   - GET /doubt - Doubt page');
      console.log('✨ Photo Gallery is ready!');
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    console.error("Stack trace:", err.stack);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

startServer();