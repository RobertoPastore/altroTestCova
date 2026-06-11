---
name: Obsidian Kinetic
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e3bfb1'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#aa8a7d'
  outline-variant: '#5a4136'
  surface-tint: '#ffb596'
  primary: '#ffb596'
  on-primary: '#581e00'
  primary-container: '#ff6600'
  on-primary-container: '#561d00'
  inverse-primary: '#a33e00'
  secondary: '#a6e6ff'
  on-secondary: '#003543'
  secondary-container: '#14d1ff'
  on-secondary-container: '#00566b'
  tertiary: '#4ae176'
  on-tertiary: '#003915'
  tertiary-container: '#00ae4f'
  on-tertiary-container: '#003814'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcd'
  primary-fixed-dim: '#ffb596'
  on-primary-fixed: '#360f00'
  on-primary-fixed-variant: '#7c2e00'
  secondary-fixed: '#b7eaff'
  secondary-fixed-dim: '#4cd6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
  mono-data:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 280px
  container-max: 1440px
  gutter: 24px
  margin-page: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is engineered for the high-stakes environment of cybersecurity risk assessment. The brand personality is **rigorous, industrial, and uncompromising**. It evokes a sense of absolute security and data-driven precision, positioning the product as a premium "mission control" for enterprise safety.

The visual style utilizes a **Rigorous Dark Theme** layered with **refined Glassmorphism**. This combination balances the heavy, structural feel of industrial software with the modern, high-tech depth of frosted glass layers. The interface should feel like a sophisticated physical console—tactile yet digital—designed to minimize eye strain during deep technical audits while highlighting critical risks through aggressive accentuation.

## Colors

The palette is anchored in deep blacks and dark grays to provide a void-like backdrop that emphasizes data density. 

- **Primary (#ff6600):** A high-visibility "Vibrant Orange" reserved for actionable elements, critical alerts, and brand touchpoints. It represents heat, energy, and urgency.
- **Secondary (#00d1ff):** A technical cyan used for information-rich states, scanning animations, and non-critical data visualization.
- **Tertiary (#22c55e):** A secure green used exclusively for "Safe" status indicators and successful audit completions.
- **Background (#0a0a0a):** The foundation of the UI.
- **Surface (#1a1a1a):** Used for sidebar containers and card foundations before glassmorphism effects are applied.

## Typography

The design system utilizes **Inter** for all primary communication due to its exceptional legibility in dark environments. For technical data, code snippets, and status labels, **Geist** is used to provide a monospaced, developer-friendly aesthetic that reinforces the industrial "technical" nature of the platform.

All headlines use tighter letter spacing to maintain a compact, high-density professional feel. Labels and small metadata (using Geist) employ increased letter spacing and uppercase styling to evoke the feeling of stamped industrial plates or terminal readouts.

## Layout & Spacing

The design system employs a **Fixed Sidebar Layout** to ensure navigation remains constant during complex multi-step audits. 

- **Sidebar:** Fixed at 280px. It uses a solid `#1a1a1a` background to ground the UI, providing a heavy visual anchor on the left.
- **Main Content:** A fluid area with a max-width constraint of 1440px for dashboard views.
- **Grid:** A 12-column grid system with 24px gutters. 
- **Spacing Rhythm:** Based on an 8px scale. Padding within glassmorphic cards should be generous (minimum 24px) to balance the high information density.

On mobile devices, the sidebar collapses into a bottom navigation bar or a hamburger menu, and the page margins reduce from 40px to 16px.

## Elevation & Depth

Hierarchy is achieved through **transparency and blur** rather than traditional shadows.

- **Level 0 (Floor):** Pure `#0a0a0a` background.
- **Level 1 (Navigation):** Solid `#1a1a1a` with a 1px border of `#ffffff10`.
- **Level 2 (Glass Cards):** Background of `rgba(26, 26, 26, 0.6)` with a 12px backdrop-blur. Each card features a 1px top-left highlight border (`rgba(255, 255, 255, 0.1)`) to simulate light hitting an edge.
- **Level 3 (Modals/Popovers):** Background of `rgba(30, 30, 30, 0.8)` with a 20px backdrop-blur and a subtle outer glow using the primary orange at 5% opacity.

Shadows are avoided except for the Primary CTA, which uses a sharp, short "hard shadow" to mimic an illuminated button.

## Shapes

The design system uses a **Soft (0.25rem)** roundedness approach. This choice maintains the "industrial" feel by keeping corners relatively sharp and disciplined, avoiding the playfulness of highly rounded "pill" shapes. 

- **Standard Buttons/Inputs:** 4px radius.
- **Stats Cards:** 8px radius (rounded-lg) to soften the large data blocks.
- **Progress Bars:** Fully squared off (0px) to reinforce a "meter" or "gauge" aesthetic.

## Components

### Buttons
- **Primary:** Background `#ff6600`, text `#0a0a0a` (Bold). On hover, it gains a subtle outer white glow.
- **Secondary (Outline):** 1px border of `#ffffff20`, text `#ffffff`. On hover, the border becomes `#ff6600`.
- **Secure State:** Buttons for "Finalize Audit" include a leading lock icon and a slight inner-shadow to appear "pressed" into the surface.

### Stats Cards (Glassmorphism)
Cards must use the `backdrop-filter: blur(12px)` property. Titles should be in `label-sm` (Geist) and primary values in `headline-lg`. A 2px vertical accent bar on the left side of the card should indicate status (Orange for high risk, Green for healthy).

### Progress Bars
Progress tracks are background `#1a1a1a`. The "fill" should be a solid color (no gradients) to maintain the industrial look. For risk levels, the bar segments into 10 discrete blocks to look like a digital readout.

### Sidebar Navigation
Active states are indicated by a full-height 3px orange bar on the far left of the item and a background tint of `rgba(255, 102, 0, 0.1)`. Icons should be 20px, line-weight 1.5px.

### Input Fields
Inputs are dark-filled with a 1px border. Focus states change the border to `#ff6600` and add a faint orange "inner glow" to the text cursor.