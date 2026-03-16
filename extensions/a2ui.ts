/**
 * A2UI Extension for Pi Coding Agent
 * Enables agents to generate interactive user interfaces using A2UI protocol
 *
 * Features:
 * - System prompt injection with A2UI schema
 * - LLM output parsing for A2UI JSON blocks
 * - Message validation and error feedback
 * - TUI rendering adapter (A2UI → pi-tui components)
 * - Interactive surface state management
 */

import type { ExtensionAPI, ExtensionContext, Theme } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import { StringEnum } from "@mariozechner/pi-ai";

import type { A2UIServerMessage, A2UISurface, A2UIRendererState } from "../src/types";
import {
  createA2UIBeforeAgentStartHandler,
  generateErrorFeedback,
  injectA2UISchema,
  shouldUseA2UI,
} from "../src/prompting";
import { parseA2UIResponse, extractSurfaceId, extractComponents, extractDataModel } from "../src/parser";
import { validateA2UIMessages, validateComponentReferences } from "../src/validation";
import { a2uiToTUI, renderA2UISurface, type ComponentRenderContext } from "../src/adapter";
import { listExamples, getExample, getExampleInfo } from "../src/examples";
import { InteractiveA2UIForm, type FormData } from "../src/interactive-form";

// ===== Extension State =====

let rendererState: A2UIRendererState = {
  surfaces: new Map(),
};

let a2uiValidationMode = "strict"; // strict | lenient
let a2uiAutoRetry = true;
let a2uiMaxRetries = 2;

// ===== Main Extension Export =====

