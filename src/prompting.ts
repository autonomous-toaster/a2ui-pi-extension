/**
 * System Prompt Injection for A2UI
 * Injects A2UI schema and rules into LLM prompts
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ===== Default System Prompt Injection =====

const A2UI_SCHEMA_PROMPT = `
# A2UI JSON Generation Guide

Generate A2UI JSON forms when user requests interactive UIs. Use delimiter \`---a2ui_JSON---\` to wrap JSON blocks.

## All Available Components (v0.9)

**Layout**: Card, Column, Row
**Display**: Text, Button, Image  
**Input**: TextField, TextArea, Checkbox, RadioGroup, SelectDropdown, Toggle, NumberInput, DatePicker, Rating, Combobox, Slider, Tabs, Accordion, List

## When to Use Each Input Component

- **TextField**: Single-line text input (names, emails, short answers)
- **TextArea**: Multi-line text (long responses, descriptions)
- **Checkbox**: Single yes/no option or multiple selections
- **RadioGroup**: Choose ONE from several options
- **SelectDropdown**: Choose from predefined list (dropdown)
- **Combobox**: Search/filter through options + select
- **Toggle**: On/off switch
- **NumberInput**: Integer or decimal numbers
- **Slider**: Choose number in range
- **Rating**: 1-5 star rating
- **DatePicker**: Date selection (YYYY-MM-DD format)
- **Tabs**: Group content by tabs
- **Accordion**: Collapsible sections
- **List**: Display items with selection

## Form Structure Example

\`\`\`json
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "form_id"}},
  {"version": "v0.9", "updateComponents": {"surfaceId": "form_id", "components": [
    {"id": "root", "component": "Column", "children": ["title", "q1", "q2", "submit"]},
    {"id": "title", "component": "Text", "text": "Form Title"},
    {"id": "q1", "component": "TextField", "label": "Question 1", "placeholder": "Your answer"},
    {"id": "q2", "component": "RadioGroup", "label": "Question 2", "options": [{"label": "Option A", "value": "a"}, {"label": "Option B", "value": "b"}]},
    {"id": "submit", "component": "Button", "child": "submit_text"},
    {"id": "submit_text", "component": "Text", "text": "Submit"}
  ]}}
]
\`\`\`

## Rules

1. Always include a submit Button at the end
2. First message: createSurface with unique surfaceId
3. Children reference component IDs (strings), not objects
4. All component IDs must be unique within surface
5. All messages have "version": "v0.9"
6. Wrap in [ ] array format
7. Use Column/Row/Card for layout, not just bare children

## Required Fields by Component

- **Text**: id, component, text
- **Button**: id, component, child (points to Text component for label)
- **TextField**: id, component, label, placeholder (optional)
- **TextArea**: id, component, label, placeholder (optional)
- **Checkbox**: id, component, label
- **RadioGroup**: id, component, label, options (array of {label, value})
- **SelectDropdown**: id, component, label, options (array of {label, value})
- **Combobox**: id, component, label, options (array of {label, value})
- **Column**: id, component, children (array of IDs)
- **Row**: id, component, children (array of IDs)
- **Card**: id, component, children (array of IDs)
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
