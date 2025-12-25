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

**IMPORTANT: Must execute FULL workflow - DO NOT skip any steps!**

1. **Parse user description** - Extract feature, actions, expected outcomes
2. **Read source code** - Search codebase for related components (Grep/Glob)
3. **Explore in browser** - Launch browser, navigate, take screenshots (REQUIRED)
4. **Generate test case** - Create YAML based on code + visual analysis
5. **Append to existing** - Add to test-cases.yaml, case-summary.md, README.md, and config.yaml

```
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  MANDATORY STEPS - NEVER SKIP                              ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Step 2 (Read source code):                                    ║
║  - Use Grep to find related components/functions               ║
║  - Read the actual implementation code                         ║
║  - Understand how the feature works                            ║
║                                                                ║
║  Step 3 (Explore in browser):                                  ║
║  - Launch browser with --headed --keep-open                    ║
║  - Navigate to the feature page                                ║
║  - Take screenshots to see actual UI elements                  ║
║  - Identify button text, input fields, layout                  ║
║                                                                ║
║  ❌ DO NOT generate test cases without:                        ║
║     - Reading the source code                                  ║
║     - Taking browser screenshots                               ║
║                                                                ║
║  Test cases generated without exploration are INACCURATE!      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

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
│          - Create tests/case-summary.md                         │
│          - Create tests/README.md                               │
│          ↓                                                      │
│  Step 3: Output ready for git commit                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Add Single Test Case (Interactive Mode)

When user provides a specific test case description, follow this workflow:

**⚠️ ALL STEPS ARE MANDATORY - Especially Step 3 (code) and Step 4 (browser)!**

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
│  Step 3: Read related source code ⚠️ REQUIRED                   │
│          ↓                                                      │
│          - Search for feature in codebase (Grep/Glob)           │
│          - Read relevant component/function code                │
│          - Understand the implementation                        │
│          ↓                                                      │
│  Step 4: Launch browser and explore feature ⚠️ REQUIRED         │
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
│  Step 6: Update all test files                                  │
│          ↓                                                      │
│          - Append test case to test-cases.yaml                  │
│          - Append test case to case-summary.md                  │
│          - Update test table in README.md                       │
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
node $SKILL_DIR/scripts/test-helper.js screenshot explore-feature.jpg --headed --keep-open

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
  module: rewards  # Module this test belongs to (wallet, swap, rewards, etc.)
  feature: Rewards
  priority: high
  web3: true       # Set based on config
  wallet_popups: 1 # Estimate based on action type
  depends_on: [WALLET-001]  # Test ID dependencies
  preconditions:
    - Has claimable rewards
  steps:
    - action: navigate
      url: /rewards
    - action: screenshot
      name: before-claim
    - action: click
      selector: Claim Rewards button
    - action: wallet-approve
    - action: wait
      ms: 3000
      reason: Wait for transaction confirmation
    - action: screenshot
      name: after-claim
  expected:
    - Success message displayed
    - Rewards balance updated
```

#### Step 6: Update All Test Files

**Must update ALL four files:**

1. **Read and append to test-cases.yaml:**
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

2. **Read and append to case-summary.md:**
```bash
cat ./tests/case-summary.md
```

Append new test case summary:
```bash
cat >> ./tests/case-summary.md << 'EOF'

---

### REWARD-001: Claim Rewards Success

| Field | Value |
|-------|-------|
| **Purpose** | Verify user can claim rewards successfully |
| **Module** | rewards |
| **Feature** | Rewards |
| **Priority** | High |
| **Type** | Positive |
| **Steps** | 6 |
| **Depends On** | WALLET-001 |

**Steps:**
1. Navigate to /rewards
2. Take screenshot (before-claim)
3. Click "Claim Rewards" button
4. Approve transaction in wallet
5. Wait for confirmation
6. Take screenshot (after-claim)

**Expected Results:**
- Success message displayed
- Rewards balance updated
EOF
```

3. **Read and update README.md test table:**
```bash
cat ./tests/README.md
```

Add new row to Test Summary table:
```markdown
| REWARD-001 | Claim Rewards Success | rewards | High | Yes | 1 | Positive |
```

4. **Update config.yaml execution_order:**
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

Files updated:
- tests/test-cases.yaml   (added test case YAML)
- tests/case-summary.md   (added human-readable summary)
- tests/README.md         (added row to test table)
- tests/config.yaml       (updated execution_order)

