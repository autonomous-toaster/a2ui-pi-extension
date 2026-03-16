/**
 * Interactive A2UI Form Component - V2
 * 
 * Rewritten to follow the question.ts pattern:
 * - Form logic inline in ctx.ui.custom() callback
 * - Simple state variables (no class)
 * - Explicit refresh() function
 * - Direct handleInput closure
 */

import { matchesKey, Key, truncateToWidth } from "@mariozechner/pi-tui";
import type { TextFieldComponent, ButtonComponent, TextComponent, A2UIComponent } from "./types";

export interface FormData {
  [fieldId: string]: string;
}

/**
 * Create an interactive form component for ctx.ui.custom()
 * 
 * Usage:
 *   const formData = await ctx.ui.custom(createA2UIFormComponent(components, theme))
 */
export function createA2UIFormComponent(
  components: Map<string, A2UIComponent>,
  theme: any
) {
  return (tui: any, _theme: any, _kb: any, done: (data: FormData | null) => void) => {
    // === STATE ===
    const fieldIds: string[] = [];
    const buttonIds: string[] = [];
    let focusedFieldIndex = 0;
    let focusedButtonIndex = -1; // -1 = fields, >=0 = buttons
    const fieldValues = new Map<string, string>();
    let cachedLines: string[] | undefined;
    let cachedWidth: number | undefined;

    // Scan for TextField and Button components
    for (const [id, comp] of components) {
      if (comp.component === "TextField") {
        fieldIds.push(id);
        fieldValues.set(id, "");
      } else if (comp.component === "Button") {
        buttonIds.push(id);
      }
    }

    // === HELPERS ===
    function refresh() {
      cachedLines = undefined;
      cachedWidth = undefined;
      tui.requestRender();
    }

    // === RENDER ===
    function render(width: number): string[] {
      if (cachedLines && cachedWidth === width) {
        return cachedLines;
      }

      const lines: string[] = [];
      const add = (s: string) => lines.push(truncateToWidth(s, width));

      // Top border
      add(theme.fg("accent", "┌" + "─".repeat(Math.max(0, width - 2)) + "┐"));

      // Title
      add(theme.fg("accent", "  Interactive Form"));
      add("");

      // Render fields
      for (let i = 0; i < fieldIds.length; i++) {
        const fieldId = fieldIds[i];
        const isFocused = focusedButtonIndex === -1 && i === focusedFieldIndex;
        const field = components.get(fieldId) as TextFieldComponent;
        const label = field?.label || fieldId;
        const value = fieldValues.get(fieldId) || "";

        // Label
        const labelColor = isFocused ? "success" : "text";
        add(theme.fg(labelColor, `  ${label}:`));

        // Input field
        const displayValue = value || "(empty)";
        const prefix = isFocused ? theme.fg("success", "> ") : "  ";
        add(prefix + theme.fg("muted", displayValue));
        add("");
      }

      // Buttons
      if (buttonIds.length > 0) {
        const buttonTexts: string[] = [];
        for (let i = 0; i < buttonIds.length; i++) {
          const buttonId = buttonIds[i];
          const btn = components.get(buttonId) as ButtonComponent;
          let label = btn?.id || "Button";

          // Try to get label from child Text component
          if (btn?.child) {
            const child = components.get(btn.child) as TextComponent;
            if (child) label = child.text;
          }

          const isFocused = focusedButtonIndex === i;
          const buttonText = `[ ${label} ]`;
          const styled = isFocused
            ? theme.bg("selectedBg", theme.fg("text", buttonText))
            : theme.fg("accent", buttonText);

          buttonTexts.push(styled);
        }
        add("  " + buttonTexts.join("  "));
      }

      add("");
      add(
        theme.fg(
          "dim",
          "  ↑↓/Tab navigate • Enter select • Backspace delete • Esc cancel",
        ),
      );

      // Bottom border
      add(theme.fg("accent", "└" + "─".repeat(Math.max(0, width - 2)) + "┘"));

      cachedLines = lines;
      cachedWidth = width;
      return lines;
    }

    // === INPUT HANDLING ===
    function handleInput(data: string) {
      // Tab or Down arrow - move focus forward
      if (matchesKey(data, Key.tab) || matchesKey(data, Key.down)) {
        if (focusedButtonIndex === -1) {
          // In fields - move to next field or to buttons
          if (focusedFieldIndex === fieldIds.length - 1) {
            // At last field, move to buttons
            if (buttonIds.length > 0) {
              focusedButtonIndex = 0;
              refresh();
            }
          } else {
            // Move to next field
            focusedFieldIndex = (focusedFieldIndex + 1) % fieldIds.length;
            refresh();
          }
          return;
        } else {
          // In buttons - cycle through buttons
          focusedButtonIndex = (focusedButtonIndex + 1) % buttonIds.length;
          refresh();
          return;
        }
      }

      // Shift+Tab or Up arrow - move focus backward
      if (matchesKey(data, Key.shift("tab")) || matchesKey(data, Key.up)) {
        if (focusedButtonIndex === -1) {
          // In fields - move to previous field
          if (focusedFieldIndex === 0 && buttonIds.length > 0) {
            // At first field, move to last button
            focusedButtonIndex = buttonIds.length - 1;
            refresh();
          } else if (fieldIds.length > 1) {
            focusedFieldIndex = (focusedFieldIndex - 1 + fieldIds.length) % fieldIds.length;
            refresh();
          }
          return;
        } else {
          // In buttons - move back to fields or prev button
          if (focusedButtonIndex === 0) {
            focusedButtonIndex = -1;
            focusedFieldIndex = fieldIds.length - 1;
            refresh();
          } else {
            focusedButtonIndex--;
            refresh();
          }
          return;
        }
      }

      // Character input - add to focused field
      if (focusedButtonIndex === -1 && data.length === 1 && data.charCodeAt(0) >= 32) {
        const fieldId = fieldIds[focusedFieldIndex];
        if (fieldId) {
          const current = fieldValues.get(fieldId) || "";
          fieldValues.set(fieldId, current + data);
          refresh();
          return;
        }
      }

      // Backspace - delete character from focused field
      if (matchesKey(data, Key.backspace)) {
        if (focusedButtonIndex === -1) {
          const fieldId = fieldIds[focusedFieldIndex];
          if (fieldId) {
            const current = fieldValues.get(fieldId) || "";
            if (current.length > 0) {
              fieldValues.set(fieldId, current.slice(0, -1));
              refresh();
            }
          }
        }
        return;  // ← IMPORTANT: Always return after handling backspace
      }

      // Enter - submit or navigate
      if (matchesKey(data, Key.enter)) {
        if (focusedButtonIndex >= 0) {
          // On a button
          if (focusedButtonIndex === 0) {
            // Submit button
            const formData: FormData = {};
            for (const [fieldId, value] of fieldValues) {
              formData[fieldId] = value;
            }
            done(formData);
            return;
          } else if (focusedButtonIndex === 1) {
            // Cancel button
            done(null);
            return;
          }
        } else {
          // In a field
          if (fieldIds.length > 1 && focusedFieldIndex < fieldIds.length - 1) {
            // Move to next field (if not at last field)
            focusedFieldIndex++;
            refresh();
          } else if (buttonIds.length > 0) {
            // Move to first button (last field or only one field)
            focusedButtonIndex = 0;
            refresh();
          }
        }
        return;
      }

      // Escape - cancel
      if (matchesKey(data, Key.escape)) {
        done(null);
        return;
      }
    }

    // === RETURN COMPONENT ===
    return {
      render,
      handleInput,
      invalidate: () => {
        cachedLines = undefined;
        cachedWidth = undefined;
      },
    };
  };
}
