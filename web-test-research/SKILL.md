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
5. **Generate** - Create test requirements based on code AND visual analysis

**Code analysis alone is NOT enough. UI screenshots reveal:**
- Third-party UI components and features
- Visual elements not obvious from code
- Actual user-facing functionality
- Hidden features from external packages

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
│  Step 5: Visual UI Analysis ← NEW!                              │
│          - Start dev server                                     │
│          - Launch browser                                       │
│          - Take screenshots of key pages                        │
│          - AI analyzes UI to find features                      │
│          ↓                                                      │
│  Step 6: Generate Feature Analysis                              │
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

## Step 6: Generate Feature Analysis

**Combine code analysis AND visual analysis:**

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

## Test Requirements

Based on code AND visual analysis:

| Feature | What to Test | Source | Wallet Popups |
|---------|--------------|--------|---------------|
| [feature] | [test scenarios] | Code+UI | [0/1/2/...] |
| [visual feature] | [test scenarios] | UI only | [0/1/2/...] |
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
