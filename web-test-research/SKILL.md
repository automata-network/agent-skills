---
name: web-test-research
description: Deep analysis of ANY web project - identify business functions, research unknown protocols via WebSearch, understand code to generate accurate test cases. Works with any Web3 DApp type.
license: MIT
compatibility: Node.js 18+
metadata:
  author: AI Agent
  version: 3.0.0
allowed-tools: Bash Read Glob Grep WebSearch WebFetch
---

# Project Research

Deep analysis of ANY web project to understand its business functionality and generate accurate test cases.

## CRITICAL: Discover & Research Unknown Functionality

**You are NOT limited to predefined protocols. You MUST:**

1. **DISCOVER** what the project does by reading code
2. **RESEARCH** any unknown protocol/SDK via WebSearch
3. **UNDERSTAND** the business logic, not just the tech stack
4. **GENERATE** test cases based on actual functionality

**Your knowledge includes:** DeFi, NFTs, DAOs, Gaming, Social, Identity, and all Web3 concepts. Use it!

## Web3 DApp Categories (Use Your Knowledge!)

When analyzing a project, identify which category it belongs to:

### DeFi (Decentralized Finance)
| Type | Examples | Core Functions |
|------|----------|----------------|
| DEX | Uniswap, SushiSwap, Curve, PancakeSwap | swap, addLiquidity, removeLiquidity |
| Aggregator | 1inch, ParaSwap, LiFi, Cowswap | getQuote, swap, bridge |
| Lending | Aave, Compound, MakerDAO | supply, borrow, repay, withdraw |
| Derivatives | GMX, dYdX, Perpetual Protocol | openPosition, closePosition, addMargin |
| Yield | Yearn, Convex, Beefy | deposit, withdraw, harvest |
| Staking | Lido, Rocket Pool, native staking | stake, unstake, claimRewards |

### NFT & Digital Assets
| Type | Examples | Core Functions |
|------|----------|----------------|
| Marketplace | OpenSea, Blur, LooksRare, Magic Eden | list, buy, bid, acceptOffer |
| Minting | Custom mint pages, launchpads | mint, reveal, setApproval |
| Gaming | Axie, Gods Unchained, Parallel | play, breed, trade, craft |

### Infrastructure & Tools
| Type | Examples | Core Functions |
|------|----------|----------------|
| Bridge | Wormhole, LayerZero, Axelar | bridge, redeem |
| Identity | ENS, Lens, Worldcoin | register, resolve, verify |
| DAO | Snapshot, Tally, Aragon | propose, vote, execute |
| Launchpad | Pinksale, DxSale | createToken, presale, claim |

## Research Process

### Step 1: Initial Discovery

```bash
# 1. Check package.json for dependencies
cat package.json | grep -A 100 "dependencies"

# 2. Find main source files
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.vue" \) | head -50

# 3. Look for contract ABIs (reveals functionality)
find . -name "*.json" | xargs grep -l "abi" 2>/dev/null | head -10
```

### Step 2: Identify Business Functions

**Search for ANY blockchain interaction patterns:**

```bash
# Contract writes (ANY transaction)
grep -rn "writeContract\|useContractWrite\|sendTransaction\|usePrepareContractWrite" --include="*.ts" --include="*.tsx" .

# Contract reads
grep -rn "readContract\|useContractRead\|useReadContract" --include="*.ts" --include="*.tsx" .

# Common DeFi actions
grep -rn "swap\|bridge\|stake\|mint\|borrow\|supply\|deposit\|withdraw\|claim\|approve" --include="*.ts" --include="*.tsx" .

# Signing operations
grep -rn "signMessage\|signTypedData\|useSignMessage" --include="*.ts" --include="*.tsx" .

# Find SDK/protocol imports
grep -rn "from '@\|from \"@" --include="*.ts" --include="*.tsx" . | grep -v "node_modules"
```

### Step 3: READ The Code (MANDATORY)

**After finding matches, READ the actual files:**