Next steps:
1. Review the generated test case
2. Commit: git add tests/ && git commit -m "Add REWARD-001 test case"
3. Run test: skill web-test
```

### ID Generation Rules

**Use meaningful IDs that indicate test type:**

| Test Type | ID Pattern | Example | Description |
|-----------|------------|---------|-------------|
| Happy Path | FEATURE-HP-NNN | SWAP-HP-001 | Complete success journey |
| Input Validation | FEATURE-IV-NNN | SWAP-IV-001 | Validation rule test |
| Error Handling | FEATURE-EH-NNN | SWAP-EH-001 | Error scenario test |
| Edge Case | FEATURE-EC-NNN | SWAP-EC-001 | Boundary condition test |
| State Transition | FEATURE-ST-NNN | SWAP-ST-001 | State change test |
| General | FEATURE-NNN | WALLET-001 | Basic feature test |

**Feature prefixes:**

| Feature | Prefix |
|---------|--------|
| Wallet Connection | WALLET |
| Token Swap | SWAP |
| Staking | STAKE |
| Liquidity Pool | POOL |
| Bridge | BRIDGE |
| Claim/Rewards | CLAIM |
| Settings | SETTINGS |
| Login/Auth | AUTH |
| Search | SEARCH |
| Form | FORM |
| Custom | CUSTOM |

**Examples:**
```
SWAP-HP-001    → Swap Happy Path test #1
SWAP-IV-001    → Swap Input Validation test #1
SWAP-EH-001    → Swap Error Handling test #1
SWAP-EC-001    → Swap Edge Case test #1
STAKE-HP-001   → Stake Happy Path test #1
WALLET-001     → Wallet Connection test (general)
```

Always check existing IDs and increment:
```bash
grep "id:" ./tests/test-cases.yaml | tail -10
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

# ============================================
# MODULES
# Users can run tests by module:
#   "Run wallet module" or "Run swap module tests"
# ============================================
modules:
  - id: wallet
    name: Wallet
    description: Wallet connection and management
  - id: swap
    name: Token Swap
    description: Token swap functionality
  - id: stake
    name: Staking
    description: Token staking functionality

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
    module: wallet              # Module this test belongs to (wallet, swap, stake, etc.)
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
      - action: screenshot
        name: before-connect
      - action: click
        selector: Connect Wallet button
      - action: click
        selector: MetaMask option in modal
      - action: wallet-approve
      - action: screenshot
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
    module: swap              # Module this test belongs to
    feature: Token Swap
    priority: critical
    web3: true
    wallet_popups: 1
    depends_on: [WALLET-001]   # Must run after WALLET-001 completes
    preconditions:
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
      - action: click
        selector: source token dropdown
      - action: click
        selector: ETH option
      - action: fill
        selector: amount input
        value: "0.1"
      - action: click
        selector: destination token dropdown
      - action: click
        selector: USDC option
      - action: wait
        ms: 2000
        reason: Wait for quote
      - action: screenshot
        name: before-swap
      - action: click
        selector: Swap button
      - action: wallet-approve
      - action: wait
        ms: 3000
        reason: Wait for transaction
      - action: screenshot
        name: after-swap
    expected:
      - Success message displayed
      - Balance updated

  - id: SWAP-002
    name: Swap ERC20 Token (Approval Required)
    module: swap              # Module this test belongs to
    feature: Token Swap
    priority: critical
    web3: true
    wallet_popups: 2
    depends_on: [WALLET-001, SWAP-001]  # Runs after SWAP-001 (may need approval state from native swap)
    preconditions:
      - Has USDC balance
      - First time swapping USDC (token not yet approved)
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
      - action: click
        selector: source token dropdown
      - action: click
        selector: USDC option
      - action: fill
        selector: amount input
        value: "10"
      - action: click
        selector: destination token dropdown
      - action: click
        selector: ETH option
      - action: wait
        ms: 2000
        reason: Wait for quote
      - action: click
        selector: Swap button
      - action: wallet-approve
        note: Token approval popup
      - action: wallet-approve
        note: Swap transaction popup
      - action: wait
        ms: 3000
        reason: Wait for transaction
      - action: screenshot
        name: swap-complete
    expected:
      - Two wallet popups handled
      - Swap succeeds

  - id: SWAP-003
    name: Insufficient Balance Error
    module: swap              # Module this test belongs to
    feature: Token Swap
    priority: high
    web3: true
    wallet_popups: 0
    depends_on: [WALLET-001]   # Only needs wallet connected
    preconditions: []          # No additional preconditions
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
      - action: fill
        selector: amount input
        value: "999999"
      - action: screenshot
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
    module: wallet            # Module this test belongs to
    feature: Wallet Connection
    priority: high
    web3: false
    wallet_popups: 0
    depends_on: []
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
      - action: screenshot
        name: disconnected-state
    expected:
      - Connect button visible with text "Connect" or "Connect Wallet" or "连接钱包"
      - No wallet address displayed
      - User prompted to connect wallet

  - id: WALLET-DISCONNECT-002
    name: Protected Feature Access When Disconnected
    module: wallet            # Module this test belongs to
    feature: Wallet Connection
    priority: high
    web3: false
    wallet_popups: 0
    depends_on: []
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
      - action: screenshot
        name: swap-disconnected
      - action: click
        selector: Swap button (if visible)
    expected:
      - Swap button disabled OR shows "Connect Wallet" text
      - Error message or prompt to connect wallet
      - Transaction cannot proceed without wallet

  # Form/API Failure Tests (Only when forms/API/transactions detected)
  - id: SWAP-FAIL-001
    name: Swap Transaction Rejected
    module: swap              # Module this test belongs to
    feature: Token Swap
    priority: high
    web3: true
    wallet_popups: 1
    depends_on: [WALLET-001]   # Needs wallet connected to test rejection
    preconditions: []          # No additional preconditions
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
      - action: fill
        selector: amount input
        value: "0.1"
      - action: click
        selector: Swap button
      - action: wallet-reject
        note: User rejects transaction in wallet
      - action: screenshot
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
      - action: fill
        selector: email input
        value: "invalid-email"
      - action: click
        selector: Submit button
      - action: screenshot
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
      - action: screenshot
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

