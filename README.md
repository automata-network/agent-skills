# Agent Skills

A collection of AI agent skills following the [agentskills.io](https://agentskills.io/) specification. These skills can be installed and used across multiple AI coding agents including Claude Code, Cursor, Codex, and more.

## Two Workflows

The web-test skills are designed around **two distinct workflows**:

### Workflow 1: Generate Test Cases (One-time)

```
$ skill web-test-case-gen
```

Analyzes your project and generates persistent test cases that can be committed to git.

```
┌─────────────────────────────────────────────────────────────────┐
│  WORKFLOW 1: Generate Test Cases                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  $ skill web-test-case-gen                                      │
│         ↓                                                       │
│  1. web-test-research    (Analyze project, detect features)     │
│         ↓                                                       │
│  2. web-test-case-gen    (Generate YAML test cases)             │
│         ↓                                                       │
│  Output: tests/*.yaml    (Commit to GitHub)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Output files (in your project):**
```
<your-project>/
└── tests/
    ├── config.yaml         # Project configuration
    ├── test-cases.yaml     # All test cases
    └── README.md           # How to run tests
```

### Workflow 2: Execute Tests (Repeatable)

```
$ skill web-test
```

Runs tests from your committed test cases.

```
┌─────────────────────────────────────────────────────────────────┐
│  WORKFLOW 2: Execute Tests                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  $ skill web-test                                               │
│         ↓                                                       │
│  1. Check tests/ folder exists?                                 │
│     ├─ NO  → Prompt user, wait 2 min, fail if no response       │
│     └─ YES → Continue                                           │
│         ↓                                                       │
│  2. web-test-cleanup         (Clean previous session)           │
│         ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  If Web3 DApp (from config.yaml):                       │   │
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

## Available Skills

| Skill | Description |
|-------|-------------|
| [web-test](./web-test/SKILL.md) | Execute tests from persistent test cases |
| [web-test-case-gen](./web-test-case-gen/SKILL.md) | Generate persistent test cases from project analysis |
| [web-test-research](./web-test-research/SKILL.md) | Analyze project - detect framework, features, Web3 status |
| [web-test-cleanup](./web-test-cleanup/SKILL.md) | Clean up test sessions - kill browsers, stop servers |
| [web-test-wallet-setup](./web-test-wallet-setup/SKILL.md) | Set up Rabby wallet for Web3 DApp testing |
| [web-test-wallet-connect](./web-test-wallet-connect/SKILL.md) | Connect wallet to Web3 DApp |
| [web-test-report](./web-test-report/SKILL.md) | Generate test reports with visual indicators |

## Skill Dependencies

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Skill Dependencies                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  web-test-case-gen                                                       │
│         │                                                                │
│         └──▶ web-test-research                                           │
│                                                                          │
│  web-test                                                                │
│         │                                                                │
│         ├──▶ web-test-cleanup                                            │
│         │                                                                │
│         ├──▶ web-test-wallet-setup  ─▶ web-test-wallet-connect          │
│         │    (if Web3 DApp)                                              │
│         │                                                                │
│         └──▶ web-test-report                                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Skills

```bash
npx ai-agent-skills install automata-network/agent-skills --agent claude
```

### 2. Generate Test Cases (First Time)

```bash
# In your project directory
skill web-test-case-gen
```

This analyzes your project and creates `tests/` directory with YAML test cases.

### 3. Commit Test Cases

```bash
git add tests/
git commit -m "Add test cases"
```

### 4. Run Tests (Anytime)

```bash
skill web-test
```

## Test Case Format

### tests/config.yaml

```yaml
project:
  name: MyDApp
  url: http://localhost:3000
  framework: React

web3:
  enabled: true
  wallet: rabby
  network: ethereum

execution_order:
  - WALLET-001
  - SWAP-001
  - SWAP-002
```

### tests/test-cases.yaml

```yaml
test_cases:
  - id: WALLET-001
    name: Connect Wallet
    feature: Wallet Connection
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

  - id: SWAP-001
    name: Swap Native Token
    feature: Token Swap
    priority: critical
    web3: true
    wallet_popups: 1
    preconditions:
      - WALLET-001 passed
    steps:
      - action: navigate
        url: /swap
      - action: vision-type
        target: amount input
        value: "0.1"
      - action: vision-click
        target: Swap button
      - action: wallet-approve
    expected:
      - Swap transaction succeeds
```

## How Vision-Based Testing Works

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

## Web3 DApp Testing

For Web3 DApps, set the wallet private key:

```bash
export WALLET_PRIVATE_KEY="your_private_key_here"
```

**Security Notes:**
- Private key is only read from environment variables
- `.env` files are intentionally not supported to prevent accidental commits
- Use a test wallet with test funds only

## Project Structure

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
├── web-test-research/              # Project research skill
│   └── SKILL.md
│
├── web-test-cleanup/               # Cleanup skill
│   ├── SKILL.md
│   └── scripts/
│       └── cleanup.sh
│
├── web-test-wallet-setup/          # Wallet setup skill
│   ├── SKILL.md
│   └── scripts/
│       ├── wallet-setup-helper.js
│       ├── lib/
│       └── commands/
│
├── web-test-wallet-connect/        # Wallet connect skill
│   ├── SKILL.md
│   └── scripts/
│       ├── wallet-connect-helper.js
│       ├── lib/
│       └── commands/
│
└── web-test-report/                # Report generation skill
    └── SKILL.md
```

## Supported Agents

- Claude Code
- Cursor
- Codex
- VS Code (GitHub Copilot)
- Amp
- Goose
- OpenCode
- Any agent supporting the SKILL.md format

## Learn More

- [agentskills.io](https://agentskills.io/) - Open standard for AI agent skills
- [ai-agent-skills on npm](https://www.npmjs.com/package/ai-agent-skills) - CLI for installing skills

## License

MIT
