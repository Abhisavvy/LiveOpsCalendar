# Accessibility Guide - LiveOps Event Calendar

This document outlines the accessibility features implemented in the LiveOps Event Calendar and provides guidance for maintaining and improving accessibility.

## ✅ Implemented Accessibility Features

### Semantic HTML Structure
- **Proper HTML5 landmarks**: `nav`, `main`, `section`, `article`
- **Heading hierarchy**: Logical H1-H6 structure throughout the application
- **Form elements**: All inputs have associated labels using `<label>` elements
- **Button semantics**: Interactive elements use proper `<button>` elements

### Keyboard Navigation
- **Tab order**: Logical tab sequence through all interactive elements
- **Focus management**: Visible focus indicators on all focusable elements
- **Modal focus trapping**: Focus is trapped within dialogs and sheets
- **Escape key support**: All modals and dropdowns can be closed with Escape
- **Enter/Space activation**: All custom interactive elements respond to keyboard activation

### Screen Reader Support
- **ARIA labels**: All interactive elements have appropriate `aria-label` or `aria-labelledby`
- **ARIA descriptions**: Complex elements have `aria-describedby` for additional context
- **Live regions**: Dynamic content updates are announced via `aria-live`
- **State communication**: Form validation errors and loading states are announced
- **Role definitions**: Custom components have appropriate ARIA roles

### Visual Design
- **Color contrast**: WCAG 2.1 AA compliant contrast ratios (4.5:1 minimum)
- **Non-color indicators**: Event types use both color AND icons/patterns
- **Focus indicators**: High-contrast focus rings on all interactive elements
- **Text scaling**: Interface remains usable at 200% zoom
- **Reduced motion**: Respects `prefers-reduced-motion` user preference

### Form Accessibility
- **Label associations**: All form controls have proper labels
- **Error identification**: Validation errors are clearly identified and linked to inputs
- **Input descriptions**: Helper text provides guidance for complex fields
- **Required field indicators**: Required fields are marked both visually and programmatically
- **Error announcements**: Form errors are announced to screen readers

## 🎯 Calendar-Specific Accessibility

### FullCalendar Integration
- **Keyboard navigation**: Arrow keys navigate between dates
- **Event selection**: Events can be selected and activated with keyboard
- **View switching**: Calendar views can be changed via keyboard
- **Date announcement**: Screen readers announce dates and events properly

### Event Management
- **Event creation**: Accessible forms for creating and editing events
- **Drag and drop alternative**: Keyboard alternatives for drag-and-drop rescheduling
- **Status indicators**: Event status communicated via text, not just color

## 🔧 Testing Checklist

### Manual Testing
- [ ] **Tab navigation**: Can you navigate the entire interface using only Tab/Shift+Tab?
- [ ] **Keyboard activation**: Can all interactive elements be activated with Enter/Space?
- [ ] **Focus visibility**: Are focus indicators clearly visible on all elements?
- [ ] **Screen reader**: Does the interface make sense when using a screen reader?
- [ ] **High contrast**: Is the interface usable in high contrast mode?
- [ ] **Zoom test**: Is the interface usable at 200% browser zoom?

### Automated Testing Tools
- **axe-core**: Run automated accessibility scans
- **WAVE**: Web accessibility evaluation
- **Lighthouse**: Accessibility audit in Chrome DevTools
- **Color contrast analyzers**: Verify WCAG compliance

### Screen Reader Testing
- **NVDA** (Windows): Test with free screen reader
- **JAWS** (Windows): Test with enterprise screen reader  
- **VoiceOver** (macOS): Built-in screen reader testing
- **TalkBack** (Android): Mobile screen reader testing

## 🚀 Implementation Details

### Focus Management
```typescript
// Modal focus trapping is handled by Radix UI primitives
// Custom focus management for complex interactions
useEffect(() => {
  if (isOpen && dialogRef.current) {
    const firstFocusable = dialogRef.current.querySelector('[tabindex="0"]')
    firstFocusable?.focus()
  }
}, [isOpen])
```

