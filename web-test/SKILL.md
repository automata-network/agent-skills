---
name: web-test
description: Execute tests from persistent test cases. Reads ./tests/ directory, runs cleanup, wallet setup (if Web3), executes tests, and generates report.
license: MIT
compatibility: Node.js 18+, Playwright (global)
metadata:
  author: AI Agent
  version: 2.0.0
allowed-tools: Bash Read Write Glob Grep Task Skill
---

# Web Test Execution

Execute tests from persistent test cases in `./tests/` directory.

## CRITICAL RULES - READ FIRST

### Rule 1: Wallet Setup Based on config.yaml

```
┌────────────────────────────────────────────────────────────────┐
│  IF config.yaml contains:                                      │
│                                                                │
│    web3:                                                       │
│      enabled: true                                             │
│                                                                │
│  THEN at TEST START (before any test cases):                   │
│                                                                │
│    1. skill web-test-wallet-setup    ← REQUIRED AT START!      │
│                                                                │
│  Wallet CONNECT is handled by test cases:                      │
│                                                                │
│    2. WALLET-001 test case          ← Is a TEST CASE           │
│       (uses web-test-wallet-connect internally)                │
│                                                                │
│  ❌ DO NOT skip wallet-setup for Web3 DApps                    │
│  ❌ DO NOT auto-run wallet-connect (it's a test case now)      │
│  ✅ Run wallet-setup ONCE at start if web3.enabled: true       │
│  ✅ Run WALLET-001 test when reached in execution_order        │
└────────────────────────────────────────────────────────────────┘
```

**Why this matters:**
- Wallet **setup** prepares the extension (download, import key)
- Wallet **connect** is now a testable feature (WALLET-001)
- Other tests depend on WALLET-001 via preconditions

### Rule 2: NEVER Skip Tests Due to Time Constraints

```
╔════════════════════════════════════════════════════════════════╗
║                    ⛔ CRITICAL RULE ⛔                          ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  This is AUTOMATED TESTING - user does NOT care about time!    ║
║  Run ALL tests, no matter how long it takes.                   ║
║                                                                ║
║  ❌ FORBIDDEN - These excuses are NOT allowed:                 ║
║     - "Time constraints"                                       ║
║     - "To save time"                                           ║
║     - "Already running too long"                               ║
║     - "Similar to another test"                                ║
║     - "Will test later"                                        ║
║     - "Not enough time"                                        ║
║                                                                ║
║  ✅ ONLY these reasons can skip a test:                        ║
║     - Feature does not exist in the project                    ║
║     - Test case is explicitly deprecated                       ║
║     - Required permissions unavailable (admin-only, paid tier) ║
║     - Blocking dependency failed (wallet setup failed)         ║
║                                                                ║
║  ⚠️  IF YOU SKIP A TEST FOR "TIME CONSTRAINTS":                ║
║      → The test run is considered INCOMPLETE                   ║
║      → User will NOT accept the results                        ║
║      → You MUST re-run the skipped tests                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

**Why this matters:**
- **This is AUTOMATED testing** - the user does NOT care how long it takes
- Users explicitly want ALL test cases executed, regardless of time
- Every test case exists for a reason - skipping means missing bugs
- Skipping tests defeats the entire purpose of testing
- "Time constraints" is YOUR concern, not the user's - they want completeness
- If a test takes too long, WAIT for it - the user expects this
- If a test is truly unnecessary, the user will REMOVE it from the test suite

### Rule 3: Follow Execution Order

Always execute in this exact order:
1. Check for test cases
2. `web-test-cleanup` - Clean previous session
3. Read config.yaml
4. `web-test-wallet-setup` - **(if web3.enabled: true)** - Run ONCE at start
5. Execute test cases (including WALLET-001 which connects wallet)
6. `web-test-report` - Generate report
7. `web-test-cleanup --keep-data` - Final cleanup

**Note:** `web-test-wallet-connect` is no longer called directly by this skill.
It is invoked when executing WALLET-001 test case or as a precondition check.

### Rule 4: SEQUENTIAL EXECUTION ONLY - ONE TEST AT A TIME

```
╔════════════════════════════════════════════════════════════════╗
║            ⛔ CRITICAL: NO PARALLEL TEST EXECUTION ⛔           ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  1. Execute ONLY ONE test case at a time                       ║
║  2. WAIT for current test to FULLY COMPLETE before next        ║
║  3. NEVER run multiple tests in parallel                       ║
║                                                                ║
║  ❌ FORBIDDEN:                                                 ║
║     - Running 2+ tests simultaneously                          ║
║     - Starting next test before screenshots captured           ║
║     - Using parallel Task agents for different tests           ║
║                                                                ║
║  ✅ REQUIRED:                                                  ║
║     - Complete test → capture screenshots → record result      ║
║     - Only then start next test                                ║
║     - Respect depends_on order from test-cases.yaml            ║
║                                                                ║
║  WHY: Parallel tests cause:                                    ║
║     - Screenshot conflicts (wrong page captured)               ║
║     - Browser state corruption                                 ║
║     - Wallet popup handling failures                           ║
║     - Unpredictable test results                               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## Prerequisites

