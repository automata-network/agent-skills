/**
 * Network emulation commands for testing
 *
 * Provides capabilities for:
 * - Network latency simulation
 * - Offline mode
 * - API response mocking
 * - Network condition throttling
 */

const { ensureBrowser, getPage, getContext } = require('../lib/browser');

// Store active route handlers for cleanup
const activeRoutes = new Map();
let globalLatency = 0;
let isOffline = false;

const commands = {
  /**
   * Set network conditions (latency, offline mode)
   * Usage:
   *   set-network --latency 3000        # Add 3s delay to all requests
   *   set-network --offline             # Simulate offline mode
   *   set-network --latency 0           # Remove latency
   *   set-network --online              # Go back online
   */
  async 'set-network'(args, options) {
    await ensureBrowser(options);
    const context = getContext();
    const page = getPage();

    // Handle offline mode
    if (options.offline) {
      await context.setOffline(true);
      isOffline = true;
      console.log(JSON.stringify({
        success: true,
        action: 'set-network',
        mode: 'offline',
        message: 'Network set to offline mode. All requests will fail.'
      }));
      return;
    }

    // Handle online mode (restore from offline)
    if (options.online) {
      await context.setOffline(false);
      isOffline = false;
      console.log(JSON.stringify({
        success: true,
        action: 'set-network',
        mode: 'online',
        message: 'Network restored to online mode.'
      }));
      return;
    }

    // Handle latency simulation
    if (options.latency !== undefined) {
      const latency = parseInt(options.latency);

      if (isNaN(latency) || latency < 0) {
        console.log(JSON.stringify({
          success: false,
          error: 'Latency must be a non-negative number in milliseconds'
        }));
        return;
      }

      // Remove existing latency route if any
      if (activeRoutes.has('latency')) {
        await page.unroute('**/*', activeRoutes.get('latency'));
        activeRoutes.delete('latency');
      }

      globalLatency = latency;

      if (latency > 0) {
        // Add latency to all requests
        const latencyHandler = async (route) => {
          await new Promise(resolve => setTimeout(resolve, latency));
          await route.continue();
        };

        await page.route('**/*', latencyHandler);
        activeRoutes.set('latency', latencyHandler);

        console.log(JSON.stringify({
          success: true,
          action: 'set-network',
          latency: latency,
          message: `Added ${latency}ms delay to all network requests`
        }));
      } else {
        console.log(JSON.stringify({
          success: true,
          action: 'set-network',
          latency: 0,
          message: 'Network latency removed'
        }));
      }
      return;
    }

    // No valid options provided
    console.log(JSON.stringify({
      success: false,
      error: 'No network option specified',
      usage: [
        'set-network --latency <ms>  # Add delay to requests',
        'set-network --offline       # Simulate offline mode',
        'set-network --online        # Restore online mode'
      ]
    }));
  },

  /**
   * Mock a specific API route with custom response
   * Usage:
   *   mock-route "/api/users" --status 500 --body "Server Error"
   *   mock-route "/api/data" --status 200 --json '{"data": []}'
   *   mock-route "/api/*" --status 404
   *   mock-route "/api/slow" --delay 5000 --status 200
   */
  async 'mock-route'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const pattern = args[0];
    if (!pattern) {
      console.log(JSON.stringify({
        success: false,
        error: 'URL pattern required',
        usage: 'mock-route "<pattern>" --status <code> [--body <text>] [--json <json>] [--delay <ms>]'
      }));
      return;
    }

    const status = parseInt(options.status) || 200;
    const delay = parseInt(options.delay) || 0;
    const body = options.body || options.json || '';
    const contentType = options.json ? 'application/json' : 'text/plain';

    // Create route handler
    const mockHandler = async (route) => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await route.fulfill({
        status: status,
        contentType: contentType,
        body: body
      });
    };

    // Remove existing handler for this pattern if any
    const routeKey = `mock:${pattern}`;
    if (activeRoutes.has(routeKey)) {
      await page.unroute(pattern, activeRoutes.get(routeKey));
    }

    // Add new handler
    await page.route(pattern, mockHandler);
    activeRoutes.set(routeKey, mockHandler);

    console.log(JSON.stringify({
      success: true,
      action: 'mock-route',
      pattern: pattern,
      status: status,
      delay: delay,
      contentType: contentType,
      bodyPreview: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
      message: `Route "${pattern}" will return ${status} ${delay > 0 ? `after ${delay}ms delay` : ''}`
    }));
  },

  /**
   * Mock API error (convenience wrapper)
   * Usage:
   *   mock-api-error "/api/data" --status 500
   *   mock-api-error "/api/users" --status 503 --message "Service Unavailable"
   */
  async 'mock-api-error'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const pattern = args[0];
    if (!pattern) {
      console.log(JSON.stringify({
        success: false,
        error: 'URL pattern required',
        usage: 'mock-api-error "<pattern>" --status <code> [--message <text>]'
      }));
      return;
    }

    const status = parseInt(options.status) || 500;
    const message = options.message || getDefaultErrorMessage(status);
    const body = JSON.stringify({ error: message, status: status });

    const errorHandler = async (route) => {
      await route.fulfill({
        status: status,
        contentType: 'application/json',
        body: body
      });
    };

    const routeKey = `error:${pattern}`;
    if (activeRoutes.has(routeKey)) {
      await page.unroute(pattern, activeRoutes.get(routeKey));
    }

    await page.route(pattern, errorHandler);
    activeRoutes.set(routeKey, errorHandler);

    console.log(JSON.stringify({
      success: true,
      action: 'mock-api-error',
      pattern: pattern,
      status: status,
      message: message,
      response: body
    }));
  },

  /**
   * Mock request timeout (request never completes)
   * Usage:
   *   mock-timeout "/api/data"                  # Request will hang forever
   *   mock-timeout "/api/data" --after 5000     # Timeout after 5 seconds
   */
  async 'mock-timeout'(args, options) {
    await ensureBrowser(options);
    const page = getPage();

    const pattern = args[0];
    if (!pattern) {
      console.log(JSON.stringify({
        success: false,
        error: 'URL pattern required',
        usage: 'mock-timeout "<pattern>" [--after <ms>]'
      }));
      return;
    }

    const afterMs = parseInt(options.after) || 0;

    const timeoutHandler = async (route) => {
      // If --after is specified, wait that long then abort
      // Otherwise, just never respond (infinite wait)
      if (afterMs > 0) {
        await new Promise(resolve => setTimeout(resolve, afterMs));
        await route.abort('timedout');
      } else {
        // Never complete the request - it will hang until page timeout
        await new Promise(() => {}); // Infinite promise
      }
    };

    const routeKey = `timeout:${pattern}`;
    if (activeRoutes.has(routeKey)) {
      await page.unroute(pattern, activeRoutes.get(routeKey));
    }

    await page.route(pattern, timeoutHandler);
    activeRoutes.set(routeKey, timeoutHandler);

    console.log(JSON.stringify({
      success: true,
      action: 'mock-timeout',
      pattern: pattern,
      afterMs: afterMs || 'infinite',
      message: afterMs > 0
        ? `Route "${pattern}" will timeout after ${afterMs}ms`
        : `Route "${pattern}" will never respond (infinite hang)`
    }));
  },

  /**
   * Clear all network mocks and restore normal behavior
   * Usage:
   *   clear-network              # Clear all mocks
   *   clear-network "/api/data"  # Clear specific route mock
   */
  async 'clear-network'(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const context = getContext();

    const pattern = args[0];

    if (pattern) {
      // Clear specific pattern
      const keysToRemove = [];
      for (const [key, handler] of activeRoutes.entries()) {
        if (key.includes(pattern)) {
          await page.unroute(pattern, handler).catch(() => {});
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => activeRoutes.delete(key));

      console.log(JSON.stringify({
        success: true,
        action: 'clear-network',
        pattern: pattern,
        message: `Cleared mocks for pattern "${pattern}"`
      }));
    } else {
      // Clear all mocks
      for (const [key, handler] of activeRoutes.entries()) {
        const routePattern = key.includes(':') ? key.split(':')[1] : '**/*';
        await page.unroute(routePattern, handler).catch(() => {});
      }
      activeRoutes.clear();

      // Reset offline mode
      if (isOffline) {
        await context.setOffline(false);
        isOffline = false;
      }

      // Reset latency
      globalLatency = 0;

      console.log(JSON.stringify({
        success: true,
        action: 'clear-network',
        message: 'All network mocks cleared, network restored to normal',
        clearedRoutes: activeRoutes.size
      }));
    }
  },

  /**
   * Get current network emulation status
   * Usage:
   *   network-status
   */
  async 'network-status'(args, options) {
    await ensureBrowser(options);

    const routes = [];
    for (const [key] of activeRoutes.entries()) {
      routes.push(key);
    }

    console.log(JSON.stringify({
      success: true,
      action: 'network-status',
      status: {
        offline: isOffline,
        latency: globalLatency,
        activeRoutes: routes,
        totalMocks: activeRoutes.size
      }
    }));
  },

  /**
   * Throttle network to simulate slow connections
   * Usage:
   *   throttle-network slow-3g
   *   throttle-network fast-3g
   *   throttle-network offline
   *   throttle-network none        # Remove throttling
   */
  async 'throttle-network'(args, options) {
    await ensureBrowser(options);
    const page = getPage();
    const context = getContext();

    const preset = args[0]?.toLowerCase();

    const presets = {
      'slow-3g': {
        offline: false,
        downloadThroughput: 50 * 1024 / 8,  // 50kb/s
        uploadThroughput: 20 * 1024 / 8,    // 20kb/s
        latency: 2000                        // 2s latency
      },
      'fast-3g': {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8,  // 1.5Mb/s
        uploadThroughput: 750 * 1024 / 8,           // 750kb/s
        latency: 560                                 // 560ms latency
      },
      'regular-4g': {
        offline: false,
        downloadThroughput: 4 * 1024 * 1024 / 8,    // 4Mb/s
        uploadThroughput: 3 * 1024 * 1024 / 8,      // 3Mb/s
        latency: 170                                 // 170ms latency
      },
      'offline': {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 0
      },
      'none': null  // Remove throttling
    };

    if (!preset || !presets.hasOwnProperty(preset)) {
      console.log(JSON.stringify({
        success: false,
        error: 'Invalid preset',
        usage: 'throttle-network <preset>',
        presets: Object.keys(presets)
      }));
      return;
    }

    const settings = presets[preset];

    if (settings === null) {
      // Remove throttling via CDP
      try {
        const cdpSession = await context.newCDPSession(page);
        await cdpSession.send('Network.emulateNetworkConditions', {
          offline: false,
          downloadThroughput: -1,
          uploadThroughput: -1,
          latency: 0
        });
      } catch (e) {
        // CDP might not be available, use context offline as fallback
        await context.setOffline(false);
      }
      isOffline = false;

      console.log(JSON.stringify({
        success: true,
        action: 'throttle-network',
        preset: 'none',
        message: 'Network throttling removed'
      }));
      return;
    }

    // Apply throttling via CDP
    try {
      const cdpSession = await context.newCDPSession(page);
      await cdpSession.send('Network.emulateNetworkConditions', settings);
      isOffline = settings.offline;

      console.log(JSON.stringify({
        success: true,
        action: 'throttle-network',
        preset: preset,
        settings: settings,
        message: `Network throttled to ${preset} profile`
      }));
    } catch (e) {
      // Fallback: just set offline mode if CDP fails
      if (settings.offline) {
        await context.setOffline(true);
        isOffline = true;
        console.log(JSON.stringify({
          success: true,
          action: 'throttle-network',
          preset: preset,
          message: `Network set to offline (CDP throttling not available)`,
          warning: 'Full throttling requires CDP support'
        }));
      } else {
        console.log(JSON.stringify({
          success: false,
          error: 'Network throttling requires CDP support',
          hint: 'Use set-network --latency for basic delay simulation'
        }));
      }
    }
  }
};

// Helper function to get default error messages
function getDefaultErrorMessage(status) {
  const messages = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    408: 'Request Timeout',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return messages[status] || 'Error';
}

module.exports = commands;
