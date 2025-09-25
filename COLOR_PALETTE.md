# AI Humanizer Color Palette - Updated

## New Color Scheme: Slate to Emerald Gradient

This document outlines the updated color palette for the AI Humanizer web application, replacing the previous navy-teal gradient with a modern slate-to-emerald design.

## Primary Gradient
**Background Gradient**: `bg-gradient-to-t from-slate-300 to-emerald-100`
- Used throughout hero section, main text area, 3-step process cards, and Built on Science section
- Creates a soft, modern appearance with high contrast for text readability

## Color Variables (CSS Custom Properties)

### Primary Colors
```css
--color-primary-emerald: #10b981;
```

### Slate Colors (Neutral Palette)
```css
--color-slate-100: #f1f5f9;
--color-slate-200: #e2e8f0;
--color-slate-300: #cbd5e1;
--color-slate-400: #94a3b8;
--color-slate-500: #64748b;  /* Used for secondary text and inactive states */
--color-slate-600: #475569;
--color-slate-700: #334155;
--color-slate-800: #1e293b;  /* Used for primary text */
--color-slate-900: #0f172a;
```

### Emerald Colors (Accent Palette)
```css
--color-emerald-50: #ecfdf5;
--color-emerald-100: #d1fae5;   /* Gradient end point */
--color-emerald-200: #a7f3d0;
--color-emerald-300: #6ee7b7;
--color-emerald-400: #34d399;
--color-emerald-500: #10b981;   /* Primary green for buttons */
--color-emerald-600: #059669;   /* Button hover states */
--color-emerald-700: #047857;
--color-emerald-800: #065f46;
--color-emerald-900: #064e3b;
```

## Button Specifications

### Primary Button Template (Important Buttons)
```html
<button class="
  bg-green-500        <!-- Default: #22C55E -->
  hover:bg-green-600  <!-- Hover: #16A34A -->
  text-white          <!-- Text color -->
  rounded-[10px]      <!-- 10px rounded corners -->
  transition-colors   <!-- Smooth color transitions -->
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-ring
  focus-visible:ring-offset-2
  disabled:opacity-50
  disabled:pointer-events-none
  font-semibold
  px-8 py-3
  shadow-lg
">
  Button Text
</button>
```

### Secondary Button Template
```html
<button class="
  border-2 border-slate-600
  text-slate-600
  font-semibold
  px-8 py-3
  rounded-[10px]
  hover:bg-slate-100
  transition-colors
">
  Button Text
</button>
```

## Text Colors

### Primary Text
- **Main headings**: `text-slate-800` (#1e293b)
- **Body text**: `text-slate-700` (#334155)
- **Secondary text**: `text-slate-600` (#475569)
- **Muted text**: `text-slate-500` (#64748b) - Used for features and inactive states

### Accent Text
- **Success states**: `text-green-600` (#16a34a)
- **Interactive elements**: `text-green-500` (#22c55e)

## Usage Guidelines

### Gradients
- **Main backgrounds**: Use `bg-gradient-to-t from-slate-300 to-emerald-100` for hero sections, main content areas
- **Cards and components**: Apply gradient to create visual hierarchy and modern appearance

### Buttons
- **Important actions**: Use green-500 (#22C55E) background with white text
- **Secondary actions**: Use slate-600 border with slate-600 text
- **Disabled states**: Apply 50% opacity

### Text Hierarchy
1. **Black** (#000000) - Main pricing amounts and critical information
2. **Slate-800** (#1e293b) - Primary headings and important text
3. **Slate-700** (#334155) - Body text and descriptions  
4. **Slate-600** (#475569) - Secondary information
5. **Slate-500** (#64748b) - Muted text, features, inactive states

## Accessibility & Contrast

All color combinations meet WCAG AA accessibility standards:
- **Green buttons on light backgrounds**: Contrast ratio > 4.5:1
- **Slate text on light backgrounds**: Contrast ratio > 7:1
- **Focus indicators**: 2px solid ring with adequate contrast

## Implementation Notes

- All gradients use the same `from-slate-300 to-emerald-100` pattern for consistency
- Button hover states darken the base color by one shade level
- Focus states use emerald-500 for interactive elements
- Disabled states use 50% opacity with pointer-events-none