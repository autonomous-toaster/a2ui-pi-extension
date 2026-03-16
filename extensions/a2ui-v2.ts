/**
 * A2UI Extension for Pi Coding Agent - V2
 * Simplified architecture using question.ts pattern
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";

import type { A2UIServerMessage } from "../src/types";
import { createA2UIBeforeAgentStartHandler, injectA2UISchema } from "../src/prompting";
import { parseA2UIResponse, extractSurfaceId, extractComponents } from "../src/parser";
import { validateA2UIMessages } from "../src/validation";
import { createA2UIFormComponent, type FormData } from "../src/interactive-form-v2";

export default function (pi: ExtensionAPI) {
  // Inject A2UI schema into system prompt
  pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));

  // Register the /a2ui-form command for manual testing
  pi.registerCommand("a2ui-form", {
    description: "Test interactive A2UI form",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Error: UI not available", "error");
        return;
      }

      // Mock A2UI JSON
      const mockA2UI = `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "test_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "test_form",
    "components": [
      {"id": "name_field", "component": "TextField", "label": "Your Name", "placeholder": "Enter name"},
      {"id": "email_field", "component": "TextField", "label": "Email", "placeholder": "Enter email"},
      {"id": "message_field", "component": "TextField", "label": "Message", "placeholder": "Enter message"},
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Submit"},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Cancel"}
    ]
  }}
]
---a2ui_JSON---
`;

      // Parse A2UI
      const { a2uiMessages, parseError } = parseA2UIResponse(mockA2UI);
      if (!a2uiMessages.length) {
        ctx.ui.notify(`Parse error: ${parseError}`, "error");
        return;
      }

      // Validate
      const validation = validateA2UIMessages(a2uiMessages);
      if (!validation.valid) {
        ctx.ui.notify(`Validation error: ${validation.errors[0]}`, "error");
        return;
      }

      // Extract components
      const components = extractComponents(a2uiMessages);
      if (!components.size) {
        ctx.ui.notify("No components extracted", "error");
        return;
      }

      // Show interactive form
      const formData = await ctx.ui.custom(createA2UIFormComponent(components, ctx.ui.theme));

      if (formData) {
        const fields = Object.entries(formData).map(([k, v]) => `${k}: ${v || "(empty)"}`).join(" | ");
        ctx.ui.notify(`Submitted: ${fields}`, "success");
      } else {
        ctx.ui.notify("Form cancelled", "info");
      }
    },
  });
}