| ID | Name | Module | Priority | Web3 | Popups | Type |
|----|------|--------|----------|------|--------|------|
| WALLET-001 | Connect Wallet | wallet | Critical | Yes | 1 | Positive |
| SWAP-001 | Swap Native Token | swap | Critical | Yes | 1 | Positive |
| SWAP-002 | Swap ERC20 (Approval) | swap | Critical | Yes | 2 | Positive |
| SWAP-003 | Insufficient Balance | swap | High | Yes | 0 | Negative |
| WALLET-DISCONNECT-001 | Wallet Disconnected State | wallet | High | No | 0 | Negative |
| WALLET-DISCONNECT-002 | Protected Feature Access | wallet | High | No | 0 | Negative |
| SWAP-FAIL-001 | Swap Transaction Rejected | swap | High | Yes | 1 | Negative |

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
| **Module** | wallet |
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
| **Module** | swap |
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
| **Module** | swap |
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
| **Module** | swap |
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

### Step 3: Write Test Files (config.yaml, test-cases.yaml, case-summary.md, README.md)

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

# Module definitions for organized test execution
# Users can run: "Run wallet module" or "Run swap module tests"
modules:
  - id: wallet
    name: Wallet
    description: Wallet connection and management tests
  - id: swap
    name: Token Swap
    description: Token swap functionality tests
  # Add more modules based on detected features

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
| **Module** | [Module ID: wallet, swap, etc.] |
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

### Mobile Layout Detection

```
╔════════════════════════════════════════════════════════════════╗
║  📱 MOBILE RESPONSIVE TESTING                                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  STEP 1: Detect if project supports mobile layout              ║
║                                                                ║
║  Search for CSS media queries:                                 ║
║    grep -r "@media" --include="*.css" --include="*.scss"       ║
║    grep -r "max-width.*768" --include="*.css" --include="*.tsx"║
║    grep -r "useMediaQuery\|useBreakpoint" --include="*.ts"     ║
║                                                                ║
║  Mobile indicators to look for:                                ║
║    - @media (max-width: 768px)                                 ║
║    - @media screen and (max-width: 640px)                      ║
║    - @media only screen and (max-device-width: 480px)          ║
║    - Tailwind classes: sm:, md:, lg: in components             ║
║    - Mobile-specific components: MobileNav, MobileMenu         ║
║    - useMediaQuery, useBreakpoint hooks                        ║
║                                                                ║
║  STEP 2: If mobile layout detected, add to config.yaml         ║
║                                                                ║
║    mobile:                                                     ║
║      enabled: true                                             ║
║      breakpoint: 375    # iPhone SE width                      ║
║      viewport:                                                 ║
║        width: 375                                              ║
║        height: 667                                             ║
║                                                                ║
║  STEP 3: ⚠️ EXPLORE MOBILE UI BEFORE GENERATING TEST CASES     ║
║                                                                ║
║    MUST switch to mobile viewport and take screenshots:        ║
║                                                                ║
║    # Set mobile viewport first                                 ║
║    node $SKILL_DIR/scripts/test-helper.js set-viewport 375 667 \
║         --mobile --headed --keep-open                          ║
║                                                                ║
║    # Navigate to project                                       ║
║    node $SKILL_DIR/scripts/test-helper.js navigate [url] \     ║
║         --headed --keep-open                                   ║
║                                                                ║
║    # Take screenshot of mobile UI                              ║
║    node $SKILL_DIR/scripts/test-helper.js screenshot \  ║
║         mobile-home --headed --keep-open                       ║
║                                                                ║
║    # Analyze screenshot to identify:                           ║
║    - Hamburger menu / mobile nav                               ║
║    - Mobile-specific buttons and their positions               ║
║    - Bottom sheets / mobile modals                             ║
║    - Touch targets and gestures                                ║
║                                                                ║
║  STEP 4: Generate MOBILE-* test cases based on screenshots     ║
║                                                                ║
║    For each feature with mobile layout differences:            ║
║    - MOBILE-NAV-001: Mobile navigation menu                    ║
║    - MOBILE-LAYOUT-001: Responsive layout verification         ║
║    - MOBILE-MODAL-001: Mobile modal/popup styling              ║
║    - MOBILE-TOUCH-001: Touch-specific interactions             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**Mobile UI Exploration Workflow:**

```bash
SKILL_DIR="/Users/duxiaofeng/code/agent-skills/web-test"

