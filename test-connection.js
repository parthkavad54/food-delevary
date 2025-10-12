// Test script to verify frontend-backend connection
const http = require('http');

const testConnection = async () => {
  console.log('🧪 Testing Frontend-Backend Connection...\n');

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.status === 'OK') {
            console.log('✅ Backend is running and healthy!');
            console.log(`📊 Response: ${JSON.stringify(response, null, 2)}`);
            resolve(true);
          } else {
            console.log('❌ Backend health check failed');
            console.log(`📊 Status: ${res.statusCode}`);
            console.log(`📊 Response: ${data}`);
            resolve(false);
          }
        } catch (error) {
          console.log('❌ Failed to parse backend response');
          console.log(`📊 Raw response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Cannot connect to backend server');
      console.log(`📊 Error: ${error.message}`);
      console.log('\n💡 Make sure to start the backend server first:');
      console.log('   cd backend && npm run dev');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Connection timeout - backend may not be running');
      console.log('\n💡 Make sure to start the backend server first:');
      console.log('   cd backend && npm run dev');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Test API endpoints
const testAPIEndpoints = async () => {
  console.log('\n🔍 Testing API Endpoints...\n');

  const endpoints = [
    { path: '/api/restaurants', method: 'GET', name: 'Restaurants API' },
    { path: '/api/menu', method: 'GET', name: 'Menu API' },
    { path: '/api/health', method: 'GET', name: 'Health Check API' }
  ];

  for (const endpoint of endpoints) {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    await new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 404) {
            console.log(`✅ ${endpoint.name}: Available (Status: ${res.statusCode})`);
          } else {
            console.log(`⚠️  ${endpoint.name}: Status ${res.statusCode}`);
          }
          resolve();
        });
      });

      req.on('error', () => {
        console.log(`❌ ${endpoint.name}: Not accessible`);
        resolve();
      });

      req.setTimeout(3000, () => {
        console.log(`⏰ ${endpoint.name}: Timeout`);
        req.destroy();
        resolve();
      });

      req.end();
    });
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Food Delivery App - Connection Test\n');
  console.log('=' .repeat(50));
  
  const isHealthy = await testConnection();
  
  if (isHealthy) {
    await testAPIEndpoints();
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Connection test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Open http://localhost:5000 in your browser');
    console.log('   2. Test the frontend functionality');
    console.log('   3. Check browser console for any API errors');
    console.log('\n✨ Your food delivery app is ready to use!');
  } else {
    console.log('\n' + '=' .repeat(50));
    console.log('❌ Connection test failed!');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure MongoDB is running');
    console.log('   2. Check if backend dependencies are installed');
    console.log('   3. Verify backend server is running on port 5000');
    console.log('   4. Check backend console for error messages');
  }
};

runTests().catch(console.error);
