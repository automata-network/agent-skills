# Frontend UI Review Checklist

A comprehensive checklist for reviewing frontend implementations to ensure high-quality user experience, proper SEO, and robust functionality.

---

## UX & Error Handling

| Item | Status | Verification Notes |
|------|--------|-------------------|
| API call has loading UI | ☐ | Loading indicators (spinners, skeletons, progress bars) displayed during async operations |
| API error has user-friendly message | ☐ | Error messages are clear, actionable, and non-technical for end users |
| All key events are tracking correctly | ☐ | Analytics events fire as expected for user interactions |
| No hardcoded constants that should be config/env variables | ☐ | API keys, endpoints, feature flags moved to environment variables |
| Meaningful naming for files, components, and variables | ☐ | Names are descriptive, follow conventions, and indicate purpose |
| Components small and reusable where possible | ☐ | Components follow single responsibility principle and are DRY |
| Network errors/Abort requests handled gracefully | ☐ | Timeout, abort, and network failure scenarios provide feedback |

---

## SEO

| Item | Status | Verification Notes |
|------|--------|-------------------|
| `<title>` tag set | ☐ | Unique, descriptive title for each page (50-60 characters) |
| Meta description | ☐ | Compelling description for each page (150-160 characters) |
| Open Graph tags (title, description, image) | ☐ | Social media preview tags configured correctly |
| Favicon included | ☐ | Favicon files present in all required sizes |
| Correct canonical link (if needed) | ☐ | Canonical URLs set to prevent duplicate content issues |
| Semantic HTML structure | ☐ | Proper heading hierarchy (h1-h6), semantic tags used appropriately |

---

## Function & Layout

| Item | Status | Verification Notes |
|------|--------|-------------------|
| All buttons, links, forms, modals, popovers, dropdowns behave correctly | ☐ | Interactive elements function as expected across scenarios |
| Form validation triggered correctly | ☐ | Client-side validation fires appropriately with clear error messages |
| Basic keyboard & touch area interactions work | ☐ | Tab navigation, Enter/Space keys, minimum 44×44px touch targets |
| No unintended overflow horizontally or vertically | ☐ | Content contained properly, no unexpected scrollbars |
| Consistent and proper spacing, element size, element radius, typography, and colors | ☐ | Design system tokens applied consistently |
| Dark mode supported (if applicable) | ☐ | Theme switching works without visual artifacts |
| Branding included | ☐ | Logo, colors, and brand elements present where appropriate |
| Data/Calculation correct | ☐ | All computed values, aggregations, and transformations are accurate |
| Sticky headers/footers behave properly | ☐ | Fixed/sticky elements don't overlap content or cause layout shift |
| Zoom behavior correct | ☐ | Page remains functional at 200% zoom, text reflows properly |
| Tooltips content display proper location and concise formal content | ☐ | Tooltips positioned correctly, content is brief and professional |
| Interactive component has the right default state and corner cases work fine | ☐ | Initial states correct, edge cases (empty, error, loading) handled |
| Concise title/description | ☐ | Headings and descriptions are clear and to the point |
| Title and content matched | ☐ | Page/section titles accurately reflect the content |
| Element vertical/horizontal alignment correct | ☐ | Visual alignment follows design specs (center, left, right, baseline) |
| Hide browser default scroll bar (if applicable) | ☐ | Custom scrollbar styling applied where needed |

---

## Accessibility Considerations

| Item | Status | Verification Notes |
|------|--------|-------------------|
| Sufficient color contrast (WCAG AA minimum) | ☐ | Text and interactive elements meet 4.5:1 ratio |
| Focus indicators visible | ☐ | Clear focus states on all interactive elements |
| Alt text for images | ☐ | Descriptive alternative text provided for meaningful images |
| ARIA labels where needed | ☐ | Screen reader labels for icons, dynamic content |
| Form labels properly associated | ☐ | All inputs have visible or aria-label associations |

---

## Performance

| Item | Status | Verification Notes |
|------|--------|-------------------|
| Images optimized and lazy-loaded | ☐ | Appropriate formats, compressed, loading="lazy" where applicable |
| Bundle size reasonable | ☐ | No unnecessary dependencies, code-splitting implemented |
| No unnecessary re-renders | ☐ | React/framework rendering optimized |
| Debounce/throttle on high-frequency events | ☐ | Scroll, resize, input handlers optimized |

---