**Test cases must exist in `./tests/` directory.**

If no test cases found, this skill will:
1. Prompt: "No test cases found. Run `skill web-test-case-gen` to generate them?"
2. Wait up to 2 minutes for user response
3. If timeout or user declines → Exit with failure

## Quick Start

```
Run the tests for this project
```

## Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  web-test                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Check for test cases                                   │
│          ↓                                                      │
│          tests/config.yaml exists?                              │
│          tests/test-cases.yaml exists?                          │
│          ├─ NO  → Prompt user, wait 2 min, fail if no response  │
│          └─ YES → Continue                                      │
│          ↓                                                      │
│  Step 2: Use skill web-test-cleanup                             │
│          ↓                                                      │
│  Step 3: Read config.yaml                                       │
│          ↓                                                      │
│          Is Web3 DApp? (web3.enabled: true)                     │
│          ├─ YES → Step 4: Use skill web-test-wallet-setup       │
│          └─ NO  → Skip Step 4                                   │
│          ↓                                                      │
│  Step 5: Execute test cases                                     │
│          For each test in execution_order:                      │
│          - Check preconditions (e.g., WALLET-001 passed)        │
│          - If WALLET-001: uses web-test-wallet-connect          │
│          - Run test steps                                       │
│          - Record pass/fail                                     │
│          ↓                                                      │
│  Step 6: Use skill web-test-report                              │
│          ↓                                                      │
│  Step 7: Use skill web-test-cleanup --keep-data                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Instructions

### Step 1: Check for Test Cases

```bash
# Check if test files exist
ls -la ./tests/config.yaml ./tests/test-cases.yaml
```

**If files don't exist:**
```
No test cases found in ./tests/ directory.

Would you like to generate test cases first?
Run: skill web-test-case-gen

Waiting for response (2 minute timeout)...
```

If user doesn't respond within 2 minutes or says no, exit with:
```
Test execution cancelled. No test cases available.
To generate test cases, run: skill web-test-case-gen
```

### Step 2: Run Cleanup

```
Use skill web-test-cleanup
```

### Step 3: Parse Config and Load Test Cases

Read `./tests/config.yaml`:
```bash
cat ./tests/config.yaml
```

Extract:
- `project.url` - Base URL for testing
- `web3.enabled` - Whether to set up wallet
- `execution_order` - Order to run tests

Read `./tests/test-cases.yaml`:
```bash
cat ./tests/test-cases.yaml
```

### Step 4: Wallet Setup (if Web3)

**Skip this step if `web3.enabled: false` or not set.**

```
Use skill web-test-wallet-setup
```

This sets up the wallet extension (download, import private key).
Wallet connection is handled by test case WALLET-001 during test execution.

### Step 5: Execute Test Cases

**⚠️ EXECUTE EVERY TEST - NO EXCEPTIONS FOR "TIME CONSTRAINTS" ⚠️**
**⚠️ ONE TEST AT A TIME - NO PARALLEL EXECUTION ⚠️**

For each test ID in `execution_order` (SEQUENTIALLY, ONE AT A TIME):

1. Find the test case in `test-cases.yaml`
2. Check `depends_on` - skip if any dependency failed
3. Check preconditions
4. Execute each step
5. Verify expected results
6. Record pass/fail
7. **WAIT for completion before next test**

