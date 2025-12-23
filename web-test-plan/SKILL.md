---
name: web-test-plan
description: Create a structured test plan based on project research. Defines test cases, priorities, and execution order. Use this AFTER completing project research.
license: MIT
compatibility: Node.js 18+
metadata:
  author: AI Agent
  version: 1.0.0
allowed-tools: Bash Read Write Glob Grep
---

# Test Plan Creation

Create a structured test plan based on project research findings.

## When to Use This Skill

- **AFTER completing project research** (web-test-research skill)
- **Before executing tests** - Plan what to test and in what order
- **When updating test strategy** - Revise plan based on new findings

## Prerequisites

You must have completed **web-test-research** skill first to understand:
- Project framework and structure
- Routes and pages
- Interactive elements
- Whether it's a Web3 DApp

## Quick Start

```
Create a test plan for this project based on the research
```

## Test Plan Structure

### Section 1: Project Summary

```markdown
# Test Plan

## Project Summary
- **Project Name:** [name]
- **Framework:** [React/Vue/Next.js/etc.]
- **Base URL:** [http://localhost:PORT]
- **Is Web3 DApp:** YES / NO
```

### Section 2: Test Scope

Define what will be tested:

```markdown
## Test Scope

### In Scope
- [ ] Page navigation and routing
- [ ] Interactive elements (buttons, forms, modals)
- [ ] User authentication flows
- [ ] Web3 wallet connection (if applicable)
- [ ] Core feature functionality

### Out of Scope
- Performance testing
- Security testing
- API testing (unless visible in UI)
```

### Section 3: Test Cases

Create detailed test cases:

```markdown
## Test Cases

### TC-001: Homepage Load
- **Priority:** High
- **Preconditions:** None
- **Steps:**
  1. Navigate to /
  2. Wait for page load
  3. Take screenshot
- **Expected Result:** Homepage loads with all elements visible
- **Web3 Required:** No

### TC-002: Connect Wallet (Web3 DApps only)
- **Priority:** Critical
- **Preconditions:** Wallet extension installed
- **Steps:**
  1. Click "Connect Wallet" button
  2. Select wallet in modal
  3. Approve connection in wallet popup
  4. Verify wallet address displayed
- **Expected Result:** Wallet connected, address shown
- **Web3 Required:** Yes

### TC-003: [Feature Test]
- **Priority:** Medium/High/Critical
- **Preconditions:** [any prerequisites]
- **Steps:**
  1. [step 1]
  2. [step 2]
  3. [step 3]
- **Expected Result:** [what should happen]
- **Web3 Required:** Yes/No
```

### Section 4: Execution Order

Define test execution sequence:

```markdown
## Execution Order

### Phase 1: Setup (if Web3 DApp)
1. [ ] Run web-test-cleanup (fresh start)
2. [ ] Run web-test-wallet-setup
3. [ ] Run web-test-wallet-connect

### Phase 2: Core Tests
1. [ ] TC-001: Homepage Load
2. [ ] TC-002: Navigation Tests
3. [ ] TC-003: [Core Feature Tests]

### Phase 3: Feature Tests
1. [ ] TC-004: [Feature 1]
2. [ ] TC-005: [Feature 2]

### Phase 4: Cleanup
1. [ ] Run web-test-report
2. [ ] Run web-test-cleanup --keep-data
```

### Section 5: Web3 Considerations

If Web3 DApp, include:

```markdown
## Web3 Test Considerations

### Wallet Actions That Trigger Popups
- Connect wallet → Approval popup
- Sign message → Signature popup
- Approve token → Transaction popup
- Swap/Send/Mint → Transaction popup

### Expected Wallet Interactions
| Action | Popup Type | Auto-Approve |
|--------|-----------|--------------|
| Connect | Approval | Yes |
| Sign message | Signature | Yes |
| Token approval | Transaction | Yes |
| Swap | Transaction | Yes |

### Test Network
- **Network:** [Mainnet/Sepolia/Custom]
- **Test Tokens Needed:** [list if any]
```

## Instructions

### Step 1: Review Research

Read the project research report from web-test-research:
- Routes discovered
- Interactive elements found
- Web3 DApp status
- Technology insights

### Step 2: Prioritize Test Cases

Assign priorities:
- **Critical:** Must pass for app to work (login, wallet connect)
- **High:** Core features (main user flows)
- **Medium:** Secondary features
- **Low:** Edge cases, nice-to-haves

### Step 3: Define Execution Order

Order tests by:
1. Setup/Prerequisites first
2. Critical tests before dependent tests
3. Independent tests can run in any order
4. Cleanup at the end

### Step 4: Write Test Plan

Create `./test-output/test-plan.md`:

```bash
mkdir -p ./test-output
cat > ./test-output/test-plan.md << 'EOF'
# Test Plan
[Your test plan content here]
EOF
```

## Output: Test Plan File

Save to `./test-output/test-plan.md`

## Related Skills

- **web-test-research** - Must complete before creating test plan
- **web-test-wallet-setup** - Use if Web3 DApp (before tests)
- **web-test-wallet-connect** - Use if Web3 DApp (before tests)
- **web-test** - Execute the test plan
- **web-test-report** - Generate report after tests
- **web-test-cleanup** - Clean up after tests

## Notes

- Always base test plan on actual project research
- Include both happy path and error scenarios
- For Web3 DApps, wallet connection is always Critical priority
- Update the plan if new features/issues are discovered during testing
