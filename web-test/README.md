# Intelligent Web Testing Skill

AI-driven web app testing where the agent autonomously reads your code, plans comprehensive tests, executes them using Playwright, and validates results through visual analysis.

## How It Works - Architecture Overview

This skill uses a **Node.js + Playwright + AI Visual Analysis** architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AI Agent (Claude)                           │
│  - Reads and analyzes source code                                   │
│  - Plans test scenarios based on code understanding                 │
│  - Orchestrates test execution                                      │
│  - Performs visual analysis on screenshots                          │
│  - Validates results and reports issues                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      pw-helper.js (Node.js)                         │
│  - CLI interface for Playwright commands                            │
│  - Browser lifecycle management (start, stop, reconnect)            │
│  - Interactive element discovery                                    │
│  - Screenshot capture and management                                │
│  - Web3 wallet extension support                                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Playwright + Chromium                          │
│  - Headless/headed browser automation                               │
│  - DOM manipulation and interaction                                 │
│  - Network request interception                                     │
│  - Persistent browser context (cookies, localStorage)               │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Your Web App                                │
│  - Target application being tested                                  │
│  - Accessed via localhost or remote URL                             │
└─────────────────────────────────────────────────────────────────────┘
```

### The Testing Loop

1. **Code Analysis Phase**
   - AI agent reads your source files (`src/`, `pages/`, `components/`)
   - Identifies routes, components, and interactive elements
   - Understands the application structure and functionality

2. **Test Planning Phase**
   - AI generates test scenarios based on code understanding
   - Plans which pages to visit and elements to interact with
   - Considers edge cases, error states, and user flows

3. **Execution Phase**
   - AI issues commands to `pw-helper.js` via CLI
   - Playwright controls the browser to execute actions
   - Screenshots are captured after each significant action
   - Results are returned as JSON for AI processing

4. **Visual Analysis Phase**
   - AI receives screenshots and analyzes them visually
   - Compares expected vs actual UI states
   - Detects visual regressions, layout issues, and UX problems
   - Validates that interactions produced correct results

5. **Reporting Phase**
   - AI compiles findings into a comprehensive report
   - Provides specific, actionable fixes for issues found
   - Generates coverage statistics and test summaries

## Prerequisites

Playwright must be installed **globally** (not as a project dependency):

```bash
# Install Playwright globally
npm install -g playwright

# Install Chromium browser
npx playwright install chromium
```

## Usage

Simply ask the AI to test your web app:

```
Test my web app at http://localhost:3000
```

The agent will:
1. Scan your `src/` directory to understand the codebase
2. Identify all pages, components, and interactive elements
3. Create a test plan covering all functionality
4. Execute each test with screenshots
5. Visually analyze results
6. Report findings with specific fixes

## Interactive Element Types

This skill discovers and tests **11+ interactive element types**:

| Type | Examples | Test Actions |
|------|----------|--------------|
| Buttons | `<button>`, `[role="button"]`, `.btn` | Click, verify state |
| Links | `<a href>` | Navigate, verify target |
| Checkboxes | `input[type="checkbox"]` | Check, uncheck, verify state |
| Radio Buttons | `input[type="radio"]` | Select, verify group behavior |
| Select Dropdowns | `<select>` | Open, select options |
| Text Inputs | `input[type="text/email/password"]`, `<textarea>` | Fill, validate |
| Tabs | `[role="tab"]`, `.tab` | Switch, verify panel |
| Accordions | `<details>`, `[aria-expanded]` | Expand, collapse |
| Toggles/Switches | `[role="switch"]`, `.toggle` | Toggle on/off |
| Modal Triggers | `[data-toggle="modal"]` | Open, close, verify focus |
| Menu Items | `[role="menuitem"]`, `.menu-item` | Click, navigate submenus |

**Reference**: See [references/ELEMENT-TYPES.md](references/ELEMENT-TYPES.md) for complete selector definitions and test strategies.

## Quality Checklist

The AI validates against a comprehensive quality checklist:

- **UX & Error Handling** - Loading states, error messages, analytics
- **SEO** - Title tags, meta descriptions, Open Graph, favicon
- **Function & Layout** - Interactive elements, form validation, spacing, alignment
- **Accessibility** - Color contrast, focus indicators, ARIA labels
- **Performance** - Image optimization, bundle size, render efficiency

**Reference**: See [references/CHECKLIST.md](references/CHECKLIST.md) for the complete checklist.

## pw-helper.js Commands

The helper script provides CLI access to Playwright:

```bash
# Browser Management
node pw-helper.js browser-open --headed    # Open visible browser
node pw-helper.js browser-close            # Close browser

# Dev Server Management
node pw-helper.js dev-server-start . 3000  # Start dev server (auto port detection)
node pw-helper.js dev-server-stop          # Stop dev server
node pw-helper.js dev-server-status        # Check status

# Navigation
node pw-helper.js navigate "http://localhost:3000" --screenshot home.png

# Interactions
node pw-helper.js click "button.submit" --screenshot after-click.png
node pw-helper.js fill "#email" "test@example.com"
node pw-helper.js select "#country" "US"
node pw-helper.js check "#agree-terms"

# Discovery
node pw-helper.js list-elements  # Lists all interactive elements

