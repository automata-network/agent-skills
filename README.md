# Agent Skills

A collection of AI agent skills following the [agentskills.io](https://agentskills.io/) specification. These skills can be installed and used across multiple AI coding agents including Claude Code, Cursor, Codex, and more.

## Available Skills

| Skill                           | Description                                                             |
| ------------------------------- | ----------------------------------------------------------------------- |
| [web-test](./web-test/SKILL.md) | Comprehensive web app testing with Playwright ensuring 100% UI coverage |

## How web-test Works

The web-test skill uses a vision-based approach to automate browser testing:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   AI Agent      │────▶│  test-helper.js  │────▶│   Playwright    │
│ (Claude Code)   │     │     (CLI)        │     │   Browser       │
└────────┬────────┘     └──────────────────┘     └────────┬────────┘
         │                                                 │
         │◀──────────── Screenshot (Base64) ◀─────────────┘
         │
         ▼
   Visual Analysis & Decision
```

**Core Workflow:**

1. **Browser Control**: Node.js uses Playwright to launch and control Chrome browser
2. **Screenshot Capture**: After each action, the browser captures a screenshot
3. **AI Vision Analysis**: Screenshots are returned to the AI agent for visual analysis
4. **Task Orchestration**: AI agent analyzes the UI, plans test tasks, and executes them
5. **Result Verification**: AI verifies test results through visual inspection

**Browser Modes:**

- **Headless Mode**: For automated testing without display
- **Headed Mode**: For manual intervention (login, debugging)
- **Wallet Mode**: Loads Rabby wallet extension for Web3 DApp testing

**Vision Commands:**

The vision command series (`vision-screenshot`, `vision-click`, `vision-type`, etc.) enables coordinate-based interactions, allowing the AI to interact with any UI element based on visual analysis.

## Manual Configuration

### Setting WALLET_PRIVATE_KEY

For Web3 DApp testing, you need to set the wallet private key as an environment variable:

```bash
export WALLET_PRIVATE_KEY="your_private_key_here"
```

**Important Security Notes:**

- The private key is **only read from environment variables** (for security)
- `.env` files are intentionally **not supported** to prevent accidental commits
- Optionally set `WALLET_PASSWORD` for wallet unlock (auto-generated if not set)

### Manual Login Intervention

When a website requires email or social account login, manual intervention is needed:

**Workflow:**

1. **Detection**: Use `detect-login-required` command to identify login type (wallet/email/social)
2. **Mode Switch**: System automatically switches to headed mode (browser window visible)
3. **Wait for Login**: Use `wait-for-login` command which waits up to 5 minutes for manual login
4. **Manual Action**: User completes login in the browser window (enter credentials, OAuth flow, etc.)
5. **Resume**: System detects login completion and continues automated testing

**Example Flow:**

```bash
# AI detects login is required
node test-helper.js detect-login-required

# If email/social login detected, AI calls:
node test-helper.js wait-for-login
# User manually logs in within 5 minutes
# Testing continues after login detected
```

## Installation

Use the [ai-agent-skills](https://www.npmjs.com/package/ai-agent-skills) CLI to install skills from this repository.

### Claude Code

```bash
npx ai-agent-skills install automata-network/agent-skills --agent claude
```

### Cursor

```bash
npx ai-agent-skills install automata-network/agent-skills --agent cursor
```

### Codex

```bash
npx ai-agent-skills install automata-network/agent-skills --agent codex
```

## Supported Agents

The skills in this repository work with:

- Claude Code
- Cursor
- Codex
- VS Code (GitHub Copilot)
- Amp
- Goose
- OpenCode
- And any agent supporting the SKILL.md format

## Project Structure

```
agent-skills/
├── README.md
├── LICENSE
├── web-test/                       # Web testing skill
│   ├── SKILL.md                    # Skill definition (required)
│   ├── references/                 # Supporting documentation
│   └── scripts/                    # Implementation scripts
│       ├── test-helper.js          # Main CLI entry point
│       ├── lib/                    # Core libraries
│       │   ├── config.js           # Configuration and constants
│       │   ├── utils.js            # Utility functions
│       │   ├── scheduler.js        # Parallel test scheduler
│       │   └── browser.js          # Browser management
│       └── commands/               # Command modules
│           ├── basic.js            # Basic browser commands
│           ├── dev-server.js       # Dev server commands
│           ├── wallet.js           # Web3 wallet commands
│           ├── login.js            # Login detection commands
│           └── vision.js           # Vision/AI commands
└── <other-skill>/                  # Add more skills as subfolders
    └── SKILL.md
```

**Each subfolder represents a separate skill.** To add a new skill, create a new folder with a `SKILL.md` file following the [agentskills.io](https://agentskills.io/) specification.

### web-test/scripts File Reference

#### Core Libraries (lib/)

| File | Description |
|------|-------------|
| `config.js` | Configuration constants: output directories, CDP port (9222), blockchain networks, screenshot settings |
| `utils.js` | Utility functions: file operations, port management, framework detection (Vite/Next/CRA), dev server commands |
| `scheduler.js` | Parallel test scheduler with dependency graph, cycle detection, and configurable concurrency |
| `browser.js` | Browser lifecycle management, Rabby wallet extension loading, CDP connection, persistent context |

#### Command Modules (commands/)

| File | Description |
|------|-------------|
| `basic.js` | Browser control (start/stop), navigation, element interaction (click/fill/select), screenshots, element listing |
| `dev-server.js` | Development server lifecycle: start, stop, status check with framework auto-detection |
| `wallet.js` | Web3 wallet operations: setup Rabby, import private key, unlock, connect to DApp, switch network |
| `login.js` | Login detection: identify login type (wallet/email/social), wait for manual login with 5-minute timeout |
| `vision.js` | Vision commands for AI: coordinate-based click/type/scroll, screenshot with viewport info, page analysis |

### Skill Format

Each skill folder should contain:

- `SKILL.md` - Main skill definition with metadata and instructions (required)
- `references/` - Supporting documentation and checklists (optional)
- `scripts/` - Implementation scripts and tools (optional)

## Learn More

- [agentskills.io](https://agentskills.io/) - Open standard for AI agent skills
- [ai-agent-skills on npm](https://www.npmjs.com/package/ai-agent-skills) - CLI for installing skills

## License

MIT
