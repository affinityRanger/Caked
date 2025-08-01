// models/Music.js
const { MongoClient, ObjectId } = require('mongodb');

class Music {
  constructor() {
    this.mongoUri = process.env.MONGO_URI;
    this.dbName = process.env.DB_NAME;
    this.collectionName = 'music';
  }

  async getConnection() {
    const client = new MongoClient(this.mongoUri, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000
    });
    await client.connect();
    return client;
  }

  // Get all music tracks
  async findAll() {
    let client;
    try {
      client = await this.getConnection();
      const database = client.db(this.dbName);
      const collection = database.collection(this.collectionName);
      
      const tracks = await collection.find({}).sort({ order: 1 }).toArray();
      return tracks;
    } catch (error) {
      console.error('Error fetching music tracks:', error);
      throw error;
    } finally {
      if (client) await client.close();
    }
  }

  // Get a specific track by ID
  async findById(id) {
    let client;
    try {
      client = await this.getConnection();
      const database = client.db(this.dbName);
      const collection = database.collection(this.collectionName);
      
      const track = await collection.findOne({ _id: new ObjectId(id) });
      return track;
    } catch (error) {
      console.error('Error fetching track by ID:', error);
      throw error;
    } finally {
      if (client) await client.close();
    }
  }

  // Create a new track
  async create(trackData) {
    let client;
    try {
      client = await this.getConnection();
      const database = client.db(this.dbName);
      const collection = database.collection(this.collectionName);
      
      const result = await collection.insertOne({
        ...trackData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return result;
    } catch (error) {
      console.error('Error creating track:', error);
      throw error;
    } finally {
      if (client) await client.close();
    }
  }

  // Initialize sample music data
  async initializeSampleData() {
    let client;
    try {
      client = await this.getConnection();
      const database = client.db(this.dbName);
      const collection = database.collection(this.collectionName);
      
      // Check if data already exists
      const existingCount = await collection.countDocuments();
      if (existingCount > 0) {
        console.log('Sample music tracks already exist in database');
        return;
      }

      const sampleTracks = [
        {
          title: "Romantic Piano",
          filename: "romantic-piano.mp3",
          artist: "Love Collection",
          duration: "3:45",
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Gentle Strings",
          filename: "gentle-strings.mp3",
          artist: "Love Collection",
          duration: "4:12",
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Soft Melody",
          filename: "soft-melody.mp3",
          artist: "Love Collection",
          duration: "3:28",
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Love Theme",
          filename: "love-theme.mp3",
          artist: "Love Collection",
          duration: "4:56",
          order: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await collection.insertMany(sampleTracks);
      console.log('Sample music tracks inserted successfully');
    } catch (error) {
      console.error('Error initializing sample music data:', error);
      throw error;
    } finally {
      if (client) await client.close();
    }
  }
}

module.exports = Music;