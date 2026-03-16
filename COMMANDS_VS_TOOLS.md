# Commands vs Tools vs LLM Requests - Clarified

## Three Different Mechanisms in Pi

### 1. **pi Commands** (What /a2ui-demo uses)

**How it works**:
- Registered with `pi.registerCommand("name", { handler: ... })`
- Executed directly by pi when user types `/name`
- No LLM involvement
- Instant execution

**Example: /a2ui-demo form**
```typescript
pi.registerCommand("a2ui-demo form", {
  handler: async (_args, ctx) => {
    // Direct execution - no LLM
    const mockA2UI = `---a2ui_JSON---[...]`;
    const components = parseA2UIResponse(mockA2UI);
    await ctx.ui.custom(createA2UIFormComponent(components, ctx.ui.theme));
  }
});
```

**When you type**: `/a2ui-demo form`
1. Pi finds registered command
2. Executes handler immediately
3. Form appears
4. **No LLM call**

---

### 2. **LLM Tools** (What agents/LLM uses)

**How it works**:
- Registered with `pi.registerTool({ name, parameters, execute: ... })`
- Agent/LLM can call via natural language
- Requires LLM to understand schema
- Used for dynamic behavior

**Example: `todo` tool**
```typescript
pi.registerTool({
  name: "todo",
  description: "Manage todos",
  parameters: TodoParams,
  async execute(params, ctx) {
    // LLM calls this via tool interface
    if (params.action === "add") {
      todos.push(newTodo);
    }
    return { content: [...] };
  }
});
```

**When agent needs todos**:
- User: "Add a todo about refactoring"
- Agent: "I'll use the todo tool to add that"
- Agent calls: `tool.execute({action: "add", text: "refactoring"})`
- **LLM IS involved**

---

### 3. **LLM Requests** (What happens if command not found)

**How it works**:
- User types something that doesn't match a registered command
- Pi asks the LLM to interpret it
- LLM provides a response
- Could be helpful or unhelpful

**Example: Typo or missing extension**
```
User types: /a2ui-demo form
pi looks for registered command "a2ui-demo form"
NOT FOUND (extension not loaded)
pi asks LLM: "User typed /a2ui-demo form, what should I do?"
LLM responds: "I'll help you work with the form..."
**LLM IS involved (wrong!)**
```

---

## Why /a2ui-demo Commands Are NOT Calling LLM

The commands are **registered as pi commands**, not as LLM tools:

```typescript
// ✅ This is a pi COMMAND - no LLM
pi.registerCommand("a2ui-demo form", {
  handler: async (_args, ctx) => {
    // Direct execution
  }
});

// ❌ This would be an LLM TOOL
pi.registerTool({
  name: "a2ui-generate",
  execute: async (params, ctx) => {
    // LLM-driven execution
  }
});
```

The demos use commands, not tools.

---

## When You See "I'll help you with the form..."

That's the **LLM fallback**, which means:

| Situation | Cause | Solution |
|-----------|-------|----------|
| Extension loaded, command registered | You typed `/a2ui-demo form` | ✅ Works - form appears |
| Extension NOT loaded | Command not registered | Install + reload |
| Command registered, but typo | You typed `/a2ui-dmo form` | Fix typo |
| Command registered, but default behavior | LLM answering generic question | Ignore (should not happen) |

---

## Test Checklist

```
1. Extension installed?
   pi install /path/to/a2ui-pi-extension
   
2. Extension loaded?
   /reload
   
3. Command registered?
   /extensions (should show @autonomous-toaster/a2ui-pi-extension)
   
4. Command works?
   /a2ui-demo form
   Should show form immediately, NOT "I'll help you..."
```

---

## Architecture: Commands Only (No Tools)

The a2ui-pi-extension registers **only commands**, not tools:

```typescript
export default function (pi: ExtensionAPI) {
  // NO schema injection (LLM mode disabled)
  // pi.on("before_agent_start", ...); // ← COMMENTED OUT

  // Commands for direct use
  pi.registerCommand("a2ui-demo form", { ... });    // ✅ Command
  pi.registerCommand("a2ui-demo survey", { ... });  // ✅ Command
  pi.registerCommand("a2ui-overlay", { ... });      // ✅ Command
  
  // NO registerTool() calls
  // NO LLM schema injection
}
```

This is why:
- ✅ `/a2ui-demo form` works instantly with mocked data
- ✅ No LLM calls
- ✅ No API credentials needed
- ✅ Perfect for CI/CD testing

---

## Summary

| Aspect | Status |
|--------|--------|
| Commands registered? | ✅ Yes (10 commands) |
| LLM tools registered? | ❌ No |
| Schema injection enabled? | ❌ No (commented out) |
| Default behavior when extension NOT loaded? | Falls back to LLM (wrong!) |
| Expected behavior when extension IS loaded? | Commands execute directly (right!) |

**Expected behavior**: Commands execute immediately with no LLM involvement.
