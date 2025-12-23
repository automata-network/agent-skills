/**
 * Utility functions for Playwright Helper
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const net = require('net');
const { execSync } = require('child_process');

// Download file from URL
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', reject);
  });
}

// Extract CRX extension
async function extractCrx(crxPath, destDir) {
  try {
    execSync(`unzip -o "${crxPath}" -d "${destDir}" 2>/dev/null || true`);
    return true;
  } catch (e) {
    // Try alternative: remove CRX header and unzip
    const buffer = fs.readFileSync(crxPath);
    // Find ZIP signature (PK)
    let zipStart = 0;
    for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
      if (buffer[i] === 0x50 && buffer[i + 1] === 0x4B) {
        zipStart = i;
        break;
      }
    }
    const zipBuffer = buffer.slice(zipStart);
    const zipPath = crxPath.replace('.crx', '.zip');
    fs.writeFileSync(zipPath, zipBuffer);
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`);
    return true;
  }
}

// Check if a port is available
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

// Find an available port starting from startPort
async function findAvailablePort(startPort, maxTries = 10) {
  for (let i = 0; i < maxTries; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found in range ${startPort}-${startPort + maxTries - 1}`);
}

// Detect package manager based on lock files
function detectPackageManager(projectDir) {
  if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(projectDir, 'package-lock.json'))) return 'npm';
  return 'npm'; // default
}

// Detect framework based on config files and package.json
function detectFramework(projectDir) {
  // Check for config files
  if (fs.existsSync(path.join(projectDir, 'vite.config.js')) ||
      fs.existsSync(path.join(projectDir, 'vite.config.ts')) ||
      fs.existsSync(path.join(projectDir, 'vite.config.mjs'))) {
    return 'vite';
  }
  if (fs.existsSync(path.join(projectDir, 'next.config.js')) ||
      fs.existsSync(path.join(projectDir, 'next.config.mjs')) ||
      fs.existsSync(path.join(projectDir, 'next.config.ts'))) {
    return 'next';
  }

  // Check package.json for clues
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['vite']) return 'vite';
      if (deps['next']) return 'next';
      if (deps['react-scripts']) return 'cra';
      if (deps['@angular/cli']) return 'angular';
      if (deps['vue']) return 'vue';
    } catch (e) {}
  }

  return 'unknown';
}

// Get the dev server command for a framework
function getDevCommand(framework, packageManager, port) {
  const runCmd = packageManager === 'npm' ? 'npm run' : packageManager;

  switch (framework) {
    case 'vite':
      return `${runCmd} dev -- --port ${port}`;
    case 'next':
      return `${runCmd} dev -- -p ${port}`;
    case 'cra':
      return `PORT=${port} ${runCmd} start`;
    case 'angular':
      return `${runCmd} start -- --port ${port}`;
    case 'vue':
      return `${runCmd} serve -- --port ${port}`;
    default:
      // Try generic npm start with PORT env var
      return `PORT=${port} ${runCmd} dev || PORT=${port} ${runCmd} start`;
  }
}

// Wait for server to be ready
async function waitForServer(url, timeoutMs = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return true; // Server is responding
    } catch (e) {
      await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
    }
  }
  return false;
}

// Parse command line arguments
function parseArgs(args) {
  const result = {
    command: args[0],
    args: [],
    options: {
      screenshot: null,
      wait: 0,
      mobile: false,
      headless: true,
      timeout: 10000,
      wallet: false,
      network: 'ethereum',
      keepOpen: false,
    }
  };

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const option = arg.slice(2);
      if (option === 'mobile' || option === 'headed' || option === 'wallet' || option === 'keep-open' || option === 'fail-fast') {
        if (option === 'headed') {
          result.options.headless = false;
        } else if (option === 'wallet') {
          result.options.wallet = true;
        } else if (option === 'keep-open') {
          result.options.keepOpen = true;
        } else if (option === 'fail-fast') {
          result.options.failFast = true;
        } else {
          result.options[option] = true;
        }
      } else if (option === 'headless') {
        result.options.headless = true;
      } else if (option === 'max-parallel' && i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result.options.maxParallel = parseInt(args[++i]) || 5;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result.options[option] = args[++i];
      }
    } else {
      result.args.push(arg);
    }
    i++;
  }

  return result;
}

module.exports = {
  downloadFile,
  extractCrx,
  isPortAvailable,
  findAvailablePort,
  detectPackageManager,
  detectFramework,
  getDevCommand,
  waitForServer,
  parseArgs,
};
