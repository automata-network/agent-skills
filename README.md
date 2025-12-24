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

For testing Web3 DApps, create a `.test-env` file in `tests/` directory:

```bash
mkdir -p tests
echo 'WALLET_PRIVATE_KEY="your_private_key_here"' > tests/.test-env
```

**Security Notes:**

- Private key is **only read from `tests/.test-env`** file (not environment variables)
- This file is NOT exposed to AI agent APIs
- Add `.test-env` to `.gitignore` to prevent accidental commits
- Use a **test wallet with test funds only**
- `WALLET_PASSWORD` is auto-generated and saved to `.test-env` if not set

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

or

```
"Use web-test-case-gen to analyze and generate test cases for https://staging.carrier.so/"
```

This will:

1. Analyze your project (dependencies, code, UI screenshots)
2. Generate test cases in `./tests/` directory
3. You can commit these to git for repeatable testing

### Execute Tests

```
"Run the tests for this project"
```

or

```
"Use web-test to execute the test cases"
```

or

```
"Use web-test to execute the test cases for https://staging.carrier.so/"
```

This will:

1. Load test cases from `./tests/`
2. Set up browser and wallet (if Web3)
3. Execute all tests
4. Generate a report in `./test-output/`

### Git Configuration

After generating test cases, configure your project's git:

```bash
# Add tests/ to git (persistent test cases)
git add tests/
git commit -m "Add test cases"

# Add test-output/ to .gitignore (temporary artifacts)
echo "test-output/" >> .gitignore
```

| Directory      | Git Status            | Contents                                           |
| -------------- | --------------------- | -------------------------------------------------- |
| `tests/`       | **Commit to git**     | Test case definitions (YAML), reusable across runs |
| `test-output/` | **Add to .gitignore** | Screenshots, reports, browser profiles (temporary) |

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
├── web-test-wallet-sign/           # Wallet sign/tx (internal)
│   ├── SKILL.md
│   └── scripts/
│       ├── wallet-sign-helper.js
│       ├── lib/
│       └── commands/
│
└── web-test-report/                # Report generation (internal)
    └── SKILL.md
```

## 6. How It Works

### Two-Phase Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1: GENERATE                               │
│                                                                         │
│   $ skill web-test-case-gen                                             │
│                                                                         │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│   │ Analyze Code    │────▶│ Take UI         │────▶│ Generate YAML   │  │
│   │ (package.json,  │     │ Screenshots     │     │ Test Cases      │  │
│   │  WebSearch)     │     │ (Playwright)    │     │ (tests/*.yaml)  │  │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘  │
│                                                                         │
│   Output: tests/config.yaml, tests/test-cases.yaml → Commit to Git     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 2: EXECUTE                                │
│                                                                         │
│   $ skill web-test                                                      │
│                                                                         │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│   │ Load Test Cases │────▶│ Setup Wallet    │────▶│ Execute Tests   │  │
│   │ (tests/*.yaml)  │     │ (if Web3 DApp)  │     │ (Vision-based)  │  │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘  │
│                                                           │             │
│                                                           ▼             │
│                                                   ┌─────────────────┐  │
│                                                   │ Generate Report │  │
│                                                   │ (test-output/)  │  │
│                                                   └─────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Vision-Based Testing

During test execution, AI uses vision to interact with the UI:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   AI Agent      │────▶│  test-helper.js  │────▶│   Playwright    │
│ (Claude Code)   │     │     (CLI)        │     │   Browser       │
└────────┬────────┘     └──────────────────┘     └────────┬────────┘
         │                                                 │
         │◀──────────── Screenshot (Base64) ◀─────────────┘
         │
         ▼
   Visual Analysis → Determine click coordinates → Execute action
```

### Test Case Format

Test cases are stored in YAML format in your project's `./tests/` directory:

**tests/config.yaml**

```yaml
project:
  name: MyDApp
  url: http://localhost:3000

web3:
  enabled: true
  wallet: metamask

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

## 7. Available Skills

### User-Facing Skills

These skills can be invoked directly by users:

| Skill                                             | Description                                                                  | Usage                     |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------- |
| [web-test-case-gen](./web-test-case-gen/SKILL.md) | Generate persistent test cases from project analysis (code + UI screenshots) | `skill web-test-case-gen` |
| [web-test](./web-test/SKILL.md)                   | Execute tests from `./tests/` directory and generate report                  | `skill web-test`          |

### Internal Skills

These skills are called automatically by user-facing skills. Do not invoke directly.

| Skill                                                         | Description                                                                       | Called By            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------- |
| [web-test-research](./web-test-research/SKILL.md)             | Analyze project: detect framework, dependencies, Web3 status, take UI screenshots | `web-test-case-gen`  |
| [web-test-cleanup](./web-test-cleanup/SKILL.md)               | Kill browsers, stop dev servers, free ports, clean artifacts                      | `web-test`           |
| [web-test-wallet-setup](./web-test-wallet-setup/SKILL.md)     | Download and initialize MetaMask wallet extension                                 | `web-test` (if Web3) |
| [web-test-wallet-connect](./web-test-wallet-connect/SKILL.md) | Connect wallet to DApp, handle approval popups                                    | `web-test` (if Web3) |
| [web-test-wallet-sign](./web-test-wallet-sign/SKILL.md)       | Handle MetaMask signature/transaction popups, auto-approve or reject              | `web-test` (if Web3) |
| [web-test-report](./web-test-report/SKILL.md)                 | Generate test report with pass/fail indicators                                    | `web-test`           |

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
│             │                        │                                   │
│             │                        ▼                                   │
│             │                 web-test-wallet-sign (auto on click)       │
│             │                                                            │
│             └───────────────▶ web-test-report (internal)                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Skill Responsibilities

| Skill                       | Key Responsibilities                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **web-test-case-gen**       | Run research, generate YAML test cases, save to `./tests/`                                                    |
| **web-test**                | Load test cases, orchestrate full test flow, execute vision-based tests                                       |
| **web-test-research**       | Read package.json, WebSearch dependencies, read code, start dev server, take UI screenshots, analyze features |
| **web-test-cleanup**        | Kill Chromium/Chrome processes, stop dev servers, free ports (3000, 5173, 8080), remove test-output           |
| **web-test-wallet-setup**   | Download MetaMask wallet, import private key, initialize and unlock wallet                                    |
| **web-test-wallet-connect** | Navigate with wallet extension, click Connect Wallet, handle popups, verify connection                        |
| **web-test-wallet-sign**    | Auto-detect MetaMask popups after clicks, approve signatures/transactions, reject on gas errors              |
| **web-test-report**         | Collect test results, generate markdown report with ✅/❌ indicators, document failures                       |

## 8. Learn More

- [agentskills.io](https://agentskills.io/) - Open standard for AI agent skills
- [ai-agent-skills on npm](https://www.npmjs.com/package/ai-agent-skills) - CLI for installing skills
- [Playwright](https://playwright.dev/) - Browser automation framework

## License

MIT
