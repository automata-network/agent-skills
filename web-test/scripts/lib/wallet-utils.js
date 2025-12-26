/**
 * Wallet Utilities
 * Shared functions for handling MetaMask popups during testing
 */

const { getMetaMaskExtensionId } = require('./browser');

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
  // Connect requests
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
 * @param {BrowserContext} context - Playwright browser context
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Page|null>} - MetaMask popup page or null
 */
async function findMetaMaskPopup(context, timeout = 3000) {
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
    await popup.goto(notificationUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
    // Wait for button to appear instead of fixed timeout
    await popup.waitForSelector('button', { timeout: 2000 }).catch(() => {});

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
 * @param {Page} popup - MetaMask popup page
 * @returns {Promise<Object>} - Popup type info
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
 * @param {Page} popup - MetaMask popup page
 * @param {string} popupType - Type of popup (signature, transaction, connect)
 * @returns {Promise<Object>} - Result with success status
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
          await popup.waitForTimeout(100);
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
 * @param {Page} popup - MetaMask popup page
 * @returns {Promise<Object>} - Result with success status
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
          await popup.waitForTimeout(100);
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
 * Handle wallet popup after a click action
 * This is the main entry point for automatic wallet popup handling
 *
 * @param {BrowserContext} context - Playwright browser context
 * @param {string} action - Action to take: 'approve' (default) or 'reject'
 * @param {number} timeout - Timeout to wait for popup (default 3000ms)
 * @returns {Promise<Object>} - Result object with popup handling status
 */
async function handleWalletPopup(context, action = 'approve', timeout = 3000) {
  // Small delay to let popup appear
  await new Promise(resolve => setTimeout(resolve, 300));

  // Try to find popup
  const popup = await findMetaMaskPopup(context, timeout);

  if (!popup) {
    return { hasPopup: false };
  }

  // Wait for popup to load and content to appear
  await popup.waitForLoadState('domcontentloaded').catch(() => {});
  await popup.waitForSelector('button', { timeout: 2000 }).catch(() => {});

  // Detect popup type
  const popupInfo = await detectPopupType(popup);

  // Handle based on action
  if (action === 'reject') {
    const result = await clickRejectButton(popup);
    return {
      hasPopup: true,
      type: popupInfo.type,
      subtype: popupInfo.subtype,
      action: 'rejected',
      success: result.success,
    };
  }

  // Default: approve
  // Check for gas errors (only for transactions)
  if (popupInfo.hasError) {
    await clickRejectButton(popup);
    return {
      hasPopup: true,
      type: popupInfo.type,
      action: 'rejected',
      error: popupInfo.errorText,
      errorType: popupInfo.errorType,
      success: false,
      testFailed: true,
    };
  }

  // Approve the popup
  const result = await clickApproveButton(popup, popupInfo.type);

  // Wait for popup to close after approval (faster than fixed timeout)
  if (result.success) {
    try {
      await popup.waitForEvent('close', { timeout: 3000 });
    } catch (e) {
      // Popup didn't close, wait briefly and continue
      await popup.waitForTimeout(200);
    }
  }

  return {
    hasPopup: true,
    type: popupInfo.type,
    subtype: popupInfo.subtype,
    action: 'approved',
    success: result.success,
  };
}

module.exports = {
  POPUP_PATTERNS,
  findMetaMaskPopup,
  detectPopupType,
  clickApproveButton,
  clickRejectButton,
  handleWalletPopup,
};
