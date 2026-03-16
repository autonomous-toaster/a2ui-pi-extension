# a2ui-pi-extension

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

The extension currently supports 5 core A2UI components (more coming in Phase 2):

| Component | Purpose | Example |
|-----------|---------|---------|
| **Text** | Display text content | Labels, headings, descriptions |
| **Button** | Clickable actions | Submit, Cancel, Actions |
| **TextField** | Text input with data binding | Forms, search, input fields |
| **Card** | Grouped content container | Card layouts, panels |
| **Column** | Vertical layout | Stacked items |
| **Row** | Horizontal layout | Side-by-side items |

## Installation

```bash
# From git
pi install git:github.com/autonomous-toaster/a2ui-pi-extension

# Local (development)
pi install ./a2ui-pi-extension
```

Then reload pi extensions:

```bash
/reload
```

## Usage

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

### Examples: View Pre-built UIs

The extension includes a built-in tool to view and render pre-built example UIs:

```bash
# List all available examples
/a2ui_examples

# Render a specific example
/a2ui_examples contact_form      # Contact form with name, email, message
/a2ui_examples product_list      # Product cards with add-to-cart buttons
/a2ui_examples dashboard         # Dashboard with stats cards
/a2ui_examples login_form        # Login form with username/password
/a2ui_examples settings_panel    # Settings with editable fields
```

Each example renders instantly in the terminal and demonstrates real component usage patterns.

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

## Phase 2+ Roadmap

### Phase 2: Full Catalog (4-6 weeks)
- [ ] List, CheckBox, Slider, DateTimeInput components
- [ ] Modal and Tabs support
- [ ] Multi-turn action handling (user clicks → agent responds)
- [ ] Dynamic data updates via updateDataModel

### Phase 3: Core Integration (6-8 weeks)
- [ ] Move from extension to pi core
- [ ] RPC protocol layer for remote A2UI rendering
- [ ] SDK integration for headless agents
- [ ] Performance optimization

### Phase 4: Advanced Features (6-8 weeks)
- [ ] Custom component catalogs
- [ ] Theming and styling
- [ ] Advanced layout controls
- [ ] State persistence

### Phase 5: SDK Mode (Optional)
- [ ] Pi as first-class A2UI client (like Lit/Angular renderers)
- [ ] Full A2UI protocol compliance
- [ ] Browser/headless integration

## Limitations

Current limitations (Phase 1):

- **5 components only** - Text, Button, TextField, Card, Column, Row
- **No modals/overlays** - Modal and Tabs not yet supported
- **Limited interactivity** - Button clicks echo only; no multi-turn actions yet
- **Terminal rendering** - ANSI output; no browser rendering
- **Linear layouts** - Row/Column are simplified; true flexbox not available
- **No images/media** - Image, Video, AudioPlayer not supported
- **Single surface** - Only one surface per agent session (for now)

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
