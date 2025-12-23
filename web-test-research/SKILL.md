---
name: web-test-research
description: Analyze and research a web project - detect framework, discover routes/pages, find interactive elements, detect Web3 DApp, and research technologies. Use this BEFORE creating a test plan.
license: MIT
compatibility: Node.js 18+
metadata:
  author: AI Agent
  version: 1.0.0
allowed-tools: Bash Read Glob Grep WebSearch WebFetch
---

# Project Research

Analyze and research a web project to understand its structure, technologies, and features before testing.

## When to Use This Skill

- **BEFORE creating a test plan** - Understand what needs to be tested
- **When testing a new project** - Discover framework, routes, and features
- **When testing a Web3 DApp** - Detect wallet integration and understand blockchain features

## Quick Start

Ask me to research your project:
- "Research this project"
- "Analyze the project structure"
- "What framework does this project use?"

## Research Steps

### Step 1: Detect Project Structure

Read `package.json` and config files to identify:

```bash
# Check package.json for dependencies and scripts
cat package.json

# Look for framework config files
ls -la vite.config.* next.config.* nuxt.config.* angular.json webpack.config.*
```

**Framework Detection:**
| Config File | Framework | Default Port |
|-------------|-----------|--------------|
| `vite.config.*` | Vite | 5173 |
| `next.config.*` | Next.js | 3000 |
| `nuxt.config.*` | Nuxt | 3000 |
| `angular.json` | Angular | 4200 |
| `vue.config.js` | Vue CLI | 8080 |
| `webpack.config.*` | Webpack | 8080 |
| `astro.config.*` | Astro | 4321 |

### Step 2: Discover Routes and Pages

Find all page/route files:

```bash
# React/Next.js pages
find . -type f \( -name "*.tsx" -o -name "*.jsx" \) -path "*/pages/*" -o -path "*/app/*" 2>/dev/null

# Vue/Nuxt pages
find . -type f -name "*.vue" -path "*/pages/*" 2>/dev/null

# Router configuration
grep -r "createBrowserRouter\|createRouter\|defineNuxtRouteMiddleware" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .
```

**Output Format:**
```
Routes discovered:
- / (Home page)
- /about (About page)
- /dashboard (Dashboard - requires auth)
- /swap (Swap feature - Web3)
```

### Step 3: Find Interactive Elements

Search for interactive components:

```bash
# Find buttons, forms, modals
grep -r "onClick\|onSubmit\|<button\|<form\|<input\|Modal\|Dialog" --include="*.tsx" --include="*.jsx" --include="*.vue" .

# Find specific UI patterns
grep -r "handleClick\|handleSubmit\|onPress" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .
```

**Output Format:**
```
Interactive elements found:
- LoginButton (src/components/LoginButton.tsx)
- SwapForm (src/components/SwapForm.tsx)
- ConnectWalletModal (src/components/ConnectWalletModal.tsx)
```

### Step 4: Detect Web3 DApp

**CRITICAL:** Check if project is a Web3 DApp:

```bash
# Check package.json for Web3 libraries
grep -E "wagmi|viem|ethers|@rainbow-me|@privy-io|@web3modal|connectkit|@walletconnect" package.json

# Search for wallet-related code
grep -r "useAccount\|useConnect\|useWallet\|ConnectButton\|ConnectWallet" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .

# Search for contract interactions
grep -r "useContractRead\|useContractWrite\|writeContract\|readContract" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .
```

**Web3 Detection Criteria:**
- Has wagmi, viem, ethers.js, or other Web3 libraries
- Has "Connect Wallet" button or similar
- Has contract interaction code
- Has token/NFT related features

**Output Format:**
```
Web3 DApp Detection:
- Is Web3 DApp: YES / NO
- Wallet Library: wagmi / ethers / viem / none
- Connect Method: Rainbow Kit / Privy / Custom / none
- Contract Interactions: YES / NO
```

### Step 5: Research Technologies (MANDATORY)

**DO NOT skip this step!** Use web search to understand:

```
Search queries to run:
1. "[Project name] documentation"
2. "[Framework] + [Wallet library] integration guide"
3. "[DeFi feature] how it works" (e.g., "Uniswap swap how it works")
4. "[Library] usage examples" (e.g., "wagmi useContractWrite example")
```

**What to Research:**
- What the project does (DeFi, NFT, Bridge, etc.)
- How the main features work
- Expected user flows
- Common error scenarios

**Output Format:**
```
Technology Research:
- Project Type: DeFi / NFT / Bridge / Gaming / Social / Other
- Main Features: [list features]
- Expected User Flows: [list flows]
- Key Libraries: [list with brief description]
```

## Output: Project Research Report

After completing all steps, generate a summary:

```markdown
# Project Research Report

## Project Overview
- **Name:** [project name]
- **Framework:** [React/Vue/Next.js/etc.]
- **Port:** [default port]

## Web3 DApp Status
- **Is Web3 DApp:** YES / NO
- **Wallet Library:** [wagmi/ethers/viem/none]
- **Connect Method:** [Rainbow Kit/Privy/Custom/none]

## Routes Discovered
- / - [description]
- /page1 - [description]
- /page2 - [description]

## Interactive Elements
- [Element 1] - [location] - [description]
- [Element 2] - [location] - [description]

## Technology Research
- **Project Type:** [type]
- **Main Features:** [list]
- **Key Libraries:** [list]

## Recommendations for Testing
- [Recommendation 1]
- [Recommendation 2]

## Next Steps
→ If Web3 DApp: Use **web-test-wallet-setup** and **web-test-wallet-connect** skills
→ Create test plan using **web-test-plan** skill
```

## Related Skills

After completing project research:
- **web-test-plan** - Create a structured test plan based on research
- **web-test-wallet-setup** - Set up wallet if Web3 DApp detected
- **web-test-wallet-connect** - Connect wallet to DApp

## Notes

- Always complete ALL research steps before creating a test plan
- Web3 detection is critical - it determines if wallet skills are needed
- Technology research helps understand expected behaviors and edge cases
- Save the research report for reference during testing
