# Testing A2UI Demo Commands

## The Problem You Described

When you type `/a2ui-demo form`, you get:
```
I'll help you work with the form in the a2ui-demo project...
```

This means **the extension is not loaded**. The command is being interpreted by the LLM, not by pi.

## Solution: Install and Load the Extension

### Step 1: Install the Extension

```bash
# Option A: From this directory
cd /Users/jean-christophe.saad-dupuy2/src/github.com/autonomous-toaster/a2ui-pi-extension
pi install .

# Option B: From GitHub (after pushing)
pi install git:github.com/autonomous-toaster/a2ui-pi-extension
```

### Step 2: Reload Extensions

In pi, type:
```
/reload
```

### Step 3: Test a Command

```
/a2ui-demo form
```

**Expected Result**:
- A form appears immediately (no LLM response)
- Form has 3 text fields: "Your Name", "Email", "Message"
- Form has Submit and Cancel buttons
- You can type in fields, Tab to navigate, Enter to submit
- **NO** message from the LLM

**Wrong Result** (if you still see LLM response):
- Run `/extensions` to check if extension is loaded
- Run `/reload` again
- Reinstall with `pi install .`

## Verification

### Check if Extension is Loaded

In pi:
```
/extensions
```

Should show:
```
@autonomous-toaster/a2ui-pi-extension
```

### Test Command Directly

Type exactly:
```
/a2ui-demo form
```

**If extension is loaded**: Form appears immediately
**If not loaded**: LLM responds with "I'll help you..."

## All Demo Commands

Once extension is loaded, you can use:

```
/a2ui-demo form          # Phase 1: TextFields + Buttons
/a2ui-demo survey        # Phase 2A: All component types
/a2ui-demo settings      # Phase 2A: Settings form
/a2ui-demo products      # Phase 2A: Product list
/a2ui-demo profile       # Phase 2B: Profile with avatar
/a2ui-demo team          # Phase 2B: Team selection
/a2ui-demo showcase      # Phase 2B: Product showcase
/a2ui-demo dashboard     # Phase 2B: Dashboard
/a2ui-demo article       # Phase 2B: Article
/a2ui-overlay           # Overlay demo (Ctrl+U to toggle)
```

All are **direct pi commands**, NOT LLM requests.

## Why This Works (No LLM Calls)

The extension registers commands with `pi.registerCommand()`:

```typescript
pi.registerCommand("a2ui-demo form", {
  description: "Test interactive A2UI form...",
  handler: async (_args, ctx) => {
    // Shows form directly - no LLM involved
    const mockA2UI = `---a2ui_JSON---...`;
    const { a2uiMessages, parseError } = parseA2UIResponse(mockA2UI);
    // ... parse, validate, render
  }
});
```

When you type `/a2ui-demo form`:
1. Pi checks registered commands first
2. Finds the command and executes it
3. Form rendered immediately
4. **LLM not involved**

When extension is NOT loaded:
1. Pi doesn't find the command
2. Falls back to asking LLM
3. LLM tries to help (wrong behavior)

## Troubleshooting

### Q: I ran `pi install .` but still getting LLM response
**A**: Run `/reload` to load the extension, or restart pi

### Q: Extension doesn't appear in `/extensions`
**A**: Reinstall: `pi install /full/path/to/a2ui-pi-extension`

### Q: Form appears but looks broken
**A**: Check pi version compatibility (see README.md)

### Q: Keyboard input not working
**A**: Make sure the form is in focus (overlay mode - try Ctrl+U)

## Next: Actually Test It

Now go to pi and:
1. `pi install /Users/jean-christophe.saad-dupuy2/src/github.com/autonomous-toaster/a2ui-pi-extension`
2. `/reload`
3. `/a2ui-demo form`

You should see a form, NOT an LLM response!
