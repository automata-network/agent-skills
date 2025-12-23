---
name: web-test-report
description: Generate test report after completing tests - summarize results, document failures, include screenshots, provide recommendations. Use AFTER completing all tests.
license: MIT
compatibility: Node.js 18+
metadata:
  author: AI Agent
  version: 1.0.0
allowed-tools: Bash Read Write Glob
---

# Test Report Generation

Generate a comprehensive test report after completing all tests.

## When to Use This Skill

- **AFTER all tests are completed** - Document results
- **When tests have failures** - Detail what went wrong
- **Before cleanup** - Capture results before removing data

## Prerequisites

1. All tests have been executed
2. Screenshots are available in `./test-output/screenshots/`
3. Test results are known (pass/fail for each test)

## Quick Start

```bash
# Generate report file
cat > ./test-output/test-report.md << 'EOF'
# Test Report
[Your report content]
EOF
```

## Report Structure

### Section 1: Header

```markdown
# Test Report

**Date:** YYYY-MM-DD HH:MM
**Project:** [Project Name]
**URL:** [Tested URL]
**Is Web3 DApp:** YES / NO
**Tester:** AI Agent (Claude)
```

### Section 2: Executive Summary

```markdown
## Executive Summary

| Metric | Value |
|--------|-------|
| Total Tests | X |
| Passed | X |
| Failed | X |
| Pass Rate | X% |

**Overall Status:** ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
```

### Section 3: Test Results

```markdown
## Test Results

### ✅ Passed Tests

#### TC-001: Homepage Load
- **Status:** ✅ PASS
- **Duration:** Xs
- **Screenshot:** [screenshots/tc001-homepage.jpg](screenshots/tc001-homepage.jpg)
- **Notes:** Page loaded successfully with all elements visible

#### TC-002: Navigation
- **Status:** ✅ PASS
- **Duration:** Xs
- **Screenshot:** [screenshots/tc002-navigation.jpg](screenshots/tc002-navigation.jpg)
- **Notes:** All navigation links work correctly

### ❌ Failed Tests

#### TC-003: Form Submission
- **Status:** ❌ FAIL
- **Duration:** Xs
- **Screenshot:** [screenshots/tc003-form-error.jpg](screenshots/tc003-form-error.jpg)
- **Expected:** Form submits successfully
- **Actual:** Error message "Invalid email format"
- **Error Details:** Validation failed despite valid input
- **Recommendation:** Check email validation regex

### ⚠️ Skipped Tests

#### TC-010: Premium Feature
- **Status:** ⚠️ SKIPPED
- **Reason:** Requires premium account access
```

### Section 4: Web3 Test Results (if applicable)

```markdown
## Web3 Test Results

### Wallet Connection
- **Status:** ✅ PASS / ❌ FAIL
- **Wallet:** Rabby
- **Network:** Ethereum Mainnet
- **Address:** 0x1234...abcd

### Transaction Tests

#### TX-001: Token Swap
- **Status:** ✅ PASS
- **Transaction Type:** Swap
- **Screenshot:** [screenshots/tx001-swap.jpg](screenshots/tx001-swap.jpg)
- **Notes:** Swap executed successfully

#### TX-002: NFT Mint
- **Status:** ❌ FAIL
- **Transaction Type:** Mint
- **Screenshot:** [screenshots/tx002-mint-error.jpg](screenshots/tx002-mint-error.jpg)
- **Error:** Transaction reverted - insufficient funds
```

### Section 5: Screenshots Index

```markdown
## Screenshots

| Test | Screenshot | Description |
|------|------------|-------------|
| TC-001 | [tc001-homepage.jpg](screenshots/tc001-homepage.jpg) | Homepage initial load |
| TC-002 | [tc002-navigation.jpg](screenshots/tc002-navigation.jpg) | After navigation |
| TC-003 | [tc003-form-error.jpg](screenshots/tc003-form-error.jpg) | Form validation error |
```

### Section 6: Issues Found

```markdown
## Issues Found

### Issue #1: Form Validation Bug
- **Severity:** Medium
- **Test:** TC-003
- **Description:** Email validation rejects valid email addresses
- **Steps to Reproduce:**
  1. Navigate to /contact
  2. Enter email: test@example.com
  3. Click Submit
- **Expected:** Form submits
- **Actual:** Error "Invalid email format"
- **Screenshot:** [screenshots/tc003-form-error.jpg](screenshots/tc003-form-error.jpg)

### Issue #2: [Issue Title]
...
```

### Section 7: Recommendations

```markdown
## Recommendations

### High Priority
1. Fix email validation regex in contact form
2. Add error handling for network failures

### Medium Priority
1. Improve loading states for async operations
2. Add confirmation dialogs for destructive actions

### Low Priority
1. Consider adding keyboard navigation support
2. Optimize image loading for better performance
```

### Section 8: Environment

```markdown
## Test Environment

- **Browser:** Chromium (Playwright)
- **Viewport:** 1280x720
- **Mode:** Headed
- **Wallet Extension:** Rabby (if Web3)
- **Network:** [Network name] (if Web3)
```

## Instructions

### Step 1: Collect Test Results

Review all test outcomes:
- Which tests passed
- Which tests failed (with error details)
- Which tests were skipped

### Step 2: Gather Screenshots

List available screenshots:
```bash
ls -la ./test-output/screenshots/
```

### Step 3: Write Report

Create the report file:

```bash
cat > ./test-output/test-report.md << 'EOF'
# Test Report

**Date:** $(date "+%Y-%m-%d %H:%M")
**Project:** [Project Name]
**URL:** [URL]
**Is Web3 DApp:** YES/NO

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Tests | X |
| Passed | X |
| Failed | X |
| Pass Rate | X% |

## Test Results

[Detailed results here]

## Issues Found

[Issues here]

## Recommendations

[Recommendations here]
EOF
```

### Step 4: Verify Report

Check that report is complete:
- All tests documented
- Screenshots referenced correctly
- Issues clearly described
- Recommendations provided

## Output

Report saved to: `./test-output/test-report.md`

## Related Skills

- **web-test** - Run tests before generating report
- **web-test-cleanup** - Clean up after report is saved

## Next Steps

After generating report:
1. Review the report for completeness
2. Run **web-test-cleanup** with `--keep-data` to preserve report
3. Share report with stakeholders

## Notes

- Generate report BEFORE cleanup to ensure screenshots are available
- Use relative paths for screenshot references
- Include all tests, even skipped ones
- Be specific about failure reasons and reproduction steps
- Recommendations should be actionable
