const { spawn } = require('child_process');
const server = spawn('node', ['dist/server.cjs'], {
  env: { ...process.env, PORT: 3001 }
});
server.stdout.on('data', data => console.log(`stdout: ${data}`));
server.stderr.on('data', data => console.error(`stderr: ${data}`));
server.on('close', code => console.log(`child process exited with code ${code}`));
setTimeout(() => {
  server.kill();
  console.log('Killed after 3 seconds');
}, 3000);
