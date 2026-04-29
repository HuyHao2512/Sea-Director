# SpaceX Theme Implementation Guide

## Overview

The SpaceX theme is a radical minimalist design inspired by SpaceX's website aesthetic. It transforms the AI Director application from a traditional card-based UI to a cinematic, photography-driven interface with pure black backgrounds, spectral white text, and ghost button interactions.

## Theme Activation

Users can toggle between three themes:
1. **Dark** - Original dark theme with subtle grays
2. **Light** - Light theme with warm beige tones
3. **SpaceX** - Cinematic black & spectral white aesthetic

Toggle via the theme button in the Sidebar or Dashboard header. Theme preference is saved to localStorage.

## Design System

### Color Palette

**Primary Colors:**
- `--space-black: #000000` - Pure black backgrounds
- `--spectral-white: #f0f0fa` - Spectral white text (slight blue-violet tint)

**Interactive Elements:**
- `--ghost-surface: rgba(240, 240, 250, 0.1)` - Button background (10% opacity)
- `--ghost-border: rgba(240, 240, 250, 0.35)` - Button border (35% opacity)
- `--ghost-hover: rgba(240, 240, 250, 0.15)` - Hover state (15% opacity)

**Overlays:**
- `--dark-overlay: rgba(0, 0, 0, 0.5)` - Standard overlay
- `--dark-overlay-heavy: rgba(0, 0, 0, 0.7)` - Heavy overlay

### Typography

**Font Family:** Roboto Condensed (D-DIN alternative)
- Weights: 400 (regular), 700 (bold)
- All text is uppercase with positive letter-spacing

**Typography Scale:**
- Display Hero: 48px, Bold, 0.96px tracking
- Navigation Bold: 13px, Bold, 1.17px tracking
- Navigation: 12px, Regular, normal tracking
- Body: 16px, Regular, normal tracking
- Caption: 12px, Regular, uppercase
- Micro: 10px, Regular, 1px tracking

### Components

#### SpaceXButton
Universal ghost button component with optional variants.

```tsx
import { SpaceXButton } from './components/SpaceXButton';

<SpaceXButton variant="default" onClick={handleClick}>
  BUTTON TEXT
</SpaceXButton>

// Variants: 'default' | 'success' | 'error' | 'warning'
```

#### SpaceXInput
Ghost input with bottom border only, transparent background.

```tsx
import { SpaceXInput } from './components/SpaceXInput';

<SpaceXInput
  value={value}
  onChange={setValue}
  placeholder="Enter text"
  type="text"
/>

// Types: 'text' | 'textarea' | 'email' | 'password' | 'number'
```

## Layout Patterns

### Full-Viewport Sections
Each major section occupies 100vh for cinematic pacing:

```tsx
<section className="relative h-screen flex items-center justify-center">
  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--space-black)]"></div>
  <div className="relative z-10">
    {/* Content */}
  </div>
</section>
```

### Text-on-Image Overlays
Cards use photography backgrounds with dark overlays:

```tsx
<div className="group relative h-[280px] overflow-hidden">
  <div className="absolute inset-0 bg-cover bg-center"
       style={{backgroundImage: `url(${imageUrl})`}}>
    <div className="absolute inset-0 bg-[var(--dark-overlay)]"></div>
  </div>
  <div className="relative z-10 p-6">
    {/* Text content */}
  </div>
</div>
```

### Ghost Buttons
All buttons use the ghost style:

```tsx
<button className="px-[18px] py-[18px] bg-[var(--ghost-surface)]
                   border border-[var(--ghost-border)] rounded-[32px]
                   text-[var(--spectral-white)] text-xs font-bold
                   uppercase tracking-[1.17px]
                   hover:bg-[var(--ghost-hover)]
                   transition-colors">
  ACTION TEXT
</button>
```

### Cinematic Modals
Modals use full-screen dark overlays with no rounded corners:

```tsx
<div className="fixed inset-0 z-50 bg-[var(--space-black)]/95 backdrop-blur-sm
                flex items-center justify-center p-6">
  <div className="relative w-full max-w-2xl p-12 border border-[var(--ghost-border)]">
    {/* Modal content */}
  </div>
</div>
```

