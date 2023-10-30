const { exec } = require('child_process');

exec('ps aux | grep btcagent', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }
  console.log(`Running processes:\n${stdout}`);
});
