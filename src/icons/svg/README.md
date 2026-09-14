# Drop `.svg` files here

Any file in this folder can be imported as a React component:

```tsx
import Logo from './svg/logo.svg';

<Logo width={120} height={40} />
```

Notes for icons that should follow the theme:

- Export the SVG with `fill="currentColor"` (or edit the file and replace the
  hard-coded hex), then pass `color` at the call site:
  `<MyIcon width={24} height={24} color={colors.primary} />`
- Re-export new icons from `src/icons/index.tsx` so screens import from one
  place.
- Metro caches SVGs aggressively — restart with `yarn start --reset-cache`
  after adding files.