# 1. Set mobile viewport (iPhone SE size)
node $SKILL_DIR/scripts/test-helper.js set-viewport 375 667 --mobile --headed --keep-open

# 2. Navigate to project URL
node $SKILL_DIR/scripts/test-helper.js navigate "http://localhost:3000" --headed --keep-open

# 3. Take screenshot of mobile homepage
node $SKILL_DIR/scripts/test-helper.js screenshot mobile-home --headed --keep-open

# 4. Use Read tool to view screenshot and identify mobile UI elements
# Look for: hamburger menu, mobile nav, bottom sheets, touch targets

# 5. Navigate to other pages and screenshot
node $SKILL_DIR/scripts/test-helper.js navigate "http://localhost:3000/swap" --headed --keep-open
node $SKILL_DIR/scripts/test-helper.js screenshot mobile-swap --headed --keep-open

# 6. Test mobile interactions (click hamburger menu, etc.)
node $SKILL_DIR/scripts/test-helper.js click "[aria-label='Menu']" --headed --keep-open  # Click hamburger
node $SKILL_DIR/scripts/test-helper.js screenshot mobile-nav-open --headed --keep-open
```

**⚠️ IMPORTANT: Generate accurate test cases based on actual mobile UI, NOT assumptions!**

**Mobile Test Case Examples:**

```yaml
# Mobile Navigation Test
- id: MOBILE-NAV-001
  name: Mobile Navigation Menu
  module: mobile
  feature: Mobile Layout
  priority: high
  web3: false
  wallet_popups: 0
  depends_on: []
  viewport:
    width: 375
    height: 667
    deviceScaleFactor: 2
    isMobile: true
  description:
    purpose: |
      Verify mobile navigation menu works correctly.
      Tests hamburger menu, slide-out nav, touch interactions.
    notes:
      - Run in mobile viewport (375x667)
      - Desktop nav should be hidden
      - Hamburger menu icon should be visible
  steps:
    - action: set-viewport
      width: 375
      height: 667
      isMobile: true
    - action: navigate
      url: /
    - action: screenshot
      name: mobile-initial
    - action: click
      selector: hamburger menu icon (three horizontal lines)
    - action: wait
      ms: 500
      reason: Wait for menu animation
    - action: screenshot
      name: mobile-nav-open
    - action: click
      selector: close button or outside menu area
    - action: screenshot
      name: mobile-nav-closed
  expected:
    - Desktop navigation hidden
    - Hamburger menu icon visible
    - Mobile menu slides in on click
    - Menu items accessible
    - Menu closes on outside click

# Mobile Modal Test
- id: MOBILE-MODAL-001
  name: Mobile Modal Styling
  module: mobile
  feature: Mobile Layout
  priority: high
  web3: false
  wallet_popups: 0
  depends_on: []
  viewport:
    width: 375
    height: 667
    isMobile: true
  description:
    purpose: |
      Verify modals/popups display correctly on mobile.
      Tests full-screen modals, bottom sheets, touch dismiss.
  steps:
    - action: set-viewport
      width: 375
      height: 667
      isMobile: true
    - action: navigate
      url: /
    - action: click
      selector: button that opens modal (e.g., Connect Wallet)
    - action: wait
      ms: 500
      reason: Wait for modal animation
    - action: screenshot
      name: mobile-modal-open
  expected:
    - Modal fills screen or shows as bottom sheet
    - Content readable without horizontal scroll
    - Close button accessible
    - Touch gestures work (swipe to dismiss if applicable)

