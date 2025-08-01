const express = require('express');
const Music = require('../models/Music');
const router = express.Router();
const musicModel = new Music();

// GET /api/music - Get all music tracks
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all music tracks...');
    const tracks = await musicModel.findAll();
    console.log(`Found ${tracks.length} music tracks`);
    res.json(tracks);
  } catch (error) {
    console.error('Error in GET /api/music:', error);
    res.status(500).json({ 
      error: 'Failed to fetch music tracks',
      message: error.message 
    });
  }
});

// GET /api/music/:id - Get a specific track
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching music track with ID: ${id}`);
    
    const track = await musicModel.findById(id);
    
    if (!track) {
      return res.status(404).json({ 
        error: 'Track not found',
        message: `No track found with ID: ${id}` 
      });
    }
    
    console.log(`Found track: ${track.title}`);
    res.json(track);
  } catch (error) {
    console.error(`Error in GET /api/music/${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch track',
      message: error.message 
    });
  }
});

// POST /api/music - Create a new track
router.post('/', async (req, res) => {
  try {
    const trackData = req.body;
    console.log('Creating new track:', trackData.title);
    
    if (!trackData.title || !trackData.filename) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title and filename are required'
      });
    }
    
    const result = await musicModel.create(trackData);
    console.log('Track created successfully with ID:', result.insertedId);
    
    res.status(201).json({
      success: true,
      id: result.insertedId,
      message: 'Track created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/music:', error);
    res.status(500).json({ 
      error: 'Failed to create track',
      message: error.message 
    });
  }
});

module.exports = router;