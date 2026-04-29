# SpaceX Theme - Quick Start Guide

## How to Use the SpaceX Theme

### Switching Themes

**In Sidebar (Episode Workspace):**
1. Look for the theme toggle button at the bottom of the sidebar
2. Click to cycle through: Dark → Light → SpaceX → Dark
3. Your preference is automatically saved

**In Dashboard (Project List):**
1. Click the theme button in the top-right header
2. Shows current theme (Sáng/Tối/SpaceX)
3. Cycles through all three themes

### What You'll See

**SpaceX Theme Features:**
- Pure black background (#000000)
- Spectral white text (#f0f0fa) - slightly blue-tinted
- Full-viewport hero sections with gradient overlays
- Project cards as text-on-image overlays
- Ghost buttons with subtle transparency
- Cinematic modal dialogs
- All text in UPPERCASE with wide letter-spacing
- No shadows, no card containers, no decorative elements

### Components in SpaceX Theme

**Buttons:**
- All buttons use the "ghost" style
- Semi-transparent background (10% opacity)
- Spectral border (35% opacity)
- Smooth hover transitions
- 32px rounded corners

**Inputs:**
- Transparent background
- Bottom border only (no box)
- Uppercase text with letter-spacing
- Focus state brightens border to full white

**Modals:**
- Full-screen dark overlay (95% black)
- Backdrop blur effect
- Ghost borders
- No rounded corners (except buttons)
- Cinematic appearance

**Cards:**
- Text overlaid directly on gradient backgrounds
- Dark overlay for text legibility
- No container/panel styling
- Hover effects darken overlay slightly

## File Locations

**Theme Files:**
- `public/styles/theme-spacex.css` - Color palette
- `public/styles/fonts.css` - Font loading
- `public/styles/spacex-typography.css` - Typography utilities
- `public/styles/spacex-fallbacks.css` - Gradient fallbacks

**Components:**
- `components/SpaceXButton.tsx` - Ghost button component
- `components/SpaceXInput.tsx` - Ghost input component

**Documentation:**
- `DESIGN.md` - Complete design specification
- `SPACEX_THEME.md` - Implementation guide
- `IMPLEMENTATION_SUMMARY.md` - What was built

## Using SpaceX Components

### SpaceXButton

```tsx
import { SpaceXButton } from './components/SpaceXButton';

// Default ghost button
<SpaceXButton onClick={handleClick}>
  CLICK ME
</SpaceXButton>

// With variants
<SpaceXButton variant="success">SUCCESS</SpaceXButton>
<SpaceXButton variant="error">DELETE</SpaceXButton>
<SpaceXButton variant="warning">CAUTION</SpaceXButton>

// Disabled state
<SpaceXButton disabled>DISABLED</SpaceXButton>
```

### SpaceXInput

```tsx
import { SpaceXInput } from './components/SpaceXInput';

// Text input
<SpaceXInput
  value={text}
  onChange={setText}
  placeholder="Enter text"
/>

// Textarea
<SpaceXInput
  value={description}
  onChange={setDescription}
  type="textarea"
  rows={4}
  placeholder="Enter description"
/>

// Email input
<SpaceXInput
  value={email}
  onChange={setEmail}
  type="email"
  placeholder="Enter email"
/>
```

## CSS Classes Available

### Typography
- `.spacex-display-hero` - 48px, bold, 0.96px tracking
- `.spacex-nav-bold` - 13px, bold, 1.17px tracking
- `.spacex-nav` - 12px, regular, uppercase
- `.spacex-body` - 16px, regular, readable
- `.spacex-caption-bold` - 13px, bold, uppercase
- `.spacex-caption` - 12px, regular, uppercase
- `.spacex-micro` - 10px, regular, 1px tracking

### Utilities
- `.spacex-uppercase` - Force uppercase
- `.spacex-tracking-display` - 0.96px letter-spacing
- `.spacex-tracking-nav` - 1.17px letter-spacing
- `.spacex-tracking-micro` - 1px letter-spacing

### Fallbacks
- `.spacex-hero-fallback` - Hero section gradient
- `.spacex-card-fallback` - Card gradient
- `.spacex-asset-fallback` - Asset gradient
- `.spacex-noise` - Noise texture overlay
- `.spacex-glow-subtle` - Subtle inset glow

## CSS Variables

### Colors
```css
--space-black: #000000
--spectral-white: #f0f0fa
--ghost-surface: rgba(240, 240, 250, 0.1)
--ghost-border: rgba(240, 240, 250, 0.35)
--ghost-hover: rgba(240, 240, 250, 0.15)
--dark-overlay: rgba(0, 0, 0, 0.5)
--dark-overlay-heavy: rgba(0, 0, 0, 0.7)
```

### Typography
```css
--font-display: 'Roboto Condensed', Arial, Verdana, sans-serif
--font-body: 'Roboto Condensed', Arial, Verdana, sans-serif
--text-display-hero: 3.00rem
--text-body: 1.00rem
--text-nav-bold: 0.81rem
--text-nav: 0.75rem
--tracking-display: 0.96px
--tracking-nav: 1.17px
--tracking-micro: 1px
```

## Common Patterns

### Full-Viewport Hero Section
```tsx
<section className="relative h-screen flex items-center justify-center">
  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--space-black)]"></div>
  <div className="relative z-10 text-center">
    <h1 className="text-6xl font-bold text-[var(--spectral-white)] uppercase tracking-[0.96px]">
      HEADING
    </h1>
    <SpaceXButton>ACTION</SpaceXButton>
  </div>
</section>
```

### Text-on-Image Card
```tsx
<div className="group relative h-[280px] overflow-hidden">
  <div className="absolute inset-0 bg-cover bg-center"
       style={{backgroundImage: `url(${imageUrl})`}}>
    <div className="absolute inset-0 bg-[var(--dark-overlay)]"></div>
  </div>
  <div className="relative z-10 p-6 flex flex-col h-full justify-between">
    <h3 className="text-sm font-bold text-[var(--spectral-white)] uppercase tracking-[0.96px]">
      TITLE
    </h3>
    <SpaceXButton>OPEN</SpaceXButton>
  </div>
</div>
```

### Cinematic Modal
```tsx
<div className="fixed inset-0 z-50 bg-[var(--space-black)]/95 backdrop-blur-sm flex items-center justify-center p-6">
  <div className="relative w-full max-w-2xl p-12 border border-[var(--ghost-border)]">
    <h2 className="text-2xl font-bold text-[var(--spectral-white)] uppercase tracking-[0.96px] mb-6">
      MODAL TITLE
    </h2>
    <p className="text-base text-[var(--text-secondary)] mb-8">
      Modal content
    </p>
    <SpaceXButton>CONFIRM</SpaceXButton>
  </div>
</div>
```

## Troubleshooting

**Q: Theme not switching?**
A: Check browser console for errors. Verify ThemeContext is wrapping the app. Clear localStorage and try again.

**Q: Text not uppercase?**
A: Verify `text-transform: uppercase` is applied. Check CSS variables are loaded. Inspect element styles.

**Q: Buttons look wrong?**
A: Use SpaceXButton component or apply ghost button classes. Check for conflicting Tailwind classes.

**Q: Images not showing?**
A: Verify image paths. Check public/images/spacex/ exists. Use fallback gradients. Check network tab.

**Q: Colors look different?**
A: Verify theme-spacex.css is loaded. Check data-theme attribute on html element. Clear browser cache.

## Performance Tips

1. **Images:** Use WebP format with JPG fallback
2. **Lazy Loading:** Implement for below-fold images
3. **Font Loading:** Already optimized with font-display: swap
4. **CSS:** Variables are efficient, no performance impact
5. **Gradients:** CSS gradients are performant fallbacks

## Accessibility

- **Contrast:** 21:1 ratio (AAA compliant)
- **Typography:** Uppercase with letter-spacing aids readability
- **Focus States:** Clear hover/focus indicators
- **Keyboard:** All elements keyboard accessible
- **Screen Readers:** Semantic HTML maintained

## Next Steps

1. **Test the theme** - Switch between dark/light/spacex
2. **Explore components** - Try SpaceXButton and SpaceXInput
3. **Check responsive** - Test on mobile/tablet/desktop
4. **Add photography** - Place images in public/images/spacex/
5. **Customize** - Modify CSS variables as needed

## Support

- See `SPACEX_THEME.md` for detailed documentation
- See `DESIGN.md` for design specification
- See `IMPLEMENTATION_SUMMARY.md` for technical details
- Check component files for usage examples

---

**Enjoy the SpaceX aesthetic! 🚀**
