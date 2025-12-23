---
name: web-test-plan
description: Create specific test cases from project research. Uses feature analysis to generate actionable test scenarios with exact steps. MUST use web-test-research output.
license: MIT
compatibility: Node.js 18+
metadata:
  author: AI Agent
  version: 2.0.0
allowed-tools: Bash Read Write Glob Grep
---

# Test Plan Creation

Create specific, actionable test cases based on project feature analysis from web-test-research.

## CRITICAL: Test Cases Must Be Specific

**Do NOT create generic test cases. You MUST:**

1. **Use the feature analysis** from web-test-research
2. **Create test cases for each identified feature**
3. **Include exact user flows** traced from code
4. **Specify wallet popup counts** for Web3 actions
5. **Define expected results** based on code behavior

**BAD Test Case (Too Generic):**
```
TC-001: Test Swap Feature
- Steps: Click swap, enter amount, confirm
- Expected: Swap works
```

**GOOD Test Case (Specific & Actionable):**
```
SWAP-001: ETH to USDC Swap (Native Token)
- Preconditions: Wallet connected with 0.5 ETH balance
- Steps:
  1. Select ETH in source token dropdown
  2. Enter "0.1" in amount input
  3. Select USDC in destination token dropdown
  4. Wait for quote to load (shows rate and fees)
  5. Click "Swap" button
  6. Approve swap in wallet popup (1 popup)
  7. Wait for transaction confirmation
- Expected Result:
  - Transaction success toast shown
  - ETH balance decreased by ~0.1
  - USDC balance increased by quote amount
- Wallet Popups: 1 (swap transaction)

SWAP-002: USDC to ETH Swap (Token Requiring Approval)
- Preconditions: Wallet connected with 100 USDC balance
- Steps:
  1. Select USDC in source token dropdown
  2. Enter "10" in amount input
  3. Select ETH in destination token dropdown
  4. Wait for quote to load
  5. Click "Swap" button
  6. Approve token spending in wallet popup (1st popup)
  7. Approve swap in wallet popup (2nd popup)
  8. Wait for transaction confirmation
- Expected Result:
  - Transaction success toast shown
  - USDC balance decreased by 10
  - ETH balance increased
- Wallet Popups: 2 (approve + swap)
```

## Prerequisites

**MUST have completed web-test-research skill first!**

The research should provide:
- Feature list with code locations
- User flows traced through code
- External protocols identified (LiFi, Uniswap, etc.)
- Contract interactions mapped
- Wallet popup requirements documented

## Test Plan Structure

### Section 1: Project Summary

```markdown
# Test Plan

## Project Summary
- **Project Name:** [from research]
- **Type:** DeFi / NFT / Gaming / Social
- **Framework:** [React/Vue/Next.js]
- **Web3 Stack:** [wagmi + viem / ethers.js]
- **External Protocols:** [LiFi, Uniswap, etc.]
- **Base URL:** [http://localhost:PORT]
```

### Section 2: Feature Test Matrix

Map features from research to test cases:

```markdown
## Feature Test Matrix

| Feature | Code Location | Test Cases | Priority |
|---------|---------------|------------|----------|
| Token Swap | src/features/swap/ | SWAP-001 to SWAP-006 | Critical |
| Cross-chain Bridge | src/features/bridge/ | BRIDGE-001 to BRIDGE-003 | High |
| Wallet Connect | src/hooks/useConnect.ts | WALLET-001 to WALLET-003 | Critical |
| Token Selection | src/components/TokenSelector/ | TOKEN-001 to TOKEN-002 | Medium |
```

### Section 3: Test Cases by Feature

**Generate test cases for EACH feature identified in research:**

