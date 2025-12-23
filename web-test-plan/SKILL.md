---
name: web-test-plan
description: Generate test cases from project research. Converts feature analysis into specific, actionable test scenarios. MUST use web-test-research output.
license: MIT
compatibility: Node.js 18+
metadata:
  author: AI Agent
  version: 3.0.0
allowed-tools: Bash Read Write Glob Grep
---

# Test Plan Creation

Generate specific test cases based on the feature analysis from **web-test-research**.

## Prerequisites

**You MUST have completed web-test-research first.**

The research provides:
- Is it a Web3 DApp?
- What dependencies/protocols are used (with WebSearch findings)
- What features exist (with code locations)
- What user flows were traced
- What wallet interactions are needed

## Core Principle: Tests From Research

**Do NOT invent test cases. Generate them from the research output:**

```
Research found:
- Feature: Token Swap
- Uses: @xyz/sdk
- User flow: select tokens → enter amount → click swap → approve wallet
- Wallet popups: 1-2 depending on token type

↓ Generate test cases ↓

TEST-001: Swap native token
TEST-002: Swap ERC20 token (needs approval)
TEST-003: Insufficient balance error
TEST-004: User rejects transaction
```

## Test Case Generation Rules

### For Each Feature in Research:

1. **Happy path test** - Normal successful usage
2. **Error handling tests** - What happens when things go wrong
3. **Edge cases** - Boundary conditions
4. **Wallet interaction tests** (if Web3) - Approval/rejection flows

### Test Case Format:

```markdown
### [TEST-ID]: [Descriptive Name]

**Feature:** [from research]
**Priority:** Critical/High/Medium/Low

**Preconditions:**
- [what must be true before test]

**Steps:**
1. [action from user flow]
2. [action]
...

**Expected Result:**
- [what should happen]

**Wallet Popups:** [number, from research]
```

## Test Plan Structure

```markdown
# Test Plan

## Project Summary
- **Project:** [name]
- **Is Web3 DApp:** [Yes/No from research]
- **Key Features:** [list from research]

## Test Cases

### Feature: [Feature Name from Research]

[Generate test cases for this feature]

### Feature: [Next Feature]

[Generate test cases]

## Execution Order

### Phase 1: Setup
[If Web3 DApp]
1. Run web-test-cleanup
2. Run web-test-wallet-setup
3. Run web-test-wallet-connect

### Phase 2: Core Tests
1. [Critical tests first]
2. [Then high priority]

### Phase 3: Cleanup
1. Run web-test-report
2. Run web-test-cleanup --keep-data

## Wallet Popup Summary
[If Web3 DApp]

| Test | Action | Popups |
|------|--------|--------|
| [from generated tests] | | |
```

## Example: Generating Tests from Research

**Research output:**
```
Feature: User Registration
- Code: src/pages/Register.tsx
- User flow: enter email → enter password → click register → verify email
- No wallet interaction
```

**Generated tests:**
```markdown
### REG-001: Successful Registration
**Priority:** Critical
**Steps:**
1. Navigate to /register
2. Enter valid email
3. Enter valid password (meets requirements)
4. Click Register button
**Expected:** Success message, redirect to verify page
**Wallet Popups:** 0

### REG-002: Invalid Email Format
**Priority:** High
**Steps:**
1. Navigate to /register
2. Enter invalid email (no @)
3. Try to submit
**Expected:** Validation error shown
**Wallet Popups:** 0

### REG-003: Weak Password
**Priority:** High
**Steps:**
1. Navigate to /register
2. Enter valid email
3. Enter weak password (too short)
**Expected:** Password requirements error
**Wallet Popups:** 0
```

**Research output (Web3):**
```
Feature: Token Swap
- Code: src/features/Swap.tsx
- Uses: @someprotocol/sdk (researched: DEX aggregator)
- User flow: connect wallet → select tokens → enter amount → get quote → click swap → approve tx
- Wallet popups: 1 for native, 2 for ERC20 (approve + swap)
```

**Generated tests:**
```markdown
### SWAP-001: Swap Native Token
**Priority:** Critical
**Preconditions:** Wallet connected, has native token balance
**Steps:**
1. Navigate to swap page
2. Select native token as source
3. Enter amount within balance
4. Select destination token
5. Wait for quote
6. Click Swap
7. Approve transaction in wallet
**Expected:** Swap succeeds, balances update
**Wallet Popups:** 1

### SWAP-002: Swap ERC20 Token (First Time)
**Priority:** Critical
**Preconditions:** Wallet connected, has ERC20 token balance, never approved this token
**Steps:**
1. Navigate to swap page
2. Select ERC20 token as source
3. Enter amount
4. Select destination token
5. Click Swap
6. Approve token spending (first popup)
7. Approve swap transaction (second popup)
**Expected:** Swap succeeds
**Wallet Popups:** 2

### SWAP-003: Insufficient Balance
**Priority:** High
**Preconditions:** Wallet connected
**Steps:**
1. Enter amount greater than balance
**Expected:** Error message, swap button disabled
**Wallet Popups:** 0

### SWAP-004: Reject in Wallet
**Priority:** High
**Steps:**
1. Initiate valid swap
2. Reject in wallet popup
**Expected:** Error message "rejected", can retry
**Wallet Popups:** 1 (rejected)
```

## Key Rules

1. **Every test must trace to research** - No invented features
2. **Use actual user flows** - Steps come from code analysis
3. **Include wallet popup counts** - Critical for automation
4. **Prioritize correctly** - Core features = Critical
5. **Be specific** - "Enter 0.1 ETH" not "Enter amount"

## Output

Save to `./test-output/test-plan.md`

```bash
mkdir -p ./test-output
```

## Related Skills

| Skill | When to Use |
|-------|-------------|
| web-test-research | **Before this** - Provides feature analysis |
| web-test-wallet-setup | Before tests if Web3 DApp |
| web-test-wallet-connect | Before tests if Web3 DApp |
| web-test | Execute the test plan |
| web-test-report | After tests complete |
