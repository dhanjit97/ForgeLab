# Design System and UI Specification

## 1. Design direction

ForgeLab should feel like a focused engineering workshop and a
high-quality technical reference---not a generic dashboard template. Use
restrained color, strong typography, deliberate spacing, crisp editor
surfaces, and diagrams that explain real concepts.

Avoid: - Excessive glassmorphism, neon glow, gradients on every surface,
and decorative 3D that competes with code. - A card for every item. -
Tiny low-contrast labels. - Randomly changing colors between pages. -
Dense navigation that makes lessons feel like an admin panel. -
Unrequested animation and layout shifts.

## 2. Information architecture

Primary navigation: - Learn - Code Lab - Snippets - Engineering Guides -
Projects - My Progress (signed-in users)

Global utilities: - Search - Theme selector - Account menu - Keyboard
shortcuts/help

Learn landing: - Continue learning - Language paths - Recommended next
lesson - Recent activity - Browse by topic

Lesson layout: - Left: collapsible curriculum tree. - Center: article
content, examples, exercises. - Right: optional table of contents /
learning objectives on wide screens. - Inline runnable examples open in
an embedded panel or Code Lab. - On narrow screens, sidebars become
drawers and the article remains the priority.

Code Lab: - Header: language/runtime selector, file selector, Run,
Reset, Save. - Main: Monaco editor and optional file tree. - Lower/right
panel: Output, Errors, Input, Tests, Details. - Resizable panels with
keyboard-accessible controls. - Clear states: Ready, Queued, Running,
Succeeded, Compile error, Runtime error, Timed out, Cancelled, Service
unavailable. - Never display an endless spinner without elapsed time or
a way to leave the job.

Snippet page: - Search and filters above results. - Snippet detail has
explanation, code, copy, open in Code Lab, compatibility/version
notes. - Public and private snippets are visually distinguished.

Project guide: - Overview, prerequisites, architecture, milestones, test
strategy, stretch goals. - Diagrams should be accompanied by text
descriptions. - Distinguish learning prototype, hardened prototype, and
production-grade design.

## 3. Typography

Use at most two UI typefaces plus the editor's coding font. - UI/body:
Inter or a system sans-serif stack. - Headings: same family with
controlled weight/size; do not add a novelty display font. - Code:
JetBrains Mono or a system monospace fallback. - Body minimum 16px for
core reading text; compact controls may be 13--14px where accessible. -
Body line height around 1.5--1.7; code line height around 1.45--1.6. -
Use a restrained scale, e.g. 12, 14, 16, 20, 24, 32, 40px.

## 4. Color and themes

Use semantic CSS custom properties, not hard-coded color values
throughout components. Ship light and dark themes, with the selected
theme persisted in user preferences/local storage. Example token intent
(exact values can be tuned after contrast testing): - `--bg`: page
background - `--surface`: main surface - `--surface-raised`:
menus/popovers - `--text`: primary text - `--text-muted`: secondary
text - `--border`: subtle border - `--accent`: primary action and active
navigation - `--accent-contrast`: text on accent - `--success`,
`--warning`, `--danger`, `--info` - `--editor-bg`, `--editor-gutter`,
`--editor-selection` - `--focus-ring` Provide user-selectable accent
presets only if each preset passes contrast checks. Do not let a theme
choice alter semantic status colors unpredictably. Avoid relying on
color alone to communicate state.

## 5. Layout and spacing

-   Use a 4px base spacing scale.
-   Main reading width: approximately 68--78 characters.
-   Code Lab uses the full available width.
-   Keep a consistent max content width on landing and guide pages.
-   Use borders and spacing before shadows; reserve shadows for
    overlays.
-   Prefer flat sections and clear hierarchy over nested card stacks.
-   Make the editor layout configurable, but provide a sensible default.

## 6. Components

Build reusable components: - Button, IconButton, TextField, Select,
Tabs, Tooltip, Dialog, Drawer, Toast, Badge, Breadcrumbs. - AppShell,
TopNav, SidebarNav, SearchCommand. - LessonArticle, CodeExample,
ExpectedOutput, Callout, TableOfContents. - CodeWorkspace, EditorTabs,
FileTree, StdinPanel, OutputPanel, DiagnosticList, RunStatus. -
SnippetList, SnippetDetail, LanguageBadge. - ExercisePrompt,
TestResults, HintDisclosure. - ProgressIndicator, MilestoneChecklist.
Components must support keyboard navigation, visible focus,
loading/error/empty states, and reduced motion.

## 7. Accessibility

Target WCAG 2.2 AA. - Full keyboard operation for navigation and primary
workflows. - Visible focus that is not obscured. - Accessible labels and
announcements for run status. - Do not steal focus when compiler output
arrives. - Respect reduced-motion preference. - Ensure contrast for
text, code tokens, borders needed to identify controls, and focus
rings. - Provide a non-editor fallback for reading code examples. - Test
zoom at 200% and narrow viewport layouts.

## 8. Responsive behavior

-   Desktop: full Code Lab split view.
-   Tablet: collapsible file tree and tabbed output panel.
-   Mobile: lesson reading first; Code Lab uses editor/output tabs and
    avoids tiny side-by-side panes.
-   Do not promise equivalent coding comfort on phones; make the
    essential run/inspect loop usable.

## 9. Interaction quality

-   Buttons say what they do: Run, Stop, Copy code, Open in Code Lab.
-   Disable Run only when necessary and explain why.
-   Keep the last result visible while a new run queues, with a clear
    stale-result label.
-   Confirm destructive resets if user code would be lost.
-   Autosave drafts locally only with clear privacy expectations.
-   Provide empty states that teach the next action.
-   Keep keyboard shortcuts discoverable and avoid conflicts with
    browser/editor shortcuts.

## 10. UI acceptance

-   Design tokens are centralized.
-   No page uses arbitrary one-off colors without a documented reason.
-   Every main page has loading, error, empty, and populated states.
-   Core interactions work without a mouse.
-   No placeholder button is presented as functional.
-   UI snapshots or visual checks cover lesson, Code Lab, snippets, and
    mobile layouts.