### ARIA Live Regions
```typescript
// Toast notifications use ARIA live regions
<div role="status" aria-live="polite">
  {toast.title}
</div>
```

### Keyboard Event Handling
```typescript
// Custom keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      handleActivate()
      break
    case 'Escape':
      handleClose()
      break
  }
}
```

## 🎨 Color and Contrast

### Color Palette Compliance
All color combinations in the dark theme meet WCAG AA standards:

| Element | Foreground | Background | Contrast Ratio |
|---------|------------|------------|----------------|
| Body text | `hsl(210 40% 98%)` | `hsl(222.2 84% 4.9%)` | 15.3:1 ✅ |
| Muted text | `hsl(215 20.2% 65.1%)` | `hsl(222.2 84% 4.9%)` | 5.8:1 ✅ |
| Primary button | `hsl(222.2 84% 4.9%)` | `hsl(210 40% 98%)` | 15.3:1 ✅ |
| Event - IAP | `hsl(142.1 76.2% 36.3%)` | `hsl(222.2 84% 4.9%)` | 4.6:1 ✅ |

### Non-Color Indicators
- **Event types**: Use both color AND icons (💰 for IAP, 🎯 for Progression, etc.)
- **Status indicators**: Use both color AND text/badges
- **Form validation**: Use both color AND text descriptions

## 📱 Mobile Accessibility

### Touch Targets
- **Minimum size**: All interactive elements are at least 44×44px
- **Touch feedback**: Visual feedback on touch interactions
- **Gesture alternatives**: All gestures have alternative input methods

### Responsive Design
- **Sidebar collapse**: Sidebar becomes a drawer on mobile with proper focus management
- **Calendar adaptation**: Calendar switches to appropriate mobile views
- **Text scaling**: Interface remains usable with large text settings

## 🔍 Screen Reader Experience

### Content Structure
1. **Page landmark**: Main content is within `<main>` landmark
2. **Navigation**: Sidebar filters are in `<nav>` landmark  
3. **Heading flow**: Logical heading structure (H1 → H2 → H3)
4. **Content relationships**: Related content is grouped appropriately

### Interaction Feedback
- **Form submission**: Success/error states are announced
- **Loading states**: Progress indicators are announced
- **Dynamic updates**: Filter results are announced via live regions
- **Modal states**: Opening/closing of dialogs is announced

## 🛠️ Maintenance Guidelines

### Code Standards
- **Always include labels**: Every form control needs a label
- **Test with keyboard**: All new features must be keyboard accessible
- **Validate contrast**: Check color combinations with tools
- **Use semantic HTML**: Prefer semantic elements over divs with roles

### Component Library Usage
- **Radix UI primitives**: Provide excellent accessibility defaults
- **shadcn/ui components**: Built on accessible foundations
- **Custom components**: Follow Radix/shadcn patterns for consistency

### Testing Integration
- **Pre-commit hooks**: Run accessibility linters
- **CI/CD integration**: Include axe-core in automated tests
- **Regular audits**: Schedule periodic accessibility reviews

## 🎯 Future Improvements

### Planned Enhancements
- [ ] **Keyboard shortcuts**: Add hotkeys for common actions
- [ ] **Voice commands**: Integrate with speech recognition APIs
- [ ] **Haptic feedback**: Add tactile feedback for mobile interactions
- [ ] **High contrast theme**: Dedicated high contrast color scheme
- [ ] **Font size controls**: In-app text scaling options

### Advanced Features
- [ ] **Screen reader table navigation**: Enhanced calendar table navigation
- [ ] **Magnification support**: Better integration with magnification tools
- [ ] **Switch access**: Support for switch-based navigation devices
- [ ] **Eye tracking**: Compatibility with eye-tracking software

## 📚 Resources

### Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
- [Accessibility Insights](https://accessibilityinsights.io/)

---

*This accessibility guide is a living document. Please update it as new features are added or accessibility improvements are made.*