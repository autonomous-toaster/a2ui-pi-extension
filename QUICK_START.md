# Quick Start: A2UI Demo Commands

## Installation (Required)

The extension must be installed before `/a2ui-demo` commands work.

### Option 1: Install from GitHub
```bash
pi install git:github.com/autonomous-toaster/a2ui-pi-extension
```

### Option 2: Install from Local Directory
```bash
pi install /Users/jean-christophe.saad-dupuy2/src/github.com/autonomous-toaster/a2ui-pi-extension
```

### Verify Installation
```bash
pi extensions
# Should show: @autonomous-toaster/a2ui-pi-extension
```

## Usage

After installation, reload pi:
```bash
/reload
```

Then use demo commands:
```bash
/a2ui-demo form       # Phase 1: Basic form with TextFields
/a2ui-demo survey     # Phase 2A: All component types
/a2ui-demo settings   # Phase 2A: Settings form
/a2ui-demo products   # Phase 2A: Product list
/a2ui-demo profile    # Phase 2B: Profile with avatar
/a2ui-demo team       # Phase 2B: Team selection
/a2ui-demo showcase   # Phase 2B: Product showcase
/a2ui-demo dashboard  # Phase 2B: Dashboard
/a2ui-demo article    # Phase 2B: Article
/a2ui-overlay         # Overlay demo (press Ctrl+U to toggle)
```

## Demo Data

All demo commands use **pure mocked A2UI JSON**:
- No LLM calls
- No network requests
- No API keys needed
- Instant rendering

## Important Notes

### Why "I'll help you work with the form"?

If you see LLM responses like "I'll generate an interactive A2UI form", it means:
1. The extension is **not installed/loaded**
2. Or you need to run `/reload` after installing

The command `/a2ui-demo form` is being interpreted as a natural language request instead of a pi command.

### How to Verify Extension is Loaded

Run: `/a2ui-demo form`

**If extension IS loaded**:
- Form appears immediately in overlay/modal
- Keyboard input works
- Mocked data displayed

**If extension is NOT loaded**:
- LLM responds with "I'll help..."
- No form appears
- Solution: Install extension and run `/reload`

## LLM Mode (Future)

Currently demos use pure mocked data. When you want LLM to generate UIs:

1. Enable schema injection in `extensions/a2ui.ts`:
```typescript
pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));
```

2. Then agent can generate A2UI forms when you request "build a form"

## Troubleshooting

### "I'll generate an interactive A2UI form" response
→ Extension not installed. Run: `pi install ...` then `/reload`

### Command not found
→ Extension not loaded. Run: `/reload`

### Form appears but looks broken
→ Check pi version compatibility (see README.md)

### Keyboard input not working
→ Make sure overlay is in focus, try pressing Ctrl+U to refocus
