# Agent Skills

A collection of AI agent skills following the [agentskills.io](https://agentskills.io/) specification. These skills can be installed and used across multiple AI coding agents including Claude Code, Cursor, Codex, and more.

## Available Skills

| Skill | Description |
|-------|-------------|
| [web-test](./web-test/SKILL.md) | Core web app testing with Playwright - execute tests using vision-based interactions |
| [web-test-cleanup](./web-test-cleanup/SKILL.md) | Clean up test sessions - kill browsers, stop dev servers, free ports |
| [web-test-research](./web-test-research/SKILL.md) | Analyze and research a web project - detect framework, discover routes, detect Web3 |
| [web-test-plan](./web-test-plan/SKILL.md) | Create structured test plans based on project research |
| [web-test-wallet-setup](./web-test-wallet-setup/SKILL.md) | Set up Rabby wallet extension for Web3 DApp testing |
| [web-test-wallet-connect](./web-test-wallet-connect/SKILL.md) | Connect wallet to Web3 DApp - handle popup approvals |
| [web-test-report](./web-test-report/SKILL.md) | Generate test reports after completing tests |

## Testing Workflow

The web-test skills are designed to work together in a modular workflow:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Complete Testing Workflow                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. web-test-cleanup          Clean previous test session                │
│         ↓                                                                │
│  2. web-test-research         Analyze project structure                  │
│         ↓                     Detect framework, routes, Web3             │
│  3. web-test-plan             Create test plan                           │
│         ↓                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  If Web3 DApp:                                                   │    │
│  │  4. web-test-wallet-setup     Download & initialize wallet       │    │
│  │  5. web-test-wallet-connect   Connect wallet to DApp             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│         ↓                                                                │
│  6. web-test                  Execute tests                              │
│         ↓                                                                │
│  7. web-test-report           Generate test report                       │
│         ↓                                                                │
│  8. web-test-cleanup          Final cleanup (--keep-data)                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Skill Responsibilities

### web-test (Core)
The main testing skill that executes vision-based browser tests.

**Responsibilities:**
- Start/stop browser sessions
- Navigate to URLs
- Execute vision-based interactions (click, type, scroll)
- Take screenshots for AI analysis
- Handle login detection

**Commands:** `navigate`, `vision-click`, `vision-screenshot`, `vision-type`, `wait`, etc.

---

### web-test-cleanup
Clean up test sessions before and after testing.

**Responsibilities:**
- Kill browser processes (Chromium, Chrome)
- Stop dev server processes
- Free blocked ports (3000, 5173, 8080, etc.)
- Remove test-output folder (optional)

**When to Use:**
- **Before tests:** Run without `--keep-data` for a clean slate
- **After tests:** Run with `--keep-data` to preserve artifacts

---

### web-test-research
Analyze a web project before testing.

**Responsibilities:**
- Detect framework (React, Vue, Next.js, etc.)
- Discover routes and pages
- Find interactive elements
- **Detect if Web3 DApp** (critical for wallet setup)
- Research project technologies via web search

**Output:** Project research report with recommendations

---

### web-test-plan
Create structured test plans.

**Responsibilities:**
- Define test cases with priorities
- Set execution order
- Identify Web3-specific tests
- Document preconditions and expected results

**Output:** `./test-output/test-plan.md`

---

### web-test-wallet-setup
Set up Rabby wallet for Web3 DApp testing.

**Responsibilities:**
- Download Rabby wallet extension from GitHub
- Import wallet using private key from environment
- Initialize and unlock wallet
- Verify wallet is ready

**Prerequisites:**
- `WALLET_PRIVATE_KEY` environment variable set
- Project confirmed as Web3 DApp

---

### web-test-wallet-connect
Connect wallet to Web3 DApp.

**Responsibilities:**
- Navigate to DApp with wallet extension
- Detect and click Connect Wallet button
- Handle wallet selection modal
- **Auto-approve Rabby popup** (connect, sign, transaction)
- Verify wallet connection

**Key Features:**
- Pre-emptive popup listener (catches fast popups)
- Multi-step approval handling
- Retry logic for button clicks

---

### web-test-report
Generate test reports after testing.

**Responsibilities:**
- Summarize test results (pass/fail/skip)
- Document failures with screenshots
- List issues found
- Provide recommendations

**Output:** `./test-output/test-report.md`

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
│
├── web-test/                       # Core testing skill
│   ├── SKILL.md                    # Skill definition
│   ├── references/                 # Supporting documentation
│   └── scripts/
│       ├── test-helper.js          # Main CLI entry point
│       ├── lib/                    # Core libraries
│       └── commands/               # Command modules
│           ├── basic.js            # Browser commands
│           ├── dev-server.js       # Dev server commands
│           ├── login.js            # Login detection
│           └── vision.js           # Vision/AI commands
│
├── web-test-cleanup/               # Cleanup skill
│   ├── SKILL.md
│   └── scripts/
│       └── cleanup.sh              # Cleanup script
│
├── web-test-research/              # Project research skill
│   └── SKILL.md                    # No scripts needed
│
├── web-test-plan/                  # Test planning skill
│   └── SKILL.md                    # No scripts needed
│
├── web-test-wallet-setup/          # Wallet setup skill
│   ├── SKILL.md
│   └── scripts/
│       ├── wallet-setup-helper.js  # CLI entry point
│       ├── lib/                    # Shared libraries
│       └── commands/
│           └── wallet-setup.js     # Setup commands
│
├── web-test-wallet-connect/        # Wallet connect skill
│   ├── SKILL.md
│   └── scripts/
│       ├── wallet-connect-helper.js # CLI entry point
│       ├── wallet-connect-flow.js   # Full connection flow
│       ├── lib/                     # Shared libraries
│       └── commands/
│           └── wallet-connect.js    # Connect commands
│
└── web-test-report/                # Report generation skill
    └── SKILL.md                    # No scripts needed
```

## Script Entry Points

| Skill | Entry Point | Description |
|-------|-------------|-------------|
| web-test | `scripts/test-helper.js` | Core browser commands |
| web-test-cleanup | `scripts/cleanup.sh` | Kill processes, free ports |
| web-test-wallet-setup | `scripts/wallet-setup-helper.js` | Download & init wallet |
| web-test-wallet-connect | `scripts/wallet-connect-helper.js` | Connect wallet to DApp |

## Learn More

- [agentskills.io](https://agentskills.io/) - Open standard for AI agent skills
- [ai-agent-skills on npm](https://www.npmjs.com/package/ai-agent-skills) - CLI for installing skills

## License

MIT
