const { MongoClient, ObjectId } = require('mongodb');
class Photo {
  constructor() {
    this.mongoUri = process.env.MONGO_URI;
    this.dbName = process.env.DB_NAME;
    this.collectionName = 'photos'; // Changed from 'roses' to 'photos'
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
  
  // Get all photos
  async findAll(category = null) {
    let client;
    try {
      client = await this.getConnection();
      const database = client.db(this.dbName);
      const collection = database.collection(this.collectionName);
      
      let query = {};
      if (category) {
        query.category = category;
      }
      
      const photos = await collection.find(query).sort({ order: 1 }).toArray();
      return photos;
    } catch (error) {
      console.error('Error fetching photos:', error);
      throw error;
    } finally {
      if (client) await client.close();
    }
  }
  
  // Get a specific photo by ID
  async findById(id) {
    let client;
    try {
      client = await this.getConnection();
      const database = client.db(this.dbName);
      const collection = database.collection(this.collectionName);
      
      const photo = await collection.findOne({ _id: new ObjectId(id) });
      return photo;
    } catch (error) {
      console.error('Error fetching photo by ID:', error);
      throw error;
    } finally {
      if (client) await client.close();
    }
  }
  
  // Create a new photo
  async create(photoData) {
    let client;
    try {
      client = await this.getConnection();
      const database = client.db(this.dbName);
      const collection = database.collection(this.collectionName);
      
      const result = await collection.insertOne({
        ...photoData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return result;
    } catch (error) {
      console.error('Error creating photo:', error);
      throw error;
    } finally {
      if (client) await client.close();
    }
  }
  
  // Update a photo
  async update(id, updateData) {
    let client;
    try {
      client = await this.getConnection();
      const database = client.db(this.dbName);
      const collection = database.collection(this.collectionName);
      
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        }
      );
      return result;
    } catch (error) {
      console.error('Error updating photo:', error);
      throw error;
    } finally {
      if (client) await client.close();
    }
  }
  
  // Delete a photo
  async delete(id) {
    let client;
    try {
      client = await this.getConnection();
      const database = client.db(this.dbName);
      const collection = database.collection(this.collectionName);
      
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    } finally {
      if (client) await client.close();
    }
  }
  
  // Initialize sample data
  async initializeSampleData() {
    let client;
    try {
      client = await this.getConnection();
      const database = client.db(this.dbName);
      const collection = database.collection(this.collectionName);
      
      // Check if data already exists
      const existingCount = await collection.countDocuments();
      if (existingCount > 0) {
        console.log('Sample photos already exist in database');
        return;
      }
      
      const samplePhotos = [
        {
          title: "Red Rose",
          label: "Love",
          message: "You are the love of my life, forever and always. Every moment with you is a treasure.",
          photos: ["red-rose-1.jpg", "red-rose-2.jpg", "red-rose-3.jpg"],
          mainImage: "red-rose.jpg", // Renamed from roseImage
          color: "#ff1744",
          category: "roses", // Added category field
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Pink Rose",
          label: "Joy",
          message: "Your smile brings joy to my heart every single day. You light up my world.",
          photos: ["pink-rose-1.jpg", "pink-rose-2.jpg"],
          mainImage: "pink-rose.jpg",
          color: "#ff69b4",
          category: "roses",
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "White Rose",
          label: "Pure",
          message: "Pure and beautiful, just like our love. You are my everything.",
          photos: ["white-rose-1.jpg", "white-rose-2.jpg", "white-rose-3.jpg", "white-rose-4.jpg"],
          mainImage: "white-rose.jpg",
          color: "#ffffff",
          category: "roses",
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Yellow Rose",
          label: "Sunshine",
          message: "You are my sunshine on cloudy days. Your warmth fills my soul.",
          photos: ["yellow-rose-1.jpg", "yellow-rose-2.jpg"],
          mainImage: "yellow-rose.jpg",
          color: "#ffd700",
          category: "roses",
          order: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Mountain Landscape",
          label: "Nature",
          message: "Beautiful mountain view at sunset",
          photos: ["mountain-1.jpg", "mountain-2.jpg"],
          mainImage: "mountain.jpg",
          color: "#4CAF50",
          category: "nature",
          order: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "Ocean Waves",
          label: "Ocean",
          message: "Peaceful ocean scene",
          photos: ["ocean-1.jpg", "ocean-2.jpg"],
          mainImage: "ocean.jpg",
          color: "#2196F3",
          category: "nature",
          order: 6,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: "City Skyline",
          label: "Urban",
          message: "Modern city at night",
          photos: ["city-1.jpg", "city-2.jpg"],
          mainImage: "city.jpg",
          color: "#9C27B0",
          category: "urban",
          order: 7,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      await collection.insertMany(samplePhotos);
      console.log('Sample photos inserted successfully');
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw error;
    } finally {
      if (client) await client.close();
    }
  }
}
module.exports = Photo;