export default function (pi: ExtensionAPI) {
  // ===== Event Handlers =====

  /**
   * Inject A2UI schema into system prompt for UI-related requests
   */
  pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));

  /**
   * Clear surfaces on session start
   */
  pi.on("session_start", async (_event, _ctx) => {
    rendererState.surfaces.clear();
  });

  // ===== Custom Tool Registration =====

  /**
   * Main A2UI tool - generates and manages interactive UIs
   */
  pi.registerTool({
    name: "a2ui_generate",
    label: "A2UI Generator",
    description:
      "Generate interactive A2UI interfaces. When you want to create a UI, use this tool.",
    promptSnippet: "Generate an A2UI interface with form fields, buttons, and containers",
    promptGuidelines: [
      "Use this tool when the user asks to build or display an interactive UI.",
      "The tool handles parsing, validation, and rendering of A2UI JSON.",
      "Describe what UI you're building in plain text, then generate the A2UI JSON.",
      "The tool will validate your JSON and retry with error feedback if needed.",
    ],

    parameters: Type.Object({
      description: Type.String({
        description: "What UI to generate (e.g., 'contact form with name and email fields')",
      }),
      context: Type.Optional(Type.Object({}, { description: "Optional data context" })),
    }),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      if (!ctx.hasUI) {
        return {
          content: [{ type: "text", text: "Error: UI not available. This tool requires interactive mode." }],
          details: { error: "No UI" },
        };
      }

      try {
        // Step 1: Generate A2UI from LLM
        onUpdate?.({
          content: [{ type: "text", text: "Generating form..." }],
          details: { phase: "generating" },
        });

        const llmPrompt = `Generate an A2UI interface for: ${params.description}`;
        const llmResponse = await callLLMWithA2UISchema(llmPrompt, pi);

        // Step 2: Parse response
        let { text, a2uiMessages, parseError } = parseA2UIResponse(llmResponse);

        if (parseError && a2uiAutoRetry && a2uiMaxRetries > 0) {
          let attempts = 0;
          while (attempts < a2uiMaxRetries && (parseError || a2uiMessages.length === 0)) {
            const errorMsg = generateErrorFeedback([parseError || "No valid JSON found"], llmResponse);
            const retryResponse = await callLLMWithErrorFeedback(errorMsg, pi);
            const retryParsed = parseA2UIResponse(retryResponse);
            text = retryParsed.text;
            a2uiMessages = retryParsed.a2uiMessages;
            parseError = retryParsed.parseError;
            attempts++;
          }
        }

        if (!a2uiMessages.length) {
          return {
            content: [{ type: "text", text: `Failed to generate form. ${parseError ? `Error: ${parseError}` : "No valid JSON."}` }],
            details: { error: parseError || "No A2UI generated" },
          };
        }

        // Step 3: Validate
        const validation = validateA2UIMessages(a2uiMessages);
        if (!validation.valid) {
          return {
            content: [{ type: "text", text: `Validation failed:\n${validation.errors.join("\n")}` }],
            details: { error: "Validation failed", errors: validation.errors },
          };
        }

        // Step 4: Extract components
        const surfaceId = extractSurfaceId(a2uiMessages);
        const components = extractComponents(a2uiMessages);

        console.log("[A2UI] Extracted:", { surfaceId, componentCount: components.size, messageCount: a2uiMessages.length });

        if (!surfaceId || components.size === 0) {
          console.log("[A2UI] ERROR: No surfaceId or components");
          return {
            content: [{ type: "text", text: "No components found in A2UI" }],
            details: { error: "No components" },
          };
        }

        // Step 5: Show interactive form via ctx.ui.custom()
        onUpdate?.({
          content: [{ type: "text", text: "Showing form..." }],
          details: { phase: "rendering" },
        });

        console.log("[A2UI] About to show form via ctx.ui.custom()");

        const formData = await ctx.ui.custom<FormData | null>(
          (tui, theme, _kb, done) => {
            console.log("[A2UI] In ctx.ui.custom callback, creating form");
            const form = new InteractiveA2UIForm(components, theme);

            form.onSubmit = (data) => {
              console.log("[A2UI] Form submitted with data", data);
              done(data);
            };

            form.onCancel = () => {
              console.log("[A2UI] Form cancelled");
              done(null);
            };

            return {
              render: (width) => form.render(width),
              invalidate: () => form.invalidate(),
              handleInput: (data) => {
                console.log("[A2UI Tool wrapper] handleInput called with:", JSON.stringify(data));
                form.handleInput(data);
                tui.requestRender();
              },
            };
          },
          { overlay: true }
        );

        console.log("[A2UI] Form closed, formData:", formData);

        return {
          content: [
            {
              type: "text",
              text: `Form submitted:\n${JSON.stringify(submission, null, 2)}`,
            },
          ],
          details: {
            formSubmitted: true,
            data: submission,
            rawData: formData,
          },
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error: ${errorMsg}` }],
          details: { error: errorMsg },
        };
      }
    },


    /**
     * Custom rendering of A2UI results
     */
    renderResult(result, { expanded, isPartial }, theme) {
      // Handle streaming
      if (isPartial) {
        return new Text(theme.fg("warning", "Generating interface..."), 0, 0);
      }

      // Handle errors
      if (result.details?.error) {
        return new Text(theme.fg("error", `Error: ${result.details.error}`), 0, 0);
      }

      if (!result.details?.a2ui?.messages?.length) {
        return new Text("No A2UI messages to render", 0, 0);
      }

      // Render A2UI surface
      const { surfaceId } = result.details.a2ui;
      const surface = rendererState.surfaces.get(surfaceId);

      if (!surface) {
        return new Text(`Surface not found: ${surfaceId}`, 0, 0);
      }

      try {
        const renderContext: ComponentRenderContext = {
          theme,
          dataModel: surface.dataModel,
          components: surface.components,
        };

        return renderA2UISurface(surfaceId, renderContext);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return new Text(theme.fg("error", `Render error: ${errorMsg}`), 0, 0);
      }
    },
  });

  // ===== Configuration Commands =====

  /**
   * Configure A2UI validation mode
   */
  pi.registerCommand("a2ui-config", {
    description: "Configure A2UI extension settings",
    handler: async (args, ctx) => {
      const parts = args.split(" ");
      const setting = parts[0];
      const value = parts[1];

      switch (setting) {
        case "validation":
          if (["strict", "lenient"].includes(value)) {
            a2uiValidationMode = value;
            ctx.ui.notify(`A2UI validation mode: ${value}`, "info");
          } else {
            ctx.ui.notify("Invalid validation mode. Use: strict or lenient", "error");
          }
          break;

        case "auto-retry":
          if (["on", "off", "true", "false"].includes(value.toLowerCase())) {
            a2uiAutoRetry = ["on", "true"].includes(value.toLowerCase());
            ctx.ui.notify(`A2UI auto-retry: ${a2uiAutoRetry ? "enabled" : "disabled"}`, "info");
          } else {
            ctx.ui.notify("Use: on/off or true/false", "error");
          }
          break;

        case "max-retries":
          const maxRetries = parseInt(value, 10);
          if (!isNaN(maxRetries) && maxRetries >= 0) {
            a2uiMaxRetries = maxRetries;
            ctx.ui.notify(`A2UI max retries: ${maxRetries}`, "info");
          } else {
            ctx.ui.notify("Invalid number. Use: a2ui-config max-retries N", "error");
          }
          break;

        default:
          ctx.ui.notify(
            `Unknown setting: ${setting}\nAvailable: validation, auto-retry, max-retries`,
            "warning",
          );
      }
    },
  });

  /**
   * Show A2UI extension info and status
   */
  pi.registerCommand("a2ui-status", {
    description: "Show A2UI extension status",
    handler: async (_args, ctx) => {
      const surfaceCount = rendererState.surfaces.size;
      const statusMsg =
        `A2UI Extension Status:\n` +
        `  Active surfaces: ${surfaceCount}\n` +
        `  Validation mode: ${a2uiValidationMode}\n` +
        `  Auto-retry: ${a2uiAutoRetry ? "enabled" : "disabled"}\n` +
        `  Max retries: ${a2uiMaxRetries}`;

      ctx.ui.notify(statusMsg, "info");
    },
  });

  /**
   * Clear all A2UI surfaces
   */
  pi.registerCommand("a2ui-clear", {
    description: "Clear all A2UI surfaces",
    handler: async (_args, ctx) => {
      const count = rendererState.surfaces.size;
      rendererState.surfaces.clear();
      ctx.ui.notify(`Cleared ${count} A2UI surface(s)`, "info");
    },
  });

  /**
   * A2UI Examples tool - display pre-built example UIs
   */
  pi.registerTool({
    name: "a2ui_examples",
    label: "A2UI Examples",
    description: "View and render pre-built A2UI example UIs",
    promptSnippet: "Show example UIs",

    parameters: Type.Object({
      example: Type.Optional(
        Type.String({
          description: "Example name (contact_form, product_list, dashboard, login_form, settings_panel) or leave empty to list",
        }),
      ),
    }),

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const exampleKey = params.example?.toLowerCase();
      const availableExamples = listExamples();

      // List mode
      if (!exampleKey) {
        const exampleList = availableExamples
          .map((key) => {
            const info = getExampleInfo(key);
            return `• **${info?.name}**: ${info?.description}`;
          })
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `# Available A2UI Examples\n\n${exampleList}`,
            },
          ],
          details: { action: "list", count: availableExamples.length },
        };
      }

      // Validate example exists
      if (!availableExamples.includes(exampleKey)) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown example: ${exampleKey}\n\nAvailable: ${availableExamples.join(", ")}`,
            },
          ],
          details: { error: `Unknown example: ${exampleKey}` },
        };
      }

      // Get example
      const exampleMessages = getExample(exampleKey);
      if (!exampleMessages) {
        return {
          content: [{ type: "text", text: `Failed to load example: ${exampleKey}` }],
          details: { error: "Failed to load example" },
        };
      }

      // Validate
      const validation = validateA2UIMessages(exampleMessages);
      if (!validation.valid) {
        return {
          content: [
            {
              type: "text",
              text: `Validation failed:\n${validation.errors.join("\n")}`,
            },
          ],
          details: { error: "Validation failed", errors: validation.errors },
        };
      }

      // Extract and store surface
      const surfaceId = extractSurfaceId(exampleMessages);
      if (!surfaceId) {
        return {
          content: [{ type: "text", text: "Failed to extract surface ID" }],
          details: { error: "No surface ID found" },
        };
      }

      const surface: A2UISurface = {
        surfaceId,
        components: extractComponents(exampleMessages),
        dataModel: extractDataModel(exampleMessages),
      };
      rendererState.surfaces.set(surfaceId, surface);

      const info = getExampleInfo(exampleKey);

      return {
        content: [
          {
            type: "text",
            text: `**${info?.name}**: ${info?.description}`,
          },
        ],
        details: {
          a2ui: {
            messages: exampleMessages,
            surfaceId,
            dataModel: surface.dataModel,
          },
        },
      };
    },

    renderResult(result, { expanded, isPartial }, theme) {
      // Handle streaming
      if (isPartial) {
        return new Text(theme.fg("warning", "Loading example..."), 0, 0);
      }

      // Handle list mode (no A2UI)
      if (!result.details?.a2ui?.messages?.length) {
        return new Text(result.content[0]?.text || "No content", 0, 0);
      }

      // Render A2UI surface
      const { surfaceId } = result.details.a2ui;
      const surface = rendererState.surfaces.get(surfaceId);

      if (!surface) {
        return new Text(`Surface not found: ${surfaceId}`, 0, 0);
      }

      try {
        const renderContext: ComponentRenderContext = {
          theme,
          dataModel: surface.dataModel,
          components: surface.components,
        };

        return renderA2UISurface(surfaceId, renderContext);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return new Text(theme.fg("error", `Render error: ${errorMsg}`), 0, 0);
      }
    },
  });
}

// ===== Helper Functions =====

/**
 * Call LLM with A2UI schema injected into prompt
 */
async function callLLMWithA2UISchema(prompt: string, pi: ExtensionAPI): Promise<string> {
  // This is a placeholder - in real usage, would call the actual LLM
  // For now, return mock response with actual form fields for testing
  console.log("[A2UI] Calling LLM with prompt:", prompt);

  return `