```markdown
## Test Cases

### Feature: Token Swap (LiFi)

Based on code analysis:
- Code: src/features/swap/SwapWidget.tsx, src/hooks/useLiFiSwap.ts
- SDK: @lifi/sdk v2.x
- Functions: lifi.getQuote(), lifi.executeRoute()

#### SWAP-001: ETH to USDC (Native Token, No Approval)
- **Priority:** Critical
- **Preconditions:**
  - Wallet connected
  - ETH balance > 0.1
- **Steps:**
  1. Navigate to /swap
  2. Select ETH in "From" dropdown
  3. Enter "0.1" in amount input
  4. Select USDC in "To" dropdown
  5. Verify quote appears (rate, fees, estimated time)
  6. Click "Swap" button
  7. Approve transaction in Rabby popup
  8. Wait for confirmation (~30 seconds)
- **Expected Result:**
  - Success toast: "Swap completed"
  - ETH balance: decreased by ~0.1
  - USDC balance: increased by quoted amount
  - Transaction link in toast
- **Wallet Popups:** 1
- **Estimated Time:** 30-60 seconds

#### SWAP-002: USDC to ETH (ERC20, Needs Approval)
- **Priority:** Critical
- **Preconditions:**
  - Wallet connected
  - USDC balance > 10
  - First time swapping USDC (no prior approval)
- **Steps:**
  1. Navigate to /swap
  2. Select USDC in "From" dropdown
  3. Enter "10" in amount input
  4. Select ETH in "To" dropdown
  5. Verify quote appears
  6. Click "Swap" button
  7. Approve token spending in 1st Rabby popup
  8. Approve swap transaction in 2nd Rabby popup
  9. Wait for confirmation
- **Expected Result:**
  - Success toast: "Swap completed"
  - USDC balance: decreased by 10
  - ETH balance: increased
- **Wallet Popups:** 2 (approve + swap)

#### SWAP-003: Insufficient Balance Error
- **Priority:** High
- **Preconditions:**
  - Wallet connected
  - ETH balance = 0.01
- **Steps:**
  1. Navigate to /swap
  2. Select ETH in "From" dropdown
  3. Enter "100" in amount input (more than balance)
  4. Select USDC in "To" dropdown
- **Expected Result:**
  - Error message: "Insufficient balance" or similar
  - Swap button disabled
  - No wallet popup triggered
- **Wallet Popups:** 0

#### SWAP-004: Cancel in Wallet
- **Priority:** High
- **Preconditions:** Wallet connected, ETH balance > 0.1
- **Steps:**
  1. Navigate to /swap
  2. Enter valid swap (0.1 ETH → USDC)
  3. Click "Swap" button
  4. Click "Reject" in Rabby popup
- **Expected Result:**
  - Error message: "Transaction rejected" or "User denied"
  - Swap button re-enabled
  - No balance change
- **Wallet Popups:** 1 (rejected)

#### SWAP-005: Zero Amount
- **Priority:** Medium
- **Preconditions:** Wallet connected
- **Steps:**
  1. Navigate to /swap
  2. Select ETH in "From" dropdown
  3. Enter "0" or leave empty
  4. Select USDC in "To" dropdown
- **Expected Result:**
  - Swap button disabled
  - No quote fetched or "Enter amount" message
- **Wallet Popups:** 0

#### SWAP-006: Same Token Selection
- **Priority:** Medium
- **Preconditions:** Wallet connected
- **Steps:**
  1. Navigate to /swap
  2. Select USDC in "From" dropdown
  3. Try to select USDC in "To" dropdown
- **Expected Result:**
  - Either: USDC not selectable in "To"
  - Or: Error message "Cannot swap same token"
- **Wallet Popups:** 0

### Feature: Cross-chain Bridge (LiFi)

Based on code analysis:
- Code: src/features/bridge/BridgeWidget.tsx
- Uses same lifi.executeRoute() with different chains

#### BRIDGE-001: ETH Mainnet to Polygon
- **Priority:** High
- **Preconditions:**
  - Wallet connected to Ethereum Mainnet
  - ETH balance > 0.05
- **Steps:**
  1. Navigate to /bridge
  2. Select "Ethereum" as source chain
  3. Select "Polygon" as destination chain
  4. Select ETH as token
  5. Enter "0.01" as amount
  6. Verify bridge quote (fees, time estimate)
  7. Click "Bridge" button
  8. Approve in Rabby popup
  9. Wait for bridge initiation
- **Expected Result:**
  - Bridge initiated message
  - ETH balance on Ethereum decreased
  - Pending bridge indicator shown
  - (Funds arrive on Polygon after bridge time)
- **Wallet Popups:** 1
- **Estimated Time:** Bridge can take 5-30 minutes

### Feature: Wallet Connection

#### WALLET-001: Connect Wallet (RainbowKit)
- **Priority:** Critical
- **Preconditions:** Rabby wallet extension installed
- **Steps:**
  1. Navigate to homepage
  2. Click "Connect Wallet" button in header
  3. Click "Rabby" in wallet selection modal
  4. Approve connection in Rabby popup
- **Expected Result:**
  - Modal closes
  - Wallet address shown in header (0x...1234)
  - "Connected" indicator visible
- **Wallet Popups:** 1

#### WALLET-002: Disconnect Wallet
- **Priority:** High
- **Preconditions:** Wallet already connected
- **Steps:**
  1. Click connected wallet address in header
  2. Click "Disconnect" in dropdown
- **Expected Result:**
  - "Connect Wallet" button shown again
  - No wallet address displayed
- **Wallet Popups:** 0

#### WALLET-003: Switch Network
- **Priority:** Medium
- **Preconditions:** Wallet connected
- **Steps:**
  1. Click network selector (if exists)
  2. Select different network (e.g., Polygon)
  3. Approve network switch in Rabby popup
- **Expected Result:**
  - Network indicator updated
  - Balances reload for new network
- **Wallet Popups:** 1
```

### Section 4: Execution Order

