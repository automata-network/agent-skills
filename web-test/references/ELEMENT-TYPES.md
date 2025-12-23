# Interactive Element Types Reference

This document defines the standard interactive element types tested across all frontend-testing tools. Use this as the canonical reference for element discovery and testing strategies.

---

## Element Type Definitions

### 1. Buttons

**Selectors:**
- `<button>`
- `[role="button"]`
- `[onclick]`
- `input[type="button"]`
- `input[type="submit"]`
- `input[type="reset"]`
- `[class*="btn"]` (class-based buttons)

**Test Actions:**
- Click
- Verify enabled/disabled state
- Check aria-label or text content
- Verify click triggers expected action

**Example:**
```html
<button class="btn-primary">Submit</button>
<div role="button" onclick="handleClick()">Click Me</div>
```

---

### 2. Links

**Selectors:**
- `<a href>` (excluding `href="#"` and `href="javascript:"`)

**Test Actions:**
- Click to navigate
- Verify target URL is valid (not 404)
- Check opens in correct target (_blank, _self)
- Verify aria-label for icon-only links

**Example:**
```html
<a href="/about">About Us</a>
<a href="https://example.com" target="_blank">External Link</a>
```

---

### 3. Checkboxes

**Selectors:**
- `input[type="checkbox"]`

**Test Actions:**
- Check (set to checked state)
- Uncheck (set to unchecked state)
- Verify state tracking
- Test with associated label
- Verify onChange handlers fire

**Example:**
```html
<input type="checkbox" id="agree" />
<label for="agree">I agree to terms</label>
```

---

### 4. Radio Buttons

**Selectors:**
- `input[type="radio"]`

**Test Actions:**
- Select each option in radio group
- Verify only one selected at a time
- Test with associated label
- Verify onChange handlers fire

**Example:**
```html
<input type="radio" name="size" value="small" id="small" />
<label for="small">Small</label>
<input type="radio" name="size" value="large" id="large" />
<label for="large">Large</label>
```

---

### 5. Select Dropdowns

**Selectors:**
- `<select>`

**Test Actions:**
- Click to open dropdown
- Select each option (test up to 3 options per dropdown)
- Verify selected value changes
- Check onChange handlers fire
- Test keyboard navigation (Arrow keys)

**Example:**
```html
<select name="country">
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
  <option value="ca">Canada</option>
</select>
```

---

### 6. Text Inputs

**Selectors:**
- `input[type="text"]`
- `input[type="email"]`
- `input[type="password"]`
- `input[type="search"]`
- `input[type="tel"]`
- `input[type="url"]`
- `input[type="number"]`
- `input` (generic, no type specified)
- `<textarea>`

**Test Actions:**
- Fill with test data
- Verify value updates
- Test validation (email format, required fields)
- Test placeholder visibility
- Test maxlength restrictions
- Verify onInput/onChange handlers

**Example:**
```html
<input type="email" placeholder="Enter email" required />
<textarea placeholder="Your message" maxlength="500"></textarea>
```

---

### 7. Tabs

**Selectors:**
- `[role="tab"]`
- `[class*="tab"]` (e.g., `.tab`, `.tab-item`)
- `<button class="tab">`

**Test Actions:**
- Click each tab
- Verify associated panel becomes visible
- Check aria-selected attribute changes
- Test keyboard navigation (Arrow keys)
- Verify only one tab active at a time

**Example:**
```html
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
<div role="tabpanel">Content 1</div>
```

---

### 8. Accordions

**Selectors:**
- `<details><summary>`
- `[aria-expanded]`
- `[class*="accordion"]`
- `[class*="collapse"]`

**Test Actions:**
- Click to expand
- Click to collapse
- Verify aria-expanded attribute changes
- Check content visibility toggles
- Test keyboard interaction (Enter/Space)

**Example:**
```html
<details>
  <summary>Click to expand</summary>
  <p>Hidden content here</p>
</details>

<div class="accordion-item">
  <button aria-expanded="false">Section 1</button>
  <div class="accordion-content">Content</div>
</div>
```

---

### 9. Toggles/Switches

**Selectors:**
- `[role="switch"]`
- `[class*="toggle"]`
- `[class*="switch"]`
- `input[type="checkbox"]` with switch styling

**Test Actions:**
- Click to toggle on
- Click to toggle off
- Verify aria-checked attribute
- Check visual state change
- Verify onChange handlers

**Example:**
```html
<button role="switch" aria-checked="false">
  Enable notifications
</button>

<label class="switch">
  <input type="checkbox" />
  <span class="slider"></span>
</label>
```

---

### 10. Modal Triggers

**Selectors:**
- `[data-toggle="modal"]`
- `[data-bs-toggle="modal"]` (Bootstrap)
- `[aria-haspopup="dialog"]`
- `[class*="modal-trigger"]`
- Buttons with text like "Open", "Show Modal"

**Test Actions:**
- Click to open modal
- Verify modal becomes visible
- Check aria-hidden changes
- Test Escape key to close
- Verify focus trap within modal
- Test close button

**Example:**
```html
<button data-toggle="modal" data-target="#myModal">
  Open Modal
</button>

<div id="myModal" role="dialog" aria-hidden="true">
  <div class="modal-content">
    <button class="close" aria-label="Close">×</button>
  </div>
</div>
```

---

### 11. Menu Items

**Selectors:**
- `[role="menuitem"]`
- `[class*="menu-item"]`
- `<li>` inside `<ul role="menu">`
- Dropdown menu items

**Test Actions:**
- Click menu item
- Verify action triggers
- Check keyboard navigation (Arrow keys)
- Test nested submenus
- Verify aria-expanded for submenus

**Example:**
```html
<ul role="menu">
  <li role="menuitem">Profile</li>
  <li role="menuitem">Settings</li>
  <li role="menuitem">Logout</li>
</ul>

<div class="dropdown">
  <button class="dropdown-toggle">Menu</button>
  <div class="dropdown-menu">
    <a class="menu-item" href="/profile">Profile</a>
  </div>
</div>
```

---

## Testing Strategy

### Discovery Order
1. **Explicit roles first** - `[role="button"]`, `[role="tab"]`, etc.
2. **Semantic HTML** - `<button>`, `<a>`, `<select>`, etc.
3. **Class-based** - `[class*="btn"]`, `[class*="tab"]`, etc.
4. **Generic with context** - `input`, `textarea`, etc.

### Best Practices
- Test elements in the order they appear in DOM
- Capture before/after screenshots for state changes
- Verify ARIA attributes update correctly
- Test keyboard interactions (Tab, Enter, Space, Arrows)
- Check touch target sizes (44×44px minimum)
- Verify focus states are visible
- Test with assistive technologies when possible

### Coverage Validation
- Compare discovered elements against source code
- Identify untested element types
- Calculate coverage percentage by type
- Report gaps in test coverage

---
