const http = require('http');
const fs = require('fs');
const path = require('path');
const { JSDOM, ResourceLoader } = require('jsdom');

const server = http.createServer((req, res) => {
    let filePath = './dist' + req.url;
    if (filePath === './dist/') filePath = './dist/index.html';
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

server.listen(18765, () => {
    const html = fs.readFileSync('dist/index.html', 'utf-8');
    const resourceLoader = new ResourceLoader();
    const dom = new JSDOM(html, {
        url: 'http://localhost:18765/',
        runScripts: 'dangerously',
        resources: 'usable'
    });
    
    dom.window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
    dom.window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {}, addEventListener: ()=>{}, removeEventListener: ()=>{} });
    dom.window.HTMLCanvasElement.prototype.getContext = () => ({
        fillRect: ()=>{}, clearRect: ()=>{}, getImageData: ()=>( { data: new Uint8ClampedArray(4) } ), putImageData: ()=>{}, createImageData: ()=>( { data: new Uint8ClampedArray(4) } ), setTransform: ()=>{}, drawImage: ()=>{}, save: ()=>{}, fillText: ()=>{}, strokeText: ()=>{}, restore: ()=>{}, stroke: ()=>{}, beginPath: ()=>{}, moveTo: ()=>{}, lineTo: ()=>{}, closePath: ()=>{}, arc: ()=>{}, rect: ()=>{}, ellipse: ()=>{}, measureText: ()=>( { width: 0 } )
    });

    dom.window.console.log = (...args) => console.log('LOG:', ...args);
    dom.window.console.error = (...args) => console.log('ERR:', ...args);
    dom.window.console.warn = (...args) => console.log('WARN:', ...args);

    setTimeout(() => {
        console.log('JSDOM test complete.');
        process.exit(0);
    }, 4000);
});
