---
name: web-app-testing
description: Comprehensive web app testing with Playwright ensuring 100% UI coverage. Automatically crawls entire web app, analyzes implementation code, captures ALL interactive elements, interacts with EVERY element to reveal hidden UI states, runs comprehensive quality checklist (Deployment, Code Quality, UX, SEO, Function & Layout), and provides concise UI/UX designer review. Generates reports with checklist results and actionable fixes.
license: MIT
compatibility: Python 3.10+, Playwright, Pillow, PyYAML
metadata:
  author: Yi Liao
  version: 0.0.1
allowed-tools: Bash Read Write Glob
---

# Playwright Web Testing

Advanced automated web application testing with Playwright. Automatically discover all pages and interactive elements in your web app, analyzed the implementation code to ensure no UI screens are missed. Capture screenshots with visual regression testing, simulate devices(mobile on iphone 15), perform interactive actions, and generate comprehensive reports with network analysis and code coverage.

## 🎯 Interactive Element Types

**Reference**: See [references/ELEMENT-TYPES.md](references/ELEMENT-TYPES.md) for complete element type definitions, selectors, and test actions.

This skill discovers and tests ALL these interactive element types:

1. **Buttons** - `<button>`, `[role="button"]`, `[onclick]`, input buttons, submit buttons, class-based buttons
2. **Links** - `<a href>` elements (excluding anchors and javascript:)
3. **Checkboxes** - `input[type="checkbox"]` with check/uncheck actions and state tracking
4. **Radio Buttons** - `input[type="radio"]` with automatic selection testing
5. **Select Dropdowns** - `<select>` with option testing (tests up to 3 options per dropdown)
6. **Text Inputs** - text, email, password, search, tel, url, and generic inputs, plus textareas
7. **Tabs** - `[role="tab"]`, `.tab`, `[class*="tab"]` elements
8. **Accordions** - `<details><summary>`, `[aria-expanded]`, `.accordion` elements
9. **Toggles/Switches** - `[role="switch"]`, `.toggle`, `.switch` elements
10. **Modal Triggers** - `[data-toggle="modal"]`, `[aria-haspopup="dialog"]` elements
11. **Menu Items** - `[role="menuitem"]`, `.menu-item` elements

Each element type is:
- ✅ Automatically discovered on every page
- ✅ Tested with appropriate interactions (click, check, select, fill)
- ✅ Captured with before/after screenshots (when enabled)
- ✅ Tracked for UI coverage reporting
- ✅ Matched against source code for gap detection


## Quick Start

Ask me to comprehensively test your web app:
- "Crawl my web app, test everything, run checklist, and provide design feedback"
- "analyzed the implementation code and captured every animation frame or UI"
- "Interact with aLL 11+ element types (buttons, links, checkboxes, radios, dropdowns,
   inputs, tabs, accordions, toggles, modals, menus), take screenshots of each UI state, and provide detailed UX/design review"
- "Test with picky designer review - no UI detail left unexamined"
- "Run comprehensive quality checks: deployment, code quality, UX, SEO, and functionality"


# Frontend UI Review Checklist

**Reference**: See [references/CHECKLIST.md](references/CHECKLIST.md) for the complete comprehensive checklist covering:

- ✅ **UX & Error Handling** - Loading states, error messages, analytics, naming, error handling
- ✅ **SEO** - Title tags, meta descriptions, Open Graph, favicon, semantic HTML
- ✅ **Function & Layout** - Interactive elements, forms, keyboard/touch, spacing, dark mode, branding, tooltips, alignment
- ✅ **Accessibility** - Contrast ratios, focus indicators, alt text, ARIA labels
- ✅ **Performance** - Image optimization, bundle size, rendering, debouncing

---

## 🎨 Claude Design Review (Post-Test)

### Overview
Leverage Claude for comprehensive pixel-perfect design analysis using post-test screenshots. This automated review process identifies critical design issues and ensures visual consistency across your application.

### Review Process

1. **Screenshot Capture** - Automated screenshot collection during testing
2. **JSON Export** - Screenshots saved to `screenshots_for_review.json`
3. **Claude Analysis** - AI-powered design review with prioritized feedback
4. **Review Report** - Concise feedback file with actionable fixes

### What Claude Reviews

