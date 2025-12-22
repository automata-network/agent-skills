---
name: intelligent-web-testing
description: AI-driven web app testing. Agent reads code, understands functionality, plans tests, executes Playwright commands directly, and validates results autonomously. No pre-written scripts required.
license: MIT
compatibility: Node.js 18+, Playwright
metadata:
  author: AI Agent
  version: 1.0.0
allowed-tools: Bash Read Write Glob Grep Task
---

# Intelligent Web Testing

An AI-driven testing skill where the agent autonomously:
1. **Reads and understands** project source code
2. **Plans tests** based on discovered functionality
3. **Executes tests** using Playwright directly
4. **Validates results** by analyzing screenshots and outputs

## Quick Start

Ask me to test your web app:
- "Test my web app" (I'll auto-detect the port)
- "Analyze my project and run comprehensive UI tests"
- "Test all interactive elements and validate they work correctly"

## Auto Port Detection

I automatically detect the dev server port from your project configuration:

| Framework | Config File | Default Port |
|-----------|-------------|--------------|
| **Vite** | `vite.config.js/ts` → `server.port` | 5173 |
| **Next.js** | `package.json` scripts or `-p` flag | 3000 |
| **Remix** | `remix.config.js` or package.json | 3000 |
| **Webpack** | `webpack.config.js` → `devServer.port` | 8080 |
| **Create React App** | `PORT` env or package.json | 3000 |
| **Vue CLI** | `vue.config.js` → `devServer.port` | 8080 |
| **Angular** | `angular.json` → `serve.options.port` | 4200 |
| **Nuxt** | `nuxt.config.js` → `server.port` | 3000 |
| **Astro** | `astro.config.mjs` → `server.port` | 4321 |
| **SvelteKit** | `vite.config.js` (uses Vite) | 5173 |

## How It Works

### Phase 1: Code Analysis
I will read your project's source code to understand:
- Project structure and framework (React, Vue, Next.js, etc.)
- Available pages and routes
- Interactive components (buttons, forms, modals, etc.)
- Expected behaviors and user flows

### Phase 2: Test Planning
Based on code analysis, I will create a test plan covering:
- All discoverable pages/routes
- Interactive elements (buttons, links, inputs, dropdowns, etc.)
- Form submissions and validations
- Modal/dialog interactions
- Navigation flows
- Error states and edge cases

### Phase 3: Test Execution
I will execute tests using Playwright directly via the helper script:

```bash
# Navigate and screenshot (using detected port, e.g., 5173 for Vite)
node pw-helper.js navigate "http://localhost:5173" --screenshot home.png

# Click element
node pw-helper.js click "button.submit" --screenshot after-click.png

# Fill form
node pw-helper.js fill "#email" "test@example.com"

# Select option
node pw-helper.js select "#country" "US"

# Check/uncheck
node pw-helper.js check "#agree-terms"

# Get page content for validation
node pw-helper.js content

# Run multiple actions in sequence
node pw-helper.js run-sequence actions.json --screenshots
```

### Phase 4: Result Validation
I will validate results by:
- Analyzing screenshots visually
- Checking console output for errors
- Verifying expected UI states
- Comparing before/after states
- Reporting issues with specific details

## Instructions

When you ask me to test your web app, I will follow this workflow:

### Step 0: Detect Framework and Port

First, I'll identify the framework and dev server port:

```
1. Check for framework config files:
   - vite.config.js/ts → Vite project
   - next.config.js/mjs → Next.js project
   - remix.config.js → Remix project
   - webpack.config.js → Webpack project
   - vue.config.js → Vue CLI project
   - angular.json → Angular project
   - nuxt.config.js/ts → Nuxt project
   - astro.config.mjs → Astro project
   - svelte.config.js → SvelteKit project

2. Read the config to find port:
   - Vite: server.port (default 5173)
   - Next.js: package.json "dev" script -p flag (default 3000)
   - Webpack: devServer.port (default 8080)
   - Vue CLI: devServer.port (default 8080)
   - Angular: angular.json serve.options.port (default 4200)

3. Check package.json scripts for custom port:
   - Look for PORT=xxxx or --port xxxx or -p xxxx

4. Construct base URL: http://localhost:<detected_port>
```

### Step 1: Understand the Project

Next, I'll analyze your codebase:

```
1. Find all source files (*.tsx, *.jsx, *.vue, *.html, *.js, *.ts)
2. Identify the framework and project structure
3. Discover routes/pages from:
   - Router configuration files
   - Page/route directories
   - Navigation components
4. Find interactive elements:
   - Button components and click handlers
   - Form inputs and submissions
   - Modal/dialog triggers
   - Dropdown menus and selects
   - Tabs, accordions, toggles
5. Understand expected behaviors from:
   - Component props and state
   - Event handlers
   - API calls and responses
```

### Step 2: Create Test Plan

I'll generate a structured test plan:

```markdown
## Test Plan for [Project Name]

### Pages to Test
1. / (Home) - Main landing page
2. /login - User authentication
3. /dashboard - User dashboard
...

### Interactive Elements
1. Navigation menu - Click each link, verify navigation
2. Login form - Fill credentials, submit, verify redirect
3. Settings modal - Open, modify, save, verify changes
...

### User Flows
1. Registration flow: Home → Sign Up → Fill Form → Verify Email
2. Purchase flow: Product → Add to Cart → Checkout → Confirm
...

### Edge Cases
1. Invalid form inputs - Verify error messages
2. Network errors - Verify error handling
3. Empty states - Verify placeholder content
...
```

### Step 3: Execute Tests

For each test, I'll:

1. **Setup**: Ensure Playwright helper is available
2. **Navigate**: Go to the target page
3. **Capture Before**: Take screenshot of initial state
4. **Interact**: Perform the action (click, fill, select, etc.)
5. **Wait**: Allow UI to update
6. **Capture After**: Take screenshot of result state
7. **Validate**: Check expected outcome

Example test execution:

```bash
# Test: Login form submission (port auto-detected from project config)
node pw-helper.js navigate "http://localhost:${PORT}/login" --screenshot login-before.png
node pw-helper.js fill "#email" "test@example.com"
node pw-helper.js fill "#password" "password123"
node pw-helper.js click "button[type='submit']" --screenshot login-after.png --wait 2000
```

### Step 4: Validate and Report

After each test, I'll analyze:

1. **Visual Check**: Read the screenshot to verify UI state
2. **Console Check**: Look for JavaScript errors
3. **Network Check**: Verify API calls succeeded
4. **State Check**: Confirm expected changes occurred

Final report format:

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
...

### Failed Tests
- [ ] Submit button unresponsive on mobile viewport
  - Expected: Form submits on click
  - Actual: No response to click event
  - Screenshot: submit-fail.png
  - Suggestion: Check click handler binding

### Warnings
- Loading spinner persists for 5+ seconds on /dashboard
- Console warning: "React key prop missing"
...
```

## Helper Script Setup

Before testing, I'll ensure the Playwright helper is installed:

```bash
# Check if helper exists, create if not
if [ ! -f pw-helper.js ]; then
  # I will create the helper script
fi

# Install Playwright if needed
npm list playwright || npm install playwright
npx playwright install chromium
```

## Test Output Directory

All test artifacts are saved to `./test-output/`:
- `screenshots/` - All captured screenshots
- `test-plan.md` - Generated test plan
- `test-results.md` - Final test report
- `console-logs.txt` - Browser console output

## Validation Criteria

I validate tests using these criteria:

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

## Example Session

User: "Test my web app"

Agent:
1. **Detect Framework**: Found `vite.config.ts` → Vite project
2. **Detect Port**: Read config, found `server: { port: 5173 }` → http://localhost:5173
3. **Analyze Code**: Reads `src/` directory
   - Found `App.tsx`, `pages/`, `components/`
   - Identified routes: `/`, `/about`, `/contact`, `/login`
   - Discovered: Navbar, LoginForm, ContactForm, Modal
4. **Create Test Plan**: 12 tests covering all pages and interactions
5. **Execute Tests**:
   ```bash
   node pw-helper.js navigate "http://localhost:5173" --screenshot home.png
   node pw-helper.js click "nav a[href='/login']" --screenshot nav-to-login.png
   # ... more tests
   ```
6. **Validate Results**: Analyze screenshots, check console logs
7. **Report**: 11 passed, 1 failed (contact form submit error)
8. **Suggest Fix**: "ContactForm.tsx:42 - onClick handler missing await"

### Port Detection Examples

```
# Vite project - reads vite.config.ts
Found: server.port = 5173 → http://localhost:5173

# Next.js project - reads package.json
Found: "dev": "next dev -p 3001" → http://localhost:3001

# Custom webpack - reads webpack.config.js
Found: devServer.port = 9000 → http://localhost:9000

# No config specified - uses framework default
Vite default → http://localhost:5173
Next.js default → http://localhost:3000
Vue CLI default → http://localhost:8080
Angular default → http://localhost:4200
```

## Notes

- I analyze your actual code to understand expected behavior
- Tests are dynamically generated based on your project
- I validate results myself by reading screenshots
- No pre-written test scripts required
- I adapt to any frontend framework