I'll create an interactive form for you.

---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "contact_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "contact_form",
    "components": [
      {
        "id": "form",
        "component": "Column",
        "children": ["title", "name_field", "email_field", "message_field", "buttons"]
      },
      {"id": "title", "component": "Text", "text": "Contact Form", "attributes": {"textAlignment": "center"}},
      {
        "id": "name_field",
        "component": "TextField",
        "label": "Your Name",
        "placeholder": "Enter your name"
      },
      {
        "id": "email_field",
        "component": "TextField",
        "label": "Email Address",
        "placeholder": "Enter your email"
      },
      {
        "id": "message_field",
        "component": "TextField",
        "label": "Message",
        "placeholder": "Enter your message"
      },
      {
        "id": "buttons",
        "component": "Row",
        "children": ["submit_btn", "cancel_btn"]
      },
      {
        "id": "submit_btn",
        "component": "Button",
        "child": "submit_label",
        "attributes": {"primary": true}
      },
      {
        "id": "submit_label",
        "component": "Text",
        "text": "Submit"
      },
      {
        "id": "cancel_btn",
        "component": "Button",
        "child": "cancel_label"
      },
      {
        "id": "cancel_label",
        "component": "Text",
        "text": "Cancel"
      }
    ]
  }}
]
---a2ui_JSON---
  `;
}

/**
 * Call LLM with error feedback for self-correction
 */
async function callLLMWithErrorFeedback(feedback: string, pi: ExtensionAPI): Promise<string> {
  console.log("[A2UI] Calling LLM with error feedback");
  // Placeholder - would implement actual LLM call with feedback
  return callLLMWithA2UISchema("Please fix the previous A2UI JSON.", pi);
}
