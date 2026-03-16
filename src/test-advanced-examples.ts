/**
 * Test commands for advanced A2UI examples
 * These demonstrate images and advanced layouts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { parseA2UIResponse, extractComponents } from "./parser";
import { validateA2UIMessages } from "./validation";
import { createA2UIFormComponent } from "./interactive-form-v2";
import {
  getProfileCardExample,
  getTeamSelectionExample,
  getProductShowcaseExample,
  getDashboardExample,
  getArticleExample,
} from "./examples-advanced";

export function registerAdvancedExamples(pi: ExtensionAPI) {
  // Profile Card with Image
  pi.registerCommand("a2ui-profile", {
    description: "Phase 2B+: Profile card with avatar image",
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
        ctx.ui.notify("Profile updated", "success");
      } else {
        ctx.ui.notify("Profile update cancelled", "info");
      }
    },
  });

  // Team Selection with Multiple Images
  pi.registerCommand("a2ui-team", {
    description: "Phase 2B+: Team selection with member avatars",
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
        ctx.ui.notify("Team selected", "success");
      } else {
        ctx.ui.notify("Team selection cancelled", "info");
      }
    },
  });

  // Product Showcase
  pi.registerCommand("a2ui-product-showcase", {
    description: "Phase 2B+: Product showcase with image",
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
        ctx.ui.notify("Product added to cart", "success");
      } else {
        ctx.ui.notify("Shopping cancelled", "info");
      }
    },
  });

  // Dashboard
  pi.registerCommand("a2ui-dashboard", {
    description: "Phase 2B+: User dashboard with profile image",
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
        ctx.ui.notify("Preferences saved", "success");
      } else {
        ctx.ui.notify("Preferences not saved", "info");
      }
    },
  });

  // Article with Featured Image
  pi.registerCommand("a2ui-article", {
    description: "Phase 2B+: Article with featured image",
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
        ctx.ui.notify("Feedback submitted", "success");
      } else {
        ctx.ui.notify("Feedback cancelled", "info");
      }
    },
  });
}
