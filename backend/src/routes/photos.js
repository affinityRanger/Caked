const express = require('express');
const Photo = require('../models/Photo');
const router = express.Router();
const photoModel = new Photo();

// GET /api/photos - Get all photos
router.get('/', async (req, res) => {
  try {
    const category = req.query.category; // Optional category filter
    console.log('Fetching all photos...');
    const photos = await photoModel.findAll(category);
    console.log(`Found ${photos.length} photos`);
    res.json(photos);
  } catch (error) {
    console.error('Error in GET /api/photos:', error);
    res.status(500).json({ 
      error: 'Failed to fetch photos',
      message: error.message 
    });
  }
});

// GET /api/photos/:id - Get a specific photo
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching photo with ID: ${id}`);
    
    const photo = await photoModel.findById(id);
    
    if (!photo) {
      return res.status(404).json({ 
        error: 'Photo not found',
        message: `No photo found with ID: ${id}` 
      });
    }
    
    console.log(`Found photo: ${photo.title}`);
    res.json(photo);
  } catch (error) {
    console.error(`Error in GET /api/photos/${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch photo',
      message: error.message 
    });
  }
});

// POST /api/photos - Create a new photo
router.post('/', async (req, res) => {
  try {
    const photoData = req.body;
    console.log('Creating new photo:', photoData.title);
    
    if (!photoData.title || !photoData.category) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title and category are required'
      });
    }
    
    const result = await photoModel.create(photoData);
    console.log('Photo created successfully with ID:', result.insertedId);
    
    res.status(201).json({
      success: true,
      id: result.insertedId,
      message: 'Photo created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/photos:', error);
    res.status(500).json({ 
      error: 'Failed to create photo',
      message: error.message 
    });
  }
});

// PUT /api/photos/:id - Update a photo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`Updating photo with ID: ${id}`);
    
    const result = await photoModel.update(id, updateData);
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        error: 'Photo not found',
        message: `No photo found with ID: ${id}` 
      });
    }
    
    console.log('Photo updated successfully');
    res.json({
      success: true,
      message: 'Photo updated successfully'
    });
  } catch (error) {
    console.error(`Error in PUT /api/photos/${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to update photo',
      message: error.message 
    });
  }
});

// DELETE /api/photos/:id - Delete a photo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting photo with ID: ${id}`);
    
    const result = await photoModel.delete(id);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        error: 'Photo not found',
        message: `No photo found with ID: ${id}` 
      });
    }
    
    console.log('Photo deleted successfully');
    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error(`Error in DELETE /api/photos/${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to delete photo',
      message: error.message 
    });
  }
});

module.exports = router;