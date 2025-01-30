# Styling Architecture & Decision Records

## Current Implementation Analysis

### Core Control Points (Validated)
1. **Design System**  
   - `tailwind.config.js` fully controls:
   ```js
   colors: {
     primary: '#3c6e47', // Main brand color
     accent: {
       DEFAULT: '#7FB069',    // Sage green
       hover: '#6A9557',
     },
     chat: {
       background: '#2F3B2F' // Specialized chat UI colors
     }
   },
   fontFamily: {
     sans: ['Inter', 'system-ui'],
   },
   boxShadow: {
     'soft': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
   }
   ```
   - Custom utilities (e.g., `.card`, `.shimmer`) defined in plugin section

2. **Global Base**  
   - `styles/globals.css` handles:
   ```css
   /* Base typography */
   h1 { @apply text-h1 mb-6; }
   
   /* Form field defaults */
   input[type="text"] {
     @apply border-[#3c6e47]/20 focus:border-[#3c6e47];
   }
   
   /* Third-party overrides */
   .prose pre {
     @apply bg-chat-background !important;
   }
   ```

3. **Layout Core**  
   - `components/Layout.js` establishes:
   ```jsx
   <div className="min-h-screen flex flex-col">
     <Header />
     <main className="flex-1 w-full relative">
       {children} // Content width controlled by parent containers
     </main>
   </div>
   ```

### Page-Specific Style Patterns
| Page/Component        | Current Approach                                                                 |
|-----------------------|----------------------------------------------------------------------------------|
| **Index/Dashboard**   | Utility-first composition with `hover-grow`/`click-shrink` custom utilities      |
| **Exam System**       | State-driven classes in `pages/exam/index.js`:
```jsx
<div className={`transition-all duration-500 ${showQuiz ? 'translate-y-0' : '-translate-y-full'}`}>
```
| **Chat Interfaces**   | Dedicated color palette in tailwind config + `LearningChat.js` animation logic   |

### Critical Modification Pathways
1. **Branding Updates**
   - Primary colors: `tailwind.config.js > colors.primary`
   - Gradients: `globals.css > .hero-gradient`
   - Fonts: `tailwind.config.js > fontFamily`

2. **Layout Adjustments**
   - Container widths: Modify `max-w-*` classes in:
   ```jsx
   // pages/exam/results/[id].js
   <main className="container mx-auto px-4 py-8 max-w-3xl">
   ```
   - Z-index stack: Header uses `z-50`, overlays `z-[60]`

3. **Mobile Responsiveness**
   - Component-level media queries via `useMediaQuery` hook:
   ```jsx
   // components/Header.js
   const isMobile = useMediaQuery('(max-width: 768px)');
   ```

### Divergence from Original Architecture
1. **Component-State Styling**  
   - Implemented through conditional class binding rather than CSS-in-JS:
   ```jsx
   // pages/exam/index.js
   <div className={`${m.isAI ? 'bg-white' : 'bg-[#3c6e47]'}`}>
   ```

2. **Animation Strategy**  
   - Hybrid approach using both Tailwind's `animate-*` and global CSS:
   ```css
   /* globals.css */
   @keyframes slide-up {
     from { transform: translateY(100%); }
   }
   ```

3. **Design Token Management**  
   - Extended Tailwind tokens instead of CSS variables:
   ```js
   // tailwind.config.js
   spacing: {
     'gutter-sm': '1rem', // Used in component padding/margins
   }
   ```

## Updated Architecture Guidelines

### Styling Hierarchy
```
1. Design Tokens (tailwind.config.js)
   └─ Colors, spacing, shadows
   
2. Global Utilities (globals.css) 
   └─ Base styles, third-party overrides
   
3. Layout Core (Layout.js)
   └─ Z-index stack, responsive containers
   
4. Component Layer 
   └─ Utility-first markup + conditional classes
```

### Modification Protocol
| Change Type            | Primary Target                | Fallback Target              |
|------------------------|-------------------------------|------------------------------|
| Color Scheme           | tailwind.config.js            | globals.css gradients        |
| Spacing System         | tailwind.config.js > spacing  | Component-level padding/margin |
| Mobile Breakpoints     | Component files               | useMediaQuery hook           |
| Complex Animations     | globals.css keyframes         | Tailwind animate-* utilities |

### Anti-Pattern Alerts
1. **!important Overrides**  
   Only permitted in `globals.css` for third-party libs:
   ```css
   .prose pre { @apply bg-chat-background !important; }
   ```

2. **Inline Style Exceptions**  
   Only allowed for dynamic viewport-based calculations:
   ```jsx
   <div style={{ height: `calc(100vh - ${headerHeight}px)` }}>
   ```

3. **Component-Specific Colors**  
   Must extend tailwind.config.js rather than hardcoding:
   ```js
   // Instead of:
   <div className="bg-[#3c6e47]">
   
   // Use:
   // tailwind.config.js
   colors: { primary: '#3c6e47' }
   <div className="bg-primary">
   ```

This documentation reflects the actual implementation while maintaining scalability for future changes.
