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
import { createA2UIFormComponent, type FormData } from "../src/interactive-form-v3";
import {
  getPhase2ASurveyExample,
  getPhase2ASettingsExample,
  getPhase2AProductListExample,
} from "../src/examples-phase2";
import {
  getProfileCardExample,
  getTeamSelectionExample,
  getProductShowcaseExample,
  getDashboardExample,
  getArticleExample,
} from "../src/examples-advanced";

export default function (pi: ExtensionAPI) {
  // Inject A2UI schema into system prompt
  pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));

  // Register the /a2ui-form command for manual testing
  pi.registerCommand("a2ui-form", {
    description: "Test interactive A2UI form (Phase 1)",
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
        const fields = Object.entries(formData)
          .map(([k, v]) => `${k}: ${v || "(empty)"}`)
          .join(" | ");
        ctx.ui.notify(`Submitted: ${fields}`, "info");
      } else {
        ctx.ui.notify("Form cancelled", "info");
      }
    },
  });

  // Phase 2A: Product Survey Example
  pi.registerCommand("a2ui-survey", {
    description: "Phase 2A Example: Product Survey with all components",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Error: UI not available", "error");
        return;
      }

      const mockA2UI = getPhase2ASurveyExample();

      const { a2uiMessages, parseError } = parseA2UIResponse(mockA2UI);
      if (!a2uiMessages.length) {
        ctx.ui.notify(`Parse error: ${parseError}`, "error");
        return;
      }

      const validation = validateA2UIMessages(a2uiMessages);
      if (!validation.valid) {
        ctx.ui.notify(`Validation error: ${validation.errors[0]}`, "error");
        return;
      }

      const components = extractComponents(a2uiMessages);
      if (!components.size) {
        ctx.ui.notify("No components extracted", "error");
        return;
      }

      const formData = await ctx.ui.custom(createA2UIFormComponent(components, ctx.ui.theme));

      if (formData) {
        const fields = Object.entries(formData).map(([k, v]) => `${k}: ${v || "(empty)"}`);
        ctx.ui.notify(`Survey submitted with ${fields.length} fields`, "info");
      } else {
        ctx.ui.notify("Survey cancelled", "info");
      }
    },
  });

  // Phase 2A: Settings Form Example
  pi.registerCommand("a2ui-settings", {
    description: "Phase 2A Example: Settings form with checkboxes and select",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Error: UI not available", "error");
        return;
      }

      const mockA2UI = getPhase2ASettingsExample();

      const { a2uiMessages, parseError } = parseA2UIResponse(mockA2UI);
      if (!a2uiMessages.length) {
        ctx.ui.notify(`Parse error: ${parseError}`, "error");
        return;
      }

      const validation = validateA2UIMessages(a2uiMessages);
      if (!validation.valid) {
        ctx.ui.notify(`Validation error: ${validation.errors[0]}`, "error");
        return;
      }

      const components = extractComponents(a2uiMessages);
      if (!components.size) {
        ctx.ui.notify("No components extracted", "error");
        return;
      }

      const formData = await ctx.ui.custom(createA2UIFormComponent(components, ctx.ui.theme));

      if (formData) {
        ctx.ui.notify("Settings saved successfully", "info");
      } else {
        ctx.ui.notify("Settings not saved", "info");
      }
    },
  });

  // Phase 2A: Product List Example
  pi.registerCommand("a2ui-products", {
    description: "Phase 2A Example: Product selection with list component",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Error: UI not available", "error");
        return;
      }

      const mockA2UI = getPhase2AProductListExample();

      const { a2uiMessages, parseError } = parseA2UIResponse(mockA2UI);
      if (!a2uiMessages.length) {
        ctx.ui.notify(`Parse error: ${parseError}`, "error");
        return;
      }

      const validation = validateA2UIMessages(a2uiMessages);
      if (!validation.valid) {
        ctx.ui.notify(`Validation error: ${validation.errors[0]}`, "error");
        return;
      }

      const components = extractComponents(a2uiMessages);
      if (!components.size) {
        ctx.ui.notify("No components extracted", "error");
        return;
      }

      const formData = await ctx.ui.custom(createA2UIFormComponent(components, ctx.ui.theme));

      if (formData) {
        ctx.ui.notify("Product selected and added to cart", "info");
      } else {
        ctx.ui.notify("Product selection cancelled", "info");
      }
    },
  });

  // Phase 2B+: Profile Card with Avatar Image
  pi.registerCommand("a2ui-profile", {
    description: "Phase 2B+: Profile card with avatar image (image rendering demo)",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Error: UI not available", "error");
        return;
      }

      const mockA2UI = getProfileCardExample();
      const { a2uiMessages, parseError } = parseA2UIResponse(mockA2UI);
      if (!a2uiMessages.length) {
        ctx.ui.notify(`Parse error: ${parseError}`, "error");
        return;
      }

      const validation = validateA2UIMessages(a2uiMessages);
      if (!validation.valid) {
        ctx.ui.notify(`Validation error: ${validation.errors[0]}`, "error");
        return;
      }

      const components = extractComponents(a2uiMessages);
      if (!components.size) {
        ctx.ui.notify("No components extracted", "error");
        return;
      }

      const formData = await ctx.ui.custom(createA2UIFormComponent(components, ctx.ui.theme));

      if (formData) {
        ctx.ui.notify("Profile updated", "info");
      } else {
        ctx.ui.notify("Profile update cancelled", "info");
      }
    },
  });

  // Phase 2B+: Team Selection with Avatars
  pi.registerCommand("a2ui-team", {
    description: "Phase 2B+: Team selection with member avatars (multiple images demo)",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Error: UI not available", "error");
        return;
      }

      const mockA2UI = getTeamSelectionExample();
      const { a2uiMessages, parseError } = parseA2UIResponse(mockA2UI);
      if (!a2uiMessages.length) {
        ctx.ui.notify(`Parse error: ${parseError}`, "error");
        return;
      }

      const validation = validateA2UIMessages(a2uiMessages);
      if (!validation.valid) {
        ctx.ui.notify(`Validation error: ${validation.errors[0]}`, "error");
        return;
      }

      const components = extractComponents(a2uiMessages);
      if (!components.size) {
        ctx.ui.notify("No components extracted", "error");
        return;
      }

      const formData = await ctx.ui.custom(createA2UIFormComponent(components, ctx.ui.theme));

      if (formData) {
        ctx.ui.notify("Team selected", "info");
      } else {
        ctx.ui.notify("Team selection cancelled", "info");
      }
    },
  });

  // Phase 2B+: Product Showcase with Image
  pi.registerCommand("a2ui-product-showcase", {
    description: "Phase 2B+: Product showcase with image (e-commerce demo)",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Error: UI not available", "error");
        return;
      }

      const mockA2UI = getProductShowcaseExample();
      const { a2uiMessages, parseError } = parseA2UIResponse(mockA2UI);
      if (!a2uiMessages.length) {
        ctx.ui.notify(`Parse error: ${parseError}`, "error");
        return;
      }

      const validation = validateA2UIMessages(a2uiMessages);
      if (!validation.valid) {
        ctx.ui.notify(`Validation error: ${validation.errors[0]}`, "error");
        return;
      }

      const components = extractComponents(a2uiMessages);
      if (!components.size) {
        ctx.ui.notify("No components extracted", "error");
        return;
      }

      const formData = await ctx.ui.custom(createA2UIFormComponent(components, ctx.ui.theme));

      if (formData) {
        ctx.ui.notify("Product added to cart", "info");
      } else {
        ctx.ui.notify("Shopping cancelled", "info");
      }
    },
  });

  // Phase 2B+: Dashboard with Profile Image
  pi.registerCommand("a2ui-dashboard", {
    description: "Phase 2B+: User dashboard with profile image (settings demo)",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Error: UI not available", "error");
        return;
      }

      const mockA2UI = getDashboardExample();
      const { a2uiMessages, parseError } = parseA2UIResponse(mockA2UI);
      if (!a2uiMessages.length) {
        ctx.ui.notify(`Parse error: ${parseError}`, "error");
        return;
      }

      const validation = validateA2UIMessages(a2uiMessages);
      if (!validation.valid) {
        ctx.ui.notify(`Validation error: ${validation.errors[0]}`, "error");
        return;
      }

      const components = extractComponents(a2uiMessages);
      if (!components.size) {
        ctx.ui.notify("No components extracted", "error");
        return;
      }

      const formData = await ctx.ui.custom(createA2UIFormComponent(components, ctx.ui.theme));

      if (formData) {
        ctx.ui.notify("Preferences saved", "info");
      } else {
        ctx.ui.notify("Preferences not saved", "info");
      }
    },
  });

  // Phase 2B+: Article with Featured Image
  pi.registerCommand("a2ui-article", {
    description: "Phase 2B+: Article with featured image (content with feedback demo)",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Error: UI not available", "error");
        return;
      }

      const mockA2UI = getArticleExample();
      const { a2uiMessages, parseError } = parseA2UIResponse(mockA2UI);
      if (!a2uiMessages.length) {
        ctx.ui.notify(`Parse error: ${parseError}`, "error");
        return;
      }

      const validation = validateA2UIMessages(a2uiMessages);
      if (!validation.valid) {
        ctx.ui.notify(`Validation error: ${validation.errors[0]}`, "error");
        return;
      }

      const components = extractComponents(a2uiMessages);
      if (!components.size) {
        ctx.ui.notify("No components extracted", "error");
        return;
      }

      const formData = await ctx.ui.custom(createA2UIFormComponent(components, ctx.ui.theme));

      if (formData) {
        ctx.ui.notify("Feedback submitted", "info");
      } else {
        ctx.ui.notify("Feedback cancelled", "info");
      }
    },
  });
}

