# Brand Guidelines: Vesper

## 1) Brand Summary
- **Personality:** Minimalist, calm, precise, premium, reliable.
- **Never feel like:** Cluttered, loud, cheap, overwhelming.
- **One-line positioning statement:** "A minimalist, privacy-focused expense tracker designed to bring clarity and peace of mind to your financial life."

---

## 2) Color System
- **Backgrounds:**
  - **Base Background:** `#09090b` (Deep matte black/gray)
  - **Surface Background:** `#18181b` (For list items, section panels)
  - **Elevated Background:** `#27272a` (For cards, inputs, modals)
- **Text:**
  - **Primary Text:** `#f4f4f5` (High contrast, readable white-gray)
  - **Secondary Text:** `#a1a1aa` (Cool grey for subtitles, headers)
  - **Muted Text:** `#71717a` (Dimmed descriptions, helper text)
- **Borders & Dividers:**
  - **Border Base:** `#27272a`
  - **Border Active/Focus:** `#6366f1`
- **Accent Color:**
  - **Primary Accent:** `#6366f1` (Indigo-500)
  - **Primary Hover:** `#4f46e5` (Indigo-600)
- **Semantic Colors:**
  - **Success (Income):** `#10b981` (Emerald-500)
  - **Warning (Budget alert >80%):** `#f59e0b` (Amber-500)
  - **Error / Destructive (Budget crossed / Delete):** `#ef4444` (Red-500)
  - **Info:** `#3b82f6` (Blue-500)

**Contrast Guidance:**
- All primary text (`#f4f4f5`) on Base/Surface/Elevated backgrounds achieves a contrast ratio of > 7:1, satisfying AAA guidelines.
- Primary Accent (`#6366f1`) or Semantic buttons have text set to white (`#ffffff`) for perfect legibility.

---

## 3) Typography
- **Primary Font:** `Outfit`, sans-serif (Google Fonts)
- **Numeric Font:** `JetBrains Mono`, monospace (for currency, amounts, and dates to ensure visual alignment)
- **Type Scale:**
  - **H1 (Header/Title):** `2rem` (32px), Font-weight: `700` (Bold)
  - **H2 (Section Header):** `1.5rem` (24px), Font-weight: `600` (Semi-bold)
  - **H3 (Card Title):** `1.125rem` (18px), Font-weight: `500` (Medium)
  - **Body (Primary text):** `1rem` (16px), Font-weight: `400` (Regular)
  - **Small (Muted text/Labels):** `0.875rem` (14px), Font-weight: `400` (Regular)

---

## 4) Spacing + Layout
- **Spacing Scale (4/8-based):** `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`.
- **Grid:**
  - **Mobile:** Single column fluid layout with `16px` padding.
  - **Desktop:** 12-column grid layout with `24px` gutter and maximum width of `1200px`.
- **Card Padding & Radius:**
  - **Padding:** `20px` (or `24px` on desktop)
  - **Border Radius:** `12px`
  - **Elevation:** None (flat matte theme). We use clean borders (`1px solid #27272a`) and a very subtle hover highlight instead of heavy drop shadows.

---

## 5) Components
- **Buttons:**
  - **Primary:** Background `#6366f1`, Text `#ffffff`. Hover background `#4f46e5`. Focus outline: `#6366f1` with `2px` offset.
  - **Secondary:** Background `#27272a`, Text `#f4f4f5`. Hover background `#3f3f46`.
  - **Ghost:** Background transparent, Text `#a1a1aa`. Hover: Background `#18181b`, Text `#f4f4f5`.
  - **Destructive:** Background `#ef4444`, Text `#ffffff`. Hover `#dc2626`.
  - **Disabled:** Background `#27272a`, Text `#71717a`. Cursor: not-allowed.
- **Inputs:**
  - **Appearance:** Background `#18181b`, Border `1px solid #27272a`, Text `#f4f4f5`, Radius `8px`.
  - **Focus-visible:** Border color `#6366f1`, outline none.
  - **Error state:** Border color `#ef4444`.
- **Chips / Tags:**
  - **Appearance:** Background `#27272a`, Border `1px solid #3f3f46`, Text `#a1a1aa`. Hover: Border `#6366f1`. Active: Background `#6366f1`, Text `#ffffff`.
- **List Rows:**
  - **Appearance:** Background `#18181b`, Border-bottom `1px solid #27272a`. Hover: Background `#27272a` (smooth transition).
- **Modal / Drawer:**
  - **Appearance:** Background `#18181b` (slide-up drawer on mobile, centered modal on desktop). Border `1px solid #27272a`. Backdrop: `rgba(0, 0, 0, 0.7)` with blur.
- **Toast / Snackbar:**
  - **Appearance:** Background `#27272a`, Text `#f4f4f5`, Border `1px solid #3f3f46`, Radius `8px`, Action button text `#6366f1` (hover `#818cf8`).

---

## 6) Iconography
- **Style:** Clean, geometric vector (stroke-based).
- **Attributes:** Stroke width `2px`, round joints/caps. Inlined SVGs dynamically.

---

## 7) Motion
- **Transitions:**
  - Standard interactive transition: `150ms ease-out`.
  - Modals & drawers: `250ms cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration).
- **Reduced Motion:**
  - Disable all animations/transitions if user agent sets `@media (prefers-reduced-motion: reduce)`.

---

## 8) Accessibility Checklist
- **Focus States:** Every focusable element must have a clear `:focus-visible` state using `outline: 2px solid #6366f1` with an offset of `2px`.
- **Hit Targets:** Interactive controls (buttons, links, chips) must be at least `44px` by `44px` in hit size.
- **Keyboard Navigation:** Modals must capture focus, and pressing `Escape` must close open drawers or confirmation modals.

---

## 9) Design Tokens

### CSS Variables Block
```css
:root {
  --color-base: #09090b;
  --color-surface: #18181b;
  --color-elevated: #27272a;
  --color-border: #27272a;
  --color-border-active: #6366f1;
  
  --color-text-primary: #f4f4f5;
  --color-text-secondary: #a1a1aa;
  --color-text-muted: #71717a;
  
  --color-accent: #6366f1;
  --color-accent-hover: #4f46e5;
  
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  --font-primary: 'Outfit', sans-serif;
  --font-numeric: 'JetBrains Mono', monospace;
  
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 9999px;
  
  --transition-fast: 150ms ease-out;
  --transition-normal: 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

### JSON Format
```json
{
  "theme": "matte-black",
  "colors": {
    "backgrounds": {
      "base": "#09090b",
      "surface": "#18181b",
      "elevated": "#27272a"
    },
    "text": {
      "primary": "#f4f4f5",
      "secondary": "#a1a1aa",
      "muted": "#71717a"
    },
    "border": {
      "base": "#27272a",
      "active": "#6366f1"
    },
    "accent": {
      "primary": "#6366f1",
      "hover": "#4f46e5"
    },
    "semantic": {
      "success": "#10b981",
      "warning": "#f59e0b",
      "error": "#ef4444",
      "info": "#3b82f6"
    }
  },
  "typography": {
    "primaryFont": "Outfit, sans-serif",
    "numericFont": "JetBrains Mono, monospace"
  },
  "radius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "pill": "9999px"
  }
}
```
