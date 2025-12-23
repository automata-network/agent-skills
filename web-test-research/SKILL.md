---
name: web-test-research
description: Analyze ANY web project - detect if Web3 DApp, research dependencies via WebSearch, understand business functions from code, generate test requirements.
license: MIT
compatibility: Node.js 18+
metadata:
  author: AI Agent
  version: 4.0.0
allowed-tools: Bash Read Glob Grep WebSearch WebFetch
---

# Project Research

Analyze any web project to understand what it does and what needs to be tested.

## Core Principle: Discover, Research, Understand

**You must dynamically:**

1. **Detect** - Is this a Web3 DApp? What dependencies does it use?
2. **Research** - WebSearch any unknown dependency/protocol to understand what it does
3. **Read** - Read the actual code to understand how features are implemented
4. **Generate** - Create test requirements based on discovered functionality

**NO hardcoded protocol lists. Every project is unique.**

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

## Step 5: Generate Feature Analysis

**Output format:**

```markdown
# Project Analysis

## Project Type
- **Is Web3 DApp:** Yes/No
- **Framework:** [detected from package.json]
- **Web3 Stack:** [detected libraries]

## Dependencies Researched

### [Dependency Name]
- **Package:** @xxx/sdk
- **What it does:** [from WebSearch]
- **User actions:** [list of actions]
- **Requires transactions:** Yes/No
- **Requires approvals:** Yes/No

## Features Found

### Feature: [Name based on code]
- **Code location:** [file path]
- **Uses:** [dependency/contract]
- **User flow:**
  1. [step from reading code]
  2. [step]
  ...
- **Wallet interactions:** [list any tx/signing]

### Feature: [Next feature]
...

## Test Requirements

Based on discovered features:

| Feature | What to Test | Wallet Popups Expected |
|---------|--------------|------------------------|
| [feature] | [test scenarios] | [0/1/2/...] |
```

## Example Research Flow

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

5. cat src/components/SwapButton.tsx
   → User selects tokens, enters amount, clicks Swap
   → Shows quote before confirming
   → Handles approval if needed

6. Generate test requirements:
   - Test token swap (native token) → 1 popup
   - Test token swap (ERC20) → 2 popups (approve + swap)
   - Test insufficient balance → 0 popups, error shown
   - Test user rejection → 1 popup rejected
```

## Key Rules

1. **No assumptions** - Research every unknown dependency
2. **Read the code** - Don't guess, read the actual implementation
3. **WebSearch is your tool** - Use it to understand any protocol
4. **Be specific** - Test requirements must be based on real code
5. **Document sources** - Note where you learned each piece of information

## Output

Provide a feature analysis that the **web-test-plan** skill can use to generate specific test cases.

## Related Skills

- **web-test-plan** - Creates test cases from this analysis
- **web-test-wallet-setup** - Sets up wallet (if Web3 DApp)
- **web-test-wallet-connect** - Connects wallet (if Web3 DApp)
- **web-test** - Executes tests
