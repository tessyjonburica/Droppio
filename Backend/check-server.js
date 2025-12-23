/**
 * Quick script to check if the backend server can start
 * Run with: node check-server.js
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:5000';

console.log('Checking backend server status...\n');

// Check health endpoint
const checkHealth = () => {
  return new Promise((resolve, reject) => {
    const req = http.get(`${API_URL}/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({ success: true, status: json });
          } catch (e) {
            resolve({ success: true, status: data });
          }
        } else {
          reject(new Error(`Server responded with status ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        reject(new Error('Server is not running. Start it with: npm run dev'));
      } else if (error.code === 'ENOTFOUND') {
        reject(new Error(`Cannot resolve hostname. Check API_URL: ${API_URL}`));
      } else {
        reject(error);
      }
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Connection timeout. Server may be starting or not responding.'));
    });
  });
};

checkHealth()
  .then((result) => {
    console.log('✅ Server is running and healthy!');
    console.log('Status:', JSON.stringify(result.status, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Server check failed:');
    console.error('   ', error.message);
    console.error('\n💡 To start the server:');
    console.error('   1. cd Backend');
    console.error('   2. Make sure .env file exists with all required variables');
    console.error('   3. npm install (if not done already)');
    console.error('   4. npm run dev');
    process.exit(1);
  });

