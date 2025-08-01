const fs = require('fs');
const path = require('path');

// First, clear existing sample data (optional)
async function clearExistingPhotos() {
  try {
    const Photo = require('./src/models/Photo');
    const photoModel = new Photo();
    
    let client = await photoModel.getConnection();
    const database = client.db(process.env.DB_NAME);
    const collection = database.collection('photos');
    
    // Delete all existing photos
    await collection.deleteMany({});
    console.log('✓ Cleared existing photos');
    
    await client.close();
  } catch (error) {
    console.error('Error clearing photos:', error);
  }
}

// Get all image files from uploads/images directory
function getImageFiles() {
  const imagesDir = path.join(__dirname, 'uploads', 'images');
  
  if (!fs.existsSync(imagesDir)) {
    console.log('uploads/images directory does not exist');
    return [];
  }
  
  const files = fs.readdirSync(imagesDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  });
  
  return imageFiles;
}

// Add photos to database
async function addPhotosToDatabase() {
  require('dotenv').config();
  
  try {
    const Photo = require('./src/models/Photo');
    const photoModel = new Photo();
    
    const imageFiles = getImageFiles();
    console.log(`Found ${imageFiles.length} image files:`, imageFiles);
    
    if (imageFiles.length === 0) {
      console.log('No image files found in uploads/images/');
      return;
    }
    
    // Create photo entries for each image
    for (let i = 0; i < imageFiles.length; i++) {
      const filename = imageFiles[i];
      const nameWithoutExt = path.parse(filename).name;
      
      const photoData = {
        title: nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        label: "Personal Photo",
        message: `My photo: ${nameWithoutExt}`,
        photos: [filename], // Array with just this image
        mainImage: filename,
        roseImage: filename, // Legacy field if your frontend uses this
        color: "#2196F3", // Default blue color
        category: "personal",
        order: i + 1
      };
      
      const result = await photoModel.create(photoData);
      console.log(`✓ Added photo: ${photoData.title} (ID: ${result.insertedId})`);
    }
    
    console.log(`\n🎉 Successfully added ${imageFiles.length} photos to database!`);
    console.log('You can now view them at: http://localhost:3000/api/photos');
    console.log('Your frontend should now display your actual photos!');
    console.log('\n📝 Frontend Integration Notes:');
    console.log('- Images are served from: http://localhost:3000/images/[filename]');
    console.log('- API endpoint: http://localhost:3000/api/photos');
    console.log('- Make sure your frontend JavaScript is pointing to these URLs');
    
  } catch (error) {
    console.error('Error adding photos:', error);
  }
}

// Main function
async function main() {
  console.log('🔄 Starting bulk photo addition...\n');
  
  // Uncomment the next line if you want to clear existing sample data first
  // await clearExistingPhotos();
  
  await addPhotosToDatabase();
  
  console.log('\n✨ Done!');
  process.exit(0);
}

main();