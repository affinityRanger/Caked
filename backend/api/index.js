const express = require('express');
const router = express.Router();

// Import your existing routes
const musicRoutes = require('../src/routes/music');
const photoRoutes = require('../src/routes/photos');

// Use the routes
router.use('/music', musicRoutes);
router.use('/photos', photoRoutes);

module.exports = router;