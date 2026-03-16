# A2UI Components Analysis & Refactoring

## Current Implementation Status

### Phase 1 Components ✅
- **Text** - Display text (implemented)
- **Button** - Clickable button (implemented)
- **TextField** - Text input (implemented)

### Phase 2A Components ✅
- **Checkbox** - Boolean toggle (implemented)
- **RadioGroup** - Single selection (implemented)
- **SelectDropdown** - Dropdown search (implemented)
- **List** - Scrollable list (implemented)
- **Image** - Display image (implemented, has bugs)

### Layout Components ⚠️
- **Card** - Container (schema defined, not actively used)
- **Column** - Vertical layout (schema defined, not actively used)
- **Row** - Horizontal layout (schema defined, not actively used)

**Total Implemented**: 11 components (8 active + 3 layout stubs)

## Missing Components (Priority)

### Phase 2B (Next 4 weeks)
1. **TextArea** - Multi-line text input
   - Replace TextField for longer content
   - Ctrl+A to select all
   - Scrollable if content exceeds height
   - Status: NOT IMPLEMENTED

2. **Slider / NumberInput** - Numeric input with range
   - Keyboard: ← → for adjustment
   - Can input number directly
   - Optional min/max/step
   - Status: NOT IMPLEMENTED

3. **Tabs** - Tab navigation
   - ← → keys to switch tabs
   - Display tab names + content
   - Store selected tab in form data
   - Status: NOT IMPLEMENTED

4. **Accordion** - Collapsible sections
   - Space to toggle expand/collapse
   - Show/hide content sections
   - Multiple independently collapsible
   - Status: NOT IMPLEMENTED

### Phase 2C (Later)
5. **Modal** - Dialog/popup overlay
6. **Breadcrumb** - Navigation trail
7. **Alert/Toast** - Notification display
8. **Progress** - Progress bar
9. **Pagination** - Page selection
10. **Badge** - Label display

## Component Architecture

All components follow closure pattern:
```typescript
export function createComponentName(...): () => (tui, theme, kb, done) => {
  // State
  let state = {...};
  
  // Cache
  let cachedLines: string[] | undefined;
  let cachedWidth: number | undefined;
  
  return {
    render(width): string[] {
      if (cachedWidth === width && cachedLines) return cachedLines;
      cachedLines = renderImpl(width, state);
      cachedWidth = width;
      return cachedLines;
    },
    
    handleInput(data: string): void {
      // Update state from input
      // Call tui.requestRender() if changed
    },
    
    invalidate(): void {
      cachedLines = undefined;
    }
  };
};
```

## Current Issues

1. **Image Rendering** (KNOWN BUG)
   - Kitty graphics protocol implementation incomplete
   - Base64 fallback not working properly
   - Affects: a2ui-demo profile, a2ui-demo team, a2ui-demo showcase, a2ui-demo dashboard, a2ui-demo article
   - Decision: Skip for now, focus on missing interactive components

2. **Layout Components**
   - Card, Column, Row defined in schema but not used in interactive forms
   - Could be useful for complex layouts
   - Decision: Implement later if needed

3. **Form Data Collection**
   - Only collected from interactive components (TextField, Checkbox, etc.)
   - Non-interactive components (Text) don't contribute to form data
   - This is correct behavior

## Refactoring Goals (This Session)

### ✅ DONE
1. Reorganize commands under `/a2ui-demo` prefix
   - /a2ui-demo form
   - /a2ui-demo survey
   - /a2ui-demo settings
   - /a2ui-demo products
   - /a2ui-demo profile
   - /a2ui-demo team
   - /a2ui-demo showcase
   - /a2ui-demo dashboard
   - /a2ui-demo article

2. Implement overlay display with Ctrl+U toggle
   - New: `/a2ui-overlay` command for demo
   - Pattern: createA2UIOverlayManager()
   - Follows doom-overlay example
   - Overlay options: 80% width, 85% height, centered

### TODO
3. Implement missing Phase 2B components
   - TextArea (multi-line input)
   - Slider / NumberInput (numeric range)
   - Tabs (tab navigation)
   - Accordion (collapsible sections)

4. Fix layout component usage
   - Card, Column, Row rendering
   - Or remove if not needed

5. Document component API
   - Standard interfaces
   - Keyboard shortcuts
   - Form data format

## File Structure