# Mobile-only Component Test
- id: MOBILE-COMPONENT-001
  name: Mobile-Only Components
  module: mobile
  feature: Mobile Layout
  priority: medium
  web3: false
  wallet_popups: 0
  depends_on: []
  viewport:
    width: 375
    height: 667
    isMobile: true
  description:
    purpose: |
      Verify components that only appear on mobile.
      Tests mobile-specific UI elements.
  steps:
    - action: set-viewport
      width: 375
      height: 667
      isMobile: true
    - action: navigate
      url: /
    - action: screenshot
      name: mobile-components
  expected:
    - Mobile-only components visible
    - Desktop-only components hidden
    - Touch-friendly button sizes (min 44x44px)
    - Readable text size (min 16px)
```

**Mobile viewport action:**

| Action | Parameters | Description |
|--------|------------|-------------|
| `set-viewport` | `width`, `height`, `isMobile`, `deviceScaleFactor` | Set browser to mobile viewport size |

**test-helper.js command:**
```bash
node $SKILL_DIR/scripts/test-helper.js set-viewport 375 667 --mobile --headed --keep-open
```

---

```
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  CRITICAL: GENERATE COMPREHENSIVE BUSINESS TESTS           ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Test coverage quality is CRITICAL. You MUST generate tests    ║
║  for ALL business functions, not just basic happy paths.       ║
║                                                                ║
║  For EACH feature, generate tests for:                         ║
║  ✓ Happy path (complete user journey)                          ║
║  ✓ Input validation (all rules discovered)                     ║
║  ✓ Error handling (all error states)                           ║
║  ✓ Edge cases (boundary conditions)                            ║
║  ✓ State transitions (all state changes)                       ║
║                                                                ║
║  A feature with just ONE test case is INCOMPLETE!              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

### Business Function Test Generation

For EACH feature discovered in web-test-research, you MUST generate multiple test cases:

#### 1. Happy Path Tests (Critical Priority)

Generate complete end-to-end tests for the main user journey:

```yaml
# Example: Complete swap happy path
- id: SWAP-HP-001
  name: Complete Token Swap Journey
  module: swap
  feature: Token Swap
  priority: critical
  web3: true
  wallet_popups: 1
  depends_on: [WALLET-001]
  description:
    purpose: |
      Test complete swap flow from token selection to transaction confirmation.
      Verifies the entire user journey works correctly.
    business_rules:
      - User can select source and destination tokens
      - Amount input shows live balance
      - Quote updates automatically
      - Transaction completes successfully
  preconditions:
    - Has native token balance
  steps:
    - action: navigate
      url: /swap
    - action: screenshot
      name: swap-initial
    - action: click
      selector: source token dropdown
    - action: screenshot
      name: token-selector-open
    - action: click
      selector: ETH option
    - action: fill
      selector: amount input
      value: "0.1"
    - action: wait
      ms: 1000
      reason: Wait for balance validation
    - action: click
      selector: destination token dropdown
    - action: click
      selector: USDC option
    - action: wait
      ms: 2000
      reason: Wait for quote to load
    - action: screenshot
      name: quote-ready
    - action: click
      selector: Swap button
    - action: wallet-approve
    - action: wait
      ms: 3000
      reason: Wait for transaction
    - action: screenshot
      name: swap-complete
  expected:
    - Token selector shows available tokens with balances
    - Quote displays exchange rate and output amount
    - Transaction confirmation in wallet popup
    - Success message displayed
    - Balance updated after swap
```

#### 2. Input Validation Tests (High Priority)

Generate tests for EVERY validation rule found in code:

