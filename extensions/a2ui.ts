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

// Helper to compress form data into readable format (minimize context usage)
function compressFormData(formData: FormData): string {
  const lines: string[] = [];
  
  for (const [key, value] of Object.entries(formData)) {
    if (value === null || value === undefined || value === "") {
      continue; // Skip empty values
    }
    
    // Format value based on type
    let formatted = value;
    if (Array.isArray(value)) {
      formatted = value.join(", ");
    } else if (typeof value === "object") {
      formatted = JSON.stringify(value);
    } else {
      formatted = String(value);
    }
    
    // Truncate very long values
    if (formatted.length > 200) {
      formatted = formatted.substring(0, 200) + "...";
    }
    
    lines.push(`• ${key}: ${formatted}`);
  }
  
  return lines.length > 0 ? lines.join("\n") : "(no data)";
}

// Helper to run example forms with shared logic
async function runDemoForm(
  name: string,
  example: string,
  ctx: any
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

  // Always use regular form component (no overlay)
  const componentFn = createA2UIFormComponent(components, ctx.ui.theme);

  const formData = await ctx.ui.custom(componentFn);

  if (formData) {
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
  textarea: {
    name: "TextArea Demo",
    example: `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "textarea_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "textarea_form",
    "components": [
      {"id": "title_label", "component": "Text", "text": "Feedback Form"},
      {"id": "name_field", "component": "TextField", "label": "Your Name", "placeholder": "Enter your name"},
      {"id": "feedback_field", "component": "TextArea", "label": "Feedback", "placeholder": "Enter your feedback (press Enter for new lines)", "rows": 4},
      {"id": "notes_field", "component": "TextArea", "label": "Additional Notes", "placeholder": "Optional notes", "rows": 3},
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Submit Feedback"},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Cancel"}
    ]
  }}
]
---a2ui_JSON---
`,
  },
  slider: {
    name: "Slider Demo",
    example: `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "slider_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "slider_form",
    "components": [
      {"id": "title_label", "component": "Text", "text": "Settings - Adjust Values"},
      {"id": "volume_label", "component": "Text", "text": "Volume: Use arrow keys or type numbers"},
      {"id": "volume_slider", "component": "Slider", "label": "Volume", "value": 50, "min": 0, "max": 100, "step": 5},
      {"id": "brightness_label", "component": "Text", "text": "Brightness: Use arrow keys or type numbers"},
      {"id": "brightness_slider", "component": "Slider", "label": "Brightness", "value": 75, "min": 0, "max": 100, "step": 1},
      {"id": "price_label", "component": "Text", "text": "Price Range: Set your budget"},
      {"id": "price_slider", "component": "Slider", "label": "Max Price ($)", "value": 500, "min": 0, "max": 1000, "step": 50},
      {"id": "difficulty_label", "component": "Text", "text": "Difficulty Level"},
      {"id": "difficulty_slider", "component": "Slider", "label": "Difficulty", "value": 5, "min": 1, "max": 10, "step": 1},
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Save Settings"},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Cancel"}
    ]
  }}
]
---a2ui_JSON---
`,
  },
  tabs: {
    name: "Tabs Demo",
    example: `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "tabs_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "tabs_form",
    "components": [
      {"id": "title_label", "component": "Text", "text": "Documentation - Use arrow keys to switch tabs"},
      {"id": "docs_tabs", "component": "Tabs", "defaultTab": "overview", "tabs": [
        {"id": "overview", "label": "Overview", "content": "Welcome to the documentation. This is a quick start guide."},
        {"id": "install", "label": "Installation", "content": "Install via: npm install package"},
        {"id": "api", "label": "API Docs", "content": "Methods: connect(), disconnect(), on(), emit()"},
        {"id": "examples", "label": "Examples", "content": "const app = new App(); app.start();"}
      ]},
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Done"},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Close"}
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
  accordion: {
    name: "Accordion Demo",
    example: `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "accordion_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "accordion_form",
    "components": [
      {"id": "title_label", "component": "Text", "text": "FAQ - Use Space to toggle, arrow keys to navigate"},
      {"id": "faq_accordion", "component": "Accordion", "sections": [
        {"id": "general", "title": "General Questions", "content": "What is this product? How does it work? Visit us for more info.", "expanded": true},
        {"id": "pricing", "title": "Pricing & Plans", "content": "We offer 3 plans: Starter, Pro, and Enterprise. Prices start at $9/month.", "expanded": false},
        {"id": "support", "title": "Support & Contact", "content": "Email: support@example.com. Phone: 1-800-EXAMPLE.", "expanded": false},
        {"id": "technical", "title": "Technical Details", "content": "Built with REST API and WebSocket. Cloud-based infrastructure.", "expanded": false}
      ]},
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Close"},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Cancel"}
    ]
  }}
]
---a2ui_JSON---
`,
  },
  toggle: {
    name: "Toggle Demo",
    example: `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "toggle_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "toggle_form",
    "components": [
      {"id": "title_label", "component": "Text", "text": "Preferences - Use Space to toggle"},
      {"id": "notifications_toggle", "component": "Toggle", "label": "Enable Notifications", "checked": true},
      {"id": "darkmode_toggle", "component": "Toggle", "label": "Dark Mode", "checked": false},
      {"id": "analytics_toggle", "component": "Toggle", "label": "Send Analytics", "checked": true},
      {"id": "auto_save_toggle", "component": "Toggle", "label": "Auto-save Changes", "checked": false},
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Save"},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Cancel"}
    ]
  }}
]
---a2ui_JSON---
`,
  },
  numberinput: {
    name: "NumberInput Demo",
    example: `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "number_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "number_form",
    "components": [
      {"id": "title_label", "component": "Text", "text": "Event Details - Enter numbers"},
      {"id": "attendees_label", "component": "Text", "text": "Expected attendees (use ↑↓ or type)"},
      {"id": "attendees", "component": "NumberInput", "label": "Attendees", "value": 50, "min": 0, "max": 10000, "step": 10},
      {"id": "hours_label", "component": "Text", "text": "Event duration in hours"},
      {"id": "duration", "component": "NumberInput", "label": "Duration (hours)", "value": 2, "min": 1, "max": 24},
      {"id": "cost_label", "component": "Text", "text": "Budget ($)"},
      {"id": "budget", "component": "NumberInput", "label": "Budget", "value": 1000, "min": 0, "max": 100000, "step": 100},
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
  rating: {
    name: "Rating Demo",
    example: `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "rating_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "rating_form",
    "components": [
      {"id": "title_label", "component": "Text", "text": "Feedback Survey - Press 1-5 to rate"},
      {"id": "product_label", "component": "Text", "text": "How would you rate our product?"},
      {"id": "product_rating", "component": "Rating", "label": "Product Quality", "value": 0, "maxStars": 5},
      {"id": "service_label", "component": "Text", "text": "How would you rate our service?"},
      {"id": "service_rating", "component": "Rating", "label": "Service Quality", "value": 0, "maxStars": 5},
      {"id": "support_label", "component": "Text", "text": "How would you rate our support?"},
      {"id": "support_rating", "component": "Rating", "label": "Support Quality", "value": 0, "maxStars": 5},
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Submit Feedback"},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Cancel"}
    ]
  }}
]
---a2ui_JSON---
`,
  },
  combobox: {
    name: "Combobox Demo",
    example: `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "combo_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "combo_form",
    "components": [
      {"id": "title_label", "component": "Text", "text": "Job Application - Type to search options, arrow keys to select"},
      {"id": "country_label", "component": "Text", "text": "Country (type to filter, arrows to select)"},
      {"id": "country_combo", "component": "Combobox", "label": "Country", "value": "USA", "options": [{"label": "USA", "value": "usa"}, {"label": "Canada", "value": "ca"}, {"label": "UK", "value": "uk"}, {"label": "Australia", "value": "au"}]},
      {"id": "role_label", "component": "Text", "text": "Role (type to filter, arrows to select)"},
      {"id": "role_combo", "component": "Combobox", "label": "Role", "value": "Software Engineer", "options": [{"label": "Software Engineer", "value": "engineer"}, {"label": "Product Manager", "value": "manager"}, {"label": "Designer", "value": "designer"}, {"label": "Sales", "value": "sales"}]},
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Apply"},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Cancel"}
    ]
  }}
]
---a2ui_JSON---
`,
  },
  datepicker: {
    name: "DatePicker Demo",
    example: `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "date_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "date_form",
    "components": [
      {"id": "title_label", "component": "Text", "text": "Event Booking - Enter dates as YYYY-MM-DD"},
      {"id": "start_label", "component": "Text", "text": "Event start date"},
      {"id": "start_date", "component": "DatePicker", "label": "Start Date", "placeholder": "2026-01-15"},
      {"id": "end_label", "component": "Text", "text": "Event end date"},
      {"id": "end_date", "component": "DatePicker", "label": "End Date", "placeholder": "2026-01-20"},
      {"id": "deadline_label", "component": "Text", "text": "Registration deadline"},
      {"id": "deadline_date", "component": "DatePicker", "label": "Deadline", "placeholder": "2026-01-10"},
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Book Event"},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Cancel"}
    ]
  }}
]
---a2ui_JSON---
`,
  },
  card: {
    name: "Card Layout Demo",
    example: `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "card_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "card_form",
    "components": [
      {"id": "main_card", "component": "Card", "children": ["header_label", "form_section", "buttons_section"]},
      {"id": "header_label", "component": "Text", "text": "User Registration"},
      {"id": "form_section", "component": "Column", "children": ["name_field", "email_field"]},
      {"id": "name_field", "component": "TextField", "label": "Full Name", "placeholder": "John Doe"},
      {"id": "email_field", "component": "TextField", "label": "Email", "placeholder": "john@example.com"},
      {"id": "buttons_section", "component": "Row", "children": ["submit_btn", "cancel_btn"]},
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Register"},
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Cancel"}
    ]
  }}
]
---a2ui_JSON---
`,
  },
  showcase: { name: "Product Showcase", example: getProductShowcaseExample() },
  dashboard: { name: "Dashboard", example: getDashboardExample() },
  article: { name: "Article", example: getArticleExample() },
};

