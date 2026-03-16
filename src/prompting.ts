/**
 * System Prompt Injection for A2UI
 * Injects A2UI schema and rules into LLM prompts
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ===== Default System Prompt Injection =====

const A2UI_SCHEMA_PROMPT = `
# A2UI Component Generation

When the user asks for an interactive UI, form, display, or interface, generate valid A2UI JSON.

## What is A2UI?

A2UI (Agent-to-UI) is a JSON-based protocol that lets agents describe user interfaces.
- **Security First**: No code execution, only declarative component definitions
- **Framework Agnostic**: Renders on web, mobile, and desktop
- **LLM-Friendly**: Flat structure with ID references instead of nested objects

## Core Components (v0.9)

The following components are available:

- **Text** - Display text content
  Example: \`{"id": "title", "component": "Text", "text": "Hello World"}\`

- **Button** - Clickable button with optional action
  Example: \`{"id": "btn", "component": "Button", "child": "btn_label", "action": {"name": "submit"}}\`

- **TextField** - Text input field with data binding
  Example: \`{"id": "name_input", "component": "TextField", "label": "Your name", "value": {"path": "/form/name"}}\`

- **Card** - Container for grouped content
  Example: \`{"id": "card", "component": "Card", "children": ["title", "body"]}\`

- **Column** - Vertical layout container
  Example: \`{"id": "col", "component": "Column", "children": ["item1", "item2"]}\`

- **Row** - Horizontal layout container
  Example: \`{"id": "row", "component": "Row", "children": ["left", "right"]}\`

## How to Generate A2UI

1. Respond to the user's request with normal text explaining what UI you're building
2. Generate A2UI JSON in a code block with delimiter \`---a2ui_JSON---\`
3. Format your response like this:

\`\`\`
This is a contact form with fields for name and email:

\\\`\\\`\\\`json
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "contact_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "contact_form",
    "components": [
      {"id": "root", "component": "Column", "children": ["title", "name_field", "email_field", "submit_btn"]},
      {"id": "title", "component": "Text", "text": "Contact Us"},
      {"id": "name_field", "component": "TextField", "label": "Full Name", "value": {"path": "/form/name"}},
      {"id": "email_field", "component": "TextField", "label": "Email", "value": {"path": "/form/email"}},
      {"id": "submit_btn", "component": "Button", "child": "submit_text", "action": {"name": "submit"}},
      {"id": "submit_text", "component": "Text", "text": "Submit"}
    ]
  }}
]
\\\`\\\`\\\`
\`\`\`

## Critical Rules

1. **Start with createSurface** - First message MUST have \`createSurface\` with a \`surfaceId\`
2. **Use ID references** - Children reference component IDs (e.g., \`"child": "btn_label"\`), never inline objects
3. **Unique IDs** - All component IDs must be unique within a surface
4. **Data binding** - Use JSON paths like \`{"path": "/form/fieldName"}\` for dynamic data
5. **JSON paths** - Data paths must start with \`/\` (e.g., \`/user/email\`)
6. **Type correctness** - Component \`component\` field must match one of the 6 types above
7. **No code execution** - A2UI is declarative only — you cannot execute arbitrary code
8. **Array format** - Always wrap messages in an array \`[...]\`
9. **Version field** - Every message must have \`"version": "v0.9"\`

## Example: Multi-Step Form

\`\`\`json
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "form",
    "components": [
      {"id": "main", "component": "Card", "children": ["heading", "fields", "actions"]},
      {"id": "heading", "component": "Text", "text": "Registration"},
      {"id": "fields", "component": "Column", "children": ["name_input", "email_input", "password_input"]},
      {"id": "name_input", "component": "TextField", "label": "Username", "value": {"path": "/reg/username"}},
      {"id": "email_input", "component": "TextField", "label": "Email", "value": {"path": "/reg/email"}},
      {"id": "password_input", "component": "TextField", "label": "Password", "value": {"path": "/reg/password"}},
      {"id": "actions", "component": "Row", "children": ["cancel_btn", "submit_btn"]},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_text", "action": {"name": "cancel"}},
      {"id": "cancel_text", "component": "Text", "text": "Cancel"},
      {"id": "submit_btn", "component": "Button", "child": "submit_text", "action": {"name": "submit"}, "attributes": {"primary": true}},
      {"id": "submit_text", "component": "Text", "text": "Register"}
    ]
  }},
  {"version": "v0.9", "updateDataModel": {"surfaceId": "form", "path": "/reg/username", "value": ""}}
]
\`\`\`

## What NOT to Do

❌ Don't use component types not in the 6 above (e.g., Modal, Slider, CheckBox yet)
❌ Don't nest components inline - always use ID references
❌ Don't forget the createSurface message
❌ Don't forget version field in messages
❌ Don't use duplicate IDs
❌ Don't reference non-existent component IDs
❌ Don't include code, scripts, or executable content
`;

// ===== Injection Functions =====

/**
 * Inject A2UI schema into system prompt
 */
