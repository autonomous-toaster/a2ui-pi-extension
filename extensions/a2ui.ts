/**
 * A2UI Extension for Pi Coding Agent - V3
 * With overlay support and demo commands via /a2ui-demo <type>
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

// Demo examples map
const demoExamples: Record<string, { name: string; example: string }> = {
  form: {
    name: "Contact Form",
    example: `
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
`,
  },
  survey: { name: "Product Survey", example: getPhase2ASurveyExample() },
  settings: { name: "Settings", example: getPhase2ASettingsExample() },
  products: { name: "Product List", example: getPhase2AProductListExample() },
  profile: { name: "Profile Card", example: getProfileCardExample() },
  team: { name: "Team Selection", example: getTeamSelectionExample() },
  showcase: { name: "Product Showcase", example: getProductShowcaseExample() },
  dashboard: { name: "Dashboard", example: getDashboardExample() },
  article: { name: "Article", example: getArticleExample() },
};

export default function (pi: ExtensionAPI) {
  console.error("[A2UI Extension] Loading");
  console.error("[A2UI] imports:", {
    parseA2UIResponse: typeof parseA2UIResponse,
    validateA2UIMessages: typeof validateA2UIMessages,
    extractComponents: typeof extractComponents,
    createA2UIFormComponent: typeof createA2UIFormComponent,
  });

  // NOTE: A2UI schema injection is disabled for demos
  // The demos use mocked A2UI data via /a2ui-demo <type>
  // When you want LLM to generate A2UI, use: pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));
  
  // DISABLED FOR DEMO MODE:
  // pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));

  // === MAIN DEMO COMMAND ===
  pi.registerCommand("a2ui-demo", {
    description: "Show A2UI demo: /a2ui-demo [form|survey|settings|products|profile|team|showcase|dashboard|article|overlay]",
    handler: async (args, ctx) => {
      const demoType = args.trim() || "form";
      console.error(`[A2UI] /a2ui-demo ${demoType} handler called`);
      
      if (demoType === "overlay") {
        // Special handling for overlay
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

        ctx.ui.notify("Overlay demo closed. Use /a2ui-demo overlay to reopen.", "info");
        return;
      }

      const demo = demoExamples[demoType];
      if (!demo) {
        ctx.ui.notify(`Unknown demo type: ${demoType}. Available: form, survey, settings, products, profile, team, showcase, dashboard, article, overlay`, "error");
        return;
      }

      console.error(`[A2UI] Running demo: ${demo.name}`);
      await runDemoForm(demo.name, demo.example, ctx, false);
    },
  });

  console.error("[A2UI Extension] Registered /a2ui-demo command");
  console.error("[A2UI Extension] Usage: /a2ui-demo [form|survey|settings|products|profile|team|showcase|dashboard|article|overlay]");
}