```bash
# Example: Found swap at src/hooks/useSwap.ts:15
cat src/hooks/useSwap.ts
```

**For each file, extract:**
1. What SDK/protocol is being used?
2. What function calls are made?
3. What parameters are required?
4. What is the expected result?

### Step 4: Research Unknown Protocols (CRITICAL!)

**When you find an unknown SDK or protocol, USE WebSearch:**

```
# Example searches:
"[protocol-name] SDK documentation"
"[protocol-name] how to use"
"[protocol-name] user flow transactions"
"[contract-name] what does it do"
```

**Questions to answer via research:**
1. What is this protocol/service?
2. What are the main user actions?
3. What blockchain transactions are involved?
4. Are token approvals needed?
5. What are common error scenarios?

### Step 5: Map Business Functions

**Create a function map based on code + research:**

```markdown
## Business Function Map

### Function: [Name from code - e.g., "Token Swap"]

**Discovered from:**
- File: src/features/swap/useSwap.ts
- SDK: @someprotocol/sdk
- Contract: 0x... (SwapRouter)

**What it does:** (from code + research)
[Description of business function]

**User Flow:** (traced from UI code)
1. [Step 1]
2. [Step 2]
...

**Blockchain Interactions:**
| Action | Contract | Method | Requires Approval |
|--------|----------|--------|-------------------|
| [action] | [contract] | [method] | Yes/No |

**Test Scenarios:**
| ID | Scenario | Input | Expected | Wallet Popups |
|----|----------|-------|----------|---------------|
```

## Identifying Unknown DApps

### Pattern Recognition

**If you see these patterns, the DApp likely does:**

| Code Pattern | Likely Function |
|--------------|-----------------|
| `swap`, `getQuote`, `executeRoute` | Token exchange (DEX/Aggregator) |
| `bridge`, `crossChain`, `layerZero` | Cross-chain transfer |
| `stake`, `delegate`, `unstake` | Staking/Delegation |
| `mint`, `totalSupply`, `tokenURI` | NFT minting |
| `supply`, `borrow`, `repay`, `liquidate` | Lending protocol |
| `openPosition`, `leverage`, `margin` | Derivatives trading |
| `vote`, `propose`, `execute` | DAO governance |
| `claim`, `harvest`, `compound` | Yield farming |
| `list`, `buy`, `offer`, `acceptBid` | NFT marketplace |
| `register`, `resolve`, `setRecord` | Name service/Identity |

### Contract ABI Analysis

**Read ABI files to understand available functions:**

```bash
# Find and read ABI
cat src/abis/SomeContract.json | grep "\"name\":"
```

**Common function signatures reveal purpose:**
- `transfer(address,uint256)` → Token transfer
- `approve(address,uint256)` → Token approval
- `swapExactTokensForTokens(...)` → DEX swap
- `deposit(uint256)` → Vault/Staking deposit
- `mint(address,uint256)` → NFT/Token minting

## Research Unknown Protocols

### WebSearch Strategy

**Always research protocols you don't recognize:**

```
Step 1: Basic understanding
Search: "[protocol] what is it"

Step 2: User documentation
Search: "[protocol] user guide how to"

Step 3: Developer docs
Search: "[protocol] SDK documentation API"

Step 4: Transaction flow
Search: "[protocol] transaction approval flow"
```

### Document Your Research

```markdown
## Protocol Research: [Name]

**Source:** [URL from WebSearch]

**What it is:**
[Brief description]

**Main Features:**
1. [Feature 1]
2. [Feature 2]

**User Actions:**
| Action | Description | Tx Required |
|--------|-------------|-------------|

**Approval Requirements:**
- [When approvals are needed]

**Common Errors:**
- [Error 1]: [Cause]
- [Error 2]: [Cause]
```

## Output Format

### Feature Analysis Report

