const { MongoClient } = require('mongodb');

class Music {
  constructor() {
    // Fixed environment variable parsing
    this.mongoUri = this.getEnvValue('MONGO_URI') || 
                    this.getEnvValue('SamWRLD') || 
                    'mongodb+srv://lonergamers:EstB999Jw@clustersamwrld.hqnhrry.mongodb.net/Sam-WRLD?retryWrites=true&w=majority&appName=ClusterSamWRLD';
    
    this.dbName = this.getEnvValue('DB_NAME') || 
                  this.getEnvValue('SamWrld') || 
                  'Sam-WRLD';
    
    this.collectionName = 'music'; // Music has its own collection

    // Debug logging
    console.log('Music Model - MongoDB URI:', this.mongoUri ? this.mongoUri.substring(0, 50) + '...' : 'undefined');
    console.log('Music Model - DB Name:', this.dbName);
    console.log('Music Model - Collection:', this.collectionName);
    
    // Validate URI
    if (!this.mongoUri || typeof this.mongoUri !== 'string' || !this.mongoUri.startsWith('mongodb')) {
      console.error('Music Model - Invalid MongoDB URI:', this.mongoUri);
      throw new Error('Invalid MongoDB URI in Music model');
    }
  }

  // Fixed environment variable parsing method
  getEnvValue(varName) {
    const value = process.env[varName];
    
    if (!value) {
      console.log(`Music Model - Environment variable ${varName} is not set`);
      return null;
    }
    
    // Handle Railway's special format: "Key: VARNAME\nValue: actual_value"
    if (typeof value === 'string') {
      const lines = value.split('\n');
      if (lines.length >= 2 && lines[0].startsWith('Key:') && lines[1].startsWith('Value:')) {
        const actualValue = lines[1].replace('Value:', '').trim();
        console.log(`Music Model - Extracted value from ${varName}:`, actualValue.substring(0, 50) + '...');
        return actualValue;
      }
      
      // Return as-is if not in special format
      return value;
    }
    
    return value;
  }

  async getConnection() {
    try {
      console.log('Music Model - Creating MongoDB connection...');
      
      const client = new MongoClient(this.mongoUri, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        retryWrites: true,
        w: 'majority'
      });
      
      console.log('Music Model - Attempting to connect...');
      await client.connect();
      
      console.log('Music Model - Testing connection with ping...');
      await client.db(this.dbName).admin().ping();
      
      console.log('Music Model - Connection successful!');
      return client;
      
    } catch (error) {
      console.error('Music Model - Connection failed:', error.message);
      console.error('Music Model - Full error:', error);
      throw error;
    }
  }

  async initializeSampleData() {
    let client;
    try {
      console.log('Music Model - Initializing sample data...');
      client = await this.getConnection();
      const db = client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      // Check if data already exists
      const existingCount = await collection.countDocuments();
      if (existingCount > 0) {
        console.log(`Music Model - Sample data already exists (${existingCount} documents)`);
        return;
      }

      // Sample music data
      const sampleMusic = [
        {
          title: "Dreamin'",
          artist: "PARTYNEXTDOOR",
          filename: "PARTYNEXTDOOR - Dreamin.mp3",
          category: "chill",
          duration: 240,
          description: "A smooth R&B track perfect for relaxation",
          createdAt: new Date()
        },
        {
          title: "TRAUMA",
          artist: "PARTYNEXTDOOR",
          filename: "PARTYNEXTDOOR - TRAUMA .mp3",
          category: "emotional",
          duration: 180,
          description: "Deep emotional track about overcoming difficulties",
          createdAt: new Date()
        },
        {
          title: "KEEP IT",
          artist: "Juice WRLD",
          filename: "KEEP IT-JUICE WRLD.mp3",
          category: "rap",
          duration: 200,
          description: "Energetic rap track with meaningful lyrics",
          createdAt: new Date()
        },
        {
          title: "DEEPER",
          artist: "PARTYNEXTDOOR",
          filename: "PARTYNEXTDOOR - DEEPER.mp3",
          category: "chill",
          duration: 220,
          description: "Introspective track with deep emotional resonance",
          createdAt: new Date()
        },
        {
          title: "Grace",
          artist: "Juice WRLD",
          filename: "Juice WRLD - Grace.mp3",
          category: "emotional",
          duration: 195,
          description: "A heartfelt song about finding grace in difficult times",
          createdAt: new Date()
        }
      ];

      const result = await collection.insertMany(sampleMusic);
      console.log(`Music Model - Inserted ${result.insertedCount} sample music tracks`);

    } catch (error) {
      console.error('Music Model - Error initializing sample data:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async getAllMusic(category = null) {
    let client;
    try {
      client = await this.getConnection();
      const db = client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      const filter = category ? { category: category } : {};
      const music = await collection.find(filter).toArray();
      
      console.log(`Music Model - Retrieved ${music.length} tracks${category ? ` for category: ${category}` : ''}`);
      return music;

    } catch (error) {
      console.error('Music Model - Error getting music:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async getMusicById(id) {
    let client;
    try {
      const { ObjectId } = require('mongodb');
      client = await this.getConnection();
      const db = client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      const track = await collection.findOne({ _id: new ObjectId(id) });
      return track;

    } catch (error) {
      console.error('Music Model - Error getting track by ID:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  async addMusic(musicData) {
    let client;
    try {
      client = await this.getConnection();
      const db = client.db(this.dbName);
      const collection = db.collection(this.collectionName);

      musicData.createdAt = new Date();
      const result = await collection.insertOne(musicData);
      
      console.log('Music Model - Added new track:', result.insertedId);
      return result;

    } catch (error) {
      console.error('Music Model - Error adding music:', error);
      throw error;
    } finally {
      if (client) {
        await client.close();
      }
    }
  }
}

module.exports = Music;