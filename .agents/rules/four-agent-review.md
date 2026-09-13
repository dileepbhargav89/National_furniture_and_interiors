# Mandatory 4-Agent Review Protocol

After EVERY implementation or modification in this project, you MUST execute a thorough 4-Agent Review across both the system implementation and the source code, and proactively modify the code if any issues, regressions, or optimization opportunities are discovered.

## The 4 Evaluation Agents:

### 1. Logic & Architecture Agent
- Contract integrity between API, packages, and UI frontends.
- State management, URL parameter synchronization, debouncing, error recovery, and edge-case handling (empty states, missing properties).
- Modularity, separation of concerns, and clean TypeScript typing (zero `any`, exactOptionalPropertyTypes compliance).

### 2. Performance & Core Web Vitals (CWV) Agent
- Largest Contentful Paint (LCP) optimization: proper `<Image priority>`, responsive `sizes`, WebP/AVIF formats.
- Cumulative Layout Shift (CLS) elimination: explicit aspect ratios, skeleton loading states, fixed image dimensions.
- Interaction to Next Paint (INP) & JS execution: efficient memoization (`useMemo`, `useCallback`), debounced user inputs, deferred asset preloading for videos.

### 3. UI/UX, Aesthetics & Accessibility (a11y) Agent
- Luxury brand adherence: `#171717`, `#8C7355`, `#FAF9F6`, `#D4AF37`, serif accents with modern sans-serif.
- Compact, space-efficient card geometry: reduced card size, high information density without clutter.
- Accessibility: WCAG AA contrast ratio $\ge 4.5:1$, semantic HTML5 elements, ARIA dialog roles (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`), keyboard accessibility (`Escape` dismiss, focus management), minimum $44 \times 44\text{px}$ touch targets.

### 4. Business, Funnel & Conversion Agent
- End-to-end shopping & consultation funnel: discovery -> quick-view/PDP -> finish swatches -> cart -> checkout / consultation lead capture.
- Transparent psychological pricing: selling price in ₹, strikethrough MRP, discount percentage badges, No-Cost EMI calculation, free shipping thresholds.
- Social proof & trust markers: verified buyer reviews, customer photography, 10-year warranty, white-glove setup.
- Admin catalog synchronization: admin portal changes reflect immediately on the storefront.
