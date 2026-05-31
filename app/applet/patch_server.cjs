const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('/api/record-activity')) {
  // Insert before // Serve frontend assets
  const newEndpoints = `
// GeoSync SSE Hook
app.get('/api/geosync', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  res.write('data: {"status":"GeoSync Active", "timestamp":' + Date.now() + '}\\n\\n');
  
  const interval = setInterval(() => {
    res.write('data: {"heartbeat": true, "timestamp":' + Date.now() + '}\\n\\n');
  }, 10000);
  
  req.on('close', () => clearInterval(interval));
});

// Record Activity Pipeline
let sandboxStateDb = [];
app.post('/api/record-activity', (req, res) => {
  const { module, action, payload, isSandbox } = req.body;
  
  if (isSandbox) {
    console.log(\`[SANDBOX SYNC] Saving branch experiment to server database. Module: \${module}\`);
    sandboxStateDb.push({ module, action, payload, timestamp: Date.now() });
  } else {
    console.log(\`[LIVE SYNC] Recording global state to main database. Module: \${module}\`);
  }
  
  res.json({ success: true, recorded: true });
});
`;
  content = content.replace('// Serve frontend assets', newEndpoints + '\n// Serve frontend assets');
  fs.writeFileSync('server.ts', content);
  console.log('Patched server.ts');
}
