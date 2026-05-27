const Service = require('node-windows').Service;
const path = require('path');

// Read env variables to pass to the service
const fs = require('fs');
const envPath = path.join(__dirname, '.env.local');
const envVars = [];

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      envVars.push({ name: key, value: val });
    }
  }
}

// Add static env vars
envVars.push({ name: 'NODE_ENV', value: 'production' });
envVars.push({ name: 'PORT', value: '3001' });

// Create a new service object
const svc = new Service({
  name: 'TarikAIBot',
  description: 'Tarik AI WhatsApp Bot running 24/7',
  // On Windows, running tsx directly might fail in a service, so we tell node to use --import tsx
  script: path.join(__dirname, 'server.ts'),
  nodeOptions: [
    '--import', 'tsx',
    '--max-old-space-size=512'
  ],
  env: envVars,
  wait: 5,
  grow: .5,
  maxRestarts: 50
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', function() {
  console.log('Service installed successfully!');
  console.log('Starting service...');
  svc.start();
});

// Listen for the "start" event and let us know when the process has actually started working.
svc.on('start', function() {
  console.log('Service is now running in the background!');
});

// Install the script as a service.
console.log('Installing Windows Service...');
svc.install();
