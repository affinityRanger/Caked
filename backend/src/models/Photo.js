const { MongoClient } = require('mongodb');

class Photo {
  constructor() {
    // Fixed environment variable parsing
    this.mongoUri = this.getEnvValue('MONGO_URI') || 
                    this.getEnvValue('SamWRLD') || 
                    'mongodb+srv://lonergamers:EstB999Jw@clustersamwrld.hqnhrry.mongodb.net/Sam-WRLD?retryWrites=true&w=majority&appName=ClusterSamWRLD';
    
    this.dbName = this.getEnvValue('DB_NAME') || 
                  this.getEnvValue('SamWrld') || 
                  'Sam-WRLD';
    
    this.collectionName = this.getEnvValue('COLLECTION_NAME') || 
                         this.getEnvValue('samWRLD') || 
                         'files';

    // Debug logging
    console.log('Photo Model - MongoDB URI:', this.mongoUri ? this.mongoUri.substring(0, 50) + '...' : 'undefined');
    console.log('Photo Model - DB Name:', this.dbName);
    console.log('Photo Model - Collection:', this.collectionName);
    
    // Validate URI
    if (!this.mongoUri || typeof this.mongoUri !== 'string' || !this.mongoUri.startsWith('mongodb')) {
      console.error('Photo Model - Invalid MongoDB URI:', this.mongoUri);
      throw new Error('Invalid MongoDB URI in Photo model');
    }
  }

  // Fixed environment variable parsing method
  getEnvValue(varName) {
    const value = process.env[varName];
    
    if (!value) {
      console.log(`Photo Model - Environment variable ${varName} is not set`);
      return null;
    }
    
    // Handle Railway's special format: "Key: VARNAME\nValue: actual_value"
    if (typeof value === 'string') {
      const lines = value.split('\n');
      if (lines.length >= 2 && lines[0].startsWith('Key:') && lines[1].startsWith('Value:')) {
        const actualValue = lines[1].replace('Value:', '').trim();
        console.log(`Photo Model - Extracted value from ${varName}:`, actualValue.substring(0, 50) + '...');
        return actualValue;
      }
      
      // Return as-is if not in special format
      return value;
    }
    
    return value;
  }

  async getConnection() {
    try {
      console.log('Photo Model - Creating MongoDB connection...');
      
      const client = new MongoClient(this.mongoUri, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        retryWrites: true,
        w: 'majority'
      });
      
      console.log('Photo Model - Attempting to connect...');
      await client.connect();
      
      console.log('Photo Model - Testing connection with ping...');
      await client.db(this.dbName).admin().ping();
      
      console.log('Photo Model - Connection successful!');
      return client;
      
    } catch (error) {
      console.error('Photo Model - Connection failed:', error.message);
      console.error('Photo Model - Full error:', error);
      throw error;
    }
  }

  async initializeSampleData() {
    let client;
    try {
      console.log('Photo Model - Initializing sample data...');
      client = await this.getConnection();
      const db = client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      // Check if data already exists
      const existingCount = await collection.countDocuments();
      if (existingCount > 0) {
        console.log(`Photo Model - Sample data already exists (${existingCount} documents)`);
        return;
      }

      // Sample photo data
      const samplePhotos = [
        {
          title: "Beautiful Red Rose",
          mainImage: "rose1.jpg",
          category: "roses",
          description: "A stunning red rose in full bloom",
          photos: ["rose1.jpg", "rose2.jpg"],
          createdAt: new Date()
        },
        {
          title: "White Rose Garden",
          mainImage: "white_rose.jpg",
          category: "roses",
          description: "Elegant white roses in the garden",
          photos: ["white_rose.jpg"],
          createdAt: new Date()
        },
        {
          title: "Garden Path",
          mainImage: "garden_path.jpg",
          category: "garden",
          description: "A peaceful garden path lined with flowers",
          photos: ["garden_path.jpg", "flowers1.jpg"],
          createdAt: new Date()
        },
        {
          title: "Hope Collection",
          mainImage: "hope1.jpg",
          category: "hope",
          description: "Images that inspire hope and joy",
          photos: ["hope1.jpg", "hope2.jpg", "hope3.jpg"],
          createdAt: new Date()
        }
      ];

      const result = await collection.insertMany(samplePhotos);
      console.log(`Photo Model - Inserted ${result.insertedCount} sample photos`);

    } catch (error) {
      console.error('Photo Model - Error initializing sample data:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async getAllPhotos(category = null) {
    let client;
    try {
      client = await this.getConnection();
      const db = client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      const filter = category ? { category: category } : {};
      const photos = await collection.find(filter).toArray();
      
      console.log(`Photo Model - Retrieved ${photos.length} photos${category ? ` for category: ${category}` : ''}`);
      return photos;

    } catch (error) {
      console.error('Photo Model - Error getting photos:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async getPhotoById(id) {
    let client;
    try {
      const { ObjectId } = require('mongodb');
      client = await this.getConnection();
      const db = client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      const photo = await collection.findOne({ _id: new ObjectId(id) });
      return photo;

    } catch (error) {
      console.error('Photo Model - Error getting photo by ID:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async addPhoto(photoData) {
    let client;
    try {
      client = await this.getConnection();
      const db = client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      photoData.createdAt = new Date();
      const result = await collection.insertOne(photoData);
      
      console.log('Photo Model - Added new photo:', result.insertedId);
      return result;

    } catch (error) {
      console.error('Photo Model - Error adding photo:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }
}

module.exports = Photo;