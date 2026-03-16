# Implementation Details: Why Demo Commands Don't Call LLM

## Architecture Review

### Command Registration (extensions/a2ui.ts)

The extension registers **10 direct pi commands**:

```typescript
export default function (pi: ExtensionAPI) {
  pi.registerCommand("a2ui-demo form", {
    description: "Test interactive A2UI form (Phase 1)",
    handler: async (_args, ctx) => {
      const mockA2UI = `---a2ui_JSON---[...]`;
      return runDemoForm("Contact Form", mockA2UI, ctx, false);
    },
  });
  
  pi.registerCommand("a2ui-demo survey", { ... });
  pi.registerCommand("a2ui-demo settings", { ... });
  // ... 7 more commands ...
}
```

**Key**: Using `pi.registerCommand()`, NOT `pi.registerTool()`.

### Command Handler Flow

When user types `/a2ui-demo form`:

1. **Pi command parser** checks registered commands
2. **Finds** `"a2ui-demo form"` in registry
3. **Executes** handler function directly:
   ```typescript
   handler: async (_args, ctx) => {
     // This code runs IMMEDIATELY
     // No LLM, no await, no external calls
     const mockA2UI = `...mocked JSON...`;
     return runDemoForm("Contact Form", mockA2UI, ctx, false);
   }
   ```
4. **runDemoForm()** function:
   - Parses mocked A2UI JSON
   - Validates components
   - Creates form component
   - Renders in overlay/modal
   - Returns immediately

### No LLM Involvement

The command handler:
- ❌ Does NOT call `ctx.ai` or LLM
- ❌ Does NOT make HTTP requests
- ❌ Does NOT have schema injection
- ❌ Does NOT interact with agent

It only:
- ✅ Parses mocked JSON
- ✅ Validates structure
- ✅ Renders UI component
- ✅ Manages user input

### Proof: Check the Code

In `extensions/a2ui.ts`, the handler for `/a2ui-demo form`:

```typescript
pi.registerCommand("a2ui-demo form", {
  handler: async (_args, ctx) => {
    const mockA2UI = `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "test_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "test_form",
    "components": [
      {"id": "name_field", "component": "TextField", ...},
      {"id": "email_field", "component": "TextField", ...},
      ...
    ]
  }}
]
---a2ui_JSON---
`;
    return runDemoForm("Contact Form", mockA2UI, ctx, false);
  },
});
```

**Observation**: 
- `mockA2UI` is hardcoded string (no runtime fetch)
- `runDemoForm()` only does local parsing
- No `ctx.ai`, no `ctx.tools`, no LLM calls
- **Handler completes instantly**

### Why You See LLM Response

If typing `/a2ui-demo form` gives "I'll search for context...":

**Root cause**: Extension is NOT loaded, so:
1. Pi doesn't find command `"a2ui-demo form"`
2. Pi passes input to agent/LLM fallback
3. LLM tries to help
4. User sees LLM response

**Evidence**: If extension WAS loaded:
- Console would show: `[A2UI Extension] Loading - registering 10 demo commands`
- Command would execute immediately
- No LLM involvement

## Three Different Scenarios

### Scenario 1: Extension LOADED (Correct)

```
User: /a2ui-demo form
↓
Pi command parser finds "a2ui-demo form" in registry
↓
Handler executes immediately:
  - Parse mockA2UI
  - Validate components
  - Render form
↓
Form appears in overlay
No LLM call
Completion: instant (< 100ms)
```

### Scenario 2: Extension NOT LOADED (Wrong)

```
User: /a2ui-demo form
↓
Pi command parser searches registry
↓
Command NOT found (extension not loaded)
↓
Fallback to LLM agent
↓
LLM responds: "I'll search for context about a2ui-demo form..."
↓
User sees LLM response
User frustrated
```

### Scenario 3: Extension LOADED but Component Bug

```
User: /a2ui-demo form
↓
Command found and executes
↓
Handler runs:
  - Parse mockA2UI ✓
  - Validate components ✓
  - Create form component ✗ (bug in component)
↓
Error displayed or form looks broken
But NOT LLM call - it's a rendering issue
```

## What Would Call LLM

These would call LLM (but NOT in current setup):

### Option A: Using registerTool()
```typescript
pi.registerTool({
  name: "a2ui-generate",
  async execute(params, ctx) {
    // LLM can call this
  }
})
```

### Option B: Schema Injection
```typescript
pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({
  enabled: true
}));
// Agent receives A2UI schema in system prompt
// Agent tries to generate A2UI JSON
```

### Option C: No Command Registered
```typescript
User: /something-undefined
π Falls back to LLM
LLM: "I'll help..."
```

**Current setup uses NONE of these** - only `registerCommand()`.

## Configuration Summary

| Aspect | Status |
|--------|--------|
| Commands registered? | ✅ 10 commands with pi.registerCommand() |
| Tools registered? | ❌ No |
| Schema injection? | ❌ Disabled (commented out) |
| Mock data used? | ✅ Yes (hardcoded JSON) |
| LLM calls in handler? | ❌ No |
| Extension logging? | ✅ Yes (diagnostic console log) |

## How to Verify It Works

### Check 1: Extension Loaded

In pi console, after `/reload`:
```
[A2UI Extension] Loading - registering 10 demo commands
```

If you see this → extension loaded ✓
If you DON'T → extension not loaded ✗

### Check 2: Command Exists

Run:
```
/a2ui-demo form
```

**If loaded**: Form appears
**If not loaded**: LLM response

### Check 3: No Network Calls

Form appears instantly with mocked data:
- No network latency
- No API key needed
- No rate limiting
- Works offline

## Summary

**Demo commands do NOT call LLM** because:

1. They're registered with `pi.registerCommand()` (direct execution)
2. NOT registered as LLM tools
3. Handler uses hardcoded mock data
4. No schema injection enabled
5. Handler completes instantly with no external calls

**If you see LLM response**, it's because:
- Extension not loaded
- Pi can't find the command
- Falls back to asking LLM

**Fix**: `pi install . && /reload && /a2ui-demo form`