```
src/
  ├── components/
  │   ├── index.ts              (exports)
  │   ├── checkbox.ts           (Phase 2A)
  │   ├── radio.ts              (Phase 2A)
  │   ├── select.ts             (Phase 2A)
  │   ├── list.ts               (Phase 2A)
  │   ├── image.ts              (Phase 2A - buggy)
  │   ├── textarea.ts           (Phase 2B - TODO)
  │   ├── slider.ts             (Phase 2B - TODO)
  │   ├── tabs.ts               (Phase 2B - TODO)
  │   └── accordion.ts          (Phase 2B - TODO)
  ├── interactive-form-v3.ts    (main form renderer)
  ├── overlay-manager.ts        (NEW: overlay control)
  ├── types.ts                  (component types)
  ├── parser.ts                 (A2UI parsing)
  ├── validation.ts             (message validation)
  ├── prompting.ts              (schema injection)
  ├── adapter.ts                (A2UI → TUI)
  ├── examples-phase2.ts        (Phase 2A examples)
  └── examples-advanced.ts      (Phase 2B+ examples)
extensions/
  └── a2ui.ts                   (main extension - REFACTORED)
```

## Testing Plan

### Overlay Demo
```bash
/a2ui-overlay
# Form appears in overlay
# Press Ctrl+U to hide
# Press Ctrl+U again to show
# Fill and submit
```

### Command Organization
```bash
/a2ui-demo form         # Phase 1: Basic form
/a2ui-demo survey       # Phase 2A: All Phase 2A components
/a2ui-demo settings     # Phase 2A: Settings example
/a2ui-demo products     # Phase 2A: Product list
/a2ui-demo profile      # Phase 2B: Avatar image
/a2ui-demo team         # Phase 2B: Multiple avatars
/a2ui-demo showcase     # Phase 2B: Product image
/a2ui-demo dashboard    # Phase 2B: Dashboard image
/a2ui-demo article      # Phase 2B: Article image
```

## Next Steps (Not in this session)

1. **Implement TextArea**
   - Create src/components/textarea.ts
   - Handle Ctrl+A, Enter (without submit), scrolling
   - Add to interactive-form-v3.ts renderer
   - Add example with TextArea

2. **Implement Slider**
   - Create src/components/slider.ts
   - Handle ← → keys, direct number input
   - Support min/max/step
   - Add to interactive-form-v3.ts renderer

3. **Implement Tabs**
   - Create src/components/tabs.ts
   - Handle ← → for switching
   - Display tab names and content
   - Properly collect active tab in form data

4. **Implement Accordion**
   - Create src/components/accordion.ts
   - Handle Space to expand/collapse
   - Support multiple independent sections
   - Track collapsed/expanded state in form data

5. **Fix Image Component**
   - Debug Kitty graphics protocol
   - Or switch to different image rendering method
   - Test with actual images

6. **Layout Components**
   - Decide: Keep or remove Card/Column/Row?
   - If keeping: Implement proper rendering and nesting
   - If removing: Update types.ts and schema

## Keyboard Shortcut Reference

| Key | Component | Action |
|-----|-----------|--------|
| Tab | Form | Move to next field |
| Shift+Tab | Form | Move to previous field |
| ↑/↓ | RadioGroup, Select, List, Accordion | Navigate options |
| ←/→ | Tabs, Slider | Switch tabs / adjust value |
| Space | Checkbox, Radio, Accordion | Toggle / expand-collapse |
| Enter | TextField, TextArea (Shift+Enter) | Submit form / new line |
| Ctrl+A | TextArea | Select all |
| Escape | Form | Cancel |
| Ctrl+U | Overlay (new) | Toggle visibility |

---

## IMPORTANT: Demo Mode vs LLM Mode

### Current: Demo Mode (LLM Injection DISABLED)

The extension runs in **demo mode** where:
- `/a2ui-demo *` commands use mocked A2UI JSON
- Agent conversations do NOT receive A2UI schema
- No LLM calls to generate UIs
- Perfect for component testing and UI development

### Future: LLM Mode (Enable Schema Injection)

When ready for LLM integration, enable in `extensions/a2ui.ts`:
```typescript
pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));
```

Then:
- Agent receives A2UI schema in system prompt
- User can request: "build a form"
- LLM generates A2UI JSON
- Form rendered with `/a2ui-demo` infrastructure

### Why Two Modes

**Demo Mode** (current):
- Fast (no network latency)
- Reliable (no API timeouts)
- Testable (no credentials needed)
- Offline capable
- Perfect for CI/CD

**LLM Mode** (future):
- Dynamic UI generation
- Agent-driven interfaces
- Real user interaction
- Requires LLM API access
