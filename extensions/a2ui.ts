/**
 * A2UI Extension for Pi Coding Agent - V3
 * With overlay support and reorganized demo commands
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";

import type { A2UIServerMessage } from "../src/types";
import { createA2UIBeforeAgentStartHandler, injectA2UISchema } from "../src/prompting";
import { parseA2UIResponse, extractSurfaceId, extractComponents } from "../src/parser";
import { validateA2UIMessages } from "../src/validation";
import { createA2UIFormComponent, type FormData } from "../src/interactive-form-v3";
import { createA2UIOverlayManager } from "../src/overlay-manager";
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

// Helper to run example forms with shared logic
async function runDemoForm(
  name: string,
  example: string,
  ctx: any,
  useOverlay: boolean = false
) {
  if (!ctx.hasUI) {
    ctx.ui.notify("Error: UI not available", "error");
    return;
  }

  const { a2uiMessages, parseError } = parseA2UIResponse(example);
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

  const componentFn = useOverlay
    ? createA2UIOverlayManager(components, ctx.ui.theme, (data) => {
        if (data) {
          ctx.ui.notify(`${name} submitted (Ctrl+U to close)`, "info");
        }
      })
    : createA2UIFormComponent(components, ctx.ui.theme);

  const formData = await ctx.ui.custom(componentFn, useOverlay ? {
    overlay: true,
    overlayOptions: {
      width: "80%",
      maxHeight: "85%",
      anchor: "center",
      margin: { top: 2 },
    },
  } : undefined);

  if (formData && !useOverlay) {
    ctx.ui.notify(`${name} submitted successfully`, "info");
  }
}

export default function (pi: ExtensionAPI) {
  console.log("[A2UI Extension] Loading - registering 10 demo commands");
  
  // NOTE: A2UI schema injection is disabled for demos
  // The demos use mocked A2UI data via /a2ui-demo commands
  // When you want LLM to generate A2UI, use: pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));
  
  // DISABLED FOR DEMO MODE:
  // pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));

  // === BASE FORM (Non-overlay for testing) ===
  pi.registerCommand("a2ui-demo form", {
    description: "Test interactive A2UI form (Phase 1) - basic contact form",
    handler: async (_args, ctx) => {
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
      await runDemoForm("Contact Form", mockA2UI, ctx, false);
    },
  });

  // === PHASE 2A DEMOS ===
  pi.registerCommand("a2ui-demo survey", {
    description: "Phase 2A: Product Survey (all component types)",
    handler: async (_args, ctx) => {
      await runDemoForm("Product Survey", getPhase2ASurveyExample(), ctx, false);
    },
  });

  pi.registerCommand("a2ui-demo settings", {
    description: "Phase 2A: Settings form (checkboxes, select, radio)",
    handler: async (_args, ctx) => {
      await runDemoForm("Settings", getPhase2ASettingsExample(), ctx, false);
    },
  });

  pi.registerCommand("a2ui-demo products", {
    description: "Phase 2A: Product list (list, radio, checkbox)",
    handler: async (_args, ctx) => {
      await runDemoForm("Product List", getPhase2AProductListExample(), ctx, false);
    },
  });

  // === PHASE 2B+ DEMOS (Image support) ===
  pi.registerCommand("a2ui-demo profile", {
    description: "Phase 2B+: Profile card with avatar image",
    handler: async (_args, ctx) => {
      await runDemoForm("Profile Card", getProfileCardExample(), ctx, false);
    },
  });

  pi.registerCommand("a2ui-demo team", {
    description: "Phase 2B+: Team selection with member avatars",
    handler: async (_args, ctx) => {
      await runDemoForm("Team Selection", getTeamSelectionExample(), ctx, false);
    },
  });

  pi.registerCommand("a2ui-demo showcase", {
    description: "Phase 2B+: Product showcase with image (e-commerce)",
    handler: async (_args, ctx) => {
      await runDemoForm("Product Showcase", getProductShowcaseExample(), ctx, false);
    },
  });

  pi.registerCommand("a2ui-demo dashboard", {
    description: "Phase 2B+: User dashboard with profile image",
    handler: async (_args, ctx) => {
      await runDemoForm("Dashboard", getDashboardExample(), ctx, false);
    },
  });

  pi.registerCommand("a2ui-demo article", {
    description: "Phase 2B+: Article with featured image and feedback",
    handler: async (_args, ctx) => {
      await runDemoForm("Article", getArticleExample(), ctx, false);
    },
  });

  // === OVERLAY DEMO ===
  pi.registerCommand("a2ui-overlay", {
    description: "Demo overlay mode with Ctrl+U toggle (press Ctrl+U to show/hide)",
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

      const componentFn = createA2UIOverlayManager(components, ctx.ui.theme, (data) => {
        if (data) {
          const entries = Object.entries(data).length;
          ctx.ui.notify(`Overlay form submitted with ${entries} fields`, "info");
        }
      });

      await ctx.ui.custom(componentFn, {
        overlay: true,
        overlayOptions: {
          width: "80%",
          maxHeight: "85%",
          anchor: "center",
          margin: { top: 2 },
        },
      });

      ctx.ui.notify("Overlay demo closed. Use /a2ui-overlay to reopen.", "info");
    },
  });
}

