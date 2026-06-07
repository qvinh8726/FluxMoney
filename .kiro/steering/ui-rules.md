# UI Rules

## Component System
- Build UI from **shadcn/ui** components first. Add them via `npx shadcn@latest add <component>` and customize in place rather than installing competing libraries.
- Compose small primitives into feature components. Avoid duplicating component variants — extend with props and `cva` variants.
- Keep presentational components free of data fetching; pass data in as props from server components.

## Styling
- Use **Tailwind CSS** utility classes; avoid inline `style` and ad-hoc CSS files except for global tokens.
- Use the design tokens defined in the Tailwind/theme config (colors, spacing, radius). Don't hardcode hex colors or magic pixel values when a token exists.
- Merge conditional classes with the project's `cn()` helper (clsx + tailwind-merge). Don't manually concatenate class strings.
- Support **dark mode** via the theme's class strategy; never hardcode light-only colors.

## Layout & Responsiveness
- Design **mobile-first**; layer responsive variants (`sm:`, `md:`, `lg:`) upward.
- Use Flexbox/Grid utilities for layout; avoid absolute positioning unless necessary.
- Respect consistent spacing scale and container widths across pages.

## Accessibility (required)
- Use semantic HTML and the accessible Radix primitives that shadcn/ui provides; don't strip their ARIA behavior.
- All interactive elements must be keyboard-navigable with visible focus states.
- Provide labels for inputs, `alt` text for meaningful images, and accessible names for icon-only buttons.
- Maintain sufficient color contrast (WCAG AA). Note: full compliance requires manual testing with assistive tech.

## States & Feedback
- Every async action needs **loading**, **empty**, **error**, and **success** states.
- Use skeletons/spinners for loading and toasts or inline messages for feedback.
- Disable submit buttons while a mutation is in flight to prevent duplicate submissions.
- Show clear, user-friendly error messages — never raw stack traces or internal codes.

## Forms
- Use a typed form approach (e.g., react-hook-form + Zod) with both client and server validation.
- Display field-level validation inline; keep error copy concise and actionable.

## Conventions for AI Assistance
- Reuse existing components and patterns before creating new ones; prefer composing shadcn primitives over building bespoke UI (simplicity first).
- Keep UI changes surgical: don't restyle, reformat, or "improve" unrelated components, classes, or markup while making a change. Every changed line should trace to the request. See `coding-standards.md` → Working Principles.
- Keep new UI consistent with the established look, spacing, and interaction patterns.
- Verify responsive behavior and keyboard/focus handling for any new interactive UI.