export function injectA2UISchema(baseSystemPrompt: string): string {
  return baseSystemPrompt + A2UI_SCHEMA_PROMPT;
}

/**
 * Check if prompt should use A2UI
 * (heuristic: look for UI-related keywords)
 */
export function shouldUseA2UI(userPrompt: string): boolean {
  if (!userPrompt || typeof userPrompt !== "string") {
    return false;
  }

  const lowerPrompt = userPrompt.toLowerCase();

  const uiKeywords = [
    "ui",
    "interface",
    "form",
    "display",
    "component",
    "layout",
    "button",
    "input",
    "field",
    "screen",
    "visual",
    "render",
    "build a ui",
    "create a ui",
    "make a ui",
    "design a",
    "interactive",
    "dashboard",
  ];

  return uiKeywords.some((keyword) => lowerPrompt.includes(keyword));
}

/**
 * Load custom A2UI schema from file if provided
 */
export function loadA2UISchema(schemaPath?: string): string {
  if (!schemaPath) {
    return A2UI_SCHEMA_PROMPT;
  }

  try {
    const fullPath = path.resolve(schemaPath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`A2UI schema file not found: ${fullPath}. Using default.`);
      return A2UI_SCHEMA_PROMPT;
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    return A2UI_SCHEMA_PROMPT + "\n\n## Custom Rules\n\n" + content;
  } catch (err) {
    console.warn(`Failed to load A2UI schema: ${err}. Using default.`);
    return A2UI_SCHEMA_PROMPT;
  }
}

/**
 * Create a before_agent_start event handler for A2UI injection
 * Can be used directly in extensions
 */
export function createA2UIBeforeAgentStartHandler(options?: {
  enabled?: boolean;
  customSchemaPath?: string;
  alwaysInject?: boolean; // Inject even if prompt doesn't look like UI request
}) {
  const enabled = options?.enabled !== false;
  const alwaysInject = options?.alwaysInject === true;
  const customSchemaPath = options?.customSchemaPath;

  return async function beforeAgentStart(event: any, _ctx: any) {
    if (!enabled) {
      return;
    }

    // Check if this prompt needs A2UI
    const needsA2UI = alwaysInject || shouldUseA2UI(event.prompt);

    if (!needsA2UI) {
      return; // Skip injection
    }

    const schema = loadA2UISchema(customSchemaPath);
    const injectedPrompt = injectA2UISchema(event.systemPrompt);

    return {
      systemPrompt: injectedPrompt,
    };
  };
}

/**
 * Generate error feedback message for LLM self-correction
 */
export function generateErrorFeedback(
  errors: string[],
  originalOutput: string,
): string {
  const errorList = errors.map((e, i) => `${i + 1}. ${e}`).join("\n");

  return `
The A2UI JSON you generated had validation errors:

${errorList}

Please fix these errors and try again. Make sure:
- All component IDs are unique within the surface
- All referenced component IDs exist
- The first message is createSurface
- All messages have "version": "v0.9"
- Component types are one of: Text, Button, TextField, Card, Column, Row
- Data paths start with / (e.g., /form/name)

Here's the output you generated for reference:
\`\`\`
${originalOutput}
\`\`\`

Generate corrected A2UI JSON with the same delimiter format.
`;
}
