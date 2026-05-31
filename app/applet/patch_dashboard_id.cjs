const fs = require('fs');
const path = require('path');

function patch(corePath) {
    const file = path.join('/app/applet/src/cores', corePath, 'MainDashboard.tsx');
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
        '<div className="flex h-screen bg-[#111111] text-white overflow-hidden font-sans">',
        '<div id="dashboard-root" className="flex h-screen bg-[#111111] text-white overflow-hidden font-sans">'
    );
    fs.writeFileSync(file, content);
}
patch('dummy');
patch('live');
