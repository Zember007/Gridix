# Design

## Theme

Gridix is a product UI for people working through repeated operational tasks on desktop and mobile. The default scene is a developer or manager using a laptop during a workday, switching between project setup, inventory, leads, and settings. The interface should be light, quiet, and precise, with a restrained accent used only for primary action, selection, focus, and key status.

## Color Strategy

Use restrained tinted neutrals plus one product accent. Avoid pure black and pure white in app surfaces.

- App background: warm off-white, used for the main canvas.
- Surface: slightly lifted neutral for cards, sheets, dialogs, and tables.
- Muted surface: toolbar, empty state, and secondary panels.
- Text: off-black neutral, with secondary and muted tiers.
- Accent: desaturated indigo-blue for primary action and selected states.
- Status: semantic success, warning, danger, and info colors with soft backgrounds.

Color use rules:

- Primary accent should stay below 10% of a screen.
- Destructive actions use danger styling only at the final action point.
- Project `theme_color` may tint public selector affordances, but base layout, text, borders, and controls must remain token-driven.
- Data visualization may use a broader palette, but controls should not inherit chart colors.

## Typography

Use the existing Poppins asset stack for now, with product-scale tuning rather than a new font dependency.

- Body: 14px or 15px with readable line-height.
- Labels: 12px or 13px, medium weight.
- Section titles: 16px to 18px, semibold.
- Page titles: 22px to 28px, semibold.
- Numeric/data-heavy text should use tabular figures.
- Avoid negative letter spacing in compact UI.

## Layout

The product uses predictable app patterns:

- Sidebar plus content shell for admin and editor.
- Sticky section headers for long workflows.
- Compact toolbars above data-heavy content.
- Tables/lists for scanning repeated records.
- Sheets and drawers for preview/detail.
- Wizards for project creation and application flows.

Spacing should be consistent but not monotonous:

- 4px: tight icon/text adjustment.
- 8px: compact control gaps.
- 12px: grouped controls.
- 16px: section inner rhythm.
- 24px: major group separation.
- 32px: page-level separation.

Cards are for repeated items, dialogs, and framed tools. Do not nest cards when a section header, divider, toolbar, or table row will communicate structure better.

## Components

Shared product primitives should live in `packages/ui` only when cross-app and app-agnostic:

- `PageHeader`: page title, description, metadata, primary/secondary actions.
- `SectionHeader`: compact section title, description, optional action.
- `Toolbar`: search, filters, view controls, bulk actions, and trailing actions.
- `DataState`: loading, empty, error, and not-found states.
- `ConfirmDialog`: contextual destructive/confirmation flow.
- `FormShell`: consistent form sections and sticky action area.
- `StatusBadge`: semantic status label with restrained color.

Base controls must include default, hover, focus-visible, active, disabled, and loading behavior. Avoid imperative hover handlers for normal styling.

## Motion

Motion should communicate state:

- 150-250ms transitions for hover, active, sheet/dialog entry, and selected states.
- Use transform and opacity, not layout properties.
- Respect reduced motion.
- No decorative page-load choreography.

## Workflow Rules

- Admin pages should have a stable header and clear primary action.
- Project lists should prioritize scan speed: name, status, inventory/lead signals, publish/widget actions, and edit/open actions.
- Project creation should behave like a wizard: type, method, import/mapping, review.
- Project editor should show dirty/saving state and keep primary save/back actions stable.
- Public selector filters should expose active chips, result count, reset, and mobile sheet behavior.
- Long forms should use steps, validation summaries, and clear back/continue actions.

## Accessibility

All interactive controls need visible focus, meaningful accessible names, correct disabled state, and enough hit area on touch devices. Dialogs and sheets must preserve focus behavior from Radix. Text must fit translated labels without overlapping.
