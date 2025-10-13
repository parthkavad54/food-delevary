#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Food Delivery Application...\n');

// Start backend server
console.log('📦 Starting Backend Server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => {
  console.error('❌ Failed to start backend:', err);
});

backend.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

// Wait a moment for backend to start
setTimeout(() => {
  console.log('\n🌐 Backend should be running on http://localhost:5000');
  console.log('🌐 Frontend is served by backend at http://localhost:5000');
  console.log('\n📝 Available endpoints:');
  console.log('   - Health Check: http://localhost:5000/health');
  console.log('   - API Base: http://localhost:5000/api');
  console.log('   - Frontend: http://localhost:5000');
  console.log('\n✨ Your food delivery app is ready!');
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill('SIGTERM');
  process.exit(0);
});

