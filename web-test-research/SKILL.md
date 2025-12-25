---
name: web-test-research
description: Analyze ANY web project - detect if Web3 DApp, research dependencies via WebSearch, understand business functions from code AND UI screenshots, generate test requirements.
license: MIT
compatibility: Node.js 18+
metadata:
  author: AI Agent
  version: 5.0.0
allowed-tools: Bash Read Glob Grep WebSearch WebFetch Skill
---

# Project Research

Analyze any web project to understand what it does and what needs to be tested.

## Core Principle: Discover, Research, Understand, SEE

**You must dynamically:**

1. **Detect** - Is this a Web3 DApp? What dependencies does it use?
2. **Research** - WebSearch any unknown dependency/protocol to understand what it does
3. **Read** - Read the actual code to understand how features are implemented
4. **See** - Launch the app and take UI screenshots to discover visual features
5. **Analyze Business** - Deep dive into business logic, user flows, and edge cases
6. **Generate** - Create comprehensive test requirements based on code, UI, AND business analysis

**Code analysis alone is NOT enough. UI screenshots reveal:**
- Third-party UI components and features
- Visual elements not obvious from code
- Actual user-facing functionality
- Hidden features from external packages

```
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  CRITICAL: BUSINESS FUNCTION ANALYSIS                      ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Test coverage quality depends on DEEP business understanding: ║
║                                                                ║
║  1. Identify ALL business functions, not just technical ones   ║
║  2. Map complete user journeys from start to finish            ║
║  3. Find business rules, validations, and constraints          ║
║  4. Discover edge cases and boundary conditions                ║
║  5. Understand state transitions and their triggers            ║
║                                                                ║
║  A swap test is NOT just "click swap button"                   ║
║  It includes: token selection, amount validation, slippage,    ║
║  price impact, approval flow, transaction states, etc.         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  web-test-research                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Check Dependencies (package.json)                      │
│          ↓                                                      │
│  Step 2: Research Unknown Dependencies (WebSearch)              │
│          ↓                                                      │
│  Step 3: Find Feature Code (grep, find)                         │
│          ↓                                                      │
│  Step 4: Read and Understand Code                               │
│          ↓                                                      │
│  Step 5: Visual UI Analysis                                     │
│          - Start dev server                                     │
│          - Launch browser                                       │
│          - Take screenshots of key pages                        │
│          - AI analyzes UI to find features                      │
│          ↓                                                      │
│  Step 6: Deep Business Function Analysis ← CRITICAL!            │
│          - Map complete user journeys                           │
│          - Identify business rules and validations              │
│          - Find edge cases and boundary conditions              │
│          - Document state transitions                           │
│          ↓                                                      │
│  Step 7: Generate Comprehensive Feature Analysis                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Step 1: Check Dependencies

```bash
# Read package.json to see all dependencies
cat package.json
```

**Look for:**
- Web3 libraries: wagmi, ethers, viem, web3.js, @rainbow-me/rainbowkit
- Any `@protocol-name/sdk` packages
- Contract interaction patterns

**If Web3 dependencies found → It's a Web3 DApp**

## Step 2: Research Unknown Dependencies

**For EVERY unfamiliar dependency, use WebSearch:**

```
Found: @someprotocol/sdk in package.json

→ WebSearch: "someprotocol SDK what is it"
→ WebSearch: "someprotocol documentation"
→ Learn what this protocol does
→ Understand user actions and transaction flows
```

**Questions to answer:**
- What does this protocol/service do?
- What are the main user actions?
- Does it require blockchain transactions?
- Are token approvals needed?

## Step 3: Find Feature Code

```bash
# Find where blockchain interactions happen
grep -rn "writeContract\|useContractWrite\|sendTransaction" --include="*.ts" --include="*.tsx" .

# Find where external SDKs are used
grep -rn "from '@" --include="*.ts" --include="*.tsx" . | grep -v node_modules

# Find main components/pages
find . -path ./node_modules -prune -o -type f \( -name "*.tsx" -o -name "*.vue" \) -print | head -30
```

## Step 4: Read and Understand Code

**For each feature file found, READ IT:**

```bash
cat src/features/SomeFeature.tsx
```

**Extract:**
- What user inputs are there? (forms, dropdowns, buttons)
- What happens when user clicks submit?
- What SDK/contract calls are made?
- What success/error states exist?

## Step 5: Visual UI Analysis (IMPORTANT!)

**Code analysis alone misses visual features. You MUST see the actual UI.**

### 5.1 Start Dev Server

```bash
# Check how to start the project
cat package.json | grep -A5 '"scripts"'

