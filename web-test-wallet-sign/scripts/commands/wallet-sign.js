/**
 * Wallet Sign Commands
 * Handle MetaMask signature requests and transaction popups
 */

const path = require('path');
const fs = require('fs');

const { SCREENSHOTS_DIR } = require('../lib/config');
const {
  ensureBrowser,
  getContext,
  getPage,
  getMetaMaskExtensionId,
} = require('../lib/browser');

/**
 * Popup type detection patterns
 */
const POPUP_PATTERNS = {
  // Signature requests (no gas cost)
  signature: {
    indicators: [
      'Signature request',
      'Sign message',
      'personal_sign',
      'Sign typed data',
      'signTypedData',
      'eth_signTypedData',
      'Message:',
      'Sign this message',
    ],
    approveButton: [
      'button[data-testid="confirm-footer-button"]',
      'button[data-testid="signature-request-scroll-button"]',
      'button:has-text("Sign")',
      'button:has-text("Confirm")',
    ],
  },
  // Transaction requests (has gas cost)
  transaction: {
    indicators: [
      'Gas fee',
      'Estimated gas',
      'Max fee',
      'Total',
      'Amount',
      'Send',
      'Confirm transaction',
      'Contract interaction',
    ],
    errorIndicators: [
      'Insufficient funds',
      'insufficient funds',
      'not enough',
      'gas required exceeds',
      'cannot estimate gas',
      'execution reverted',
      'Error',
    ],
    approveButton: [
      'button[data-testid="confirm-footer-button"]',
      'button[data-testid="page-container-footer-next"]',
      'button:has-text("Confirm")',
      'button:has-text("Approve")',
    ],
    rejectButton: [
      'button[data-testid="confirm-footer-cancel-button"]',
      'button[data-testid="page-container-footer-cancel"]',
      'button:has-text("Reject")',
      'button:has-text("Cancel")',
    ],
  },
  // Connect requests (handled by wallet-connect, but detect here too)
  connect: {
    indicators: [
      'Connect with MetaMask',
      'Connect to this site',
      'Connect request',
    ],
    approveButton: [
      'button[data-testid="confirm-btn"]',
      'button:has-text("Connect")',
    ],
  },
};

/**
 * Find MetaMask popup/notification page
 */