#### **Pixel-Perfect Analysis**
Claude examines every UI detail captured in screenshots:
- **Typography**: Font family, size, weight, line-height, letter-spacing
- **Colors**: Text colors, backgrounds, borders, gradients, contrast ratios
- **Spacing**: Margins, padding, alignment, grid consistency
- **Visual Details**: Shadows, borders, border-radius, hover states, transitions
- **Layout**: Alignment, hierarchy, balance, responsive behavior
- **Accessibility**: Contrast ratios, touch target sizes, readability

#### **Design Element Inspection**

**Typography**
- Font family consistency across components
- Font size hierarchy (headings, body, captions)
- Font weight usage (regular, medium, bold)
- Line-height for readability
- Letter-spacing and text alignment

**Colors**
- Text color contrast against backgrounds
- Brand color consistency
- Interactive state colors (hover, active, disabled)
- Border and divider colors
- Shadow and overlay colors

**Spacing**
- Consistent margin and padding scale
- Alignment (left, center, right, justified)
- Grid system adherence
- Whitespace balance
- Element proximity and grouping

**Visual Details**
- Box shadows (elevation, blur, spread)
- Border styles and widths
- Border-radius consistency
- Transition timing and easing
- Hover and focus states

**Accessibility**
- WCAG contrast ratios (AA/AAA compliance)
- Touch target minimum sizes (44×44px)
- Text readability at various sizes
- Color-blind friendly palettes

### Priority-Focused Feedback

Claude provides **CRITICAL ISSUES ONLY** - focusing on blocking design/UX problems:

#### 🔴 **Critical (Blocking)**
Issues that severely impact usability or accessibility:
- WCAG contrast violations (below 4.5:1 for normal text, 3:1 for large text)
- Broken layouts (overflow, overlapping elements, missing content)
- Interactive elements too small (<44×44px touch targets)
- Illegible text (too small, poor contrast, bad font rendering)
- Major brand inconsistencies

#### ⚠️ **High Priority**
Issues that significantly affect user experience:
- Poor contrast (technically passing but borderline)
- Inconsistent spacing across similar components
- Typography inconsistencies (mixed fonts, sizes, weights)
- Misaligned elements
- Inconsistent border-radius or shadows
- UX confusion (unclear affordances, misleading interactions)

#### 💡 **Medium Priority** (Optional)
Nice-to-have improvements:
- Minor spacing tweaks for visual polish
- Subtle color adjustments
- Enhanced micro-interactions

### Feedback Format

Claude provides **specific, actionable fixes** rather than vague observations:

**❌ Avoid**: "Button text is too small"
**✅ Good**: "Button font-size: 16px (currently 12px) - fails touch target minimum"

**❌ Avoid**: "Colors need work"
**✅ Good**: "Insufficient color contrast: #666 on #999 (2.8:1) - needs 4.5:1 minimum. Suggest #444 on #999 (5.2:1)"

**❌ Avoid**: "Spacing seems off"
**✅ Good**: "Card padding: 24px (currently 16px) - inconsistent with sidebar cards which use 24px"

### Design System Consistency

Claude validates consistency across all screens:
- **Typography scale**: Ensures font sizes follow defined scale (e.g., 12px, 14px, 16px, 18px, 24px, 32px)
- **Color palette**: Verifies colors match design system tokens
- **Spacing system**: Checks margins/padding use consistent scale (e.g., 4px, 8px, 16px, 24px, 32px)
- **Component patterns**: Identifies deviations from established patterns

### Implementation Workflow
```bash
# 1. Run tests with screenshot capture
npm run test:e2e -- --screenshot

# 2. Screenshots exported to screenshots_for_review.json

# 3. Submit to Claude for review
# Upload screenshots_for_review.json to Claude

# 4. Claude generates review file
# design_review_feedback.md with prioritized issues

# 5. Address critical issues first
# Fix 🔴 Critical issues before deployment
# Schedule ⚠️ High Priority fixes for next sprint
```

### Review Checklist

| Item | Status | Verification Notes |
|------|--------|-------------------|
| Screenshots captured for all key screens | ☐ | Login, dashboard, forms, modals, empty states, error states |
| JSON export generated successfully | ☐ | `screenshots_for_review.json` created and readable |
| Claude review completed | ☐ | Feedback file received with prioritized issues |
| Critical issues identified | ☐ | All 🔴 Critical items documented |
| High priority issues documented | ☐ | All ⚠️ High Priority items listed |
| Fixes applied and verified | ☐ | Screenshots re-captured to confirm fixes |
| Design system consistency validated | ☐ | Colors, fonts, spacing match design tokens |
| Accessibility requirements met | ☐ | Contrast ratios, touch targets, readability verified |

---

## Notes

