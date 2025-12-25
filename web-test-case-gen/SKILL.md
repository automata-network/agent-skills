---
name: web-test-case-gen
description: Generate persistent test cases from project analysis, or add individual test cases interactively. Supports full project analysis or adding single test cases via prompt description with browser exploration.
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

### Full Project Analysis Mode
1. **Runs web-test-research** - Analyze project, detect features, research protocols
2. **Generates test cases** - Create YAML files based on research
3. **Saves to ./tests/** - In the TARGET PROJECT (not agent-skills)
4. **Ready for git commit** - Test cases persist across sessions

### Add Single Test Case Mode (Interactive)
1. **Parse user description** - Extract feature, actions, expected outcomes
2. **Read source code** - Search codebase for related components
3. **Explore in browser** - Launch browser, navigate, take screenshots
4. **Generate test case** - Create YAML based on code + visual analysis
5. **Append to existing** - Add to test-cases.yaml and update execution_order

## Quick Start

### Generate All Test Cases (Full Analysis)

```
Generate test cases for this project
```

### Add Single Test Case (Interactive)

```
Add a test case for: [describe the feature you want to test]
```

Example prompts:
```
Add a test case for: clicking the "Claim Rewards" button and verifying rewards are claimed
```
```
Add a test case for: testing the search function with invalid input
```
```
Add a test case for: user can stake tokens and see updated balance
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

## Add Single Test Case (Interactive Mode)

When user provides a specific test case description, follow this workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│  web-test-case-gen (Add Single Test Case)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Parse user's test description                          │
│          ↓                                                      │
│          - Extract feature name                                 │
│          - Identify expected actions                            │
│          - Note expected outcomes                               │
│          ↓                                                      │
│  Step 2: Check if tests/config.yaml exists                      │
│          ├─ NO  → Run web-test-research first                   │
│          └─ YES → Read existing config                          │
│          ↓                                                      │
│  Step 3: Read related source code                               │
│          ↓                                                      │
│          - Search for feature in codebase (Grep/Glob)           │
│          - Read relevant component/function code                │
│          - Understand the implementation                        │
│          ↓                                                      │
│  Step 4: Launch browser and explore feature                     │
│          ↓                                                      │
│          - Use skill web-test-cleanup                           │
│          - If Web3 DApp, use skill web-test-wallet-setup        │
│          - Navigate to project URL                              │
│          - Take screenshots of relevant pages                   │
│          - Identify UI elements needed for test                 │
│          ↓                                                      │
│  Step 5: Generate test case YAML                                │
│          ↓                                                      │
│          - Create unique ID (FEATURE-NNN)                       │
│          - Define steps based on exploration                    │
│          - Add expected outcomes                                │
│          ↓                                                      │
│  Step 6: Append to test-cases.yaml                              │
│          ↓                                                      │
│          - Add test case to existing file                       │
│          - Update execution_order in config.yaml                │
│          ↓                                                      │
│  Step 7: Cleanup browser                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step: Add Single Test Case

#### Step 1: Parse User Description

Extract key information from the user's prompt:

| User Says | Extract |
|-----------|---------|
| "clicking the Claim Rewards button" | Action: click, Target: "Claim Rewards" button |
| "verifying rewards are claimed" | Expected: success message or balance change |
| "testing search with invalid input" | Action: type invalid input, Expected: error message |
| "user can stake tokens" | Feature: staking, Action: stake flow |

#### Step 2: Check Existing Config

```bash
# Check if tests directory exists
ls ./tests/config.yaml
```

If no config exists:
```
No existing test configuration found.
Running web-test-research to analyze the project first...
```
Then use `skill web-test-research` and create initial config.

#### Step 3: Read Related Source Code

Search for the feature in codebase:

```bash
# Search for feature keywords in code
grep -r "Claim" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" src/
```

Read relevant files to understand:
- Component structure
- Function signatures
- Expected inputs/outputs
- Error handling

#### Step 4: Launch Browser and Explore

Use test-helper.js commands to explore:

```bash
SKILL_DIR="<path-to-web-test-skill>"

# Start browser and navigate
node $SKILL_DIR/scripts/test-helper.js navigate [project-url] --headed --keep-open

# Take screenshot for analysis
node $SKILL_DIR/scripts/test-helper.js vision-screenshot explore-feature.jpg --headed --keep-open

# Use Read tool to view screenshot and identify elements
```

Analyze the screenshot:
- Locate the target button/element
- Note its position and context
- Identify any prerequisite steps (login, navigation)

#### Step 5: Generate Test Case YAML

Create test case based on exploration:

```yaml
- id: REWARD-001   # Auto-generate unique ID
  name: Claim Rewards Success
  feature: Rewards
  priority: high
  web3: true       # Set based on config
  wallet_popups: 1 # Estimate based on action type
  preconditions:
    - WALLET-001 passed
    - Has claimable rewards
  steps:
    - action: navigate
      url: /rewards
    - action: vision-screenshot
      name: before-claim
    - action: vision-click
      target: Claim Rewards button
    - action: wallet-approve
    - action: wait
      ms: 5000
      reason: Wait for transaction
    - action: vision-screenshot
      name: after-claim
  expected:
    - Success message displayed
    - Rewards balance updated
```

#### Step 6: Append to Existing Files

Read current test-cases.yaml:
```bash
cat ./tests/test-cases.yaml
```

Append new test case:
```bash
cat >> ./tests/test-cases.yaml << 'EOF'

  - id: REWARD-001
    name: Claim Rewards Success
    # ... rest of test case
EOF
```

Update config.yaml execution_order:
```bash
# Add new test ID to execution_order
```

#### Step 7: Cleanup and Report

```bash
# Cleanup browser
skill web-test-cleanup --keep-data
```

Report to user:
```
✅ Test case added successfully!

New test case:
- ID: REWARD-001
- Name: Claim Rewards Success
- File: tests/test-cases.yaml

Next steps:
1. Review the generated test case
2. Commit: git add tests/ && git commit -m "Add REWARD-001 test case"
3. Run test: skill web-test
```

### ID Generation Rules

| Feature | ID Pattern | Example |
|---------|------------|---------|
| Wallet | WALLET-NNN | WALLET-001 |
| Swap | SWAP-NNN | SWAP-002 |
| Stake | STAKE-NNN | STAKE-001 |
| Claim | CLAIM-NNN | CLAIM-001 |
| Custom | CUSTOM-NNN | CUSTOM-001 |

Always check existing IDs and increment:
```bash
grep "id:" ./tests/test-cases.yaml | tail -5
```

## Output Files

**Location:** `./tests/` (in the project being tested)

```
<target-project>/
└── tests/
    ├── config.yaml         # Project configuration
    ├── test-cases.yaml     # All test cases
    ├── case-summary.md     # Summary of all test cases (NEW)
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
  # ╔════════════════════════════════════════════════════════════════╗
  # ║  CRITICAL: SEQUENTIAL EXECUTION ONLY - NO PARALLEL TESTS       ║
  # ╠════════════════════════════════════════════════════════════════╣
  # ║                                                                ║
  # ║  1. Tests execute ONE AT A TIME in this exact order            ║
  # ║  2. Each test MUST complete before the next one starts         ║
  # ║  3. NEVER run tests in parallel (screenshots will conflict)    ║
  # ║  4. Dependencies are enforced via depends_on field             ║
  # ║  5. Order is determined by agent during project exploration    ║
  # ║                                                                ║
  # ╚════════════════════════════════════════════════════════════════╝
  - WALLET-001    # No dependencies, runs first
  - SWAP-001      # depends_on: [WALLET-001]
  - SWAP-002      # depends_on: [WALLET-001, SWAP-001] (needs approval from SWAP-001)
  - SWAP-003      # depends_on: [WALLET-001]
```

### tests/test-cases.yaml

```yaml
test_cases:
  # ============================================
  # WALLET CONNECTION TEST (Web3 DApps only)
  # This is BOTH a test case AND a precondition for other tests
  # ============================================
  - id: WALLET-001
    name: Connect Wallet
    feature: Wallet Connection
    priority: critical
    web3: true
    wallet_popups: 1
    depends_on: []              # No dependencies, runs first
    preconditions: []
    # This test case uses web-test-wallet-connect skill internally
    uses_skill: web-test-wallet-connect
    description:
      purpose: |
        Verify user can connect MetaMask wallet to the DApp.
        This is the foundation for all Web3 functionality.
      notes:
        - Must run FIRST before any Web3 tests
        - Wallet extension must be set up via web-test-wallet-setup
        - Look for wallet address displayed after connection
        - Connection modal should close automatically
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

  # ============================================
  # TESTS REQUIRING WALLET CONNECTION
  # These tests have WALLET-001 as precondition
  # ============================================
  - id: SWAP-001
    name: Swap Native Token
    feature: Token Swap
    priority: critical
    web3: true
    wallet_popups: 1
    depends_on: [WALLET-001]   # Must run after WALLET-001 completes
    preconditions:
      - WALLET-001 passed  # <-- Requires wallet connected first
      - Has native token balance
    description:
      purpose: |
        Verify user can swap native token (ETH) for another token.
        Tests the core swap functionality with simplest token type.
      notes:
        - Native token swap does NOT require approval (only 1 popup)
        - Wait for quote to load before clicking Swap
        - Transaction may take 10+ seconds on mainnet
        - Check balance update after swap completes
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
    depends_on: [WALLET-001, SWAP-001]  # Runs after SWAP-001 (may need approval state from native swap)
    preconditions:
      - WALLET-001 passed
      - Has USDC balance
      - First time swapping USDC
    description:
      purpose: |
        Verify ERC20 token swap with token approval flow.
        Tests the two-step process: approve token spending + execute swap.
      notes:
        - ERC20 tokens require approval before first swap (2 popups)
        - First popup is token approval, second is swap transaction
        - If token was previously approved, only 1 popup appears
        - Approval is per-token, per-spender (router contract)
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
    depends_on: [WALLET-001]   # Only needs wallet connected
    preconditions:
      - WALLET-001 passed
    description:
      purpose: |
        Verify error handling when user enters amount exceeding balance.
        Tests client-side validation prevents invalid transactions.
      notes:
        - No wallet popup should appear (validation before submit)
        - Swap button should be disabled or show error state
        - Error message should be clear and user-friendly
        - This is a NEGATIVE test case
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

  # ============================================
  # NEGATIVE TEST CASES (Conditional - based on detected features)
  # ============================================

  # Wallet Disconnection Tests (Only for Web3 DApps)
  - id: WALLET-DISCONNECT-001
    name: Wallet Disconnected State
    feature: Wallet Connection
    priority: high
    web3: false
    wallet_popups: 0
    preconditions: []
    description:
      purpose: |
        Verify UI shows correct state when wallet is not connected.
        Tests that users are prompted to connect before using features.
      notes:
        - Run with fresh browser (no wallet connected)
        - Look for "Connect Wallet" button or similar prompt
        - No wallet address should be displayed
        - This is a NEGATIVE test case
    steps:
      - action: navigate
        url: /
      - action: vision-screenshot
        name: disconnected-state
    expected:
      - Connect button visible with text "Connect" or "Connect Wallet" or "连接钱包"
      - No wallet address displayed
      - User prompted to connect wallet

  - id: WALLET-DISCONNECT-002
    name: Protected Feature Access When Disconnected
    feature: Wallet Connection
    priority: high
    web3: false
    wallet_popups: 0
    preconditions: []
    description:
      purpose: |
        Verify protected features are inaccessible without wallet connection.
        Tests that Web3 features require authentication before use.
      notes:
        - Navigate directly to protected page (e.g., /swap)
        - Swap button should be disabled or show "Connect Wallet"
        - Should NOT be able to submit transaction
        - This is a NEGATIVE test case
    steps:
      - action: navigate
        url: /swap
      - action: vision-screenshot
        name: swap-disconnected
      - action: vision-click
        target: Swap button (if visible)
    expected:
      - Swap button disabled OR shows "Connect Wallet" text
      - Error message or prompt to connect wallet
      - Transaction cannot proceed without wallet

  # Form/API Failure Tests (Only when forms/API/transactions detected)
  - id: SWAP-FAIL-001
    name: Swap Transaction Rejected
    feature: Token Swap
    priority: high
    web3: true
    wallet_popups: 1
    depends_on: [WALLET-001]   # Needs wallet connected to test rejection
    preconditions:
      - WALLET-001 passed
    description:
      purpose: |
        Verify app handles user rejection of wallet transaction gracefully.
        Tests error recovery when user clicks "Reject" in MetaMask.
      notes:
        - Use wallet-reject action instead of wallet-approve
        - App should show clear error message (not crash)
        - Form should remain usable for retry
        - No balance should change
        - This is a NEGATIVE test case
    steps:
      - action: navigate
        url: /swap
      - action: vision-type
        target: amount input
        value: "0.1"
      - action: vision-click
        target: Swap button
      - action: wallet-reject
        note: User rejects transaction in wallet
      - action: vision-screenshot
        name: swap-rejected
    expected:
      - Error message displayed (e.g., "Transaction rejected", "User denied", "取消交易")
      - Form remains usable (can retry)
      - No balance change

  - id: FORM-FAIL-001
    name: Form Validation Error
    feature: Form Submission
    priority: high
    web3: false
    wallet_popups: 0
    preconditions: []
    description:
      purpose: |
        Verify form validation prevents submission of invalid data.
        Tests client-side validation with user-friendly error messages.
      notes:
        - Enter obviously invalid data (e.g., "invalid-email")
        - Look for inline error messages near the field
        - Form should NOT be submitted
        - Error styling should be visible (red border, icon)
        - This is a NEGATIVE test case
    steps:
      - action: navigate
        url: /form-page
      - action: vision-type
        target: email input
        value: "invalid-email"
      - action: vision-click
        target: Submit button
      - action: vision-screenshot
        name: form-validation-error
    expected:
      - Inline error message visible (e.g., "Invalid email", "请输入有效邮箱")
      - Form NOT submitted
      - Error styling on invalid field (red border, error icon)

  - id: API-FAIL-001
    name: API Error Handling
    feature: API Integration
    priority: high
    web3: false
    wallet_popups: 0
    preconditions: []
    description:
      purpose: |
        Verify app handles API errors gracefully with user-friendly messages.
        Tests error recovery when backend returns 500 or similar errors.
      notes:
        - Uses mock-api-error action to simulate server failure
        - App should show error UI (toast, alert, or error component)
        - Should provide retry option or clear next steps
        - Should NOT show raw error or crash
        - This is a NEGATIVE test case
    steps:
      - action: navigate
        url: /api-dependent-page
      - action: mock-api-error
        endpoint: /api/data
        status: 500
      - action: vision-screenshot
        name: api-error-state
    expected:
      - Error UI displayed (toast, alert, error message)
      - Clear error message (e.g., "Failed to load", "服务器错误", "请稍后重试")
      - Retry option available (retry button or refresh prompt)
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

| ID | Name | Priority | Web3 | Popups | Type |
|----|------|----------|------|--------|------|
| WALLET-001 | Connect Wallet | Critical | Yes | 1 | Positive |
| SWAP-001 | Swap Native Token | Critical | Yes | 1 | Positive |
| SWAP-002 | Swap ERC20 (Approval) | Critical | Yes | 2 | Positive |
| SWAP-003 | Insufficient Balance | High | Yes | 0 | Negative |
| WALLET-DISCONNECT-001 | Wallet Disconnected State | High | No | 0 | Negative |
| WALLET-DISCONNECT-002 | Protected Feature Access | High | No | 0 | Negative |
| SWAP-FAIL-001 | Swap Transaction Rejected | High | Yes | 1 | Negative |

## Regenerate Test Cases

If the project changes, regenerate:
```bash
skill web-test-case-gen
```
```

### tests/case-summary.md

```markdown
# Test Case Summary

Generated by `web-test-case-gen` on [date].

## Overview

| Total Cases | Positive | Negative | Web3 Required | Est. Duration |
|-------------|----------|----------|---------------|---------------|
| 7           | 3        | 4        | 5             | ~15 min       |

---

## Test Cases

### WALLET-001: Connect Wallet

| Field | Value |
|-------|-------|
| **Purpose** | Verify user can connect MetaMask wallet to the DApp |
| **Feature** | Wallet Connection |
| **Priority** | Critical |
| **Type** | Positive |
| **Steps** | 6 |
| **Depends On** | None |

**Steps:**
1. Navigate to homepage
2. Take screenshot (before-connect)
3. Click "Connect Wallet" button
4. Click MetaMask option in modal
5. Approve connection in wallet popup
6. Take screenshot (after-connect)

**Expected Results:**
- Wallet address displayed in header
- Connection modal closed

---

### SWAP-001: Swap Native Token

| Field | Value |
|-------|-------|
| **Purpose** | Verify user can swap native token (ETH) for another token |
| **Feature** | Token Swap |
| **Priority** | Critical |
| **Type** | Positive |
| **Steps** | 12 |
| **Depends On** | WALLET-001 |

**Steps:**
1. Navigate to /swap
2. Click source token dropdown
3. Select ETH option
4. Type amount "0.1"
5. Click destination token dropdown
6. Select USDC option
7. Wait 3s for quote
8. Take screenshot (before-swap)
9. Click Swap button
10. Approve transaction in wallet
11. Wait 10s for transaction
12. Take screenshot (after-swap)

**Expected Results:**
- Success message displayed
- Balance updated

---

### SWAP-002: Swap ERC20 Token (Approval Required)

| Field | Value |
|-------|-------|
| **Purpose** | Verify ERC20 token swap with token approval flow |
| **Feature** | Token Swap |
| **Priority** | Critical |
| **Type** | Positive |
| **Steps** | 12 |
| **Depends On** | WALLET-001, SWAP-001 |

**Steps:**
1. Navigate to /swap
2. Click source token dropdown
3. Select USDC option
4. Type amount "10"
5. Click destination token dropdown
6. Select ETH option
7. Wait 3s for quote
8. Click Swap button
9. Approve token approval popup
10. Approve swap transaction popup
11. Wait 10s for transaction
12. Take screenshot (swap-complete)

**Expected Results:**
- Two wallet popups handled
- Swap succeeds

---

### SWAP-003: Insufficient Balance Error

| Field | Value |
|-------|-------|
| **Purpose** | Verify error handling when user has insufficient balance |
| **Feature** | Token Swap |
| **Priority** | High |
| **Type** | Negative |
| **Steps** | 3 |
| **Depends On** | WALLET-001 |

**Steps:**
1. Navigate to /swap
2. Type amount "999999"
3. Take screenshot (insufficient-balance)

**Expected Results:**
- Error message shown
- Swap button disabled
- No wallet popup triggered

---

## Execution Order

```
1. WALLET-001 (no dependencies)
   ↓
2. SWAP-001 (depends on: WALLET-001)
   ↓
3. SWAP-002 (depends on: WALLET-001, SWAP-001)
   ↓
4. SWAP-003 (depends on: WALLET-001)
   ↓
...
```

## Notes

- All tests execute **sequentially** (one at a time)
- If a dependency fails, dependent tests are **skipped**
- Estimated duration assumes ~2-3 min per test case
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

Write `case-summary.md`:
```bash
cat > ./tests/case-summary.md << 'EOF'
# Test Case Summary

Generated by `web-test-case-gen` on [current date].

## Overview

| Total Cases | Positive | Negative | Web3 Required | Est. Duration |
|-------------|----------|----------|---------------|---------------|
| [count]     | [count]  | [count]  | [count]       | ~[N] min      |

---

## Test Cases

### [TEST-ID]: [Test Name]

| Field | Value |
|-------|-------|
| **Purpose** | [Why this test exists - what it verifies] |
| **Feature** | [Feature name] |
| **Priority** | [Critical/High/Medium/Low] |
| **Type** | [Positive/Negative] |
| **Steps** | [Number of steps] |
| **Depends On** | [List of dependencies or "None"] |

**Steps:**
1. [Step 1 description]
2. [Step 2 description]
...

**Expected Results:**
- [Expected result 1]
- [Expected result 2]
...

---

[Repeat for each test case]

## Execution Order

```
1. TEST-001 (no dependencies)
   ↓
2. TEST-002 (depends on: TEST-001)
   ↓
...
```

## Notes

- All tests execute **sequentially** (one at a time)
- If a dependency fails, dependent tests are **skipped**
- Estimated duration assumes ~2-3 min per test case
EOF
```

### Step 4: Inform User

After generating:
```
Test cases generated in ./tests/

Files created:
- tests/config.yaml       # Project configuration
- tests/test-cases.yaml   # All test cases (YAML)
- tests/case-summary.md   # Human-readable summary of all test cases
- tests/README.md         # How to run tests

Next steps:
1. Review the generated test cases
2. Commit to git: git add tests/ && git commit -m "Add test cases"
3. Run tests: skill web-test
```

## Test Case Generation Rules

### Wallet Connection as Precondition

For Web3 DApps (`web3.enabled: true`), wallet connection handling:

```
┌─────────────────────────────────────────────────────────────────┐
│  WALLET CONNECTION RULES                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. WALLET-001 (Connect Wallet) is a TEST CASE, not auto-run   │
│     - Uses web-test-wallet-connect skill internally             │
│     - First test in execution_order for Web3 DApps              │
│                                                                 │
│  2. Tests requiring wallet connection add precondition:         │
│     preconditions:                                              │
│       - WALLET-001 passed                                       │
│                                                                 │
│  3. Tests NOT requiring wallet (negative tests, etc.):          │
│     preconditions: []                                           │
│     - WALLET-DISCONNECT-001, WALLET-DISCONNECT-002              │
│     - These test disconnected state behavior                    │
│                                                                 │
│  4. web-test executor will:                                     │
│     - Run WALLET-001 when encountered in execution_order        │
│     - Check preconditions before each test                      │
│     - Skip test if precondition test failed                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### From Research → Test Cases

| Research Output | Generate |
|-----------------|----------|
| Feature with user flow | Happy path test case |
| Input validation | Error handling test cases |
| Wallet interaction | Test with wallet_popups count + precondition: WALLET-001 |
| External protocol | Research-based test scenarios |

### Negative Test Cases (Conditional)

Generate negative/failure test cases **based on detected project features**. Only add these when the corresponding feature exists.

#### Wallet Disconnection Tests (Only for Web3 DApps)

**Condition:** Only generate when `web3.enabled: true` in config.

When wallet is disconnected, verify the UI shows appropriate prompts:

| Element to Check | Expected Text (any of) |
|------------------|------------------------|
| Connect button | "Connect", "Connect Wallet", "连接钱包" |
| Login prompt | "未登录", "Not Logged In", "Sign In" |
| Status indicator | "Disconnected", "Not Connected" |

**Generate these tests when Web3 detected:**
- `WALLET-DISCONNECT-001`: After disconnect, UI shows connect button
- `WALLET-DISCONNECT-002`: Protected features inaccessible when disconnected

#### Form/API Failure Tests (Only when forms/API detected)

**Condition:** Only generate when project has form submissions or API calls.

| If Feature Detected | Generate Failure Cases |
|---------------------|------------------------|
| Form submission | Form validation error, submission error with message |
| Wallet transactions | Transaction rejected, Transaction failed, Insufficient balance |
| Login/Auth | Invalid credentials, Account locked |
| Search functionality | No results, Invalid input |

**Failure cases should verify:**
1. Clear error message is displayed (not just console log)
2. Error UI is visible (toast, alert, inline error, etc.)
3. User can recover (retry button, form reset, etc.)

### Test Case Dependencies (depends_on)

```
╔════════════════════════════════════════════════════════════════╗
║  DEPENDENCY RULES - AGENT MUST DETERMINE FROM PROJECT ANALYSIS ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  1. Agent determines dependencies by:                          ║
║     - Analyzing code during web-test-research                  ║
║     - Understanding feature relationships                      ║
║     - Observing UI flows and user journeys                     ║
║                                                                ║
║  2. Common dependency patterns:                                ║
║     - WALLET-001 → All Web3 tests (must connect first)         ║
║     - Login → All authenticated features                       ║
║     - Create → Read/Update/Delete (CRUD order)                 ║
║     - Form fill → Submit → Verify                              ║
║                                                                ║
║  3. depends_on field:                                          ║
║     depends_on: []           # No dependencies                 ║
║     depends_on: [WALLET-001] # Runs after WALLET-001           ║
║     depends_on: [A, B]       # Runs after BOTH A and B pass    ║
║                                                                ║
║  4. Execution rules:                                           ║
║     - Tests run ONE AT A TIME (never parallel)                 ║
║     - Test waits for ALL depends_on tests to complete          ║
║     - If ANY dependency fails, dependent test is SKIPPED       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**Why Dependencies Matter:**
- Some tests modify state (create user, stake tokens)
- Later tests may depend on that state
- Screenshots would conflict if tests run in parallel
- Proper ordering ensures predictable test results

**Agent Responsibility:**
The agent MUST analyze the project during web-test-research and determine:
1. Which features require authentication/wallet connection
2. Which features depend on data created by other tests
3. The logical order of user workflows
4. State dependencies between features

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
| `wallet-approve` | `note` | Handle wallet popup (approve) |
| `wallet-reject` | `note` | Reject wallet popup (for negative tests) |
| `mock-api-error` | `endpoint`, `status` | Simulate API failure |
| `check-text-visible` | `text` | Verify text is visible on page |
| `check-element-disabled` | `target` | Verify element is disabled |

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