# Validation
node pw-helper.js text ".success-message"
node pw-helper.js evaluate "document.title"

# Parallel Testing (with dependency support)
node pw-helper.js run-test test-config.json --max-parallel 5
```

### Parallel Test Configuration

For complex test suites with dependencies:

```json
{
  "parallel": true,
  "tasks": [
    {
      "id": "homepage",
      "depends": [],
      "steps": [
        {"action": "navigate", "url": "http://localhost:3000"},
        {"action": "screenshot", "name": "home.png"}
      ]
    },
    {
      "id": "login",
      "depends": [],
      "steps": [
        {"action": "navigate", "url": "http://localhost:3000/login"},
        {"action": "fill", "selector": "#email", "value": "test@example.com"},
        {"action": "screenshot", "name": "login.png"}
      ]
    },
    {
      "id": "dashboard",
      "depends": ["login"],
      "steps": [
        {"action": "navigate", "url": "http://localhost:3000/dashboard"},
        {"action": "screenshot", "name": "dashboard.png"}
      ]
    }
  ]
}
```

## Output

All test artifacts are saved to `./test-output/`:
- `screenshots/` - Captured screenshots for AI analysis
- `elements.json` - Discovered interactive elements
- `console-logs.txt` - Browser console output
- `page-content.html` - Page HTML for analysis
- `chrome-profile/` - Persistent browser state

## Web3 Wallet Testing

This skill supports testing Web3 DApps with wallet integration using the Rabby wallet extension.

### Setting Up the Private Key

Before testing DApps, you must set the wallet private key as an environment variable:

```bash
# Set for current terminal session only
export WALLET_PRIVATE_KEY="your_64_hex_characters_private_key"

# Or set inline when running commands
WALLET_PRIVATE_KEY="0x..." node pw-helper.js wallet-import --wallet
```

**Security Notes:**
- The private key is used ONLY locally in the browser and is NEVER logged or transmitted
- Use a dedicated test wallet, NOT your main wallet with real funds
- Never commit private keys to version control
- The key format must be 64 hex characters (with or without `0x` prefix)

### Wallet Workflow

1. **Install the wallet extension** (one-time setup)
   ```bash
   node pw-helper.js wallet-setup
   ```

2. **Import your wallet**
   ```bash
   WALLET_PRIVATE_KEY="0x..." node pw-helper.js wallet-import --wallet
   ```

3. **Connect to a DApp**
   ```bash
   node pw-helper.js navigate "https://your-dapp.com" --wallet
   node pw-helper.js wallet-connect
   ```

### Headless Mode

Wallet testing supports headless mode using Playwright's bundled Chromium:

```bash
# Run wallet tests in headless mode (no visible browser window)
WALLET_PRIVATE_KEY="0x..." node pw-helper.js wallet-import --wallet --headless
```

## Login Handling

### Automatic Login Support

The tool automatically handles wallet-based logins (Privy, RainbowKit, etc.) when `WALLET_PRIVATE_KEY` is configured.

### Manual Intervention Required

The following login methods require human interaction:

1. **Email verification codes**
   - Verification codes are sent to email and must be manually retrieved and entered

2. **Social account logins (OAuth)**
   - Google, Twitter, Discord, GitHub, etc.
   - These involve third-party authentication pages and potential 2FA

3. **SMS verification codes**
   - Codes sent to mobile phones require manual retrieval

4. **CAPTCHA challenges**
   - reCAPTCHA, hCaptcha, etc. require human solving

### Manual Login Flow

When testing apps that require email or social login:

```bash
# 1. Open browser in headed mode (visible window)
node pw-helper.js browser-open --headed

# 2. Navigate to the login page
node pw-helper.js navigate "https://your-app.com/login"

# 3. Wait for manual login completion
#    The user should complete the login in the browser window
node pw-helper.js wait-for-login

# 4. After login is complete, continue with automated testing
node pw-helper.js navigate "https://your-app.com/dashboard"
node pw-helper.js screenshot "dashboard.png"
```

### Session Persistence

Login state is automatically saved in `./test-output/chrome-profile/`:

- Cookies and localStorage are preserved across sessions
- No need to log in again for subsequent tests
- State persists even after using `browser-close`
- To clear login state, delete the `./test-output/chrome-profile/` directory

## Comparison with Traditional Testing

| Aspect | Traditional Testing | This Skill |
|--------|---------------------|------------|
| Test creation | Manual script writing | AI generates from code analysis |
| Execution | Fixed test scripts | Dynamic, adaptive testing |
| Validation | Assertion-based rules | AI visual analysis |
| Adaptability | Requires code changes | Automatically adapts to UI changes |
| Coverage | Limited to written tests | Comprehensive, code-aware |

## Example Session

**User:** Test my React app at http://localhost:3000

**Agent:**
1. Reads `src/App.tsx`, `src/pages/`, `src/components/`
2. Finds routes: `/`, `/login`, `/dashboard`, `/settings`
3. Discovers: LoginForm, UserMenu, SettingsModal, DataTable
4. Creates 15 tests covering all interactions
5. Executes tests, captures 30 screenshots
6. Visually analyzes each screenshot for issues
7. Reports: 14 passed, 1 failed (modal close button issue)
8. Provides specific fix: "Add onClick handler to close button"