async function findMetaMaskPopup(context, timeout = 10000) {
  const extensionId = getMetaMaskExtensionId();
  if (!extensionId) {
    return null;
  }

  // Check existing pages for notification
  const pages = context.pages();
  for (const p of pages) {
    const url = p.url();
    if (url.includes('chrome-extension://') &&
        (url.includes('notification') || url.includes('popup') || url.includes('confirm'))) {
      return p;
    }
  }

  // Try to open notification page directly
  try {
    const notificationUrl = `chrome-extension://${extensionId}/notification.html`;
    const popup = await context.newPage();
    await popup.goto(notificationUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await popup.waitForTimeout(2000);

    // Check if there's actually content (not empty notification)
    const hasContent = await popup.evaluate(() => {
      return document.body.innerText.length > 50;
    }).catch(() => false);

    if (hasContent) {
      return popup;
    }

    await popup.close().catch(() => {});
  } catch (e) {
    // Notification page might not have pending requests
  }

  // Wait for popup event
  try {
    const popup = await context.waitForEvent('page', { timeout });
    return popup;
  } catch (e) {
    return null;
  }
}

/**
 * Detect popup type by analyzing page content
 */
async function detectPopupType(popup) {
  try {
    const pageText = await popup.evaluate(() => document.body.innerText);
    const pageHtml = await popup.evaluate(() => document.body.innerHTML);

    // Check for error indicators first (for transactions)
    for (const errorText of POPUP_PATTERNS.transaction.errorIndicators) {
      if (pageText.includes(errorText) || pageHtml.includes(errorText)) {
        return {
          type: 'transaction',
          hasError: true,
          errorType: 'insufficient_gas',
          errorText: errorText,
        };
      }
    }

    // Check for signature patterns
    for (const indicator of POPUP_PATTERNS.signature.indicators) {
      if (pageText.includes(indicator) || pageHtml.includes(indicator)) {
        // Determine signature subtype
        let subtype = 'personal_sign';
        if (pageText.includes('signTypedData') || pageText.includes('typed data')) {
          subtype = 'signTypedData_v4';
        }
        return {
          type: 'signature',
          subtype: subtype,
          hasError: false,
        };
      }
    }

    // Check for transaction patterns
    for (const indicator of POPUP_PATTERNS.transaction.indicators) {
      if (pageText.includes(indicator) || pageHtml.includes(indicator)) {
        return {
          type: 'transaction',
          hasError: false,
        };
      }
    }

    // Check for connect patterns
    for (const indicator of POPUP_PATTERNS.connect.indicators) {
      if (pageText.includes(indicator) || pageHtml.includes(indicator)) {
        return {
          type: 'connect',
          hasError: false,
        };
      }
    }

    // Default to unknown
    return {
      type: 'unknown',
      hasError: false,
      pageText: pageText.substring(0, 500),
    };
  } catch (e) {
    return {
      type: 'error',
      hasError: true,
      errorText: e.message,
    };
  }
}

/**
 * Click approve button on popup
 */
async function clickApproveButton(popup, popupType) {
  const selectors = popupType === 'signature'
    ? POPUP_PATTERNS.signature.approveButton
    : popupType === 'connect'
      ? POPUP_PATTERNS.connect.approveButton
      : POPUP_PATTERNS.transaction.approveButton;

  for (const selector of selectors) {
    try {
      const btn = await popup.$(selector);
      if (btn) {
        const isVisible = await btn.isVisible().catch(() => false);
        const isEnabled = await btn.isEnabled().catch(() => false);

        if (isVisible && isEnabled) {
          await btn.scrollIntoViewIfNeeded().catch(() => {});
          await popup.waitForTimeout(200);
          await btn.click({ timeout: 5000 });
          return { success: true, selector };
        }
      }
    } catch (e) {
      continue;
    }
  }

  return { success: false };
}

/**
 * Click reject button on popup
 */
async function clickRejectButton(popup) {
  const selectors = POPUP_PATTERNS.transaction.rejectButton;

  for (const selector of selectors) {
    try {
      const btn = await popup.$(selector);
      if (btn) {
        const isVisible = await btn.isVisible().catch(() => false);
        const isEnabled = await btn.isEnabled().catch(() => false);

        if (isVisible && isEnabled) {
          await btn.scrollIntoViewIfNeeded().catch(() => {});
          await popup.waitForTimeout(200);
          await btn.click({ timeout: 5000 });
          return { success: true, selector };
        }
      }
    } catch (e) {
      continue;
    }
  }

  return { success: false };
}

/**
 * Take screenshot of popup
 */
async function takePopupScreenshot(popup, name) {
  try {
    const screenshotPath = path.join(SCREENSHOTS_DIR, name);
    await popup.screenshot({
      path: screenshotPath,
      type: 'jpeg',
      quality: 60,
    });
    return screenshotPath;
  } catch (e) {
    return null;
  }
}

const commands = {
  /**
   * Main wallet-sign command
   * Auto-detects popup type and handles appropriately
   */
  async 'wallet-sign'(args, options) {
    await ensureBrowser(options);

    const context = getContext();
    if (!context) {
      console.log(JSON.stringify({
        success: false,
        error: 'No browser context. Ensure wallet is connected first.',
      }));
      return;
    }

    const timeout = parseInt(options.timeout) || 30000;

    try {
      // Find MetaMask popup
      console.log(JSON.stringify({ status: 'info', message: 'Looking for MetaMask popup...' }));

      const popup = await findMetaMaskPopup(context, timeout);

      if (!popup) {
        console.log(JSON.stringify({
          success: false,
          error: 'No MetaMask popup found',
          hint: 'Make sure a DApp action triggered a wallet popup',
        }));
        return;
      }

      // Wait for popup to load
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      await popup.waitForTimeout(1500);

      // Take screenshot
      await takePopupScreenshot(popup, 'wallet-popup-before.jpg');

      // Detect popup type
      console.log(JSON.stringify({ status: 'info', message: 'Detecting popup type...' }));
      const popupInfo = await detectPopupType(popup);

      console.log(JSON.stringify({
        status: 'info',
        message: `Detected popup type: ${popupInfo.type}`,
        details: popupInfo,
      }));

      // Handle based on type
      if (popupInfo.type === 'signature') {
        // Signatures always get approved (no gas cost, low risk)
        console.log(JSON.stringify({
          status: 'info',
          message: `Approving ${popupInfo.subtype} signature request...`,
        }));

        const clickResult = await clickApproveButton(popup, 'signature');

        if (clickResult.success) {
          await popup.waitForTimeout(1000);
          await takePopupScreenshot(popup, 'wallet-popup-after.jpg');

          console.log(JSON.stringify({
            success: true,
            type: 'signature',
            subtype: popupInfo.subtype,
            action: 'approved',
            message: `${popupInfo.subtype} signature approved successfully`,
          }));
        } else {
          console.log(JSON.stringify({
            success: false,
            type: 'signature',
            error: 'Could not find approve button',
          }));
        }
        return;
      }

      if (popupInfo.type === 'transaction') {
        // Check for gas errors
        if (popupInfo.hasError) {
          // Take screenshot of error
          await takePopupScreenshot(popup, 'wallet-popup-gas-error.jpg');

          // Reject the transaction
          await clickRejectButton(popup);

          console.log(JSON.stringify({
            success: false,
            type: 'transaction',
            action: 'rejected',
            error: 'insufficient_gas',
            errorText: popupInfo.errorText,
            message: 'Transaction failed: insufficient funds for gas - TEST FAILED',
            testResult: 'FAIL',
          }));
          return;
        }

        // No error, approve transaction
        console.log(JSON.stringify({
          status: 'info',
          message: 'Approving transaction...',
        }));

        const clickResult = await clickApproveButton(popup, 'transaction');

        if (clickResult.success) {
          await popup.waitForTimeout(2000);
          await takePopupScreenshot(popup, 'wallet-popup-after.jpg');

          console.log(JSON.stringify({
            success: true,
            type: 'transaction',
            action: 'approved',
            message: 'Transaction approved and sent',
          }));
        } else {
          console.log(JSON.stringify({
            success: false,
            type: 'transaction',
            error: 'Could not find approve button',
          }));
        }
        return;
      }

      if (popupInfo.type === 'connect') {
        // Connect requests get approved
        console.log(JSON.stringify({
          status: 'info',
          message: 'Approving connect request...',
        }));

        const clickResult = await clickApproveButton(popup, 'connect');

        if (clickResult.success) {
          await popup.waitForTimeout(1000);

          console.log(JSON.stringify({
            success: true,
            type: 'connect',
            action: 'approved',
            message: 'Connect request approved',
          }));
        } else {
          console.log(JSON.stringify({
            success: false,
            type: 'connect',
            error: 'Could not find approve button',
          }));
        }
        return;
      }

      // Unknown type - try to approve anyway
      console.log(JSON.stringify({
        status: 'warning',
        message: 'Unknown popup type, attempting generic approval...',
        pagePreview: popupInfo.pageText,
      }));

      const clickResult = await clickApproveButton(popup, 'transaction');

      console.log(JSON.stringify({
        success: clickResult.success,
        type: 'unknown',
        action: clickResult.success ? 'approved' : 'failed',
        message: clickResult.success
          ? 'Unknown popup approved'
          : 'Could not find approve button for unknown popup type',
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `wallet-sign failed: ${error.message}`,
      }));
    }
  },

  /**
   * Reject any pending popup
   */
  async 'wallet-reject'(args, options) {
    await ensureBrowser(options);

    const context = getContext();
    if (!context) {
      console.log(JSON.stringify({
        success: false,
        error: 'No browser context',
      }));
      return;
    }

    try {
      const popup = await findMetaMaskPopup(context, 10000);

      if (!popup) {
        console.log(JSON.stringify({
          success: false,
          error: 'No MetaMask popup found to reject',
        }));
        return;
      }

      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      await takePopupScreenshot(popup, 'wallet-popup-reject.jpg');

      const result = await clickRejectButton(popup);

      console.log(JSON.stringify({
        success: result.success,
        action: 'rejected',
        message: result.success ? 'Popup rejected successfully' : 'Could not find reject button',
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `wallet-reject failed: ${error.message}`,
      }));
    }
  },

  /**
   * Check popup status without acting
   */
  async 'wallet-check'(args, options) {
    await ensureBrowser(options);

    const context = getContext();
    if (!context) {
      console.log(JSON.stringify({
        success: false,
        error: 'No browser context',
      }));
      return;
    }

    try {
      const popup = await findMetaMaskPopup(context, 5000);

      if (!popup) {
        console.log(JSON.stringify({
          success: true,
          hasPopup: false,
          message: 'No MetaMask popup detected',
        }));
        return;
      }

      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      const popupInfo = await detectPopupType(popup);

      await takePopupScreenshot(popup, 'wallet-popup-check.jpg');

      console.log(JSON.stringify({
        success: true,
        hasPopup: true,
        popupType: popupInfo.type,
        details: popupInfo,
        screenshot: 'wallet-popup-check.jpg',
        message: `MetaMask popup detected: ${popupInfo.type}`,
      }));

    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: `wallet-check failed: ${error.message}`,
      }));
    }
  },
};

module.exports = commands;
