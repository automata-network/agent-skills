# Intelligent Web Testing - Technical Reference

This document contains detailed technical information for the web-test skill.

## Supported Interactions

| Action | Command | Example |
|--------|---------|---------|
| Navigate | `navigate <url>` | `navigate "http://localhost:3000"` |
| Click | `click <selector>` | `click "button.submit"` |
| Fill | `fill <selector> <value>` | `fill "#email" "test@test.com"` |
| Select | `select <selector> <value>` | `select "#country" "US"` |
| Check | `check <selector>` | `check "#agree"` |
| Uncheck | `uncheck <selector>` | `uncheck "#subscribe"` |
| Hover | `hover <selector>` | `hover ".dropdown-trigger"` |
| Press | `press <selector> <key>` | `press "#search" "Enter"` |
| Wait | `wait <ms>` | `wait 2000` |
| Screenshot | `screenshot <name>` | `screenshot "result.png"` |
| Content | `content` | Get page HTML |
| Evaluate | `evaluate <js>` | `evaluate "document.title"` |
| List Elements | `list-elements` | List all interactive elements |

## Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--screenshot <name>` | Take screenshot after action | - |
| `--wait <ms>` | Wait after action | 0 |
| `--mobile` | Use mobile viewport (390x844) | false |
| `--headed` | Run with visible browser | false |
| `--headless` | Run headless | true |
| `--timeout <ms>` | Action timeout | 10000 |
| `--wallet` | Load with MetaMask wallet extension | false |
| `--network <name>` | Specify network for Web3 | ethereum |

## Web3 DApp Testing

**Note:** Wallet setup and connection are handled by separate skills:
- `web-test-wallet-setup` - Downloads and initializes MetaMask wallet
- `web-test-wallet-connect` - Connects wallet to DApp, handles popups

### When Web3 Testing is Needed

If `tests/config.yaml` contains:
```yaml
web3:
  enabled: true
```

Then `web-test` will automatically call the wallet skills before executing tests.

### Wallet Commands in test-helper.js

These commands are used by the wallet skills internally:

| Command | Description |
|---------|-------------|
| `wallet-navigate <url>` | Navigate to URL with wallet extension loaded |
| `wallet-approve` | Approve wallet popup (connect, sign, transaction) |

### Supported Networks

| Network | Chain ID |
|---------|----------|
| Ethereum Mainnet | 0x1 |
| Polygon | 0x89 |
| Arbitrum One | 0xa4b1 |
| Optimism | 0xa |
| Base | 0x2105 |
| BNB Smart Chain | 0x38 |
| Avalanche C-Chain | 0xa86a |
| Goerli Testnet | 0x5 |
| Sepolia Testnet | 0xaa36a7 |

### Security Principles

- Private key is stored in `tests/.test-env` file (persistent directory)
- Private key is handled by `web-test-wallet-setup` skill only
- Private key is **NEVER** uploaded to AI APIs or logged
- Private key is only used locally in Playwright browser context
- All wallet operations happen in local browser instance

## Framework Detection

### Config Files and Default Ports

| Framework | Config File | Default Port |
|-----------|-------------|--------------|
| Vite | `vite.config.js/ts` → `server.port` | 5173 |
| Next.js | `package.json` scripts or `-p` flag | 3000 |
| Remix | `remix.config.js` or package.json | 3000 |
| Webpack | `webpack.config.js` → `devServer.port` | 8080 |
| Create React App | `PORT` env or package.json | 3000 |
| Vue CLI | `vue.config.js` → `devServer.port` | 8080 |
| Angular | `angular.json` → `serve.options.port` | 4200 |
| Nuxt | `nuxt.config.js` → `server.port` | 3000 |
| Astro | `astro.config.mjs` → `server.port` | 4321 |
| SvelteKit | `vite.config.js` (uses Vite) | 5173 |

### Common Start Commands

| Framework | Typical Script | Command |
|-----------|---------------|---------|
| Vite | `"dev": "vite"` | `npm run dev` |
| Next.js | `"dev": "next dev"` | `npm run dev` |
| Remix | `"dev": "remix dev"` | `npm run dev` |
| Create React App | `"start": "react-scripts start"` | `npm run start` |
| Vue CLI | `"serve": "vue-cli-service serve"` | `npm run serve` |
| Angular | `"start": "ng serve"` | `npm run start` |
| Nuxt | `"dev": "nuxt dev"` | `npm run dev` |
| Astro | `"dev": "astro dev"` | `npm run dev` |

