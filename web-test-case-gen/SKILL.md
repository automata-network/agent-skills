---
name: web-test-case-gen
description: Generate persistent test cases from project analysis. Runs web-test-research first, then generates YAML test cases to ./tests/ directory. Commit to git for repeatable testing.
license: MIT
compatibility: Node.js 18+
metadata:
  author: AI Agent
  version: 1.0.0
allowed-tools: Bash Read Write Glob Grep WebSearch WebFetch Skill
---

# Test Case Generation

Generate persistent test cases that can be committed to version control for repeatable testing.

## What This Skill Does

1. **Runs web-test-research** - Analyze project, detect features, research protocols
2. **Generates test cases** - Create YAML files based on research
3. **Saves to ./tests/** - In the TARGET PROJECT (not agent-skills)
4. **Ready for git commit** - Test cases persist across sessions

## Quick Start

```
Generate test cases for this project
```

## Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  web-test-case-gen                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Run web-test-research                                  │
│          ↓                                                      │
│          - Analyze package.json                                 │
│          - Detect Web3 status                                   │
│          - Research unknown protocols (WebSearch)               │
│          - Read code to understand features                     │
│          ↓                                                      │
│  Step 2: Generate test cases                                    │
│          ↓                                                      │
│          - Create tests/config.yaml                             │
│          - Create tests/test-cases.yaml                         │
│          - Create tests/README.md                               │
│          ↓                                                      │
│  Step 3: Output ready for git commit                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Output Files

**Location:** `./tests/` (in the project being tested)

```
<target-project>/
└── tests/
    ├── config.yaml         # Project configuration
    ├── test-cases.yaml     # All test cases
    └── README.md           # How to run tests
```

### tests/config.yaml

```yaml
project:
  name: MyDApp
  url: http://localhost:3000
  framework: React

web3:
  enabled: true
  wallet: metamask
  network: ethereum

generated:
  date: 2024-01-15T14:30:00Z
  by: web-test-case-gen

features:
  - name: Token Swap
    code: src/features/swap/
  - name: Wallet Connection
    code: src/hooks/useConnect.ts

execution_order:
  - WALLET-001
  - SWAP-001
  - SWAP-002
  - SWAP-003
```

### tests/test-cases.yaml

```yaml
test_cases:
  # Wallet Connection Tests
  - id: WALLET-001
    name: Connect Wallet
    feature: Wallet Connection
    priority: critical
    web3: true
    wallet_popups: 1
    preconditions: []
    steps:
      - action: navigate
        url: /
      - action: vision-screenshot
        name: before-connect
      - action: vision-click
        target: Connect Wallet button
      - action: vision-click
        target: MetaMask option in modal
      - action: wallet-approve
      - action: vision-screenshot
        name: after-connect
    expected:
      - Wallet address displayed in header
      - Connection modal closed

  # Swap Tests
  - id: SWAP-001
    name: Swap Native Token
    feature: Token Swap
    priority: critical
    web3: true
    wallet_popups: 1
    preconditions:
      - WALLET-001 passed
      - Has native token balance
    steps:
      - action: navigate
        url: /swap
      - action: vision-click
        target: source token dropdown
      - action: vision-click
        target: ETH option
      - action: vision-type
        target: amount input
        value: "0.1"
      - action: vision-click
        target: destination token dropdown
      - action: vision-click
        target: USDC option
      - action: wait
        ms: 3000
        reason: Wait for quote
      - action: vision-screenshot
        name: before-swap
      - action: vision-click
        target: Swap button
      - action: wallet-approve
      - action: wait
        ms: 10000
        reason: Wait for transaction
      - action: vision-screenshot
        name: after-swap
    expected:
      - Success message displayed
      - Balance updated

  - id: SWAP-002
    name: Swap ERC20 Token (Approval Required)
    feature: Token Swap
    priority: critical
    web3: true
    wallet_popups: 2
    preconditions:
      - WALLET-001 passed
      - Has USDC balance
      - First time swapping USDC
    steps:
      - action: navigate
        url: /swap
      - action: vision-click
        target: source token dropdown
      - action: vision-click
        target: USDC option
      - action: vision-type
        target: amount input
        value: "10"
      - action: vision-click
        target: destination token dropdown
      - action: vision-click
        target: ETH option
      - action: wait
        ms: 3000
      - action: vision-click
        target: Swap button
      - action: wallet-approve
        note: Token approval popup
      - action: wallet-approve
        note: Swap transaction popup
      - action: wait
        ms: 10000
      - action: vision-screenshot
        name: swap-complete
    expected:
      - Two wallet popups handled
      - Swap succeeds

  - id: SWAP-003
    name: Insufficient Balance Error
    feature: Token Swap
    priority: high
    web3: true
    wallet_popups: 0
    preconditions:
      - WALLET-001 passed
    steps:
      - action: navigate
        url: /swap
      - action: vision-type
        target: amount input
        value: "999999"
      - action: vision-screenshot
        name: insufficient-balance
    expected:
      - Error message shown
      - Swap button disabled
      - No wallet popup triggered
```

### tests/README.md

```markdown
# Test Cases

Generated by `web-test-case-gen` on [date].

## How to Run Tests

```bash
# Using the web-test skill
skill web-test
```

## Test Summary

| ID | Name | Priority | Web3 | Popups |
|----|------|----------|------|--------|
| WALLET-001 | Connect Wallet | Critical | Yes | 1 |
| SWAP-001 | Swap Native Token | Critical | Yes | 1 |
| SWAP-002 | Swap ERC20 (Approval) | Critical | Yes | 2 |
| SWAP-003 | Insufficient Balance | High | Yes | 0 |

## Regenerate Test Cases

If the project changes, regenerate:
```bash
skill web-test-case-gen
```
```

## Step-by-Step Instructions

### Step 1: Use web-test-research Skill

First, invoke the research skill to analyze the project:

```
Use skill web-test-research to analyze this project
```

This will:
- Check package.json for dependencies
- Detect if it's a Web3 DApp
- WebSearch unknown protocols
- Read code to understand features
- Output feature analysis

### Step 2: Generate Test Cases

Based on the research output, generate YAML test cases:

**For each feature found:**
1. Create a happy path test case
2. Create error handling test cases
3. Create edge case test cases
4. Include wallet popup counts for Web3 actions

### Step 3: Write YAML Files

```bash
mkdir -p ./tests
```

Write `config.yaml`:
```bash
cat > ./tests/config.yaml << 'EOF'
project:
  name: [from research]
  url: [from research]
  framework: [from research]

web3:
  enabled: [true/false]
  wallet: metamask
  network: [from research]

generated:
  date: [current date]
  by: web-test-case-gen

features:
  [list from research]

execution_order:
  [ordered test IDs]
EOF
```

Write `test-cases.yaml`:
```bash
cat > ./tests/test-cases.yaml << 'EOF'
test_cases:
  [generated test cases]
EOF
```

Write `README.md`:
```bash
cat > ./tests/README.md << 'EOF'
# Test Cases
[summary and instructions]
EOF
```

### Step 4: Inform User

After generating:
```
Test cases generated in ./tests/

Files created:
- tests/config.yaml
- tests/test-cases.yaml
- tests/README.md

Next steps:
1. Review the generated test cases
2. Commit to git: git add tests/ && git commit -m "Add test cases"
3. Run tests: skill web-test
```

## Test Case Generation Rules

### From Research → Test Cases

| Research Output | Generate |
|-----------------|----------|
| Feature with user flow | Happy path test case |
| Input validation | Error handling test cases |
| Wallet interaction | Test with wallet_popups count |
| External protocol | Research-based test scenarios |

### Priority Assignment

| Feature Type | Priority |
|--------------|----------|
| Wallet connection | Critical |
| Core business function | Critical |
| Error handling | High |
| Edge cases | Medium |
| Optional features | Low |

### Action Types in Steps

| Action | Parameters | Description |
|--------|------------|-------------|
| `navigate` | `url` | Go to URL |
| `vision-screenshot` | `name` | Take screenshot |
| `vision-click` | `target` | Click on element (AI determines coordinates) |
| `vision-type` | `target`, `value` | Type text |
| `wait` | `ms`, `reason` | Wait for condition |
| `wallet-approve` | `note` | Handle wallet popup |

## Related Skills

| Skill | Relationship |
|-------|-------------|
| web-test-research | Called automatically first |
| web-test | Uses generated test cases |
| web-test-report | References test case IDs |

## After Generation

1. **Review** - Check generated test cases make sense
2. **Commit** - `git add tests/ && git commit -m "Add test cases"`
3. **Run** - `skill web-test` to execute tests