# Common start commands:
npm run dev
# or
npm start
# or
yarn dev
```

Wait for server to be ready (usually shows "ready on localhost:3000" or similar).

### 5.2 Take Screenshots of Key Pages

Use the web-test skill's test-helper.js to capture UI:

```bash
# Navigate to homepage and take screenshot
node $SKILL_DIR/../web-test/scripts/test-helper.js navigate "http://localhost:3000" --headed --keep-open
node $SKILL_DIR/../web-test/scripts/test-helper.js vision-screenshot research-home.jpg --headed --keep-open

# Navigate to other discovered routes and screenshot each
node $SKILL_DIR/../web-test/scripts/test-helper.js navigate "http://localhost:3000/swap" --headed --keep-open
node $SKILL_DIR/../web-test/scripts/test-helper.js vision-screenshot research-swap.jpg --headed --keep-open

# Scroll down to see more content
node $SKILL_DIR/../web-test/scripts/test-helper.js vision-scroll down 500 --headed --keep-open
node $SKILL_DIR/../web-test/scripts/test-helper.js vision-screenshot research-scroll.jpg --headed --keep-open
```

### 5.3 Discover Routes to Screenshot

**Find routes from code:**
```bash
# React Router routes
grep -rn "path=" --include="*.tsx" --include="*.ts" . | grep -v node_modules

# Next.js pages
ls -la pages/ app/

# Common routes to check:
# /, /swap, /pool, /stake, /bridge, /dashboard, /settings
```

### 5.4 Analyze Screenshots

**For each screenshot, analyze:**

| Question | What to Look For |
|----------|------------------|
| What buttons exist? | Connect Wallet, Swap, Add Liquidity, Stake, etc. |
| What forms/inputs? | Token selectors, amount inputs, slippage settings |
| What third-party UI? | Modal popups, charts, token lists, price displays |
| What navigation? | Header links, sidebar menu, tabs |
| What states shown? | Loading spinners, error messages, success toasts |

### 5.5 Example Visual Analysis

```
Screenshot: research-home.jpg

Observed UI Elements:
├── Header
│   ├── Logo
│   ├── Navigation: Swap | Pool | Stake | Bridge
│   └── Connect Wallet button (top right)
├── Main Content
│   ├── Token swap interface
│   │   ├── "From" token selector with balance display
│   │   ├── Amount input field
│   │   ├── Swap direction button (↓)
│   │   ├── "To" token selector
│   │   └── "Swap" button (disabled until wallet connected)
│   └── Price chart (TradingView widget - third party)
└── Footer
    └── Social links, docs link

Features to Test:
1. Connect Wallet flow
2. Token selection modal
3. Amount input validation
4. Swap button states
5. Price chart loading
```

## Step 6: Deep Business Function Analysis (CRITICAL!)

**This step is ESSENTIAL for comprehensive test coverage. You must analyze:**

### 6.1 Map Complete User Journeys

For EACH feature, document the complete user flow:

```
Feature: Token Swap
├── Entry Point: How does user access this feature?
│   - Direct URL (/swap)
│   - Navigation menu click
│   - Home page CTA
├── Prerequisites: What must be true before using?
│   - Wallet connected
│   - Has token balance
│   - Network selected
├── Main Flow: Happy path steps
│   1. Select source token
│   2. Enter amount
│   3. Select destination token
│   4. Review quote/price
│   5. Click swap
│   6. Approve in wallet (if ERC20)
│   7. Confirm transaction
│   8. Wait for confirmation
│   9. See success state
├── Alternative Flows:
│   - User changes amount mid-flow
│   - User switches tokens
│   - Quote expires, need refresh
│   - Transaction pending too long
└── Exit Points:
    - Success → balance updated
    - Cancel → back to form
    - Error → error message shown