```yaml
# Example: Empty amount validation
- id: SWAP-IV-001
  name: Swap Empty Amount Validation
  module: swap
  feature: Token Swap
  priority: high
  web3: true
  wallet_popups: 0
  depends_on: [WALLET-001]
  description:
    purpose: Verify swap button is disabled when no amount is entered
    business_rule: "amount required - cannot swap with empty input"
  steps:
    - action: navigate
      url: /swap
    - action: screenshot
      name: empty-amount-state
  expected:
    - Swap button disabled or shows "Enter an amount"
    - No quote displayed
    - Form is in idle state

# Example: Insufficient balance validation
- id: SWAP-IV-002
  name: Swap Insufficient Balance Validation
  module: swap
  feature: Token Swap
  priority: high
  web3: true
  wallet_popups: 0
  depends_on: [WALLET-001]
  description:
    purpose: Verify error when amount exceeds balance
    business_rule: "amount <= balance - cannot swap more than owned"
  steps:
    - action: navigate
      url: /swap
    - action: fill
      selector: amount input
      value: "999999999"
    - action: wait
      ms: 1000
      reason: Wait for validation
    - action: screenshot
      name: insufficient-balance-error
  expected:
    - Error message "Insufficient balance" or similar
    - Swap button disabled
    - Input field may show error styling

# Example: Invalid input validation
- id: SWAP-IV-003
  name: Swap Invalid Input Rejection
  module: swap
  feature: Token Swap
  priority: high
  web3: true
  wallet_popups: 0
  depends_on: [WALLET-001]
  description:
    purpose: Verify non-numeric input is rejected
    business_rule: "numeric only - amount must be a valid number"
  steps:
    - action: navigate
      url: /swap
    - action: fill
      selector: amount input
      value: "abc"
    - action: screenshot
      name: invalid-input-state
  expected:
    - Input rejected or shows error
    - Non-numeric characters not accepted
```

#### 3. Error Handling Tests (High Priority)

Generate tests for each error scenario:

```yaml
# Example: Transaction rejection
- id: SWAP-EH-001
  name: Swap Transaction Rejection Handling
  module: swap
  feature: Token Swap
  priority: high
  web3: true
  wallet_popups: 1
  depends_on: [WALLET-001]
  description:
    purpose: Verify app handles user rejection gracefully
    error_scenario: User clicks "Reject" in wallet popup
  steps:
    - action: navigate
      url: /swap
    - action: fill
      selector: amount input
      value: "0.01"
    - action: wait
      ms: 2000
      reason: Wait for quote
    - action: click
      selector: Swap button
    - action: wallet-reject
    - action: wait
      ms: 1000
      reason: Wait for error handling
    - action: screenshot
      name: rejection-handled
  expected:
    - Error message displayed (e.g., "Transaction rejected")
    - Form remains usable for retry
    - No balance change
    - App does not crash

# Example: Network error
- id: SWAP-EH-002
  name: Swap Quote Fetch Error
  module: swap
  feature: Token Swap
  priority: high
  web3: true
  wallet_popups: 0
  depends_on: [WALLET-001]
  description:
    purpose: Verify error handling when quote cannot be fetched
    error_scenario: API returns error during quote fetch
  steps:
    - action: navigate
      url: /swap
    - action: mock-network-error
      trigger: quote-fetch
    - action: fill
      selector: amount input
      value: "0.1"
    - action: wait
      ms: 3000
      reason: Wait for error state
    - action: screenshot
      name: quote-error-state
  expected:
    - Error message shown (not raw error)
    - Retry option available
    - User can try again
```

#### 4. Edge Case Tests (Medium Priority)

Generate tests for boundary conditions and unusual scenarios:

```yaml
# Example: Exact balance swap
- id: SWAP-EC-001
  name: Swap Exact Balance Amount
  module: swap
  feature: Token Swap
  priority: medium
  web3: true
  wallet_popups: 1
  depends_on: [WALLET-001]
  description:
    purpose: Verify behavior when swapping entire balance
    edge_case: User wants to swap 100% of their token balance
  steps:
    - action: navigate
      url: /swap
    - action: click
      selector: MAX button or balance display
    - action: wait
      ms: 1000
      reason: Wait for amount to populate
    - action: screenshot
      name: max-amount-set
  expected:
    - Max amount correctly filled
    - Gas fee consideration shown (if applicable)
    - Quote loads successfully

# Example: Same token swap attempt
- id: SWAP-EC-002
  name: Swap Same Token Prevention
  module: swap
  feature: Token Swap
  priority: medium
  web3: true
  wallet_popups: 0
  depends_on: [WALLET-001]
  description:
    purpose: Verify app prevents swapping same token
    edge_case: User selects same token for both source and destination
  steps:
    - action: navigate
      url: /swap
    - action: click
      selector: source token dropdown
    - action: click
      selector: ETH option
    - action: click
      selector: destination token dropdown
    - action: click
      selector: ETH option
    - action: screenshot
      name: same-token-state
  expected:
    - Token automatically switched OR
    - Error message shown OR
    - Same token option disabled

# Example: Decimal precision
- id: SWAP-EC-003
  name: Swap Decimal Precision Handling
  module: swap
  feature: Token Swap
  priority: medium
  web3: true
  wallet_popups: 0
  depends_on: [WALLET-001]
  description:
    purpose: Verify handling of high decimal precision
    edge_case: Input exceeds token's decimal places
  steps:
    - action: navigate
      url: /swap
    - action: click
      selector: destination token dropdown
    - action: click
      selector: USDC option (6 decimals)
    - action: fill
      selector: amount input
      value: "0.0000001"
    - action: screenshot
      name: decimal-precision
  expected:
    - Input rounded or truncated appropriately
    - No calculation errors
    - Clear display of actual amount
```