export default function (pi: ExtensionAPI) {
  // NOTE: A2UI schema injection is disabled for demos
  // The demos use mocked A2UI data via /a2ui-demo <type>
  // When you want LLM to generate A2UI, use: pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));
  
  // DISABLED FOR DEMO MODE:
  pi.on("before_agent_start", createA2UIBeforeAgentStartHandler({ enabled: true }));

  // Track last displayed form for reopening after cancellation
  let lastFormComponents: Map<string, any> | null = null;

  // Register tool: display_a2ui_form
  // LLM calls this tool with A2UI JSON to display forms
  pi.registerTool({
    name: "display_a2ui_form",
    label: "Display A2UI Form",
    description: "Display an interactive A2UI form to the user",
    parameters: Type.Object({
      a2ui_json: Type.String({
        description: "A2UI JSON as a string (array of messages)",
      }),
    }),
    async execute(toolCallId, params: any, signal, onUpdate, ctx) {
      console.error("[A2UI Tool] Received display_a2ui_form call");
      
      const jsonStr = params.a2ui_json;
      
      try {
        // Parse the JSON string
        const a2uiMessages = JSON.parse(jsonStr) as A2UIServerMessage[];
        console.error("[A2UI Tool] Parsed", a2uiMessages.length, "messages");

        // Validate
        const validation = validateA2UIMessages(a2uiMessages);
        if (!validation.valid) {
          return {
            content: [{ type: "text", text: `Validation error: ${validation.errors.join(", ")}` }],
            details: {},
          };
        }

        // Extract components
        const components = extractComponents(a2uiMessages);
        if (!components.size) {
          return {
            content: [{ type: "text", text: "No components found in A2UI JSON" }],
            details: {},
          };
        }

        console.error("[A2UI Tool] Displaying form with", components.size, "components");

        // Store components for potential reopen via keyboard shortcut
        lastFormComponents = components;

        // Display form
        const componentFn = createA2UIFormComponent(components, ctx.ui.theme);
        const formData = await ctx.ui.custom(componentFn);

        if (formData) {
          console.error("[A2UI Tool] Form submitted with data");
          
          // Clear stored form after successful submission
          lastFormComponents = null;
          
          // Compress formData into readable format to minimize context usage
          const compressedData = compressFormData(formData);
          
          return {
            content: [{ 
              type: "text", 
              text: `Form submitted. User provided:\n${compressedData}` 
            }],
            details: {},
          };
        } else {
          console.error("[A2UI Tool] Form cancelled by user - press Ctrl+Shift+R to reopen");
          // When form is cancelled, return empty content
          // User can press Ctrl+Shift+R to reopen the form without re-triggering LLM
          ctx.ui.notify("Form cancelled. Press Ctrl+Shift+R to reopen.", "info");
          return {
            content: [{ type: "text", text: "" }],
            details: {},
          };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[A2UI Tool] Error:", message);
        return {
          content: [{ type: "text", text: `Failed to display form: ${message}` }],
          details: {},
          isError: true,
        };
      }
    },
  });

  // Register keyboard shortcut to reopen last form
  pi.registerShortcut("ctrl+shift+r", {
    label: "Reopen A2UI Form",
    description: "Reopen the last form if it was cancelled",
    handler: async (ctx) => {
      if (!lastFormComponents || lastFormComponents.size === 0) {
        ctx.ui.notify("No form to reopen", "info");
        return;
      }

      console.error("[A2UI Shortcut] Reopening last form");
      
      // Display the form again
      const componentFn = createA2UIFormComponent(lastFormComponents, ctx.ui.theme);
      const formData = await ctx.ui.custom(componentFn);

      if (formData) {
        console.error("[A2UI Shortcut] Form resubmitted with data");
        ctx.ui.notify("Form data captured. You can now reference it in your response.", "success");
        
        // Show the compressed data for reference
        const compressedData = compressFormData(formData);
        ctx.ui.notify(`Form data:\n${compressedData}`, "info");
        
        // Clear stored form after successful submission
        lastFormComponents = null;
      } else {
        console.error("[A2UI Shortcut] Form cancelled again");
        ctx.ui.notify("Form cancelled", "info");
      }
    },
  });

  // === MAIN DEMO COMMAND ===
  pi.registerCommand("a2ui-demo", {
    description: `/a2ui-demo [form|textarea|slider|tabs|accordion|toggle|numberinput|rating|combobox|datepicker|card|survey|settings|products|profile|team|showcase|dashboard|article]`,
    handler: async (args, ctx) => {
      const demoType = args.trim() || "form";

      const demo = demoExamples[demoType];
      if (!demo) {
        ctx.ui.notify(`Unknown demo type: ${demoType}. Available: form, textarea, slider, tabs, accordion, toggle, numberinput, rating, combobox, datepicker, card, survey, settings, products, profile, team, showcase, dashboard, article`, "error");
        return;
      }

      await runDemoForm(demo.name, demo.example, ctx);
    },
  });
}
