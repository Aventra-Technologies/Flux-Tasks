const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Loads environment variables from the root .env file if it exists.
 */
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        // Remove surrounding quotes if any
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

/**
 * Compiles the frontend, electron main/preload, and packs the unpacked app folder.
 * Returns the path to the win-unpacked directory.
 */
function runCompilation() {
  console.log('\n--- Step 1: Compiling Frontend and Electron App ---');
  try {
    console.log('Running: npm run build:frontend...');
    execSync('npm run build:frontend', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    console.log('\nRunning: npm run build:electron...');
    execSync('npm run build:electron', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    console.log('\nRunning: npx electron-builder --win dir...');
    execSync('npx electron-builder --win dir', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (error) {
    console.error('Build compilation failed:', error.message);
    process.exit(1);
  }

  // Verify unpackaged directory exists
  const unpackedDir = path.join(__dirname, '..', 'release', 'win-unpacked');
  if (!fs.existsSync(unpackedDir)) {
    console.error(`Error: Unpacked directory does not exist at ${unpackedDir}`);
    process.exit(1);
  }
  return unpackedDir;
}

/**
 * Escapes unsafe XML characters.
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

module.exports = {
  loadEnv,
  runCompilation,
  escapeXml
};
