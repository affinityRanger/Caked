// Load environment variables (Railway provides them directly, .env is fallback for local development)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Basic health check first - this should work immediately
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: port
  });
});

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

// Start server first, then initialize other components
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🌹 Photo Gallery Server running at http://0.0.0.0:${port}`);
  console.log('✅ Server started successfully');
  
  // Now initialize the rest of the application
  initializeApp();
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
  }
  process.exit(1);
});

async function initializeApp() {
  try {
    // Import models only after server is running
    const Photo = require('./src/models/Photo');
    const Music = require('./src/models/Music');

    console.log('DEBUG: Environment variables check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Function to safely extract environment variable value
    function getEnvValue(varName) {
      const value = process.env[varName];
      
      if (!value) {
        console.log(`Environment variable ${varName} is not set`);
        return null;
      }
      
      // If the value looks like it contains "Key:" and "Value:", extract the actual value
      if (typeof value === 'string') {
        // Check if it's in the format "Key: VARNAME\nValue: actual_value"
        const lines = value.split('\n');
        if (lines.length >= 2 && lines[0].startsWith('Key:') && lines[1].startsWith('Value:')) {
          const actualValue = lines[1].replace('Value:', '').trim();
          console.log(`Extracted actual value from ${varName}:`, actualValue.substring(0, 50) + '...');
          return actualValue;
        }
        
        // Otherwise return the value as-is
        return value;
      }
      
      return value;
    }

    // Get environment variables using the safe extraction function
    const mongoUri = getEnvValue('MONGO_URI') || 
                     getEnvValue('SamWRLD') || 
                     'mongodb+srv://lonergamers:EstB999Jw@clustersamwrld.hqnhrry.mongodb.net/Sam-WRLD?retryWrites=true&w=majority&appName=ClusterSamWRLD';

    const dbName = getEnvValue('DB_NAME') || 
                   getEnvValue('SamWrld') || 
                   'Sam-WRLD';

    const collectionName = getEnvValue('COLLECTION_NAME') || 
                          getEnvValue('samWRLD') || 
                          'files';

    console.log('Final Environment Variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('MONGO_URI type:', typeof mongoUri);
    console.log('MONGO_URI value (first 50 chars):', mongoUri ? mongoUri.substring(0, 50) + '...' : 'undefined');
    console.log('DB_NAME:', dbName);
    console.log('COLLECTION_NAME:', collectionName);

    // Validate MongoDB URI
    if (!mongoUri || typeof mongoUri !== 'string' || !mongoUri.startsWith('mongodb')) {
      console.error('WARNING: Invalid MONGO_URI environment variable');
      console.error('MONGO_URI value:', mongoUri);
      console.error('Database features will be disabled');
    } else {
      // Test database connection using your Photo model
      try {
        console.log('Testing database connection...');
        const testPhoto = new Photo();
        const testClient = await testPhoto.getConnection();
        await testClient.close();
        console.log("✅ Database connection test successful");
        
        // Initialize database with sample data
        console.log('Initializing database with sample data...');
        const photoModel = new Photo();
        const musicModel = new Music();
        
        await photoModel.initializeSampleData();
        await musicModel.initializeSampleData();
        console.log('✅ Database initialization completed successfully');
      } catch (error) {
        console.error('❌ Database error:', error);
        console.log('⚠️ Continuing without database features');
      }
    }

    // Serve frontend static files from root
    app.use('/css', express.static(path.join(__dirname, 'css')));
    app.use('/js', express.static(path.join(__dirname, 'js')));
    app.use('/assets', express.static(path.join(__dirname, 'assets')));

    // Serve media files
    app.use('/images', express.static(path.join(__dirname, 'uploads', 'images')));
    app.use('/music', express.static(path.join(__dirname, 'uploads', 'music')));
    app.use('/videos', express.static(path.join(__dirname, 'uploads', 'videos')));

    // API Routes - wrap in try-catch
    try {
      app.use('/api/photos', require('./src/routes/photos'));
      app.use('/api/music', require('./src/routes/music'));
      console.log('✅ API routes loaded successfully');
    } catch (error) {
      console.error('❌ Error loading API routes:', error);
    }

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

    // Enhanced health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          port: port,
          dbName: dbName
        }
      });
    });

    // Frontend routes - serve from root directory
    app.get('/', (req, res) => {
      try {
        res.sendFile(path.join(__dirname, 'index.html'));
      } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading page');
      }
    });

    app.get('/hope', (req, res) => {
      try {
        res.sendFile(path.join(__dirname, 'hope.html'));
      } catch (error) {
        console.error('Error serving hope.html:', error);
        res.status(500).send('Error loading page');
      }
    });

    app.get('/doubt', (req, res) => {
      try {
        res.sendFile(path.join(__dirname, 'doubt.html'));
      } catch (error) {
        console.error('Error serving doubt.html:', error);
        res.status(500).send('Error loading page');
      }
    });

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
        // Serve index.html from root for all other routes (SPA behavior)
        try {
          res.sendFile(path.join(__dirname, 'index.html'));
        } catch (error) {
          console.error('Error serving fallback index.html:', error);
          res.status(500).send('Error loading page');
        }
      }
    });

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

  } catch (error) {
    console.error('❌ Error initializing app:', error);
    // Don't exit - server is already running
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

// Handle uncaught exceptions - but don't exit immediately
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // In production, you might want to gracefully shut down
  // For now, just log and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to gracefully shut down
  // For now, just log and continue
});