/**
 * System Prompt Injection for A2UI
 * Injects A2UI schema and rules into LLM prompts
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ===== Default System Prompt Injection =====

const A2UI_SCHEMA_PROMPT = `
# A2UI JSON Generation

Generate A2UI JSON when user requests interactive UIs. Use delimiter \`---a2ui_JSON---\` to wrap the JSON block.

## Components (v0.9): Text, Button, TextField, Card, Column, Row

## Format
\`\`\`json
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "main"}},
  {"version": "v0.9", "updateComponents": {"surfaceId": "main", "components": [
    {"id": "root", "component": "Column", "children": ["title", "btn"]},
    {"id": "title", "component": "Text", "text": "Title"},
    {"id": "btn", "component": "Button", "child": "btn_text", "action": {"name": "submit"}},
    {"id": "btn_text", "component": "Text", "text": "Click"}
  ]}}
]
\`\`\`

## Rules
1. First message: createSurface with surfaceId
2. Children reference component IDs (strings), not objects
3. Unique IDs within surface
4. Data paths: {"path": "/key/field"}
5. All messages have "version": "v0.9"
6. Array format: wrap in [ ]
7. No inline objects, no code execution

## Component Examples
- Text: {"id": "t1", "component": "Text", "text": "Hello"}
- Button: {"id": "b1", "component": "Button", "child": "label", "action": {"name": "click"}}
- TextField: {"id": "f1", "component": "TextField", "label": "Name", "value": {"path": "/form/name"}}
- Card: {"id": "c1", "component": "Card", "children": ["title", "body"]}
- Column: {"id": "col", "component": "Column", "children": ["item1", "item2"]}
- Row: {"id": "row", "component": "Row", "children": ["left", "right"]}
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