#### 5. State Transition Tests (Medium Priority)

Generate tests to verify state changes:

```yaml
# Example: Quote refresh on input change
- id: SWAP-ST-001
  name: Quote Updates on Amount Change
  module: swap
  feature: Token Swap
  priority: medium
  web3: true
  wallet_popups: 0
  depends_on: [WALLET-001]
  description:
    purpose: Verify quote updates when user changes amount
    state_transition: Quote Ready → Fetching → Quote Ready
  steps:
    - action: navigate
      url: /swap
    - action: fill
      selector: amount input
      value: "0.1"
    - action: wait
      ms: 2000
      reason: Wait for initial quote
    - action: screenshot
      name: quote-v1
    - action: fill
      selector: amount input
      value: "0.5"
    - action: wait
      ms: 2000
      reason: Wait for updated quote
    - action: screenshot
      name: quote-v2
  expected:
    - Quote changes when amount changes
    - Loading state shown during fetch
    - New quote reflects new amount

# Example: Disconnect during operation
- id: SWAP-ST-002
  name: Wallet Disconnect Mid-Flow
  module: swap
  feature: Token Swap
  priority: medium
  web3: true
  wallet_popups: 0
  depends_on: [WALLET-001]
  description:
    purpose: Verify app handles wallet disconnect gracefully
    state_transition: Quote Ready → Wallet Disconnected
  steps:
    - action: navigate
      url: /swap
    - action: fill
      selector: amount input
      value: "0.1"
    - action: wait
      ms: 2000
      reason: Wait for quote
    - action: wallet-disconnect
    - action: screenshot
      name: disconnected-state
  expected:
    - Connect wallet button appears
    - Form resets or shows connect prompt
    - No crash or error
```

### Test Count Guidelines Per Feature

**Minimum test cases per business feature:**

| Feature Complexity | Happy Path | Validation | Error | Edge Cases | Total Min |
|-------------------|------------|------------|-------|------------|-----------|
| Simple (1-2 inputs) | 1 | 2-3 | 1-2 | 1-2 | 5-8 |
| Medium (3-5 inputs) | 1-2 | 4-6 | 2-3 | 2-3 | 9-14 |
| Complex (multi-step) | 2-3 | 5-8 | 3-4 | 3-4 | 13-19 |

**Example for Swap feature (Medium complexity):**
- 1 complete happy path test
- 5 validation tests (empty, insufficient, invalid, zero, max)
- 3 error tests (reject, network, timeout)
- 3 edge cases (exact balance, same token, decimals)
- **Total: 12 tests for Swap alone**

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

**Map research output to comprehensive test cases:**

| Research Output | Test Cases to Generate |
|-----------------|------------------------|
| **User Journey** | 1 Happy path (complete journey) |
| **Business Rules** | 1 test per rule (validation) |
| **Edge Cases** | 1 test per edge case |
| **Error Scenarios** | 1 test per error state |
| **State Transitions** | 1 test per transition |
| **Wallet Interaction** | Tests with wallet_popups + depends_on |
| **External Protocol** | Research-based scenarios |

**Mapping Example (Swap Feature):**

```
Research Found:                     Test Cases Generated:
──────────────────────────────────  ─────────────────────────────────────
User Journey:
├─ Token selection                  SWAP-HP-001: Complete Swap Journey
├─ Amount input
├─ Quote display
├─ Transaction flow
└─ Success confirmation

Business Rules:
├─ amount > 0                       SWAP-IV-001: Empty Amount Validation
├─ amount <= balance                SWAP-IV-002: Insufficient Balance
├─ numeric input only               SWAP-IV-003: Invalid Input Rejection
├─ slippage 0.1% - 50%              SWAP-IV-004: Slippage Bounds Check
└─ max decimals per token           SWAP-IV-005: Decimal Precision

Edge Cases:
├─ Exact balance swap               SWAP-EC-001: Max Balance Swap
├─ Same token swap                  SWAP-EC-002: Same Token Prevention
├─ Dust amount                      SWAP-EC-003: Minimum Amount
└─ Token with unusual decimals      SWAP-EC-004: Low Decimal Token

Error Scenarios:
├─ Transaction rejected             SWAP-EH-001: Rejection Handling
├─ Quote fetch failed               SWAP-EH-002: Quote Error
├─ Transaction reverted             SWAP-EH-003: Revert Handling
└─ Wallet disconnected              SWAP-EH-004: Disconnect Handling

State Transitions:
├─ Idle → Quote Ready               SWAP-ST-001: Quote Loading
├─ Quote → Confirming               SWAP-ST-002: Transaction Start
└─ Pending → Complete/Failed        SWAP-ST-003: Transaction Resolution

TOTAL: 15 test cases for Swap feature
```

