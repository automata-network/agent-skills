#!/usr/bin/env node
/**
 * Wallet Connection Flow Script
 *
 * Complete automated wallet connection flow for Rainbow/Privy DApps.
 * Handles wallet setup, import, and DApp connection with retry logic.
 *
 * Usage:
 *   node wallet-connect-flow.js <dapp-url> [options]
 *
 * Prerequisites:
 *   WALLET_PRIVATE_KEY must be set in tests/.test-env file
 *
 * Options:
 *   --max-retries <n>    Maximum retry attempts (default: 3)
 *   --headed             Run with visible browser
 *   --skip-setup         Skip wallet setup (if already installed)
 *   --skip-import        Skip wallet import (if already imported)
 *
 * Exit codes:
 *   0 - Success (wallet connected)
 *   1 - Failed after all retries
 *   2 - Configuration error (missing private key, etc.)
 */

const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const SCRIPT_DIR = __dirname;
const TEST_HELPER = path.join(SCRIPT_DIR, "test-helper.js");

// .test-env file path - stored in tests/ directory (persistent, not cleaned before tests)
const TEST_ENV_FILE = path.join(process.cwd(), "tests", ".test-env");

/**
 * Read sensitive values from .test-env file
 * This file should NOT be committed to git or exposed to external APIs
 * @returns {Object} Object with WALLET_PRIVATE_KEY and WALLET_PASSWORD
 */
function readTestEnv() {
  const result = {
    WALLET_PRIVATE_KEY: null,
    WALLET_PASSWORD: null,
  };

  if (!fs.existsSync(TEST_ENV_FILE)) {
    return result;
  }

  try {
    const content = fs.readFileSync(TEST_ENV_FILE, "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;

      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key === "WALLET_PRIVATE_KEY" || key === "WALLET_PASSWORD") {
        result[key] = value;
      }
    }
  } catch (e) {
    console.error(`[WARN] Failed to read .test-env: ${e.message}`);
  }

  return result;
}

// Configuration
const CONFIG = {
  maxRetries: 3,
  headed: false,
  skipSetup: false,
  skipImport: false,
  dappUrl: null,
  retryDelayMs: 3000,
  connectionTimeoutMs: 30000,
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (arg === "--max-retries" && args[i + 1]) {
      CONFIG.maxRetries = parseInt(args[++i]) || 3;
    } else if (arg === "--headed") {
      CONFIG.headed = true;
    } else if (arg === "--skip-setup") {
      CONFIG.skipSetup = true;
    } else if (arg === "--skip-import") {
      CONFIG.skipImport = true;
    } else if (!arg.startsWith("--")) {
      CONFIG.dappUrl = arg;
    }
    i++;
  }
}

