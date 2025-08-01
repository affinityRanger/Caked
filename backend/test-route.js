const express = require('express');
const router = express.Router();

// Simple test route
router.get('/', (req, res) => {
  res.json({ 
    message: 'Test route works',
    timestamp: new Date().toISOString()
  });
});

// Test route with parameter
router.get('/:id', (req, res) => {
  res.json({ 
    message: 'Test route with ID works',
    id: req.params.id,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;