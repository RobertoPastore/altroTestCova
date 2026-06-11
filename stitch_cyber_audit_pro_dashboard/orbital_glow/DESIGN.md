---
name: Orbital Glow
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
  on-surface-variant: '#e2bfb0'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a98a7d'
  outline-variant: '#5a4136'
  surface-tint: '#ffb693'
  primary: '#ffb693'
  on-primary: '#561f00'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#a04100'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b6b5b4'
  tertiary: '#c8c6c5'
  on-tertiary: '#313030'
  tertiary-container: '#9a9898'
  on-tertiary-container: '#313131'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-padding-desktop: 32px
  container-padding-mobile: 20px
  gutter: 24px
---

## Brand & Style
The brand personality is approachable, fluid, and high-energy. It targets a modern, tech-savvy audience that appreciates a fusion of futuristic aesthetics with tactile comfort. The design style is a hybrid of **Minimalism** and **Glassmorphism**, emphasizing soft, continuous curves and deep spatial awareness. 

The UI should evoke a sense of "soft-tech"—where high-performance functionality meets an inviting, organic interface. By removing all sharp edges, the design system eliminates visual tension, creating a safe and liquid user experience.

## Colors
The palette is rooted in a deep, tiered dark mode to provide a sense of infinite depth. The primary accent is a vibrant, high-saturation Orange (`#FF6B00`), used sparingly to draw attention to high-intent actions and active states. 

Surfaces are constructed using various shades of near-black and charcoal to create hierarchy. Secondary colors are used for container backgrounds, while the tertiary color provides a subtle lift from the base neutral background. Gradients should be used within the orange accents to enhance the "glow" effect, typically transitioning from the primary orange to a slightly more reddish hue at the bottom-right.

## Typography
This design system utilizes **Plus Jakarta Sans** across all levels to reinforce the soft, rounded theme through its open apertures and friendly letterforms. 

Headlines utilize tight letter-spacing and heavy weights to create a strong visual anchor against the expansive whitespace and large corner radii of the containers. Body text is kept clean and legible with generous line heights. All labels should be rendered in medium or semi-bold weights to ensure they stand out against dark, semi-transparent backgrounds.

## Layout & Spacing
The layout follows a **fluid grid** model with significant internal padding to accommodate the large corner radii. Because the corners are so extreme, content must be inset further than usual to avoid "crowding" the curves.

A 12-column system is used for desktop, 8 for tablet, and 4 for mobile. Spacing follows an 8px rhythmic scale. On mobile, the horizontal margins are kept at 20px, while the vertical spacing between cards is increased to 24px to emphasize their individual "floating" nature.

## Elevation & Depth
Depth is achieved through **Tonal Layers** and **Glassmorphism**. 

1. **Base:** The deepest layer is the neutral black (`#0F0F0F`).
2. **Surfaces:** Floating cards use a semi-transparent charcoal background with a `backdrop-filter: blur(20px)` and a subtle 1px inner border (stroke) at 10% white opacity to define the edge.
3. **Shadows:** Instead of traditional black shadows, use "Glow Shadows" for active elements. The primary orange button should have an orange-tinted drop shadow with a large blur (24px) and low opacity (30%) to simulate light emission.

## Shapes
The shape language is defined by **Extreme Roundness**. 

- **Small elements** (Buttons, Chips, Inputs): Must always be "full pill," meaning the border-radius is set to a value higher than the height (e.g., 9999px).
- **Medium elements** (Cards, Modals, Sections): Use a minimum radius of 32px. For larger containers on desktop, this can scale up to 48px.
- **Inner elements:** Use nested rounding—inner elements should have a radius slightly smaller than the outer container (Outer Radius - Padding = Inner Radius) to maintain visual harmony.

## Components

- **Buttons:** Always pill-shaped. Primary buttons use the Orange gradient. Secondary buttons use a thick 2px outline or a semi-transparent gray fill.
- **Input Fields:** Full pill-shaped with a height of at least 48px. Placeholder text is centered or left-aligned with a 24px horizontal inset.
- **Cards:** Use a 32px or 40px corner radius. Include a subtle inner stroke. Content within cards should have a 32px padding to clear the deep corners.
- **Chips / Tags:** Small pill shapes with `label-sm` typography. High contrast between text and background for readability.
- **Progress Bars:** Fully rounded ends for both the track and the indicator. The indicator should have a subtle glow.
- **Checkboxes & Radios:** Both are rendered as circles. The checkbox, when selected, displays a thick orange checkmark inside a circular container, abandoning the traditional square form to match the system's "Orbital" theme.
- **Lists:** List items should be housed in individual rounded capsules or separated by dividers that do not touch the container edges, reinforcing the floating-element aesthetic.