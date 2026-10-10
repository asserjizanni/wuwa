const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const lockFile = path.join(__dirname, '..', '.git', 'index.lock');
if (fs.existsSync(lockFile)) {
  console.log('Removing stale .git/index.lock...');
  fs.unlinkSync(lockFile);
}

try {
  console.log('Staging files...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('Committing changes...');
  execSync('git commit -m "Fix character and guide deletion and resolve unexpected JSON error"', { stdio: 'inherit' });

  console.log('Pushing to GitHub origin main...');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('✅ Successfully pushed to main! Live Netlify deployment triggered.');
} catch (err) {
  console.error('Error during git deploy:', err.message);
  process.exit(1);
}
