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
      try {
        // Step 1: Notify start
        onUpdate?.({
          content: [{ type: "text", text: "Generating A2UI interface..." }],
          details: { phase: "generating" },
        });

        // Step 2: Call LLM with injected schema
        const llmPrompt = `Generate an A2UI interface for: ${params.description}`;
        const llmResponse = await callLLMWithA2UISchema(llmPrompt, pi);

        // Step 3: Parse response
        let { text, a2uiMessages, parseError } = parseA2UIResponse(llmResponse);

        if (parseError && a2uiAutoRetry && a2uiMaxRetries > 0) {
          onUpdate?.({
            content: [{ type: "text", text: `Parse error: ${parseError}. Retrying...` }],
            details: { phase: "retry", error: parseError },
          });

          // Retry with error feedback
          let attempts = 0;
          while (attempts < a2uiMaxRetries && (parseError || a2uiMessages.length === 0)) {
            const errorMsg = generateErrorFeedback([parseError || "No valid JSON found"], llmResponse);
            const retryResponse = await callLLMWithErrorFeedback(errorMsg, pi);
            const retryParsed = parseA2UIResponse(retryResponse);

            text = retryParsed.text;
            a2uiMessages = retryParsed.a2uiMessages;
            parseError = retryParsed.parseError;
            llmResponse = retryResponse;

            attempts++;
          }
        }

        if (!a2uiMessages.length) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to generate A2UI. ${parseError ? `Parse error: ${parseError}` : "No valid JSON found."}`,
              },
            ],
            details: { error: parseError || "No valid A2UI JSON generated" },
          };
        }

        // Step 4: Validate messages
        onUpdate?.({
          content: [{ type: "text", text: "Validating A2UI schema..." }],
          details: { phase: "validating" },
        });

        const validation = validateA2UIMessages(a2uiMessages);
        if (!validation.valid) {
          const validationErrors =
            a2uiValidationMode === "strict" ? validation.errors : validation.errors.slice(0, 3);

          return {
            content: [
              {
                type: "text",
                text: `Validation failed:\n${validationErrors.join("\n")}`,
              },
            ],
            details: {
              error: "Validation failed",
              errors: validation.errors,
            },
          };
        }

        // Step 5: Store surface state
        const surfaceId = extractSurfaceId(a2uiMessages);
        if (surfaceId) {
          const surface: A2UISurface = {
            surfaceId,
            components: extractComponents(a2uiMessages),
            dataModel: extractDataModel(a2uiMessages),
          };
          rendererState.surfaces.set(surfaceId, surface);
        }

        // Step 6: Return result
        onUpdate?.({
          content: [{ type: "text", text: "Rendering interface..." }],
          details: { phase: "rendering", messageCount: a2uiMessages.length },
        });

        return {
          content: [{ type: "text", text }],
          details: {
            a2ui: {
              messages: a2uiMessages,
              surfaceId: surfaceId || "unknown",
              dataModel: surfaceId ? rendererState.surfaces.get(surfaceId)?.dataModel : undefined,
            },
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
   * Show and render A2UI example UIs
   */
  pi.registerCommand("a2ui-examples", {
    description: "Show A2UI example UIs (form, list, dashboard, etc.)",
    handler: async (args, ctx) => {
      const exampleKey = args.trim().toLowerCase();
      const availableExamples = listExamples();

      if (!exampleKey) {
        // List all available examples
        const exampleList = availableExamples
          .map((key) => {
            const info = getExampleInfo(key);
            return `  • ${key}: ${info?.name} - ${info?.description}`;
          })
          .join("\n");

        ctx.ui.notify(
          `Available A2UI Examples:\n\n${exampleList}\n\nUsage: /a2ui-examples <name>\nExample: /a2ui-examples contact_form`,
          "info",
        );
        return;
      }

      if (!availableExamples.includes(exampleKey)) {
        ctx.ui.notify(
          `Unknown example: ${exampleKey}\n\nAvailable: ${availableExamples.join(", ")}`,
          "error",
        );
        return;
      }

      // Get and render the example
      const exampleMessages = getExample(exampleKey);
      if (!exampleMessages) {
        ctx.ui.notify(`Failed to load example: ${exampleKey}`, "error");
        return;
      }

      // Validate the example
      const validation = validateA2UIMessages(exampleMessages);
      if (!validation.valid) {
        ctx.ui.notify(
          `Example failed validation:\n${validation.errors.join("\n")}`,
          "error",
        );
        return;
      }

      // Store and render the example
      const surfaceId = extractSurfaceId(exampleMessages);
      if (surfaceId) {
        const surface: A2UISurface = {
          surfaceId,
          components: extractComponents(exampleMessages),
          dataModel: extractDataModel(exampleMessages),
        };
        rendererState.surfaces.set(surfaceId, surface);

        const info = getExampleInfo(exampleKey);
        ctx.ui.notify(
          `✓ Rendering example: ${info?.name}\n\n${info?.description}`,
          "success",
        );
      } else {
        ctx.ui.notify("Failed to extract surface ID from example", "error");
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
  // For now, return mock response for testing
  console.log("[A2UI] Calling LLM with prompt:", prompt);

  return `
I'll create a simple interface for you.

\`\`\`json
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "demo"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "demo",
    "components": [
      {"id": "root", "component": "Column", "children": ["title", "content"]},
      {"id": "title", "component": "Text", "text": "Welcome to A2UI"},
      {"id": "content", "component": "Text", "text": "This is a simple interface generated from A2UI."}
    ]
  }}
]
\`\`\`
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
