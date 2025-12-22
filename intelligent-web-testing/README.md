# Intelligent Web Testing Skill

AI-driven web app testing where the agent autonomously:
1. Reads and understands your code
2. Plans comprehensive tests
3. Executes tests using Playwright
4. Validates results and reports issues

## Setup

```bash
cd intelligent-web-testing
npm run setup
```

## How It Works

Unlike traditional test frameworks that require pre-written test scripts, this skill lets the AI agent:

1. **Analyze your codebase** - Reads source files to understand routes, components, and interactions
2. **Generate test plans** - Creates tests based on actual code, not predefined scenarios
3. **Execute dynamically** - Uses `pw-helper.js` to run Playwright commands
4. **Validate intelligently** - Analyzes screenshots and outputs to verify correctness

## Usage

Simply ask the AI to test your web app:

```
Test my web app at http://localhost:3000
```

The agent will:
1. Scan your `src/` directory
2. Identify all pages and components
3. Create a test plan
4. Execute each test with screenshots
5. Validate results
6. Report findings

## pw-helper.js Commands

The helper script provides CLI access to Playwright:

```bash
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
```

## Output

All test artifacts are saved to `./test-output/`:
- `screenshots/` - Captured screenshots
- `elements.json` - Discovered interactive elements
- `console-logs.txt` - Browser console output
- `page-content.html` - Page HTML for analysis

## Comparison with Traditional Testing

| Aspect | Traditional (web-app-testing) | Intelligent (this skill) |
|--------|------------------------------|--------------------------|
| Test creation | Manual or config-based | AI generates from code |
| Execution | Python script | AI + lightweight helper |
| Validation | Script-based rules | AI visual analysis |
| Adaptability | Requires config changes | Automatically adapts |
| Understanding | Follows predefined steps | Understands context |

## Example Session

**User:** Test my React app at http://localhost:3000

**Agent:**
1. Reads `src/App.tsx`, `src/pages/`, `src/components/`
2. Finds routes: `/`, `/login`, `/dashboard`, `/settings`
3. Discovers: LoginForm, UserMenu, SettingsModal, DataTable
4. Creates 15 tests covering all interactions
5. Executes tests, captures 30 screenshots
6. Reports: 14 passed, 1 failed (modal close button issue)
7. Provides specific fix: "Add onClick handler to close button"