### Common Ports Scanned

| Port | Common Usage |
|------|-------------|
| 3000 | Next.js, Create React App, Express |
| 5173 | Vite |
| 8080 | Webpack, Vue CLI |
| 4200 | Angular |
| 4321 | Astro |
| 8000 | Django, FastAPI |
| 5000 | Flask |

## Validation Criteria

### Visual Validation
- Page renders without blank sections
- Elements are visible and properly aligned
- Colors and fonts match expected design
- No overlapping or cut-off content

### Functional Validation
- Clicks trigger expected actions
- Forms accept and validate input
- Navigation leads to correct pages
- Modals open and close properly
- Data displays correctly

### Error Validation
- No JavaScript errors in console
- No network request failures (except expected 4xx)
- No accessibility violations
- No broken images or resources

## Test Output Directory

All test artifacts are saved to `./test-output/` in the current working directory:

| Path | Description |
|------|-------------|
| `screenshots/` | All captured screenshots |
| `test-plan.md` | Generated test plan |
| `test-report-YYYYMMDD-HHMMSS.md` | Final test report (timestamped, new file each run) |
| `console-logs.txt` | Browser console output |
| `elements.json` | Interactive elements discovered |
| `page-content.html` | Page HTML content |

## Example Session

User: "Test my web app"

Agent:

### Step 0: Auto-Detect Local Services
```bash
# Scan common ports for running services
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000  # 200 OK
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173  # Connection refused
```

Agent: "I detected the following local services:
- http://localhost:3000 (responding)

Which URL would you like me to test?
1. http://localhost:3000
2. Enter a custom URL"

User: "1"

### Step 1-2: Analyze & Plan
1. **Target URL**: http://localhost:3000 (user confirmed)
2. **Analyze Code**: Reads `src/` directory
   - Found `App.tsx`, `pages/`, `components/`
   - Identified routes: `/`, `/about`, `/contact`, `/login`
   - Discovered: Navbar, LoginForm, ContactForm, Modal
3. **Create Test Plan**: 12 tests covering all pages and interactions

### Step 3: Execute Tests
```bash
SKILL_DIR="/path/to/web-test"

node $SKILL_DIR/scripts/test-helper.js navigate "http://localhost:3000" --screenshot home.png
node $SKILL_DIR/scripts/test-helper.js click "nav a[href='/login']" --screenshot nav-to-login.png
node $SKILL_DIR/scripts/test-helper.js fill "#email" "test@example.com"
node $SKILL_DIR/scripts/test-helper.js click "button[type='submit']" --screenshot after-login.png
```

### Step 4: Validate & Report
4. **Validate Results**: Analyze screenshots, check console logs
5. **Report**: 11 passed, 1 failed (contact form submit error)
6. **Suggest Fix**: "ContactForm.tsx:42 - onClick handler missing await"

## Test Plan Template

```markdown
## Test Plan for [Project Name]

### Pages to Test
1. / (Home) - Main landing page
2. /login - User authentication
3. /dashboard - User dashboard

### Interactive Elements
1. Navigation menu - Click each link, verify navigation
2. Login form - Fill credentials, submit, verify redirect
3. Settings modal - Open, modify, save, verify changes

### User Flows
1. Registration flow: Home → Sign Up → Fill Form → Verify Email
2. Purchase flow: Product → Add to Cart → Checkout → Confirm

### Edge Cases
1. Invalid form inputs - Verify error messages
2. Network errors - Verify error handling
3. Empty states - Verify placeholder content
```

## Test Results Template

```markdown
## Test Results

### Summary
- Total Tests: 15
- Passed: 13
- Failed: 2
- Warnings: 3

### Passed Tests
- [x] Home page loads correctly
- [x] Navigation works
- [x] Login form accepts input

### Failed Tests
- [ ] Submit button unresponsive on mobile viewport
  - Expected: Form submits on click
  - Actual: No response to click event
  - Screenshot: submit-fail.png
  - Suggestion: Check click handler binding

### Warnings
- Loading spinner persists for 5+ seconds on /dashboard
- Console warning: "React key prop missing"
```
