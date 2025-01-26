# ADR 0003: Centralized Loading Component Pattern

## Status
In Progress

## Context
Our current loading implementations are:
- Fragmented across components
- Inconsistent visually
- Difficult to maintain
- Lack proper animations

## Decision
Implement a unified `Loading` component with:
- Spinner, shimmer, and skeleton variants
- Size variants (sm/default/lg)
- Animated transitions using Tailwind
- Color theming aligned with brand

## Implementation Progress

### Completed ✅
1. Base component structure with CVA variants
2. Initial migrations:
   - Page transition loader in _app.js
   - Dashboard loading state
3. Dependencies:
   - Added class-variance-authority

### Remaining 🚧
1. Animation configuration in Tailwind
2. Visual regression testing
3. Complete component migrations
4. Skeleton variant implementation

## Implementation Strategy

1. **Component Structure** ✅
```jsx
// components/ui/loading.jsx
export function Loading({ variant, size, message }) {
  // Variant-specific rendering
}
```

2. **Animation Configuration** (tailwind.config.js) 🚧
```js
extend: {
  animation: {
    shimmer: "shimmer 2s linear infinite",
    spin: "spin 1.5s linear infinite"
  },
  keyframes: {
    shimmer: {
      "0%": { transform: "translateX(-100%)" },
      "100%": { transform: "translateX(100%)" }
    }
  }
}
```

3. **Next Steps**
- Add animation configuration to tailwind.config.js
- Create visual regression test suite:
  ```jsx
  // __tests__/components/ui/loading.test.jsx
  describe('Loading', () => {
    it('renders variants correctly')
    it('applies size classes properly')
    it('shows message when provided')
    it('animates as expected')
  })
  ```
- Implement skeleton variant
- Complete remaining component migrations

## Consequences
- Consistent loading experience
- Easier maintenance
- Better performance through optimized animations
- Requires coordinated rollout