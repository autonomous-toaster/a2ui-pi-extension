# Development Guide

## Project Structure

```
a2ui-pi-extension/
├── extensions/
│   └── a2ui.ts                 # Main extension (tool + commands)
├── src/
│   ├── types.ts                # TypeScript type definitions
│   ├── validation.ts           # Schema validation logic
│   ├── parser.ts               # LLM output parsing
│   ├── prompting.ts            # System prompt injection
│   └── adapter.ts              # A2UI → pi-tui rendering
├── a2ui-schema.json            # A2UI v0.9 component schema
├── package.json                # Dependencies
├── README.md                   # User documentation
├── LICENSE                     # MIT License
└── DEVELOPMENT.md              # This file
```

## Setup

### Install Dependencies

```bash
npm install
```

### Development Workflow

1. **Edit TypeScript files** in `src/` and `extensions/`
2. **No build step needed** - pi uses jiti for TypeScript loading
3. **Test with pi**:
   ```bash
   pi -e ./extensions/a2ui.ts
   ```

### Type Checking

Pi extensions use TypeScript directly. For type checking:

```bash
# Install TypeScript locally if needed
npm install --save-dev typescript

# Type check
npx tsc --noEmit
```

## Key Modules

### types.ts
Defines all A2UI TypeScript types:
- Component interfaces (Text, Button, TextField, Card, Column, Row)
- Message types (CreateSurface, UpdateComponents, etc.)
- Validation result types
- Renderer state types

### validation.ts
Validates A2UI messages and components:
- `validateA2UIMessage()` - Single message validation
- `validateA2UIMessages()` - Array of messages
- `validateComponent()` - Component-specific validation
- `validateComponentReferences()` - Check IDs exist

### parser.ts
Extracts A2UI JSON from LLM output:
- `parseA2UIResponse()` - Parse text + delimited JSON
- `extractSurfaceId()` - Get surface ID from messages
- `groupMessagesBySurface()` - Group by surface
- `validateMessageSequence()` - Check message order

### prompting.ts
Handles system prompt injection:
- `injectA2UISchema()` - Add schema to prompt
- `shouldUseA2UI()` - Detect UI-related requests
- `createA2UIBeforeAgentStartHandler()` - Event handler
- `generateErrorFeedback()` - Error messages for LLM

### adapter.ts
Converts A2UI to pi-tui components:
- `a2uiToTUI()` - Main conversion function
- `renderText()`, `renderButton()`, etc. - Component renderers
- `interpolateDataPath()` - Data binding
- `renderA2UISurface()` - Full surface rendering

### a2ui.ts (Main Extension)
Orchestrates the workflow:
- **Tool registration** - `a2ui_generate` tool
- **Event handlers** - `before_agent_start`, `session_start`
- **Commands** - `a2ui-config`, `a2ui-status`, `a2ui-clear`
- **Rendering** - Custom `renderResult()` for A2UI output

## Testing

### Manual Testing

```bash
# Test with pi
pi -e ./extensions/a2ui.ts

# In pi session:
pi> build a contact form

# Check output renders
pi> /a2ui-status
```

### Unit Tests (Future)

Create test files:

```typescript
// src/__tests__/validation.test.ts
import { validateA2UIMessages } from "../validation";

describe("validation", () => {
  it("accepts valid messages", () => {
    const messages = [
      {version: "v0.9", createSurface: {surfaceId: "main"}},
      {version: "v0.9", updateComponents: {surfaceId: "main", components: []}}
    ];
    const result = validateA2UIMessages(messages);
    expect(result.valid).toBe(true);
  });
});
```

Run with: `npm test`

## Common Tasks

### Add a New Component Type

1. **Define type in `types.ts`:**
   ```typescript
   export interface CheckBoxComponent extends A2UIComponent {
     component: "CheckBox";
     label: string;
     checked?: boolean;
   }
   ```

2. **Add schema in `a2ui-schema.json`:**
   ```json
   "CheckBox": {
     "description": "Checkbox component",
     "properties": {...}
   }
   ```

3. **Add validation in `validation.ts`:**
   ```typescript
   case "CheckBox":
     if (!component.label) errors.push("CheckBox missing label");
     break;
   ```

4. **Add renderer in `adapter.ts`:**
   ```typescript
   function renderCheckBox(comp: CheckBoxComponent, ctx: ComponentRenderContext): Component {
     // Implementation
   }
   ```

5. **Update main switch in `adapter.ts`:**
   ```typescript
   case "CheckBox":
     return renderCheckBox(comp as CheckBoxComponent, context);
   ```

### Update System Prompt

Edit `A2UI_SCHEMA_PROMPT` in `prompting.ts`. The prompt includes:
- Component descriptions
- Generation rules
- Examples
- Critical rules

### Improve Error Feedback

Edit `generateErrorFeedback()` in `prompting.ts` to provide better guidance to LLM.

## Debugging

### Enable Debug Logging

Add to `a2ui.ts`:

```typescript
const DEBUG = true;

function debug(msg: string, data?: any) {
  if (DEBUG) {
    console.log(`[A2UI DEBUG] ${msg}`, data || "");
  }
}
```

Use it:

```typescript
debug("Parsing response", llmResponse);
```

### Check Surface State

Add command to inspect state:

```typescript
pi.registerCommand("a2ui-debug", {
  description: "Debug A2UI state",
  handler: async (_args, ctx) => {
    const surfaces = Array.from(rendererState.surfaces.entries()).map(([id, s]) => ({
      id,
      components: s.components.size,
      dataModel: Object.fromEntries(s.dataModel)
    }));
    ctx.ui.notify(JSON.stringify(surfaces, null, 2), "info");
  }
});
```

## Integration Points

### With Pi Core

- `before_agent_start` event - Inject schema
- `session_start` event - Clear state
- Tool system - Register `a2ui_generate`
- Command system - Register `/a2ui-*` commands
- TUI rendering - Custom component rendering

### With LLM

Currently mocked in `callLLMWithA2UISchema()`. To integrate with real LLM:

```typescript
async function callLLMWithA2UISchema(prompt: string, pi: ExtensionAPI): Promise<string> {
  // Get current model from pi
  // Call LLM API with injected schema
  // Return raw response (not parsed)
}
```

## Performance Considerations

- **Parsing**: O(n) string operations - fast for typical responses
- **Validation**: O(n) where n = component count - usually small
- **Rendering**: O(n) component tree traversal - ANSI output is fast
- **Storage**: Surfaces stored in memory - cleared on session start

For production:
- Consider caching validation schemas
- Implement surface garbage collection if many surfaces created
- Profile rendering with large component trees

## Next Steps

1. **Integrate real LLM calls** - Replace mock calls in main extension
2. **Add more components** - CheckBox, Slider, List, Modal (Phase 2)
3. **Implement action handling** - Button clicks → agent responses
4. **Add unit tests** - Validation, parser, adapter tests
5. **Performance testing** - Profile with large UIs
6. **Documentation** - Examples, tutorials, API reference

## Resources

- [A2UI Spec](https://github.com/google/A2UI)
- [Pi Extension Docs](https://github.com/badlogic/pi-mono/blob/main/docs/extensions.md)
- [Pi TUI API](https://github.com/badlogic/pi-mono/tree/main/packages/tui)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