```markdown
# Project Feature Analysis

## Project Overview
- **Name:** [name]
- **Category:** [DeFi/NFT/DAO/Gaming/etc.]
- **Sub-type:** [DEX/Lending/Marketplace/etc.]
- **Framework:** [React/Vue/Next.js]
- **Web3 Stack:** [wagmi/ethers/viem]

## Protocols & SDKs Discovered

| Protocol/SDK | Purpose | Researched Via |
|--------------|---------|----------------|
| @lifi/sdk | Cross-chain swap | WebSearch + docs |
| [unknown-sdk] | [discovered purpose] | WebSearch |
| Custom contracts | [purpose from ABI] | Code analysis |

## Business Functions Identified

### Function 1: [Name]

**Discovery:**
- Code: [file paths]
- Protocol: [name] (researched via WebSearch)
- Contract: [address if found]

**Business Logic:**
[What this function does for users - from code + research]

**User Flow:**
1. [Step 1 - from UI code]
2. [Step 2]
...

**Blockchain Interactions:**
| Step | Action | Contract | Method | Wallet Popup |
|------|--------|----------|--------|--------------|
| 1 | Approve token | ERC20 | approve() | Yes |
| 2 | Execute swap | Router | swap() | Yes |

**Test Scenarios:**
| ID | Scenario | Steps | Expected | Popups |
|----|----------|-------|----------|--------|
| F1-001 | Happy path | [...] | Success | N |
| F1-002 | Error case | [...] | Error msg | 0 |
| F1-003 | Edge case | [...] | [...] | N |

### Function 2: [Name]
...

## Unknown Elements (Need More Research)

| Element | Location | Question |
|---------|----------|----------|
| [unknown function] | [file] | What does this do? |

## Test Priority

### Critical
- [ ] [Core business function 1]
- [ ] [Core business function 2]

### High
- [ ] [Secondary functions]
- [ ] [Error handling]

### Medium
- [ ] [Edge cases]
- [ ] [UI variations]
```

## Examples

### Example: Unknown DeFi Protocol

**Found in code:**
```typescript
import { useXYZProtocol } from '@xyz-finance/sdk';
const { executeSwap, getRoutes } = useXYZProtocol();
```

**Research process:**
1. WebSearch: "XYZ Finance SDK documentation"
2. WebSearch: "XYZ Finance how it works"
3. Read returned docs/articles
4. Document findings

**Output:**
```markdown
## Protocol Research: XYZ Finance

**Discovered:** @xyz-finance/sdk in src/hooks/useSwap.ts

**Research Source:** https://docs.xyz.finance (via WebSearch)

**What it is:**
DEX aggregator that finds best swap routes across multiple DEXs

**Key Functions:**
- getRoutes(params) - Fetches available swap routes
- executeSwap(route) - Executes the selected route

**Approval Flow:**
1. If ERC20 token: approve() required first
2. Then executeSwap() transaction

**Test Scenarios:**
| ID | Scenario | Expected | Popups |
|----|----------|----------|--------|
| XYZ-001 | Swap ETH→USDC | Success | 1 |
| XYZ-002 | Swap USDC→ETH | Success | 2 (approve+swap) |
| XYZ-003 | Insufficient balance | Error shown | 0 |
```

### Example: Custom Contract

**Found in code:**
```typescript
const { write } = useContractWrite({
  address: '0x1234...',
  abi: stakingABI,
  functionName: 'stake',
});
```

**Research process:**
1. Read the ABI file to see all functions
2. WebSearch contract address on block explorer
3. Understand stake/unstake/claim pattern

## Key Principles

1. **No Protocol is "Unknown"** - You can always research via WebSearch
2. **Code Reveals Intent** - Read files, don't just grep
3. **ABIs Are Documentation** - Contract ABIs list all available functions
4. **Patterns Are Universal** - DeFi/NFT patterns are similar across protocols
5. **Research Fills Gaps** - WebSearch any SDK/protocol you don't recognize
6. **Business Logic First** - Understand what users DO, not just what tech is used

## Related Skills

- **web-test-plan** - Generate test plan from this analysis
- **web-test-wallet-setup** - Set up wallet for testing
- **web-test-wallet-connect** - Connect wallet to DApp
- **web-test** - Execute the tests