```
┌─────────────────────────────────────────────────────────────────┐
│  DEPENDENCY CHECK BEFORE EACH TEST                              │
│                                                                 │
│  if test.depends_on is not empty:                               │
│      for each dep_id in test.depends_on:                        │
│          if results[dep_id] != PASS:                            │
│              SKIP this test                                     │
│              reason: "Dependency {dep_id} did not pass"         │
│                                                                 │
│  Example:                                                       │
│    SWAP-002 depends_on: [WALLET-001, SWAP-001]                  │
│    - If WALLET-001 failed → SKIP SWAP-002                       │
│    - If SWAP-001 failed → SKIP SWAP-002                         │
│    - If both passed → RUN SWAP-002                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│  REMINDER: You MUST execute ALL tests in execution_order.       │
│                                                                 │
│  ❌ DO NOT skip any test because:                               │
│     - "Time constraints" / "To save time"                       │
│     - "Similar to previous test"                                │
│     - "Already tested enough"                                   │
│                                                                 │
│  ✅ Continue executing even if:                                 │
│     - Tests are taking a long time                              │
│     - You've already run many tests                             │
│     - Some tests seem redundant to you                          │
│                                                                 │
│  The user created these tests for a reason. Execute them ALL.   │
└─────────────────────────────────────────────────────────────────┘
```

**Executing Steps:**

| Action | How to Execute |
|--------|----------------|
| `navigate` | `node $SKILL_DIR/scripts/test-helper.js navigate [url] --headed --keep-open` |
| `vision-screenshot` | `node $SKILL_DIR/scripts/test-helper.js vision-screenshot [name].jpg --headed --keep-open` |
| `vision-click` | Take screenshot → AI determines coordinates → `vision-click x y` |
| `vision-type` | `node $SKILL_DIR/scripts/test-helper.js vision-type [value] --headed --keep-open` |
| `wait` | `node $SKILL_DIR/scripts/test-helper.js wait [ms] --headed --keep-open` |
| `wallet-approve` | Use `wallet-approve` from web-test-wallet-connect skill |

### Automatic Wallet Sign Detection

After each `click` or `vision-click` action in wallet mode, the system automatically detects MetaMask popups and handles them. Use the `walletAction` field to control the behavior:

| walletAction | Behavior |
|--------------|----------|
| `approve` (default) | Auto-approve signatures and transactions (reject if gas error) |
| `reject` | Reject the signature/transaction (for testing rejection flows) |
| `ignore` | Don't wait for popup, skip detection |

**Example:**
```yaml
steps:
  # Auto-approve (default behavior)
  - action: click
    selector: "#sign-button"

  # Test rejection flow
  - action: click
    selector: "#sign-button"
    walletAction: reject

  # Skip popup detection for non-wallet clicks
  - action: click
    selector: "#regular-button"
    walletAction: ignore
```

### Step 6: Generate Report

```
Use skill web-test-report
```

### Step 7: Final Cleanup

```
Use skill web-test-cleanup --keep-data
```

## Test Helper Commands

**Location:** `scripts/test-helper.js`

### Navigation & Screenshots
| Command | Description |
|---------|-------------|
| `navigate <url>` | Navigate to URL |
| `vision-screenshot [name]` | Take screenshot for AI |
| `vision-wait-stable` | Wait for page stability |

### Vision Interactions
| Command | Description |
|---------|-------------|
| `vision-click <x> <y>` | Click at coordinates |
| `vision-type <text>` | Type text at cursor |
| `vision-press-key <key>` | Press keyboard key |
| `vision-scroll <dir> [px]` | Scroll page |

### Utility Commands
| Command | Description |
|---------|-------------|
| `wait <ms>` | Wait milliseconds |
| `wait-for <selector>` | Wait for element |

### Common Options
| Option | Description |
|--------|-------------|
| `--headed` | Show browser window |
| `--keep-open` | Keep browser open after command |
| `--wallet` | Load wallet extension |

## Example Test Execution

**tests/config.yaml:**
```yaml
project:
  name: MyDApp
  url: http://localhost:3000

web3:
  enabled: true

execution_order:
  - WALLET-001    # Connect wallet (uses web-test-wallet-connect)
  - SWAP-001      # depends_on: [WALLET-001]
  - SWAP-002      # depends_on: [WALLET-001, SWAP-001]
```

