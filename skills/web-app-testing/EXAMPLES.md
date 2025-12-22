# Playwright Web Testing Examples - Enhanced Edition

## Table of Contents

1. [Auto-Discovery Mode](#auto-discovery-mode)
2. [Basic Examples](#basic-examples)
3. [Visual Regression Testing](#visual-regression-testing)
4. [Interactive Actions](#interactive-actions)
5. [Device Testing](#device-testing)
6. [Parallel Execution](#parallel-execution)
7. [Network Testing](#network-testing)
8. [Advanced Workflows](#advanced-workflows)

## Auto-Discovery Mode

### Complete Auto-Discovery

Automatically crawl your entire web app and test all pages and interactive elements:

```bash
# Basic auto-discovery
python test_runner.py --url http://localhost:3000 --auto-discover

# With depth and page limits
python test_runner.py --url http://localhost:3000 --auto-discover --max-depth 3 --max-pages 100

# With visual regression
python test_runner.py --url http://localhost:3000 --auto-discover --baseline ./baselines --parallel 4

# With coverage tracking
python test_runner.py --url http://localhost:3000 --auto-discover --coverage --network-logs
```

### Auto-Discovery with Manual Routes

Combine auto-discovery with manually specified critical routes:

```yaml
base_url: "http://localhost:3000"
auto_discover: true
max_depth: 2
max_pages: 50
baseline_dir: "./baselines"

# Critical routes tested first (before auto-discovery)
routes:
  - route: "/"
    name: "homepage_critical"
    description: "Critical homepage test"
    wait_for: ".hero-loaded"

  - route: "/checkout"
    name: "checkout_critical"
    description: "Critical checkout flow"
    wait_for: ".payment-form"
```

### Shallow Crawl (Quick Test)

Quick scan of main pages only:

```bash
python test_runner.py --url http://localhost:3000 --auto-discover --max-depth 1 --max-pages 20
```

**What it discovers:**
- Homepage
- All first-level links from homepage
- Buttons and forms on homepage
- No deeper navigation

### Deep Crawl (Comprehensive Test)

Comprehensive test of entire application:

```bash
python test_runner.py --url http://localhost:3000 --auto-discover --max-depth 5 --max-pages 500 --parallel 6
```

**What it discovers:**
- All pages up to 5 levels deep
- Up to 500 unique pages
- All buttons and clickable elements (up to 10 per page)
- All forms with auto-filled test data
- Tests run in parallel with 6 workers

### Auto-Discovery with Device Testing

Test mobile responsiveness across your entire app:

```bash
# iPhone testing
python test_runner.py --url http://localhost:3000 --auto-discover --device iphone_13 --max-pages 50

# iPad testing
python test_runner.py --url http://localhost:3000 --auto-discover --device ipad_air --max-pages 50

# Desktop testing
python test_runner.py --url http://localhost:3000 --auto-discover --device desktop_1080p --max-pages 50
```

### Auto-Discovery Output

After running auto-discovery, you'll see:

```
🤖 AUTO-DISCOVERY MODE ENABLED
Max depth: 3, Max pages: 100

  🔍 Crawling: http://localhost:3000 (depth: 0)
    Found 12 interactive elements
    Found 2 forms
    Found 15 new links to explore
    🔍 Crawling: http://localhost:3000/about (depth: 1)
      Found 5 interactive elements
      Found 1 forms
      Found 8 new links to explore
    ...

✓ Discovery complete! Found 47 routes/states

🚀 Starting tests for: http://localhost:3000
Testing 47 routes...
```

### What Gets Tested

**Pages discovered:**
- All internal links (same domain)
- Query parameters preserved
- Fragment identifiers removed

**Interactive elements tested:**
- Buttons (`<button>`, `[role="button"]`)
- Submit inputs
- Elements with `onclick` handlers
- Elements with class names containing "button"

**Forms tested:**
- All input fields filled with appropriate test data:
  - Email fields → `test@example.com`
  - Password fields → `TestPassword123!`
  - Names → `John Doe`
  - Phone → `555-0123`
  - Numbers → `25`
  - URLs → `https://example.com`
  - Dates → `2024-01-01`

**Skipped patterns:**
- File downloads (.pdf, .zip, etc.)
- Images (.jpg, .png, .svg)
- Logout/signout links
- Delete actions
- External links
- `mailto:` and `tel:` links

## Basic Examples

### Simple Website

Test a basic website with static pages:

```yaml
base_url: "http://localhost:3000"
routes:
  - route: "/"
    name: "home"
    description: "Homepage"

  - route: "/about"
    name: "about"
    description: "About page"

  - route: "/contact"
    name: "contact"
    description: "Contact form"
```

### Dashboard Application

Test an authenticated dashboard with dynamic content:

```yaml
base_url: "http://localhost:3000"
routes:
  - route: "/login"
    name: "login"
    description: "Login screen"

  - route: "/dashboard"
    name: "dashboard"
    description: "Main dashboard"
    wait_for: ".dashboard-loaded"

  - route: "/analytics"
    name: "analytics"
    description: "Analytics view"
    wait_for: "canvas"

  - route: "/settings"
    name: "settings"
    description: "Settings page"
```

## Visual Regression Testing

### Basic Visual Regression

Create baselines and detect changes:

```yaml
base_url: "http://localhost:3000"
baseline_dir: "./baselines"
screenshot_format: "png"

routes:
  - route: "/"
    name: "homepage"
    wait_for: ".hero-section"

  - route: "/products"
    name: "products"
    wait_for: ".product-grid"
```

**First run:**
```bash
python test_runner.py --config visual_test.yaml
# Creates baseline images
```

**Subsequent runs:**
```bash
python test_runner.py --config visual_test.yaml
# Compares against baselines, generates diff images
```

### Multi-Environment Visual Testing

Test staging vs production:

```yaml
# staging_test.yaml
base_url: "https://staging.example.com"
baseline_dir: "./baselines/staging"
output_dir: "./results/staging"

routes:
  - route: "/"
    name: "home"
  - route: "/pricing"
    name: "pricing"
```

```yaml
# production_test.yaml
base_url: "https://example.com"
baseline_dir: "./baselines/production"
output_dir: "./results/production"

routes:
  - route: "/"
    name: "home"
  - route: "/pricing"
    name: "pricing"
```

## Interactive Actions

### Login Flow

Test complete login workflow:

```yaml
base_url: "http://localhost:3000"
enable_video: true

routes:
  - route: "/login"
    name: "login_empty"
    description: "Empty login form"

  - route: "/login"
    name: "login_filled"
    description: "Filled login form"
    actions:
      - type: "fill"
        selector: "#email"
        value: "test@example.com"
      - type: "fill"
        selector: "#password"
        value: "testpassword"

  - route: "/login"
    name: "login_submitted"
    description: "After login submission"
    actions:
      - type: "fill"
        selector: "#email"
        value: "test@example.com"
      - type: "fill"
        selector: "#password"
        value: "testpassword"
      - type: "click"
        selector: "#login-button"
      - type: "wait"
        ms: 2000
```

### Form Interactions

Test complex form with multiple input types:

```yaml
routes:
  - route: "/signup"
    name: "signup_complete"
    description: "Completed signup form"
    actions:
      - type: "fill"
        selector: "#name"
        value: "John Doe"

      - type: "fill"
        selector: "#email"
        value: "john@example.com"

      - type: "select"
        selector: "#country"
        value: "USA"

      - type: "click"
        selector: "#terms-checkbox"

      - type: "scroll_to"
        selector: "#submit-button"

      - type: "wait"
        ms: 500
```

### Dropdown and Modal Interactions

```yaml
routes:
  - route: "/dashboard"
    name: "dropdown_menu"
    description: "Opened dropdown menu"
    wait_for: ".dashboard-loaded"
    actions:
      - type: "click"
        selector: "#user-menu-button"
      - type: "wait"
        ms: 300

  - route: "/products"
    name: "filter_modal"
    description: "Filter modal opened"
    actions:
      - type: "click"
        selector: "#filter-button"
      - type: "wait"
        ms: 500
      - type: "fill"
        selector: "#search-filter"
        value: "laptop"
```

### Keyboard Interactions

```yaml
routes:
  - route: "/search"
    name: "search_with_keyboard"
    description: "Search using keyboard"
    actions:
      - type: "fill"
        selector: "#search-input"
        value: "playwright testing"

      - type: "press"
        selector: "#search-input"
        key: "Enter"

      - type: "wait"
        ms: 1500
```

## Device Testing

### Mobile Testing (iPhone)

```yaml
base_url: "http://localhost:3000"
device: "iphone_13"
screenshot_format: "png"

routes:
  - route: "/"
    name: "mobile_home"
    description: "Mobile homepage"

  - route: "/menu"
    name: "mobile_menu"
    description: "Mobile navigation menu"
    actions:
      - type: "click"
        selector: "#hamburger-menu"
      - type: "wait"
        ms: 300
```

**CLI:**
```bash
python test_runner.py --url http://localhost:3000 --device iphone_13
```

### Tablet Testing (iPad)

```yaml
base_url: "http://localhost:3000"
device: "ipad_pro"

routes:
  - route: "/"
    name: "tablet_home"

  - route: "/dashboard"
    name: "tablet_dashboard"
    wait_for: ".dashboard-loaded"
```

### Multi-Device Testing

Test across multiple devices:

```bash
# Test on iPhone
python test_runner.py --config test.yaml --device iphone_13 --output results/iphone

# Test on iPad
python test_runner.py --config test.yaml --device ipad_air --output results/ipad

# Test on Desktop
python test_runner.py --config test.yaml --device desktop_1080p --output results/desktop
```

### Responsive Breakpoints

```yaml
# Create separate configs for each breakpoint
# mobile.yaml
device: "iphone_13"
output_dir: "./results/mobile"
baseline_dir: "./baselines/mobile"

# tablet.yaml
device: "ipad_air"
output_dir: "./results/tablet"
baseline_dir: "./baselines/tablet"

# desktop.yaml
device: "desktop_1080p"
output_dir: "./results/desktop"
baseline_dir: "./baselines/desktop"
```

## Parallel Execution

### Fast Test Execution

Run tests in parallel for speed:

```yaml
base_url: "http://localhost:3000"
max_parallel: 4

routes:
  # 20 routes will execute 4 at a time
  - route: "/"
    name: "home"
  - route: "/about"
    name: "about"
  - route: "/products"
    name: "products"
  - route: "/product/1"
    name: "product_1"
  - route: "/product/2"
    name: "product_2"
  # ... 15 more routes
```

**CLI:**
```bash
# 10 routes × 3 seconds = 30s sequential
# 10 routes ÷ 4 workers × 3s = ~8s parallel
python test_runner.py --config test.yaml --parallel 4
```

### Large Test Suite

```yaml
base_url: "http://localhost:3000"
max_parallel: 6
screenshot_format: "jpeg"  # Smaller files for large suite

routes:
  # E-commerce site with 100+ pages
  - route: "/"
    name: "homepage"
  # ... product pages
  - route: "/products"
    name: "all_products"
  - route: "/products/category/electronics"
    name: "electronics"
  # ... 100 more routes
```

## Network Testing

### Network Logging

Track all network requests:

```yaml
base_url: "http://localhost:3000"
enable_network_logs: true
output_dir: "./results"

routes:
  - route: "/dashboard"
    name: "dashboard"
    description: "Dashboard with API calls"
    wait_for: ".data-loaded"
```

**Results:**
- JSON report includes all requests/responses
- HTML report shows failed requests
- Useful for debugging API issues

### Slow Network Testing

Test with 3G speeds:

```yaml
base_url: "http://localhost:3000"
network: "slow_3g"
enable_video: true  # Record slow loading

routes:
  - route: "/"
    name: "home_slow_3g"
    wait_for: ".page-loaded"

  - route: "/products"
    name: "products_slow_3g"
    wait_for: ".product-grid"
```

**CLI:**
```bash
python test_runner.py --url http://localhost:3000 --network slow_3g --video
```

### Offline Testing

Test offline functionality:

```yaml
base_url: "http://localhost:3000"
network: "offline"
enable_network_logs: true

routes:
  - route: "/"
    name: "offline_home"
    description: "Homepage in offline mode"

  - route: "/cached-page"
    name: "cached_page"
    description: "Service worker cached page"
```

### Network Performance Comparison

```bash
# Test with different network speeds
python test_runner.py --config test.yaml --network fast_4g --output results/4g
python test_runner.py --config test.yaml --network slow_3g --output results/3g
python test_runner.py --config test.yaml --output results/normal

# Compare load times in JSON reports
```

## Advanced Workflows

### E-commerce Checkout Flow

```yaml
base_url: "http://localhost:3000"
enable_video: true
enable_network_logs: true
screenshot_format: "png"

routes:
  - route: "/"
    name: "homepage"
    wait_for: ".hero-section"

  - route: "/products"
    name: "product_list"
    wait_for: ".product-grid"

  - route: "/product/1"
    name: "product_detail"
    actions:
      - type: "scroll_to"
        selector: "#add-to-cart"
      - type: "wait"
        ms: 500

  - route: "/product/1"
    name: "add_to_cart"
    actions:
      - type: "click"
        selector: "#add-to-cart"
      - type: "wait"
        ms: 1000

  - route: "/cart"
    name: "shopping_cart"
    wait_for: ".cart-items"

  - route: "/checkout"
    name: "checkout_empty"

  - route: "/checkout"
    name: "checkout_filled"
    actions:
      - type: "fill"
        selector: "#email"
        value: "test@example.com"
      - type: "fill"
        selector: "#address"
        value: "123 Test St"
      - type: "fill"
        selector: "#city"
        value: "Test City"
      - type: "scroll_to"
        selector: "#payment"
```

### Blog/CMS Content Testing

```yaml
base_url: "http://localhost:3000"
baseline_dir: "./baselines"
max_parallel: 3

routes:
  - route: "/"
    name: "blog_home"
    wait_for: ".post-list"

  - route: "/posts"
    name: "all_posts"
    wait_for: ".post-grid"

  - route: "/post/getting-started"
    name: "post_1"
    wait_for: "article"
    actions:
      - type: "scroll"
        x: 0
        y: 500
      - type: "wait"
        ms: 300

  - route: "/admin"
    name: "admin_login"

  - route: "/admin"
    name: "admin_dashboard"
    actions:
      - type: "fill"
        selector: "#username"
        value: "admin"
      - type: "fill"
        selector: "#password"
        value: "admin123"
      - type: "click"
        selector: "#login"
      - type: "wait"
        ms: 2000
```

### SaaS Application Testing

```yaml
base_url: "http://localhost:3000"
device: "desktop_1080p"
enable_video: true
enable_network_logs: true
max_parallel: 2
baseline_dir: "./baselines"

routes:
  # Public pages
  - route: "/"
    name: "landing"
    wait_for: ".hero"

  - route: "/pricing"
    name: "pricing"

  - route: "/features"
    name: "features"
    actions:
      - type: "scroll"
        x: 0
        y: 1000
      - type: "wait"
        ms: 500

  # App pages (after login)
  - route: "/app/dashboard"
    name: "app_dashboard"
    wait_for: ".app-loaded"

  - route: "/app/projects"
    name: "projects_list"
    wait_for: ".project-grid"

  - route: "/app/projects/new"
    name: "new_project"

  - route: "/app/projects/new"
    name: "create_project"
    actions:
      - type: "fill"
        selector: "#project-name"
        value: "Test Project"
      - type: "fill"
        selector: "#description"
        value: "Test description"
      - type: "wait"
        ms: 500

  - route: "/app/settings"
    name: "settings"
    wait_for: ".settings-form"

  - route: "/app/settings"
    name: "settings_profile_tab"
    actions:
      - type: "click"
        selector: "#profile-tab"
      - type: "wait"
        ms: 300
```

### Multi-Language Testing

```yaml
# english.yaml
base_url: "http://localhost:3000"
output_dir: "./results/en"
baseline_dir: "./baselines/en"

routes:
  - route: "/?lang=en"
    name: "home_en"
  - route: "/about?lang=en"
    name: "about_en"

# spanish.yaml
base_url: "http://localhost:3000"
output_dir: "./results/es"
baseline_dir: "./baselines/es"

routes:
  - route: "/?lang=es"
    name: "home_es"
  - route: "/about?lang=es"
    name: "about_es"
```

### CI/CD Integration Example

```yaml
# ci_test.yaml - Optimized for CI/CD
base_url: "http://localhost:3000"
output_dir: "./ci_results"
baseline_dir: "./ci_baselines"
screenshot_format: "jpeg"  # Smaller files
max_parallel: 4  # Fast execution
enable_network_logs: true  # Debug failures

routes:
  - route: "/"
    name: "home"
    wait_for: ".page-loaded"

  - route: "/critical-path-1"
    name: "critical_1"
    wait_for: ".loaded"

  - route: "/critical-path-2"
    name: "critical_2"
    wait_for: ".loaded"
```

**GitHub Actions example:**
```yaml
- name: Run Playwright Tests
  run: |
    python test_runner.py --config ci_test.yaml

- name: Upload Screenshots
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-screenshots
    path: ci_results/
```

### Performance Monitoring

```yaml
base_url: "http://localhost:3000"
enable_network_logs: true
screenshot_format: "png"
output_dir: "./performance_results"

routes:
  - route: "/"
    name: "home_normal"
    description: "Normal network"

  - route: "/"
    name: "home_slow"
    description: "Slow 3G network"
    # Run with: --network slow_3g

  - route: "/heavy-page"
    name: "heavy_normal"
    wait_for: ".content-loaded"

  - route: "/heavy-page"
    name: "heavy_slow"
    wait_for: ".content-loaded"
    # Run with: --network slow_3g
```

Run comparison:
```bash
python test_runner.py --config perf.yaml --output results/normal
python test_runner.py --config perf.yaml --network slow_3g --output results/slow
```