// Run test-helper command and return result
function runCommand(command, args = [], options = {}) {
  const headedFlag = CONFIG.headed ? "--headed" : "--headless";
  const fullArgs = [
    TEST_HELPER,
    command,
    ...args,
    headedFlag,
    "--wallet",
    "--keep-open",
  ];

  if (options.extraArgs) {
    fullArgs.push(...options.extraArgs);
  }

  const cmdStr = `node ${fullArgs.join(" ")}`;
  console.log(`[CMD] ${cmdStr}`);

  try {
    const output = execSync(cmdStr, {
      encoding: "utf8",
      timeout: options.timeout || 60000,
      env: process.env,
    });

    // Try to parse JSON output
    const lines = output.trim().split("\n");
    for (const line of lines.reverse()) {
      try {
        return JSON.parse(line);
      } catch (e) {
        continue;
      }
    }
    return { success: true, output };
  } catch (error) {
    console.error(`[ERROR] Command failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Take screenshot and return path
function takeScreenshot(name) {
  const result = runCommand("vision-screenshot", [name]);
  return result.screenshot || `./test-output/screenshots/${name}`;
}

// Step 1: Setup wallet extension
async function setupWallet() {
  if (CONFIG.skipSetup) {
    console.log("[STEP 1] Skipping wallet setup (--skip-setup)");
    return true;
  }

  console.log("[STEP 1] Setting up wallet extension...");
  const result = runCommand("wallet-setup", []);

  if (!result.success && !result.message?.includes("already installed")) {
    console.error("[STEP 1] Wallet setup failed");
    return false;
  }

  console.log("[STEP 1] Wallet extension ready");
  return true;
}

// Step 2: Initialize/Import wallet
async function importWallet() {
  if (CONFIG.skipImport) {
    console.log("[STEP 2] Skipping wallet import (--skip-import)");
    return true;
  }

  console.log("[STEP 2] Initializing wallet...");
  const result = runCommand("wallet-init", [], { timeout: 120000 });

  if (!result.success) {
    console.error("[STEP 2] Wallet initialization failed:", result.error);
    return false;
  }

  console.log("[STEP 2] Wallet initialized successfully");
  return true;
}

// Step 3: Navigate to DApp
async function navigateToDApp() {
  console.log(`[STEP 3] Navigating to DApp: ${CONFIG.dappUrl}`);
  const result = runCommand("wallet-navigate", [CONFIG.dappUrl], {
    timeout: 60000,
  });

  if (!result.success) {
    console.error("[STEP 3] Navigation failed:", result.error);
    return false;
  }

  // Wait for page to load
  runCommand("wait", ["3000"]);
  takeScreenshot("dapp-initial.jpg");

  console.log("[STEP 3] DApp loaded");
  return true;
}

// Step 4: Detect if wallet connection is needed
function detectWalletConnectionNeeded() {
  console.log("[STEP 4] Checking if wallet connection is needed...");

  // Take screenshot for analysis
  takeScreenshot("connection-check.jpg");

  // Check page content for connection indicators
  const contentResult = runCommand("content", []);
  const pageContent = contentResult.content || contentResult.output || "";

  // Patterns indicating wallet is NOT connected (need to connect)
  const needsConnectionPatterns = [
    /connect\s*wallet/i,
    /connect\s*a\s*wallet/i,
    /sign\s*in/i,
    /login/i,
    /get\s*started/i,
  ];

  // Patterns indicating wallet IS connected
  const connectedPatterns = [
    /0x[a-fA-F0-9]{4,}\.{0,3}[a-fA-F0-9]{0,4}/, // Wallet address like 0x1234...5678
    /disconnect/i,
    /logout/i,
    /connected/i,
    /profile/i,
  ];

  const needsConnection = needsConnectionPatterns.some((p) =>
    p.test(pageContent)
  );
  const isConnected = connectedPatterns.some((p) => p.test(pageContent));

  if (isConnected && !needsConnection) {
    console.log("[STEP 4] Wallet appears to be already connected");
    return { needed: false, connected: true };
  }

  if (needsConnection) {
    console.log("[STEP 4] Wallet connection is needed");
    return { needed: true, connected: false };
  }

  console.log("[STEP 4] Connection status unclear, assuming connection needed");
  return { needed: true, connected: false };
}

// Step 5: Verify wallet connection success
function verifyWalletConnection() {
  console.log("[VERIFY] Checking wallet connection status...");

  // Wait for UI to update
  runCommand("wait", ["2000"]);

  // Take screenshot for verification
  const screenshotPath = takeScreenshot("connection-verify.jpg");

  // Check page content
  const contentResult = runCommand("content", []);
  const pageContent = contentResult.content || contentResult.output || "";

  // Success indicators
  const successPatterns = [
    /0x[a-fA-F0-9]{4,}/, // Wallet address visible
    /disconnect/i, // Disconnect button visible
    /connected/i, // "Connected" text
    /profile/i, // Profile link/button
    /logout/i, // Logout option
  ];

  // Failure indicators (still showing connection UI)
  const failurePatterns = [
    /connect\s*wallet/i,
    /connect\s*a\s*wallet/i,
    /sign\s*in\s*with/i,
  ];

  const hasSuccessIndicator = successPatterns.some((p) => p.test(pageContent));
  const hasFailureIndicator = failurePatterns.some((p) => p.test(pageContent));

  // Success if we have success indicators and no failure indicators
  // OR if the main "Connect Wallet" button is gone
  if (hasSuccessIndicator && !hasFailureIndicator) {
    console.log(
      "[VERIFY] Wallet connection VERIFIED - success indicators found"
    );
    return { success: true, screenshot: screenshotPath };
  }

  if (!hasFailureIndicator && !hasSuccessIndicator) {
    // Ambiguous state - might be connected, take another screenshot
    console.log(
      "[VERIFY] Connection status ambiguous, checking button state..."
    );

    // Try to find connect wallet button
    const listResult = runCommand("list-elements", []);
    const elements = listResult.elements || [];

    const connectButton = elements.find(
      (el) => /connect.*wallet/i.test(el.text) || /sign\s*in/i.test(el.text)
    );

    if (!connectButton) {
      console.log("[VERIFY] Connect button not found - assuming connected");
      return { success: true, screenshot: screenshotPath };
    }
  }

  console.log(
    "[VERIFY] Wallet connection FAILED - still showing connection UI"
  );
  return { success: false, screenshot: screenshotPath };
}

// Main connection flow with retry
async function connectWalletWithRetry() {
  let attempt = 0;

  while (attempt < CONFIG.maxRetries) {
    attempt++;
    console.log(
      `\n========== CONNECTION ATTEMPT ${attempt}/${CONFIG.maxRetries} ==========\n`
    );

    try {
      // Navigate to DApp (re-navigate on retry)
      if (attempt > 1) {
        console.log("[RETRY] Re-navigating to DApp...");
        runCommand("browser-close", []);
        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!(await navigateToDApp())) {
        throw new Error("Failed to navigate to DApp");
      }

      // Check if connection is needed
      const status = detectWalletConnectionNeeded();

      if (status.connected) {
        console.log("\n[SUCCESS] Wallet already connected!");
        return { success: true, attempt };
      }

      // Output instructions for AI agent to complete connection
      console.log(
        "\n[ACTION REQUIRED] AI agent must now complete wallet connection:"
      );
      console.log('1. Find and click "Connect Wallet" or "Sign In" button');
      console.log(
        '2. In Rainbow/Privy modal, click "Installed" or wallet icon'
      );
      console.log("3. Approve connection in Rabby wallet popup");
      console.log("4. If signature is required, approve it");
      console.log(
        "\nUse vision-screenshot and vision-click commands to interact."
      );
      console.log(
        "Screenshot saved to: ./test-output/screenshots/connection-check.jpg\n"
      );

      // Return with instructions - AI agent will take over
      return {
        success: false,
        needsManualConnection: true,
        attempt,
        instructions: [
          "Use vision-screenshot to see current page state",
          "Use vision-click to click Connect Wallet button",
          "Use vision-click to select wallet in Rainbow/Privy modal",
          "Use vision-click to approve in Rabby popup",
          "Run: node wallet-connect-flow.js --skip-setup --skip-import <url> to verify",
        ],
      };
    } catch (error) {
      console.error(`[ATTEMPT ${attempt}] Error: ${error.message}`);

      if (attempt < CONFIG.maxRetries) {
        console.log(`[RETRY] Waiting ${CONFIG.retryDelayMs}ms before retry...`);
        await new Promise((r) => setTimeout(r, CONFIG.retryDelayMs));
      }
    }
  }

  return { success: false, attempt, error: "Max retries exceeded" };
}

// Main execution
async function main() {
  parseArgs();

  console.log("========================================");
  console.log("  WALLET CONNECTION FLOW");
  console.log("========================================");
  console.log(`DApp URL: ${CONFIG.dappUrl || "(not specified)"}`);
  console.log(`Max Retries: ${CONFIG.maxRetries}`);
  console.log(`Headed Mode: ${CONFIG.headed}`);
  console.log("========================================\n");

  // Validate configuration
  if (!CONFIG.dappUrl) {
    console.error("[ERROR] DApp URL is required");
    console.error("Usage: node wallet-connect-flow.js <dapp-url>");
    process.exit(2);
  }

  // Read sensitive values from .test-env file
  const testEnv = readTestEnv();
  if (!testEnv.WALLET_PRIVATE_KEY) {
    console.error("[ERROR] WALLET_PRIVATE_KEY not found in .test-env file");
    console.error(`Expected file: ${TEST_ENV_FILE}`);
    console.error("Ensure tests/.test-env exists with WALLET_PRIVATE_KEY");
    process.exit(2);
  }

  // Step 1: Setup wallet
  if (!(await setupWallet())) {
    console.error("\n[FATAL] Wallet setup failed");
    process.exit(1);
  }

  // Step 2: Import wallet
  if (!(await importWallet())) {
    console.error("\n[FATAL] Wallet import failed");
    process.exit(1);
  }

  // Step 3-5: Connect to DApp with retry
  const result = await connectWalletWithRetry();

  if (result.success) {
    console.log("\n========================================");
    console.log("  WALLET CONNECTION SUCCESSFUL");
    console.log(`  Attempts: ${result.attempt}`);
    console.log("========================================\n");
    process.exit(0);
  } else if (result.needsManualConnection) {
    console.log("\n========================================");
    console.log("  MANUAL CONNECTION REQUIRED");
    console.log("  AI agent must complete connection");
    console.log("========================================\n");
    // Exit with code 0 - script did its job, AI takes over
    process.exit(0);
  } else {
    console.error("\n========================================");
    console.error("  WALLET CONNECTION FAILED");
    console.error(`  Attempts: ${result.attempt}`);
    console.error(`  Error: ${result.error}`);
    console.error("========================================\n");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[FATAL]", error);
  process.exit(1);
});