```

### 6.2 Identify Business Rules and Validations

**For each input/action, find the validation rules:**

```bash
# Search for validation logic
grep -rn "validate\|isValid\|error\|required" --include="*.ts" --include="*.tsx" src/
```

**Document ALL business rules:**

| Feature | Rule | Condition | Error Message |
|---------|------|-----------|---------------|
| Swap | Min amount | amount > 0 | "Enter an amount" |
| Swap | Max amount | amount <= balance | "Insufficient balance" |
| Swap | Slippage range | 0.1% - 50% | "Slippage must be between 0.1% and 50%" |
| Swap | Price impact | impact < 15% | "High price impact warning" |
| Stake | Lock period | days >= 7 | "Minimum lock: 7 days" |
| Stake | Min stake | amount >= 100 | "Minimum stake: 100 tokens" |

### 6.3 Find Edge Cases and Boundary Conditions

**Think about what could go wrong:**

| Category | Edge Cases to Test |
|----------|-------------------|
| **Input Validation** | Empty input, zero, negative, very large number, special chars |
| **Balance** | Zero balance, exact balance, insufficient balance, dust amounts |
| **Token** | Native token vs ERC20, unsupported token, token with unusual decimals |
| **Network** | Wrong network, network switch mid-transaction |
| **Wallet** | Disconnect mid-flow, reject transaction, timeout |
| **State** | Stale data, quote expired, concurrent operations |
| **UI** | Rapid clicks, form resubmit, back button |

### 6.4 Document State Transitions

**Map all possible states and transitions:**

```
Token Swap States:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   [Idle] ──input──> [Amount Entered] ──fetch──> [Quote Ready]   │
│     │                     │                          │          │
│     │                     │ invalid                  │ click    │
│     │                     ↓                          ↓          │
│     │              [Validation Error]         [Confirming]      │
│     │                     │                      │    │         │
│     │                     │ fix                  │    │ reject  │
│     │                     ↓                      │    ↓         │
│     └──────────── [Ready to Swap] <──────────────┘  [Rejected]  │
│                          │                                      │
│                          │ approve+confirm                      │
│                          ↓                                      │
│                    [Pending] ──success──> [Completed]           │
│                        │                                        │
│                        │ fail                                   │
│                        ↓                                        │
│                    [Failed]                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5 Analyze Specific Business Scenarios

**Deep dive into business logic:**

```bash
# Find business logic files
grep -rn "calculate\|compute\|getPrice\|getQuote" --include="*.ts" --include="*.tsx" src/

# Read and understand the calculations
cat src/utils/priceCalculation.ts
```

**Example Analysis for a DEX:**

| Business Function | What to Test |
|-------------------|--------------|
| **Quote Calculation** | Correct price for different amounts, slippage applied correctly |
| **Price Impact** | Warning shows when impact > threshold, blocking when too high |
| **Token Approval** | First swap needs approval, subsequent swaps don't |
| **Transaction Fee** | Gas estimation shown, updates with network conditions |
| **Swap Route** | Multi-hop routes work, best route selected |

### 6.6 Business Function Checklist

**Before moving to Step 7, verify you have analyzed:**

```
□ All user entry points to the feature
□ Complete happy path with all steps
□ All input validation rules with error messages
□ Balance and amount edge cases
□ All possible error states and recovery flows
□ State transitions and their triggers
□ Concurrent/race condition scenarios
□ Business-specific calculations and rules
□ Integration points with external services
□ Feature-specific edge cases (e.g., token decimals, gas limits)
```

## Step 7: Generate Comprehensive Feature Analysis

**Combine code analysis, visual analysis, AND business analysis:**

