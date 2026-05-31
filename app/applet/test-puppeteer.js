const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function run() {
    console.log('Starting Vite...');
    const vite = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });
    
    await new Promise(r => setTimeout(r, 6000)); // wait for Vite to boot

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    let isCrashed = false;
    let crashLog = "";

    page.on('console', msg => {
        const text = msg.text() || '';
        if (text.includes('Maximum update depth exceeded') || text.includes('Warning: Cannot update a component')) {
             isCrashed = true;
             crashLog += text + '\n';
        }
    });

    page.on('pageerror', err => {
        const text = err.toString();
        if (text.includes('Maximum update depth exceeded') || text.includes('Warning: Cannot update a component')) {
            isCrashed = true;
            crashLog += text + '\n';
        }
    });

    console.log('Testing App...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' }).catch(e => console.log('goto err', e));
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Test clicking navigation
    const routes = ['#seismic', '#electrical', '#gpr', '#diagnostics', '#spatial'];
    for (const r of routes) {
         console.log('Navigating to', r);
         await page.goto('http://localhost:3000/' + r);
         await new Promise(res => setTimeout(res, 2000));
    }

    if (isCrashed) {
         console.error('------- CRASH LOG DETECTED -------');
         console.error(crashLog);
         vite.kill();
         process.exit(1);
    } else {
         console.log('No loop found.');
         vite.kill();
         process.exit(0);
    }
}
run();
