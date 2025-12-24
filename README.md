# Agent Skills

A collection of AI agent skills following the [agentskills.io](https://agentskills.io/) specification for automated web application testing.

## 1. Installation

Use the [ai-agent-skills](https://www.npmjs.com/package/ai-agent-skills) CLI to install skills:

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

## 2. Supported Agents

These skills work with any AI coding agent that supports the SKILL.md format:

- Claude Code
- Cursor
- Codex
- VS Code (GitHub Copilot)
- Amp
- Goose
- OpenCode

## 3. Manual Configuration

### Web3 DApp Testing (Optional)

For testing Web3 DApps, set the wallet private key as an environment variable:

```bash
export WALLET_PRIVATE_KEY="your_private_key_here"
```

**Security Notes:**
- Private key is **only read from environment variables** (not .env files)
- `.env` files are intentionally not supported to prevent accidental commits
- Use a **test wallet with test funds only**
- Optionally set `WALLET_PASSWORD` for wallet unlock (auto-generated if not set)

## 4. How to Run

Simply tell your AI agent what you want to do:

### Generate Test Cases (First Time)

```
"Generate test cases for this project"
```

or

```
"Run web-test-case-gen to analyze and create test cases"
```

This will:
1. Analyze your project (dependencies, code, UI screenshots)
2. Generate test cases in `./tests/` directory
3. You can commit these to git for repeatable testing

### Git Configuration

After generating test cases, configure your project's git:

```bash
# Add tests/ to git (persistent test cases)
git add tests/
git commit -m "Add test cases"

# Add test-output/ to .gitignore (temporary artifacts)
echo "test-output/" >> .gitignore
```

| Directory | Git Status | Contents |
|-----------|------------|----------|
| `tests/` | **Commit to git** | Test case definitions (YAML), reusable across runs |
| `test-output/` | **Add to .gitignore** | Screenshots, reports, browser profiles (temporary) |

### Execute Tests

```
"Run the tests for this project"
```

or

```
"Use web-test to execute the test cases"
```

This will:
1. Load test cases from `./tests/`
2. Set up browser and wallet (if Web3)
3. Execute all tests
4. Generate a report

## 5. Project Structure

```
agent-skills/
├── README.md
├── LICENSE
│
├── web-test/                       # Test execution skill
│   ├── SKILL.md
│   └── scripts/
│       ├── test-helper.js          # Main CLI
│       ├── lib/                    # Core libraries
│       └── commands/               # Command modules
│
├── web-test-case-gen/              # Test case generation skill
│   └── SKILL.md
│
├── web-test-research/              # Project analysis (internal)
│   └── SKILL.md
│
├── web-test-cleanup/               # Cleanup (internal)
│   ├── SKILL.md
│   └── scripts/
│       └── cleanup.sh
│
├── web-test-wallet-setup/          # Wallet setup (internal)
│   ├── SKILL.md
│   └── scripts/
│       ├── wallet-setup-helper.js
│       ├── lib/
│       └── commands/
│
├── web-test-wallet-connect/        # Wallet connect (internal)
│   ├── SKILL.md
│   └── scripts/
│       ├── wallet-connect-helper.js
│       ├── lib/
│       └── commands/
│
└── web-test-report/                # Report generation (internal)
    └── SKILL.md
```

## 6. How It Works

### Vision-Based Testing

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

1. **Browser Control**: Node.js uses Playwright to control Chrome
2. **Screenshot Capture**: After each action, capture screenshot
3. **AI Vision Analysis**: AI analyzes screenshot to determine next action
4. **Task Execution**: AI executes test steps based on visual analysis

### Test Case Format

Test cases are stored in YAML format in your project's `./tests/` directory:

**tests/config.yaml**
```yaml
project:
  name: MyDApp
  url: http://localhost:3000

web3:
  enabled: true
  wallet: rabby

execution_order:
  - WALLET-001
  - SWAP-001
```

**tests/test-cases.yaml**
```yaml
test_cases:
  - id: WALLET-001
    name: Connect Wallet
    priority: critical
    web3: true
    wallet_popups: 1
    steps:
      - action: navigate
        url: /
      - action: vision-click
        target: Connect Wallet button
      - action: wallet-approve
    expected:
      - Wallet address displayed
```

## 7. Two Workflows

### Workflow 1: Generate Test Cases

```
┌─────────────────────────────────────────────────────────────────┐
│  $ skill web-test-case-gen                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. web-test-research    (Analyze code + take UI screenshots)   │
│         ↓                                                       │
│  2. Generate YAML test cases                                    │
│         ↓                                                       │
│  Output: tests/*.yaml    (Commit to GitHub)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow 2: Execute Tests

```
┌─────────────────────────────────────────────────────────────────┐
│  $ skill web-test                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Check tests/ exists?                                        │
│     ├─ NO  → Prompt user, wait 2 min, fail if no response       │
│     └─ YES → Continue                                           │
│         ↓                                                       │
│  2. web-test-cleanup         (Clean previous session)           │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  If Web3 DApp:                                          │   │
│  │  3. web-test-wallet-setup                               │   │
│  │  4. web-test-wallet-connect                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│         ↓                                                       │
│  5. Execute test cases       (Vision-based testing)             │
│         ↓                                                       │
│  6. web-test-report          (Generate report)                  │
│         ↓                                                       │
│  7. web-test-cleanup --keep-data                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 8. Available Skills

### User-Facing Skills

These skills can be invoked directly by users:

| Skill | Description | Usage |
|-------|-------------|-------|
| [web-test-case-gen](./web-test-case-gen/SKILL.md) | Generate persistent test cases from project analysis (code + UI screenshots) | `skill web-test-case-gen` |
| [web-test](./web-test/SKILL.md) | Execute tests from `./tests/` directory and generate report | `skill web-test` |

### Internal Skills

These skills are called automatically by user-facing skills. Do not invoke directly.

| Skill | Description | Called By |
|-------|-------------|-----------|
| [web-test-research](./web-test-research/SKILL.md) | Analyze project: detect framework, dependencies, Web3 status, take UI screenshots | `web-test-case-gen` |
| [web-test-cleanup](./web-test-cleanup/SKILL.md) | Kill browsers, stop dev servers, free ports, clean artifacts | `web-test` |
| [web-test-wallet-setup](./web-test-wallet-setup/SKILL.md) | Download and initialize Rabby wallet extension | `web-test` (if Web3) |
| [web-test-wallet-connect](./web-test-wallet-connect/SKILL.md) | Connect wallet to DApp, handle approval popups | `web-test` (if Web3) |
| [web-test-report](./web-test-report/SKILL.md) | Generate test report with pass/fail indicators | `web-test` |

### Skill Dependency Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Skill Dependencies                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER-FACING:                                                            │
│                                                                          │
│  web-test-case-gen ─────────▶ web-test-research (internal)               │
│                                                                          │
│  web-test ──┬───────────────▶ web-test-cleanup (internal)                │
│             │                                                            │
│             ├── (if Web3) ──▶ web-test-wallet-setup (internal)           │
│             │                        │                                   │
│             │                        ▼                                   │
│             │                 web-test-wallet-connect (internal)         │
│             │                                                            │
│             └───────────────▶ web-test-report (internal)                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Skill Responsibilities

| Skill | Key Responsibilities |
|-------|---------------------|
| **web-test-case-gen** | Run research, generate YAML test cases, save to `./tests/` |
| **web-test** | Load test cases, orchestrate full test flow, execute vision-based tests |
| **web-test-research** | Read package.json, WebSearch dependencies, read code, start dev server, take UI screenshots, analyze features |
| **web-test-cleanup** | Kill Chromium/Chrome processes, stop dev servers, free ports (3000, 5173, 8080), remove test-output |
| **web-test-wallet-setup** | Download Rabby wallet, import private key, initialize and unlock wallet |
| **web-test-wallet-connect** | Navigate with wallet extension, click Connect Wallet, handle popups, verify connection |
| **web-test-report** | Collect test results, generate markdown report with ✅/❌ indicators, document failures |

## 9. Learn More

- [agentskills.io](https://agentskills.io/) - Open standard for AI agent skills
- [ai-agent-skills on npm](https://www.npmjs.com/package/ai-agent-skills) - CLI for installing skills
- [Playwright](https://playwright.dev/) - Browser automation framework

## License

MIT
