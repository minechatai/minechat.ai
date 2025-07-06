// Test FAQ analysis functionality
const axios = require('axios');

async function testFAQAnalysis() {
  try {
    // Test the FAQ analysis endpoint
    const response = await axios.get('http://localhost:5000/api/faq-analysis', {
      params: {
        startDate: '2025-07-01',
        endDate: '2025-07-06'
      },
      headers: {
        'Cookie': 'connect.sid=s%3Av3m9LMkxKFNZHIJIaKADgcOZqCMvUgv6.nZGhcbPNUGLKnQZHFxGKcjCdQjGXYJb7vbTmGjcNO0A'
      }
    });
    
    console.log('FAQ Analysis Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testFAQAnalysis();