**Non-negotiable minimum tests per feature:**

| Feature Type | Minimum Tests |
|--------------|---------------|
| Core business function | 10+ |
| Secondary function | 5-8 |
| Simple UI element | 3-5 |

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

### Test Case Dependencies (depends_on) vs Preconditions

```
╔════════════════════════════════════════════════════════════════╗
║  depends_on vs preconditions - IMPORTANT DISTINCTION           ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  depends_on:                                                   ║
║  ──────────                                                    ║
║  - ONLY for test case dependencies (TEST-CASE-ID)              ║
║  - Controls execution order                                    ║
║  - If dependency fails, this test is SKIPPED                   ║
║  - Example: depends_on: [WALLET-001, SWAP-001]                 ║
║                                                                ║
║  preconditions:                                                ║
║  ─────────────                                                 ║
║  - For OTHER requirements (NOT test case IDs)                  ║
║  - Describes state/data requirements                           ║
║  - Example: "Has native token balance"                         ║
║  - Example: "User is on testnet"                               ║
║  - Example: "Token not yet approved"                           ║
║                                                                ║
║  ❌ WRONG - Don't put test IDs in preconditions:               ║
║     preconditions:                                             ║
║       - WALLET-001 passed    ← WRONG! Use depends_on instead   ║
║                                                                ║
║  ✅ CORRECT:                                                   ║
║     depends_on: [WALLET-001]                                   ║
║     preconditions:                                             ║
║       - Has native token balance                               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

### Dependency Rules

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
║     - LOGIN-001 → All authenticated features                   ║
║     - CREATE-001 → READ/UPDATE/DELETE (CRUD order)             ║
║     - FORM-001 → SUBMIT-001 → VERIFY-001                       ║
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

### Timeout Rules (IMPORTANT)

```
╔════════════════════════════════════════════════════════════════╗
║  TIMEOUT: 30 SECONDS MAX FOR ANY OPERATION                     ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  When generating test cases, use SHORT wait times:             ║
║                                                                ║
║  | Scenario              | Recommended Wait | Max Allowed     ║
║  |-----------------------|------------------|-----------------|
║  | After click           | 1000ms           | 2000ms          ║
║  | After type            | 500ms            | 1000ms          ║
║  | Wait for quote/price  | 2000ms           | 3000ms          ║
║  | Wait for transaction  | 3000ms           | 5000ms          ║
║  | After page navigate   | 2000ms           | 3000ms          ║
║                                                                ║
║  ❌ NEVER use wait times > 5000ms                              ║
║  ❌ If operation takes > 30s → Test should FAIL                ║
║                                                                ║
║  ✅ Use short waits + verification instead of long waits       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**Example - Good vs Bad:**
```yaml
# ❌ BAD - Too long wait
- action: wait
  ms: 10000
  reason: Wait for transaction

# ✅ GOOD - Short wait with verification
- action: wait
  ms: 3000
  reason: Wait for transaction
- action: screenshot
  name: verify-result
# AI verifies expected result in screenshot
```

### Action Types in Steps

| Action | Parameters | Description | Timeout |
|--------|------------|-------------|---------|
| `navigate` | `url` | Go to URL | 30s max |
| `screenshot` | `name` | Take screenshot | 10s max |
| `click` | `selector` | Click on element using text/css/id selector | 30s max |
| `fill` | `selector`, `value` | Type text into input field | 10s max |
| `wait` | `ms`, `reason` | Wait for condition | 5s max recommended |
| `wallet-approve` | `note` | Handle wallet popup (approve) | 30s max |
| `wallet-reject` | `note` | Reject wallet popup (for negative tests) | 30s max |
| `mock-api-error` | `endpoint`, `status` | Simulate API failure | 10s max |
| `check-text-visible` | `text` | Verify text is visible on page | 30s max |
| `check-element-disabled` | `target` | Verify element is disabled | 30s max |

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
