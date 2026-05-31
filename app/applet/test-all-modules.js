const http = require('http');
const fs = require('fs');
const path = require('path');
const { JSDOM, ResourceLoader } = require('jsdom');

const testPaths = [
  '/', '/seismic', '/well-logging', '/spatial', '/gravity-mag', 
  '/electrical', '/microseismic', '/geochem', '/gpr', '/meteo', 
  '/groundwater', '/soil-ph', '/radiometric', '/tilt-extenso', 
  '/gas-air', '/ai-consultant', '/simulation', '/diagnostics'
];

const server = http.createServer((req, res) => {
    let filePath = './dist' + req.url;
    if (path.extname(filePath) === '') filePath = './dist/index.html';
    let extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
    }
    fs.readFile(filePath, (error, content) => {
        if (error) { res.writeHead(404); res.end('Error', 'utf-8'); }
        else { res.writeHead(200, { 'Content-Type': contentType }); res.end(content, 'utf-8'); }
    });
});

server.listen(18765, async () => {
    console.log('[Server Started]');
    
    for (const testPath of testPaths) {
       console.log(`Testing path: ${testPath}`);
       await new Promise((resolve) => {
           const html = fs.readFileSync('dist/index.html', 'utf-8');
           const dom = new JSDOM(html, {
               url: 'http://localhost:18765/#' + testPath,
               runScripts: 'dangerously',
               resources: 'usable'
           });
           
           dom.window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
           dom.window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {}, addEventListener: ()=>{}, removeEventListener: ()=>{} });
           dom.window.HTMLCanvasElement.prototype.getContext = () => ({ fillRect: ()=>{}, clearRect: ()=>{}, getImageData: ()=>( { data: new Uint8ClampedArray(4) } ), putImageData: ()=>{}, createImageData: ()=>( { data: new Uint8ClampedArray(4) } ), setTransform: ()=>{}, drawImage: ()=>{}, save: ()=>{}, fillText: ()=>{}, strokeText: ()=>{}, restore: ()=>{}, stroke: ()=>{}, beginPath: ()=>{}, moveTo: ()=>{}, lineTo: ()=>{}, closePath: ()=>{}, arc: ()=>{}, rect: ()=>{}, ellipse: ()=>{}, measureText: ()=>( { width: 0 } )});

           dom.window.console.log = () => {};
           dom.window.console.warn = () => {};
           dom.window.console.error = (...args) => {
              const msg = args.join(' ');
              if (msg.includes('Maximum update depth exceeded') || msg.includes('Warning: Cannot update a component')) {
                  console.error(`\n[!!!] FOUND INFINITE LOOP IN ${testPath}`);
                  console.error(msg);
                  process.exit(1);
              }
           };

           setTimeout(() => {
               dom.window.close();
               resolve();
           }, 1000);
       });
    }

    console.log('All paths tested successfully without infinite loops.');
    process.exit(0);
});