Use this checklist during code review and QA phases. Check off items as they're verified, and add specific notes for any issues found or special considerations.

**For Claude Design Review**: Submit your `screenshots_for_review.json` to Claude with the prompt: "Please perform a pixel-perfect design review focusing on critical and high-priority issues only. Provide specific, actionable fixes."


### 🎯 100% UI Coverage Validation
- **Source code analysis** - Parse HTML, JSX, TSX, Vue, and JS files to find ALL UI element types
- **11+ Element Types Detected** - Buttons, links, inputs, textareas, checkboxes, radio buttons, select dropdowns, tabs, accordions, toggles, modal triggers, menu items
- **Compare code vs tests** - Identify untested elements of ANY type
- **Before/after screenshots** - Capture UI state before AND after each interaction (click, fill, select, check, uncheck)
- **Comprehensive interaction testing** - Clicks, checks, unchecks, selects, fills - all tested automatically
- **Coverage reports** - Detailed JSON and HTML reports showing tested vs untested elements by type
- **Full coverage mode** - Automatically test EVERY interactive element found in source code
- **Gap detection** - Highlight UI elements implemented in code but not tested
- **Coverage percentage** - Calculate exact % of UI elements covered by tests
- **Detailed untested list** - Shows element type, file path, line number, selector, and text for each untested element
- **Framework support** - Works with React, Vue, Angular, and vanilla JS/HTML
- **Smart selector detection** - Uses id, data-testid, name, class, and element type for reliable testing

### Visual Regression Testing
- Compare screenshots against baseline images
- Automatically detect visual differences
- Generate diff images with red highlights
- Track similarity percentages

### Parallel Test Execution
- Run multiple tests concurrently
- Configurable worker count (1-10+)
- Faster test completion for large test suites

### Interactive Actions
- **Click** - Buttons, links, tabs, accordions, toggles, modal triggers, menu items
- **Check/Uncheck** - Checkboxes with state management
- **Select** - Radio buttons with automatic selection
- **Fill** - Text inputs, email, password, search, tel, URL fields, textareas
- **Select options** - Dropdown menus with multiple option testing
- **Hover** - Mouse hover over elements
- **Press keys** - Keyboard interactions
- **Scroll** - Page scrolling and element scrolling
- **Wait** - Smart waits for conditions and animations
- **Execute complex workflows** - Multi-step user journeys

### Configuration Files
- Load test configuration from JSON or YAML
- Define routes, actions, and settings in files
- Easy test suite management

### Device Emulation
- iPhone (13, 13 Pro, 13 Pro Max)
- iPad (Air, Pro)
- Android (Pixel 5, Galaxy S21)
- Desktop presets (1080p, 1440p)

### Screenshot Formats
- PNG (default, lossless)

## Instructions

When you ask me to test your web app, I will:

### Automated Testing & Quality Assurance Workflow

1. **Setup & Analysis**
   - Create test script with your configuration
   - Analyze source code to find ALL UI elements (11+ types)
   - Compare code implementation vs existing tests to identify gaps

2. **Comprehensive Testing**
   - Auto-discover all pages and routes
   - Interact with EVERY element to reveal hidden UI states
   - Capture before/after screenshots with operation behavior
   - Test buttons, forms, modals, dropdowns, tabs, accordions, toggles, etc.
   - Document every interaction performed

3. **Quality Checklist Validation**
   - Run comprehensive checklist covering:
     - Deployment (analytics, env vars, no sensitive data)
     - Code Quality (linting, tests, naming, error handling)
     - UX (loading states, error messages)
     - SEO (title, meta, Open Graph, favicon)
     - Function & Layout (all interactions, validation, keyboard/touch, spacing, typography, dark mode, branding, tooltips, alignment, scroll bars)

4. **Picky Designer Review** (Automatic)
   - Read `screenshots_for_review.json`
   - Load and analyze screenshots as a picky UI/UX designer
   - **Focus on critical issues only** - Skip minor/cosmetic problems
   - **Simple, concise feedback** - Brief bullet points with actionable fixes
   - Identify: accessibility violations, broken layouts, UX failures, critical design problems
   - Save concise review to `design_review.md`

5. **Generate Reports**
   - HTML test report with visual results and checklist results
   - UI coverage report (JSON) showing tested vs untested elements
   - Design review document with critical issues and actionable fixes (concise format)

**Everything happens automatically - you just provide the URL!**

### Basic Usage

