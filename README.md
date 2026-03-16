# a2ui-pi-extension

> ⚠️ **EXPERIMENTAL** - This project is in active development. APIs and features may change. Phase 2A MVP is production-ready; Phase 2B+ are under development.

A [pi-coding-agent](https://github.com/badlogic/pi-mono) extension that enables agents to generate interactive user interfaces using the [A2UI protocol](https://a2ui.org/).

## What is A2UI?

**A2UI (Agent-to-UI)** is a JSON-based streaming protocol that lets AI agents describe rich, interactive user interfaces without executing arbitrary code. It's designed to be:

- **Secure** - Agents can only reference pre-approved components from a catalog
- **Framework-agnostic** - The same JSON renders on web, mobile, and desktop
- **LLM-friendly** - Flat structure with ID references (easier for AI to generate)

Learn more at [https://a2ui.org/](https://a2ui.org/)

## Features

This extension provides:

- **`a2ui_generate` tool** — Ask the agent to build interactive UIs (forms, dashboards, etc.)
- **System prompt injection** — Automatically injects A2UI schema into LLM prompts for UI requests
- **Validation & error feedback** — Validates generated JSON and guides LLM through self-correction
- **TUI rendering** — Renders A2UI components as terminal UI using pi-tui
- **Surface state management** — Tracks active surfaces and data models

## Supported Components

### Phase 1: Core (Complete ✅)

| Component | Purpose | Status |
|-----------|---------|--------|
| **Text** | Display text content | ✅ Complete |
| **Button** | Clickable actions | ✅ Complete |
| **TextField** | Text input fields | ✅ Complete |

### Phase 2A: MVP (Complete ✅)

| Component | Purpose | Status |
|-----------|---------|--------|
| **Checkbox** | Boolean toggle (☑/☐) | ✅ Complete |
| **RadioGroup** | Single selection (◉/○) | ✅ Complete |
| **SelectDropdown** | Searchable dropdown (▼) | ✅ Complete |
| **List** | Scrollable selectable list (▶) | ✅ Complete |
| **Image** | Display images (📷) | ✅ Complete (placeholder MVP) |

### Phase 2B: Extended (In Development 🚧)

| Component | Purpose | Status |
|-----------|---------|--------|
| **TextArea** | Multi-line text input | 🚧 Planned |
| **Slider** | Range input / number control | 🚧 Planned |
| **Card** | Grouped content container | 🚧 Planned |
| **Tabs** | Tab navigation | 🚧 Planned |
| **Accordion** | Collapsible sections | 🚧 Planned |

### Phase 2C+: Advanced (Planned 📋)

- Modal / Dialog
- DateInput / DateRangePicker
- Rating / Stars
- Progress Bar
- Badge / Tag
- And more...

## Installation

```bash
# From git
pi install git:github.com/autonomous-toaster/a2ui-pi-extension

# Local (development)
pi install /path/to/a2ui-pi-extension
```

Then reload pi extensions:

```bash
/reload
```

## Quick Start: Demo Commands

After installation, try these commands (no LLM involved, pure mocked rendering):

```bash
/a2ui-demo form         # Phase 1: Basic form with TextFields
/a2ui-demo survey       # Phase 2A: All component types  
/a2ui-demo settings     # Phase 2A: Settings form
/a2ui-demo products     # Phase 2A: Product list
/a2ui-demo profile      # Phase 2B: Profile with avatar
/a2ui-demo team         # Phase 2B: Team selection
/a2ui-demo showcase     # Phase 2B: Product showcase
/a2ui-demo dashboard    # Phase 2B: Dashboard
/a2ui-demo article      # Phase 2B: Article
/a2ui-overlay          # Overlay demo - press Ctrl+U to toggle visibility
```

**⚠️ Troubleshooting**: If you see "I'll generate an interactive A2UI form" response instead of a form appearing, the extension is not loaded. Make sure you:
1. Ran `pi install ...` (see above)
2. Ran `/reload` to load the extension

See [QUICK_START.md](./QUICK_START.md) for detailed setup and troubleshooting.

## Usage: LLM-Driven UI Generation

### Basic: Request a UI

Simply ask the agent to build a UI:

```
pi> build a contact form with name and email fields

Agent:
This contact form has two text input fields and a submit button:

[ Contact Form UI will render here ]
```

### Advanced: Use the tool directly

```
pi> /a2ui_generate description="registration form with username, email, and password fields"

Agent:
The tool generates the A2UI JSON and renders it:

[ Registration Form UI will render here ]
```

### Examples: Test Interactive Forms

The extension includes test commands to demonstrate Phase 2A components:

```bash
# Phase 1: Basic form with text inputs
/a2ui-form

# Phase 2A: Full survey with all 5 MVP components
/a2ui-survey          # Image + RadioGroup + Checkboxes + SelectDropdown + List

# Phase 2A: Settings form
/a2ui-settings        # Checkboxes + SelectDropdown + RadioGroup

# Phase 2A: Product selection
/a2ui-products        # List + RadioGroup + Checkboxes
```

Each command renders an interactive form with full keyboard navigation:

| Key | Action |
|-----|--------|
| ↑↓ / Tab | Navigate between fields/items |
| Space | Toggle Checkbox, expand SelectDropdown |
| Enter | Select item, confirm and move next |
| Backspace | Delete text, clear search |
| Escape | Cancel form |

### Configuration Commands

Configure the extension behavior:

```bash
# Set validation mode (strict | lenient)
/a2ui-config validation strict

# Enable/disable auto-retry for parsing errors
/a2ui-config auto-retry on

# Set maximum retry attempts
/a2ui-config max-retries 3

# Check status
/a2ui-status

# Clear all active surfaces
/a2ui-clear
```

## How It Works

### 1. System Prompt Injection

When the agent detects a UI-related request (keywords: "ui", "form", "button", "interface", etc.), it:
- Injects the A2UI v0.9 schema into the system prompt
- Includes component examples and generation rules
- Instructs the LLM to format output with `---a2ui_JSON---` delimiters

### 2. LLM Generation

The LLM generates a response containing:
- Plain text explanation of the UI
- A2UI JSON code block with delimiter

Example output:
```
This is a contact form with fields for name and email:

\`\`\`json
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "contact_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "contact_form",
    "components": [...]
  }}
]
\`\`\`
```

### 3. Parsing & Validation

The tool:
- Extracts JSON between delimiters
- Validates against the A2UI schema
- If validation fails and auto-retry is enabled, sends error feedback to LLM
- LLM self-corrects and regenerates

### 4. TUI Rendering

Valid A2UI messages are converted to pi-tui components:
- `A2UIComponent` → `pi-tui Component`
- Text → Text
- Button → Styled Text
- TextField → Input
- Card → Box
- Column/Row → Container (with layout hints)

The rendered UI displays in the terminal.

## Quick Start: Pre-built Examples

The extension includes 5 ready-to-use UI examples you can render instantly:

```bash
/a2ui_examples                 # List all examples
/a2ui_examples contact_form   # Contact form with fields
/a2ui_examples product_list   # Product listing
/a2ui_examples dashboard      # Dashboard with stats
/a2ui_examples login_form     # Login interface
/a2ui_examples settings_panel # Settings editor
```

These examples demonstrate all core components and can be used as templates.

## Example Workflows

### Example 1: Simple Contact Form

```
pi> build a contact form with name, email, and phone fields

Agent:
I'll create a contact form with three fields and a submit button.

[Contact Form with three text input fields and Submit button renders]
```

### Example 2: Product Dashboard

```
pi> create a dashboard showing product statistics

Agent:
Here's a dashboard with product stats:

[Dashboard with cards for each metric renders]
```

### Example 3: Multi-Step Registration

```
pi> build a registration form with username, email, password, and confirm password

Agent:
I'll create a registration form with all four fields:

[Registration form with 4 inputs and buttons renders]
```

## Architecture

```
User Request
    ↓
A2UI System Prompt Injection (prompting.ts)
    ↓
LLM generates text + A2UI JSON
    ↓
Parse output (parser.ts)
    ↓
Validate against schema (validation.ts)
    ↓
If invalid → Send errors back to LLM (retry loop)
    ↓
Store surface state (types.ts)
    ↓
Render A2UI → pi-tui (adapter.ts)
    ↓
Terminal Display
```

## Implementation Details

### Core Modules

- **`types.ts`** - TypeScript definitions for A2UI types
- **`validation.ts`** - Schema validation and component validation
- **`parser.ts`** - LLM output parsing and A2UI message extraction
- **`prompting.ts`** - System prompt injection and error feedback generation
- **`adapter.ts`** - A2UI to pi-tui component rendering adapter
- **`a2ui.ts`** - Main extension with tool registration and event handlers

### Extension Entry Points

- `extensions/a2ui.ts` - Main extension file (registered with pi)

### Configuration

- `a2ui-schema.json` - A2UI v0.9 component schema (reference)
- `package.json` - Dependencies and extension metadata

## Status & Roadmap

### Current Status: Phase 2A MVP Complete ✅

**Phase 1** (Text, Button, TextField) — Production ready ✅
**Phase 2A** (Checkbox, RadioGroup, SelectDropdown, List, Image) — Production ready ✅
**Phase 2B** (TextArea, Slider, Card, Tabs, Accordion) — Starting soon 🚧
**Phase 3** (Agent actions, multi-turn) — Planned 📋

### Phase Timeline

**Week 1-2: Phase 2B MVP**
- [ ] TextArea (multi-line input)
- [ ] Slider (range control)
- [ ] Integration testing

**Week 3-4: Phase 2B Extended**
- [ ] Card with Image (containers)
- [ ] Tabs (tab navigation)
- [ ] Accordion (collapsible sections)

**Week 5-6: Polish & Phase 3 Planning**
- [ ] Performance optimization
- [ ] User testing & feedback
- [ ] Plan Phase 3 (agent actions)

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed implementation notes.

## Known Limitations

### Phase 1/2A (Experimental)

- **Phase 2B not started** - TextArea, Slider, Tabs, Accordion coming next
- **Image rendering** - Using placeholder MVP (text-based); actual image rendering planned for Phase 2B+
- **No agent actions** - Button clicks don't trigger agent responses yet (Phase 3)
- **Terminal only** - ANSI output; no browser/web rendering
- **Single surface** - One form per session (for now)
- **No state persistence** - Data lost when form closes

### Known Issues

- SelectDropdown filtering: Type filters options but ↑/↓ navigate fields (not expanded list items)
- List keyboard jump: Type first letter doesn't jump to item yet
- Limited error messages: Some validation errors could be more helpful

### Roadmap

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed Phase 2B+ roadmap and implementation timeline.

## Testing

### Manual Testing

```bash
# Build the extension
npm install

# Install locally
pi install ./a2ui-pi-extension

# Test with a simple request
pi> build a login form with username and password

# Check status
/a2ui-status

# Clear surfaces
/a2ui-clear
```

### Unit Tests

Run validation tests:

```bash
# Test validation
npm test -- validation.test.ts

# Test parser
npm test -- parser.test.ts
```

## License

MIT

## References

- **A2UI Specification** - https://github.com/google/A2UI
- **A2UI v0.9 Spec** - https://a2ui.org/specification/v0_9
- **Pi Coding Agent** - https://github.com/badlogic/pi-mono
- **Pi Extensions Docs** - https://github.com/badlogic/pi-mono/blob/main/docs/extensions.md

## Contributing

Contributions welcome! Areas for improvement:

- [ ] Add more component types
- [ ] Improve TUI rendering (better layout support)
- [ ] Add action handling for interactive forms
- [ ] Integration tests with real LLMs
- [ ] Documentation and examples

## Support

For issues or questions:

1. Check the [A2UI documentation](https://a2ui.org/)
2. Review [pi extension docs](https://github.com/badlogic/pi-mono/blob/main/docs/extensions.md)
3. Open an issue on GitHub

---

**Built with ❤️ for the pi community**
