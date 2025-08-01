// Load environment variables (Railway provides them directly, .env is fallback for local development)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const path = require('path');
const fs = require('fs');
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

// Debug endpoint to check directory structure
app.get('/debug', (req, res) => {
  try {
    const appRoot = process.cwd(); // Should be /app
    const files = fs.readdirSync(appRoot);
    const backendFiles = fs.readdirSync(path.join(appRoot, 'backend'));
    
    res.json({
      appRoot,
      files,
      backendFiles,
      cssExists: fs.existsSync(path.join(appRoot, 'css')),
      jsExists: fs.existsSync(path.join(appRoot, 'js')),
      assetsExists: fs.existsSync(path.join(appRoot, 'assets')),
      cssPath: path.join(appRoot, 'css'),
      jsPath: path.join(appRoot, 'js'),
      assetsPath: path.join(appRoot, 'assets')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint for static files
app.get('/test-static', (req, res) => {
  try {
    const testPath = path.join(process.cwd(), 'css');
    const files = fs.existsSync(testPath) ? fs.readdirSync(testPath) : [];
    res.json({
      message: 'Static file test',
      path: testPath,
      exists: fs.existsSync(testPath),
      files: files,
      workingDirectory: process.cwd(),
      __dirname: __dirname
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      path: path.join(process.cwd(), 'css'),
      workingDirectory: process.cwd(),
      __dirname: __dirname
    });
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
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

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Static file serving using process.cwd()
const cssDir = path.join(process.cwd(), 'css');
const jsDir = path.join(process.cwd(), 'js');
const assetsDir = path.join(process.cwd(), 'assets');

console.log('Checking static file directories:');
console.log('CSS directory:', cssDir, 'exists:', fs.existsSync(cssDir));
console.log('JS directory:', jsDir, 'exists:', fs.existsSync(jsDir));
console.log('Assets directory:', assetsDir, 'exists:', fs.existsSync(assetsDir));

if (fs.existsSync(cssDir)) {
  app.use('/css', express.static(cssDir));
  console.log('✅ Serving CSS from:', cssDir);
} else {
  console.error('❌ CSS directory not found:', cssDir);
}

if (fs.existsSync(jsDir)) {
  app.use('/js', express.static(jsDir));
  console.log('✅ Serving JS from:', jsDir);
} else {
  console.error('❌ JS directory not found:', jsDir);
}

if (fs.existsSync(assetsDir)) {
  app.use('/assets', express.static(assetsDir));
  console.log('✅ Serving assets from:', assetsDir);
} else {
  console.error('❌ Assets directory not found:', assetsDir);
}

// Serve media files
const imagesDir = path.join(__dirname, 'uploads', 'images');
const musicDir = path.join(__dirname, 'uploads', 'music');
const videosDir = path.join(__dirname, 'uploads', 'videos');

if (fs.existsSync(imagesDir)) {
  app.use('/images', express.static(imagesDir));
  console.log('✅ Serving images from:', imagesDir);
}

if (fs.existsSync(musicDir)) {
  app.use('/music', express.static(musicDir));
  console.log('✅ Serving music from:', musicDir);
}

if (fs.existsSync(videosDir)) {
  app.use('/videos', express.static(videosDir));
  console.log('✅ Serving videos from:', videosDir);
}

// Handle favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Start server first, then initialize other components
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🌹 Photo Gallery Server running at http://0.0.0.0:${port}`);
  console.log('✅ Server started successfully');
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
    const Photo = require('./src/models/Photo');
    const Music = require('./src/models/Music');
    
    function getEnvValue(varName) {
      const value = process.env[varName];
      if (!value) {
        console.log(`Environment variable ${varName} is not set`);
        return null;
      }
      if (typeof value === 'string') {
        const lines = value.split('\n');
        if (lines.length >= 2 && lines[0].startsWith('Key:') && lines[1].startsWith('Value:')) {
          const actualValue = lines[1].replace('Value:', '').trim();
          console.log(`Extracted actual value from ${varName}:`, actualValue.substring(0, 50) + '...');
          return actualValue;
        }
        return value;
      }
      return value;
    }

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

    if (!mongoUri || typeof mongoUri !== 'string' || !mongoUri.startsWith('mongodb')) {
      console.error('WARNING: Invalid MONGO_URI environment variable');
      console.error('MONGO_URI value:', mongoUri);
      console.error('Database features will be disabled');
    } else {
      try {
        console.log('Testing database connection...');
        const testPhoto = new Photo();
        const testClient = await testPhoto.getConnection();
        await testClient.close();
        console.log("✅ Database connection test successful");
        
        const photoModel = new Photo();
        const musicModel = new Music();
        
        // Defer sample data init
        setTimeout(async () => {
          try {
            console.log('⏳ Initializing sample data in background...');
            await photoModel.initializeSampleData();
            await musicModel.initializeSampleData();
            console.log('✅ Sample data initialized in background');
          } catch (err) {
            console.error('❌ Error initializing sample data in background:', err);
          }
        }, 0);
      } catch (error) {
        console.error('❌ Database error:', error);
        console.log('⚠️ Continuing without database features');
      }
    }

    // API Routes
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

    // Enhanced health check
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

    // Frontend routes
    app.get('/', (req, res) => {
      const indexPath = path.join(process.cwd(), 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('index.html not found');
      }
    });
    
    app.get('/hope', (req, res) => {
      const hopePath = path.join(process.cwd(), 'hope.html');
      if (fs.existsSync(hopePath)) {
        res.sendFile(hopePath);
      } else {
        res.status(404).send('hope.html not found');
      }
    });
    
    app.get('/doubt', (req, res) => {
      const doubtPath = path.join(process.cwd(), 'doubt.html');
      if (fs.existsSync(doubtPath)) {
        res.sendFile(doubtPath);
      } else {
        res.status(404).send('doubt.html not found');
      }
    });

    // Error handling
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
        const indexPath = path.join(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Page not found');
        }
      }
    });

    console.log('📁 Static files being served from:');
    console.log('   - CSS: /css/');
    console.log('   - JS: /js/');
    console.log('   - Assets: /assets/');
    console.log('   - Images: /images/');
    console.log('   - Music: /music/');
    console.log('   - Videos: /videos/');
    console.log('📡 API endpoints:');
    console.log('   - GET /api/photos');
    console.log('   - GET /api/music');
    console.log('🌐 Frontend routes:');
    console.log('   - GET /');
    console.log('   - GET /hope');
    console.log('   - GET /doubt');
    console.log('✨ Photo Gallery is ready!');
  } catch (error) {
    console.error('❌ Error initializing app:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});

// Uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});