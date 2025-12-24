/**
 * Configuration and constants for Playwright Helper
 */

const path = require('path');
const fs = require('fs');

// Configuration paths - relative to current working directory (project root)
// This ensures test-output is created in the directory where the command is run
const OUTPUT_DIR = path.resolve(process.cwd(), 'test-output');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const EXTENSIONS_DIR = path.join(OUTPUT_DIR, 'extensions');
const STATE_FILE = path.join(OUTPUT_DIR, '.browser-state.json');
const CDP_FILE = path.join(OUTPUT_DIR, '.browser-cdp.json');
const DEV_SERVER_FILE = path.join(OUTPUT_DIR, '.dev-server.json');
const USER_DATA_DIR = path.join(OUTPUT_DIR, 'chrome-profile');
const CDP_PORT = 9222;

// Wallet extension configuration
const METAMASK_WEBSTORE_URL = 'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';

// Network configurations for Web3
const NETWORKS = {
  ethereum: { chainId: '0x1', name: 'Ethereum Mainnet' },
  polygon: { chainId: '0x89', name: 'Polygon' },
  arbitrum: { chainId: '0xa4b1', name: 'Arbitrum One' },
  optimism: { chainId: '0xa', name: 'Optimism' },
  base: { chainId: '0x2105', name: 'Base' },
  bsc: { chainId: '0x38', name: 'BNB Smart Chain' },
  avalanche: { chainId: '0xa86a', name: 'Avalanche C-Chain' },
  goerli: { chainId: '0x5', name: 'Goerli Testnet' },
  sepolia: { chainId: '0xaa36a7', name: 'Sepolia Testnet' },
};

// Screenshot settings
const SCREENSHOT_FORMAT = process.env.SCREENSHOT_FORMAT || 'jpeg';
const SCREENSHOT_QUALITY = parseInt(process.env.SCREENSHOT_QUALITY) || 60;

// Ensure output directories exist
function ensureDirectories() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  if (!fs.existsSync(EXTENSIONS_DIR)) fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });
}

// Initialize directories on module load
ensureDirectories();

module.exports = {
  OUTPUT_DIR,
  SCREENSHOTS_DIR,
  EXTENSIONS_DIR,
  STATE_FILE,
  CDP_FILE,
  DEV_SERVER_FILE,
  USER_DATA_DIR,
  CDP_PORT,
  METAMASK_WEBSTORE_URL,
  NETWORKS,
  SCREENSHOT_FORMAT,
  SCREENSHOT_QUALITY,
  ensureDirectories,
};