## Image Fallbacks

When photography is unavailable, CSS gradients provide fallback backgrounds:

- `.spacex-hero-fallback` - Hero section gradient
- `.spacex-card-fallback` - Project card gradient
- `.spacex-asset-fallback` - Asset card gradient
- `.spacex-noise` - Subtle noise texture overlay

Example:
```tsx
<div className="spacex-card-fallback spacex-noise">
  {/* Content */}
</div>
```

## Files Modified/Created

### Created:
- `public/styles/fonts.css` - Font loading (Roboto Condensed)
- `public/styles/theme-spacex.css` - SpaceX color palette
- `public/styles/spacex-typography.css` - Typography utilities
- `public/styles/spacex-fallbacks.css` - Gradient fallbacks
- `public/images/spacex/` - Photography directory
- `components/SpaceXButton.tsx` - Ghost button component
- `components/SpaceXInput.tsx` - Ghost input component

### Modified:
- `index.html` - Added CSS links, updated theme initialization
- `contexts/ThemeContext.tsx` - Added 'spacex' theme type
- `components/Sidebar.tsx` - SpaceX theme support
- `components/Dashboard.tsx` - SpaceX hero sections and cards
- `components/GlobalAlert.tsx` - SpaceX modal styling

## Best Practices

### Do's:
✓ Use uppercase text with positive letter-spacing
✓ Apply dark overlays for text legibility on images
✓ Use ghost buttons for all interactive elements
✓ Maintain full-viewport sections for cinematic pacing
✓ Keep backgrounds pure black or photography
✓ Use spectral white (#f0f0fa) for text

### Don'ts:
✗ Don't add shadows (box-shadow: none)
✗ Don't use card containers or panels
✗ Don't use sentence case (always uppercase)
✗ Don't reduce photography to thumbnails
✗ Don't add decorative elements
✗ Don't use rounded corners (except 32px for buttons)

## Responsive Behavior

SpaceX theme maintains full-viewport sections on all screen sizes:

- **Mobile (<600px):** Stacked layout, reduced padding, proportional typography
- **Tablet (600-1280px):** Adjusted spacing, maintained full-viewport sections
- **Desktop (1280px+):** Full layout with generous spacing

Photography remains edge-to-edge at all sizes.

## Performance Considerations

1. **Font Loading:** Uses `font-display: swap` for fast rendering
2. **Image Optimization:** Use WebP format with JPG fallback
3. **Lazy Loading:** Implement for below-fold images
4. **CSS Variables:** Minimal overhead, efficient theme switching
5. **Gradients:** CSS gradients are performant fallbacks

## Accessibility

- **Contrast:** Spectral white (#f0f0fa) on black (#000000) = 21:1 ratio (AAA)
- **Typography:** Uppercase with letter-spacing aids readability
- **Focus States:** Ghost buttons have clear hover/focus states
- **Keyboard Navigation:** All interactive elements are keyboard accessible

## Future Enhancements

1. Add high-quality photography assets
2. Implement lazy loading for images
3. Add WebP format with fallbacks
4. Create animation transitions between sections
5. Add parallax scrolling effects
6. Implement dark mode detection (prefers-color-scheme)

## Troubleshooting

**Theme not switching?**
- Check localStorage for 'aidirector_theme' key
- Verify ThemeContext is wrapping the app
- Check browser console for errors

**Text not uppercase?**
- Verify `text-transform: uppercase` is applied
- Check CSS variable values
- Ensure fonts are loaded correctly

**Buttons not styled?**
- Use SpaceXButton component or apply ghost button classes
- Verify CSS variables are defined
- Check for conflicting Tailwind classes

**Images not showing?**
- Verify image paths are correct
- Check public/images/spacex/ directory exists
- Use fallback gradients as backup
- Inspect network tab for 404 errors

## Support

For questions or issues with the SpaceX theme, refer to:
- `DESIGN.md` - Complete design specification
- Component files in `components/` directory
- CSS files in `public/styles/` directory