```markdown
## Execution Order

### Phase 1: Environment Setup
1. [ ] Run web-test-cleanup (clean slate)
2. [ ] Start dev server (npm run dev)
3. [ ] Run web-test-wallet-setup (download & init Rabby)

### Phase 2: Wallet Connection (MUST PASS)
1. [ ] Run web-test-wallet-connect
2. [ ] WALLET-001: Connect Wallet
3. [ ] Verify: Address displayed in header

### Phase 3: Critical Feature Tests
1. [ ] SWAP-001: ETH to USDC (Native)
2. [ ] SWAP-002: USDC to ETH (ERC20 Approval)
3. [ ] SWAP-003: Insufficient Balance

### Phase 4: Error Handling Tests
1. [ ] SWAP-004: Cancel in Wallet
2. [ ] SWAP-005: Zero Amount
3. [ ] SWAP-006: Same Token

### Phase 5: Additional Features
1. [ ] BRIDGE-001: Cross-chain Bridge (if applicable)
2. [ ] [Other feature tests]

### Phase 6: Cleanup
1. [ ] WALLET-002: Disconnect Wallet
2. [ ] Run web-test-report
3. [ ] Run web-test-cleanup --keep-data
```

### Section 5: Wallet Popup Summary

```markdown
## Wallet Popup Summary

| Test Case | Action | Popup Type | Count | Auto-Approve |
|-----------|--------|------------|-------|--------------|
| WALLET-001 | Connect | Connection | 1 | Yes |
| SWAP-001 | Swap (native) | Transaction | 1 | Yes |
| SWAP-002 | Swap (ERC20) | Approve + Transaction | 2 | Yes |
| SWAP-004 | Reject | Transaction | 1 | No (reject) |
| BRIDGE-001 | Bridge | Transaction | 1 | Yes |

**Note:** Use wallet-approve command from web-test-wallet-connect for each popup.
```

## Protocol-Specific Test Templates

### LiFi (Swap & Bridge)

If research found LiFi SDK usage:

| Test ID | Scenario | Wallet Popups |
|---------|----------|---------------|
| LIFI-SWAP-001 | Native token swap | 1 |
| LIFI-SWAP-002 | ERC20 swap (first time) | 2 |
| LIFI-SWAP-003 | ERC20 swap (approved) | 1 |
| LIFI-BRIDGE-001 | Same-token bridge | 1 |
| LIFI-BRIDGE-002 | Token bridge (approval) | 2 |

### Uniswap

If research found Uniswap SDK usage:

| Test ID | Scenario | Wallet Popups |
|---------|----------|---------------|
| UNI-SWAP-001 | Exact input swap | 2 (approve + swap) |
| UNI-SWAP-002 | Exact output swap | 2 |
| UNI-LP-001 | Add liquidity | 3 (approve × 2 + add) |
| UNI-LP-002 | Remove liquidity | 1 |

### Aave

If research found Aave integration:

| Test ID | Scenario | Wallet Popups |
|---------|----------|---------------|
| AAVE-SUPPLY-001 | Supply ETH | 1 |
| AAVE-SUPPLY-002 | Supply ERC20 | 2 (approve + supply) |
| AAVE-BORROW-001 | Borrow against collateral | 1 |
| AAVE-REPAY-001 | Repay loan | 2 (approve + repay) |

### NFT Marketplace

If research found NFT functionality:

| Test ID | Scenario | Wallet Popups |
|---------|----------|---------------|
| NFT-MINT-001 | Mint NFT | 1 |
| NFT-LIST-001 | List for sale | 2 (approve + list) |
| NFT-BUY-001 | Buy NFT | 1 |
| NFT-TRANSFER-001 | Transfer NFT | 1 |

## Instructions

### Step 1: Read Research Output

Read the feature analysis from web-test-research. Extract:
- Each feature identified
- Code locations for each feature
- User flows traced through code
- External protocols and their functions
- Wallet interaction points

### Step 2: Generate Test Cases Per Feature

For EACH feature in the research:
1. Create happy path test case(s)
2. Create error handling test case(s)
3. Create edge case test case(s)
4. Specify exact wallet popup counts

### Step 3: Prioritize Tests

- **Critical:** Wallet connect, main feature happy path
- **High:** Error handling, secondary features
- **Medium:** Edge cases, UI variations
- **Low:** Optional features, nice-to-haves

### Step 4: Define Execution Order

Order by:
1. Wallet setup and connection first
2. Critical tests before dependent tests
3. Happy path before error cases
4. Cleanup last

### Step 5: Write Test Plan

```bash
mkdir -p ./test-output
# Write the test plan file
```

## Output

Save to `./test-output/test-plan.md`

## Related Skills

| Skill | Relationship |
|-------|-------------|
| web-test-research | **MUST complete first** - provides feature analysis |
| web-test-wallet-setup | Use before tests (Web3 DApps) |
| web-test-wallet-connect | Use before tests (Web3 DApps) |
| web-test | Execute the test plan |
| web-test-report | Generate report after tests |
| web-test-cleanup | Clean up after tests |

## Notes

- **Never create generic test cases** - Use specific inputs/outputs from code analysis
- **Include wallet popup counts** - Critical for test automation
- **Test ID format:** FEATURE-XXX (e.g., SWAP-001, BRIDGE-002)
- **Update plan** if testing reveals new behaviors
- **Document actual results** when they differ from expected
