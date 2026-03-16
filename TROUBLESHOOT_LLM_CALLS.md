# Troubleshooting: Why `/a2ui-demo form` Calls LLM

## The Problem

When you type `/a2ui-demo form`, you get:
```
I'll search for context about the a2ui-demo form and help you...
```

This means **the extension is not loaded** in pi.

## Why This Happens

1. **Extension not installed**
   - Pi doesn't know about `a2ui-demo form` command
   - Falls back to asking LLM

2. **Extension installed but not loaded**
   - Extension files exist but pi hasn't loaded them
   - Falls back to asking LLM

3. **Command not registered**
   - Extension loaded but `registerCommand()` didn't run
   - Falls back to asking LLM

## How to Fix

### Step 1: Verify Extension is Installed

```bash
# List all extensions
pi extensions

# Look for: @autonomous-toaster/a2ui-pi-extension
```

If not listed, install it:
```bash
pi install /Users/jean-christophe.saad-dupuy2/src/github.com/autonomous-toaster/a2ui-pi-extension
```

### Step 2: Reload Extension

In pi console:
```
/reload
```

Watch console output for:
```
[A2UI Extension] Loading - registering 10 demo commands
```

If you see this, extension is loaded correctly.

### Step 3: Run Demo Command

```
/a2ui-demo form
```

**Expected**: Form appears in overlay
**Wrong**: LLM response about "searching for context"

## If It Still Calls LLM

1. Check pi console output:
   - Do you see `[A2UI Extension] Loading...`?
   - If NO → extension not loading

2. Verify TypeScript compilation:
   ```bash
   cd /Users/jean-christophe.saad-dupuy2/src/github.com/autonomous-toaster/a2ui-pi-extension
   ls -la extensions/a2ui.ts
   # Should exist
   ```

3. Reinstall extension:
   ```bash
   pi uninstall @autonomous-toaster/a2ui-pi-extension
   pi install /Users/jean-christophe.saad-dupuy2/src/github.com/autonomous-toaster/a2ui-pi-extension
   /reload
   ```

4. Try demo command again:
   ```
   /a2ui-demo form
   ```

## Why Commands Don't Call LLM (When Loaded)

The extension registers **pi commands**, not LLM tools:

```typescript
pi.registerCommand("a2ui-demo form", {
  handler: async (args, ctx) => {
    // Direct execution - runs immediately
    // No LLM involved
  }
})
```

When extension IS loaded:
1. User types: `/a2ui-demo form`
2. Pi checks registered commands
3. Finds `a2ui-demo form`
4. Executes handler directly
5. Form appears
6. **NO LLM call**

When extension is NOT loaded:
1. User types: `/a2ui-demo form`
2. Pi checks registered commands
3. **Command not found**
4. Gives input to LLM agent
5. Agent responds: "I'll search for..."
6. **LLM IS called (wrong!)**

## Quick Diagnostic Checklist

```
[ ] Extension installed?
    pi extensions | grep autonomous-toaster

[ ] Extension loaded?
    /reload
    Watch for: [A2UI Extension] Loading...

[ ] Command exists?
    Try: /a2ui-demo form
    Should show form, not LLM response

[ ] All 10 commands registered?
    After /reload, check console logs
```

## Still Stuck?

Run this in pi console:
```
/info
```

Check:
- pi version (should be recent)
- Extension list shows a2ui extension

Then try:
```
/a2ui-demo survey
```

If that also calls LLM, extension definitely not loaded.

## Solution Summary

| Symptom | Cause | Fix |
|---------|-------|-----|
| "I'll search..." response | Extension not loaded | `pi install . && /reload` |
| Command not found error | Extension not in path | Check installation path |
| Form appears then crashes | Component bug | Check console errors |
| Form works but broken UI | Component incomplete | Phase 2B implementation needed |

**The bottom line**: If you see LLM response, the extension is not loaded. Install it and reload.