```markdown
# Project Analysis

## Project Type
- **Is Web3 DApp:** Yes/No
- **Framework:** [detected from package.json]
- **Web3 Stack:** [detected libraries]
- **Dev Server:** [npm run dev / npm start]
- **URL:** http://localhost:3000

## Dependencies Researched

### [Dependency Name]
- **Package:** @xxx/sdk
- **What it does:** [from WebSearch]
- **User actions:** [list of actions]
- **Requires transactions:** Yes/No
- **Requires approvals:** Yes/No

## Features Found (from Code + UI)

### Feature: [Name]
- **Discovered via:** Code / UI / Both
- **Code location:** [file path]
- **UI location:** [page/section seen in screenshot]
- **Screenshot:** [research-xxx.jpg]
- **Uses:** [dependency/contract]
- **UI Elements:**
  - [button/input/selector seen]
  - [third-party component identified]
- **User flow:**
  1. [step from reading code + seeing UI]
  2. [step]
  ...
- **Wallet interactions:** [list any tx/signing]

### Feature: [Next feature]
...

## Visual-Only Discoveries

Features found from UI that were NOT obvious from code:

| Feature | Screenshot | Description |
|---------|------------|-------------|
| Price Chart | research-home.jpg | TradingView widget, needs loading test |
| Token List Modal | research-swap.jpg | Shows token search, balances |
| Settings Popup | research-settings.jpg | Slippage, deadline settings |

## Business Function Analysis (CRITICAL FOR TEST COVERAGE)

### User Journeys

#### Journey: [Feature Name] - Happy Path
| Step | Action | Expected Result | Screenshot |
|------|--------|-----------------|------------|
| 1 | Navigate to /swap | Swap page loads | swap-initial.jpg |
| 2 | Select source token | Token selector opens | swap-token-select.jpg |
| 3 | Enter amount "0.1" | Quote fetches | swap-quote.jpg |
| ... | ... | ... | ... |

#### Journey: [Feature Name] - Error Recovery
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter amount exceeding balance | Error message shown |
| 2 | Reduce amount to valid | Error clears, quote loads |
| ... | ... | ... |

### Business Rules Discovered

| Feature | Rule | Validation | Error Message | Code Location |
|---------|------|------------|---------------|---------------|
| Swap | Min amount | amount > 0 | "Enter an amount" | src/hooks/useSwap.ts:45 |
| Swap | Balance check | amount <= balance | "Insufficient balance" | src/components/SwapForm.tsx:89 |
| Swap | Slippage range | 0.1% - 50% | "Invalid slippage" | src/utils/validation.ts:23 |
| Stake | Min stake | amount >= minStake | "Below minimum stake" | src/features/stake/index.tsx:67 |
| Stake | Lock period | days >= 7 | "Minimum lock: 7 days" | src/features/stake/index.tsx:72 |

### Edge Cases and Boundary Conditions

| Category | Test Scenario | Expected Behavior | Priority |
|----------|---------------|-------------------|----------|
| Input | Zero amount | Button disabled, show hint | High |
| Input | Negative number | Prevent input or show error | High |
| Input | Decimal overflow (e.g., 0.0000001 for 6-decimal token) | Round or reject | Medium |
| Balance | Exact balance swap | Should succeed | High |
| Balance | Balance - gas not enough | Show gas warning | High |
| Token | Token with 2 decimals | Display correctly | Medium |
| Token | Swap same token | Prevent or show error | Medium |
| Network | Wrong network selected | Show network switch prompt | High |
| State | Quote expires (user waits too long) | Refresh quote prompt | Medium |
| State | Double-click submit | Prevent duplicate tx | High |

### State Transition Diagram

```
[Feature: Swap]

Initial → [Wallet Not Connected]
             │
             ↓ connect wallet
       [Wallet Connected]
             │
             ↓ enter amount
       [Amount Entered] ←──────────────┐
             │                          │
             ├── invalid ──→ [Validation Error] ── fix ──┘
             │
             ↓ fetch quote
       [Quote Ready]
             │
             ├── quote expires ──→ [Stale Quote] ── refresh ──→ [Quote Ready]
             │
             ↓ click swap
       [Confirming]
             │
             ├── reject ──→ [Rejected] ──→ [Wallet Connected]
             │
             ↓ approve (if ERC20)
       [Approving Token]
             │
             ↓ confirm tx
       [Transaction Pending]
             │
             ├── fail ──→ [Transaction Failed] ──→ [Quote Ready]
             │
             ↓ success
       [Swap Complete] ──→ [Wallet Connected]