**Execution flow (SEQUENTIAL - ONE AT A TIME):**

```
1. ✓ Found tests/config.yaml
2. ✓ Found tests/test-cases.yaml
3. Running web-test-cleanup...
4. Web3 DApp detected (web3.enabled: true)
   - Running web-test-wallet-setup... (ONCE at start)
   - Wallet extension ready
5. Executing test cases (SEQUENTIAL - ONE AT A TIME):

   ┌──────────────────────────────────────────────────────────────┐
   │  TEST 1/3: WALLET-001                                        │
   │  depends_on: [] (no dependencies)                            │
   └──────────────────────────────────────────────────────────────┘
   ├─ [This test uses web-test-wallet-connect skill]
   ├─ navigate /
   ├─ vision-screenshot before-connect.jpg
   ├─ [AI analyzes screenshot, finds Connect button at 850, 45]
   ├─ vision-click 850 45
   ├─ [AI analyzes screenshot, finds MetaMask option at 400, 300]
   ├─ vision-click 400 300
   ├─ wallet-approve
   ├─ vision-screenshot after-connect.jpg
   └─ ✅ PASS - Wallet address displayed

   ⏳ WAITING for WALLET-001 to complete before next test...
   ✓ WALLET-001 completed. Starting next test.

   ┌──────────────────────────────────────────────────────────────┐
   │  TEST 2/3: SWAP-001                                          │
   │  depends_on: [WALLET-001] → checking...                      │
   │  ✓ WALLET-001 passed - proceeding                            │
   └──────────────────────────────────────────────────────────────┘
   ├─ navigate /swap
   ├─ [execute steps...]
   └─ ✅ PASS - Swap successful

   ⏳ WAITING for SWAP-001 to complete before next test...
   ✓ SWAP-001 completed. Starting next test.

   ┌──────────────────────────────────────────────────────────────┐
   │  TEST 3/3: SWAP-002                                          │
   │  depends_on: [WALLET-001, SWAP-001] → checking...            │
   │  ✓ WALLET-001 passed                                         │
   │  ✓ SWAP-001 passed - proceeding                              │
   └──────────────────────────────────────────────────────────────┘
   ├─ navigate /swap
   ├─ [execute steps...]
   └─ ✅ PASS - ERC20 swap successful

6. Generating report...
7. Final cleanup (keeping data)...

Test Results:
✅ WALLET-001: Connect Wallet - PASS
✅ SWAP-001: Swap Native Token - PASS
✅ SWAP-002: Swap ERC20 Token - PASS

3/3 tests passed (100%)
```

## Data Storage

All test artifacts in project directory:

```
<project-root>/
├── tests/                # Test cases (from web-test-case-gen)
│   ├── config.yaml
│   ├── test-cases.yaml
│   └── README.md
└── test-output/          # Test execution artifacts
    ├── screenshots/      # Test screenshots
    ├── chrome-profile/   # Browser state
    ├── console-logs.txt  # Browser console
    └── test-report.md    # Generated report
```

## Related Skills

| Skill | Usage |
|-------|-------|
| web-test-case-gen | Generates test cases (run first if no tests/) |
| web-test-cleanup | Called at start and end |
| web-test-wallet-setup | Called ONCE at start if `web3.enabled: true` |
| web-test-wallet-connect | Called by WALLET-001 test case or as precondition |
| web-test-report | Called after test execution |

## Error Handling

| Scenario | Action |
|----------|--------|
| No tests/ directory | Prompt user, wait 2 min, fail if no response |
| Test case fails | Record failure, **continue to next test** |
| Wallet popup timeout | Mark test as failed, **continue to next test** |
| Page load timeout | Mark test as failed, **continue to next test** |
| Test takes long time | **WAIT for it** - do NOT skip |

**⚠️ IMPORTANT: Errors are NOT a reason to skip remaining tests!**

When a test fails or times out:
1. Record the failure with details
2. Take a screenshot if possible
3. **Continue to the next test** - do NOT stop or skip remaining tests
4. **NEVER use "time constraints" as a reason** - this is invalid

## Notes

- Test cases are read from `./tests/` in the project being tested
- Always use `--headed --keep-open` for vision-based testing
- AI analyzes screenshots to determine click coordinates
- For Web3 testing, wallet skills handle all wallet interactions