1. Tell me your web app URL (e.g., http://localhost:3000)
2. Specify source directory for code analysis, ask if you don't have 
3. I'll run comprehensive tests, quality checklist, and design review
4. Check the generated reports under test_result dirtory: HTML report + UI coverage + design review

### Advanced Usage

**Complete Test Suite with Screenshot Capture:**
```bash
python test_runner.py --url http://localhost:3000 --auto-discover --source-dir ./src --ui-coverage --before-after --parallel 4
```

**100% UI Coverage Validation (Analyze Source Code):**
```bash
python test_runner.py --url http://localhost:3000 --source-dir ./src --ui-coverage --before-after
```

**Auto-Discovery + UI Coverage:**
```bash
python test_runner.py --url http://localhost:3000 --auto-discover --source-dir ./src --ui-coverage --before-after
```

**Auto-Discovery Mode (Crawl Entire App):**
```bash
python test_runner.py --url http://localhost:3000 --auto-discover --max-depth 3 --max-pages 100
```

**Auto-Discovery with Visual Regression:**
```bash
python test_runner.py --url http://localhost:3000 --auto-discover --baseline ./baselines --parallel 4
```

**Ultimate Test Suite (ALL Features):**
```bash
python test_runner.py --url http://localhost:3000 --source-dir ./src --auto-discover --ui-coverage --before-after --baseline ./baselines --video --network-logs --parallel 4
```

**Visual Regression Testing:**
```bash
python test_runner.py --url http://localhost:3000 --baseline ./baselines
```

**Parallel Execution:**
```bash
python test_runner.py --config test_config.yaml --parallel 4
```

**Device Testing:**
```bash
python test_runner.py --url http://localhost:3000 --device iphone_13
```

**Network Logging:**
```bash
python test_runner.py --url http://localhost:3000 --network-logs --video
```

**Configuration File:**
```yaml
base_url: "http://localhost:3000"
output_dir: "test_results"
baseline_dir: "baselines"
screenshot_format: "png"
enable_video: true
enable_network_logs: true
enable_coverage: true
device: "iphone_13"
max_parallel: 3

# Auto-discovery settings
auto_discover: true
max_depth: 3
max_pages: 100

# UI Coverage settings
source_dir: "./src"
enable_ui_coverage: true
before_after_screenshots: true

routes:
  - route: "/"
    name: "home"
    description: "Homepage"

  - route: "/login"
    name: "login"
    description: "Login page"
    actions:
      - type: "fill"
        selector: "#username"
        value: "testuser"
      - type: "fill"
        selector: "#password"
        value: "testpass"
      - type: "click"
        selector: "#login-button"
      - type: "wait"
        ms: 2000
```

## CLI Arguments

```
--config, -c        Config file (JSON or YAML)
--url              Base URL to test
--output, -o       Output directory (default: test_results)
--baseline, -b     Baseline directory for visual regression
--format, -f       Screenshot format: png, jpeg, webp
--video            Enable video recording
--network-logs     Enable network logging
--coverage         Enable code coverage tracking
--device, -d       Device preset (use --list-devices to see all)
--network, -n      Network preset (use --list-networks to see all)
--parallel, -p     Max parallel tests (default: 1)
--auto-discover    Automatically discover all pages and interactive elements
--max-depth        Max crawl depth for auto-discovery (default: 3)
--max-pages        Max pages to discover (default: 100)
--source-dir          Source code directory for UI coverage analysis
--ui-coverage         Enable UI coverage validation - compare code vs tests
--before-after        Take before/after screenshots for each interaction
--list-devices        List available device presets
--list-networks    List available network presets
```

## What I'll Generate

### Test Artifacts
- Full-page screenshots of all pages and interactive states
- **Before/after screenshots** with operation behavior documentation
- **Screenshots JSON file** (`screenshots_for_review.json`)
- Visual diff images (when baseline exists)
- Video recordings (when enabled)
- Network logs with request/response tracking

### Reports & Analysis
- **HTML Test Report** - Visual results, network data, UI coverage section
- **UI Coverage Report (JSON)** - Tested vs untested elements by type with file locations
- **Design Review (design_review.md)** - Critical UI/UX issues only, concise and actionable
- **Quality Checklist Report** - Comprehensive checklist results covering:
  - ✅ **Deployment** - Analytics, feature flags, environment variables, no sensitive data exposed
  - ✅ **Code Quality** - Linting, unit tests, no hardcoded secrets, meaningful naming, reusable components, error handling
  - ✅ **UX** - Loading states, error messages, graceful error handling
  - ✅ **SEO** - Title tags, meta descriptions, Open Graph tags, favicon, canonical links
  - ✅ **Function & Layout** - All interactions work, form validation, keyboard/touch support, no overflow, consistent spacing/typography/colors, dark mode, branding, data accuracy, sticky elements, zoom behavior, tooltips, component states, alignment, scroll bars

### Coverage & Insights
- **100% UI Coverage Validation** - Compare source code against actual tests
- **Detailed untested elements table** - Element type, file paths, line numbers, selectors
- **Summary statistics** - Success/failure rates, coverage percentages by element type
- **Complete interaction test results** - ALL element types tested (buttons, checkboxes, radios, dropdowns, tabs, accordions, toggles, inputs, modals, menu items, etc.)

## Comprehensive Quality Assurance Process

### 1. 100% UI Coverage (No Screens Missed)
- **Source code analysis** - Parse all HTML/JSX/TSX/Vue files to find UI elements
- **Compare code vs tests** - Identify gaps between implementation and testing
- **Interactive element discovery** - Auto-discover 11+ element types on every page
- **Interact to reveal UI** - Click buttons, open modals, expand accordions, toggle switches to reveal hidden UI states
- **Comprehensive coverage** - Ensure every UI screen is captured and tested

### 2. Screenshot Report with Operation Behavior
- **Before/after screenshots** for every interaction (click, check, uncheck, fill, select, toggle, expand)
- **Operation documentation** - Each screenshot annotated with action performed
- **Full-page captures** - Complete page state before and after each interaction
- **All interactive states** - Modals, dropdowns, tabs, accordions, tooltips, hover states

### 3. Picky Designer Review (Automatic)
After tests complete, I automatically review screenshots as a picky UI/UX designer:
- **CRITICAL ISSUES ONLY** - Focus on blocking problems that need immediate fixes
- **Concise format** - Brief bullet points, no verbose explanations
- 🔴 **Critical**: Accessibility violations, broken layouts, major UX failures
- ⚠️ **High Priority**: Important issues that significantly impact users
- **Skip minor issues** - No cosmetic nitpicks or nice-to-haves
- **Design feedback saved to `design_review.md`** with actionable fixes only

### 4. Comprehensive Quality Checklist
I automatically run and report on the following checklist:

#### Deployment Checklist
- ✅ Vercel/Google Analytics enabled on code & platform
- ✅ Feature flags toggled correctly (if used)
- ✅ Environment variables configured for staging/prod
- ✅ No sensitive info/spam/test/error logs exposed in front-end

#### Code Quality Checklist
- ✅ Code Quality check (Prettier & ESLint)
- ✅ Unit tests for critical logic
- ✅ No hardcoded constants (API keys, third-party endpoints)
- ✅ Meaningful naming for files, components, variables
- ✅ Components small and reusable where possible
- ✅ Network errors/Abort requests handled gracefully

#### UX Checklist
- ✅ API calls have loading UI
- ✅ API errors have user-friendly messages
- ✅ All interactions provide appropriate feedback

#### SEO Checklist
- ✅ `<title>` tag set
- ✅ Meta description
- ✅ Open Graph tags (title, description, image)
- ✅ Favicon included
- ✅ Correct canonical link (if needed)

#### Function & Layout Checklist
- ✅ All buttons, links, forms, modals, popovers, dropdowns behave correctly
- ✅ Form validation triggered correctly
- ✅ Basic keyboard & touch area interactions work
- ✅ No unintended overflow horizontally or vertically
- ✅ Consistent and proper spacing, element size, element radius, typography, colors
- ✅ Dark mode supported (if applicable)
- ✅ Branding included
- ✅ Data/Calculation correct
- ✅ Sticky headers/footers behave properly
- ✅ Zoom behavior correct
- ✅ Tooltips content display proper location and concise/formal content
- ✅ Interactive components have right default state and corner cases work fine
- ✅ Concise title/description
- ✅ Title and content matched
- ✅ Element vertical/horizontal alignment correct
- ✅ Hide browser default scroll bar

## Requirements

Packages must be installed in your environment:
```bash
pip install playwright Pillow PyYAML
playwright install chromium
```

No API keys required! Claude (in your current session) reviews screenshots after test completion.

I'll help you install these if needed.

## Examples

See [EXAMPLES.md](EXAMPLES.md) for common usage patterns including:
- Visual regression testing workflows
- Interactive form testing
- Mobile device testing
- Parallel test execution
- Network throttling scenarios

For detailed configuration options and advanced features, see [GUIDE.md](GUIDE.md).