```

## Comprehensive Test Requirements

Based on code, UI, AND business analysis:

### Core Business Functions (Critical Priority)

| ID | Feature | Test Scenario | Business Rule | Expected | Wallet Popups |
|----|---------|---------------|---------------|----------|---------------|
| BF-001 | Swap | Swap native token for ERC20 | Happy path | Success, balance updated | 1 |
| BF-002 | Swap | Swap ERC20 for native token | Requires approval | Approval + swap | 2 |
| BF-003 | Swap | Swap with exact balance | Edge case | Success or insufficient gas warning | 1-2 |
| BF-004 | Stake | Stake minimum amount | Min stake rule | Success | 1 |
| BF-005 | Stake | Stake below minimum | Validation | Error message shown | 0 |

### Input Validation Tests (High Priority)

| ID | Feature | Input | Business Rule | Expected |
|----|---------|-------|---------------|----------|
| IV-001 | Swap | Empty amount | amount required | Button disabled |
| IV-002 | Swap | "0" amount | amount > 0 | Error or disabled |
| IV-003 | Swap | "abc" (non-numeric) | numeric only | Input rejected |
| IV-004 | Swap | Negative "-1" | amount >= 0 | Input rejected or error |
| IV-005 | Swap | Very large "9999999999" | amount <= balance | Insufficient balance error |
| IV-006 | Swap | Decimal overflow | token decimals | Rounded or rejected |

### Error Handling Tests (High Priority)

| ID | Feature | Error Scenario | Expected Behavior |
|----|---------|----------------|-------------------|
| EH-001 | Swap | Transaction rejected in wallet | Error message, can retry |
| EH-002 | Swap | Transaction reverted | Clear error, suggest retry |
| EH-003 | Swap | Network error | Retry prompt |
| EH-004 | Swap | Quote expired | Refresh quote button |
| EH-005 | General | Wallet disconnected mid-flow | Prompt to reconnect |

### State Transition Tests (Medium Priority)

| ID | Feature | Transition | Test Scenario |
|----|---------|------------|---------------|
| ST-001 | Swap | Idle → Quote Ready | Enter valid amount |
| ST-002 | Swap | Quote Ready → Stale | Wait for timeout |
| ST-003 | Swap | Confirming → Rejected | Click reject in wallet |
| ST-004 | Swap | Pending → Failed | Simulate tx failure |
| ST-005 | Swap | Pending → Complete | Successful transaction |

### UI/UX Tests (Medium Priority)

| ID | Feature | Test Scenario | Expected |
|----|---------|---------------|----------|
| UX-001 | Swap | Double-click swap button | Single transaction only |
| UX-002 | Swap | Rapidly change input | No race conditions |
| UX-003 | Swap | Browser back during flow | Clean state |
| UX-004 | Token | Token selector search | Filters correctly |
| UX-005 | Settings | Change slippage | Applied to next swap |
```

## Example Complete Research Flow

```
1. cat package.json
   → Found: @xyz/sdk, wagmi, viem
   → This is a Web3 DApp

2. WebSearch: "xyz sdk documentation"
   → Learned: XYZ is a DEX aggregator for token swaps
   → User can: swap tokens, bridge cross-chain
   → Requires: token approval + swap transaction

3. grep for @xyz/sdk usage
   → Found in: src/hooks/useSwap.ts

4. cat src/hooks/useSwap.ts
   → Uses xyz.getQuote() and xyz.executeSwap()
   → Called from SwapButton component

5. npm run dev
   → Server started on http://localhost:3000

6. Take screenshots:
   → research-home.jpg: Homepage with swap interface
   → research-swap.jpg: Swap page with token selectors
   → research-pool.jpg: Liquidity pool page

7. Analyze screenshots:
   → Found: TradingView chart component (not in code search!)
   → Found: Token list modal with search
   → Found: Settings gear icon with slippage popup

8. Generate test requirements:
   - Test token swap (native token) → 1 popup
   - Test token swap (ERC20) → 2 popups (approve + swap)
   - Test insufficient balance → 0 popups, error shown
   - Test price chart loading → 0 popups (visual only)
   - Test token search in modal → 0 popups (visual only)
   - Test slippage settings → 0 popups (visual only)
```

## Key Rules

1. **No assumptions** - Research every unknown dependency
2. **Read the code** - Don't guess, read the actual implementation
3. **WebSearch is your tool** - Use it to understand any protocol
4. **SEE the UI** - Take screenshots, visual features are often missed
5. **Be specific** - Test requirements must be based on real code AND real UI
6. **Document sources** - Note whether each feature was found via code or UI

## Output

Provide a feature analysis that the **web-test-case-gen** skill can use to generate specific test cases.

**The analysis MUST include:**
- Features from code analysis
- Features from UI screenshots
- Visual-only discoveries (not found in code)

## Usage

This skill can be used in two ways:

1. **Automatically** - Called by `web-test-case-gen` as its first step
2. **Standalone** - Run directly to analyze a project without generating test cases

## Related Skills

| Skill | Relationship |
|-------|--------------|
| web-test-case-gen | Calls this skill first, then generates test cases |
| web-test | Provides test-helper.js for screenshots |
| web-test-wallet-setup | Sets up wallet (if Web3 DApp detected) |
| web-test-wallet-connect | Connects wallet (if Web3 DApp detected) |
