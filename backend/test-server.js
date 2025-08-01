const express = require('express');
const app = express();

console.log('Testing with clean route file...');

// Test with the clean route
try {
  app.use('/api/test', require('./test-route'));
  console.log('✓ Clean route loaded successfully');
} catch (error) {
  console.error('❌ Error with clean route:', error.message);
}

// Test with your existing routes one by one
try {
  console.log('Testing photos route...');
  app.use('/api/photos', require('./src/routes/photos'));
  console.log('✓ Photos route loaded');
} catch (error) {
  console.error('❌ Error with photos route:', error.message);
  console.error('Stack:', error.stack);
}

try {
  console.log('Testing music route...');
  app.use('/api/music', require('./src/routes/music'));
  console.log('✓ Music route loaded');
} catch (error) {
  console.error('❌ Error with music route:', error.message);
  console.error('Stack:', error.stack);
}

app.listen(3001, () => {
  console.log('Test server running on port 3001');
});