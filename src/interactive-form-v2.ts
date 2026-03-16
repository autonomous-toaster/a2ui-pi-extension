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
import type { 
  TextFieldComponent, 
  ButtonComponent, 
  TextComponent, 
  CheckboxComponent,
  RadioGroupComponent,
  SelectDropdownComponent,
  ListComponent,
  ImageComponent,
  A2UIComponent 
} from "./types";

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
    const fieldStates = new Map<string, any>(); // For Checkbox, RadioGroup, etc.
    let cachedLines: string[] | undefined;
    let cachedWidth: number | undefined;
    let lastKeyReceived = ""; // DEBUG: track last keystroke

    // Scan for interactive components
    for (const [id, comp] of components) {
      const type = comp.component;
      if (type === "TextField" || type === "Checkbox" || type === "RadioGroup" || 
          type === "SelectDropdown" || type === "List" || type === "Image") {
        fieldIds.push(id);
        // Initialize state for each component
        if (type === "TextField") {
          fieldValues.set(id, comp.value || "");
        } else if (type === "Checkbox") {
          fieldStates.set(id, comp.checked || false);
        } else if (type === "RadioGroup") {
          fieldStates.set(id, { selected: comp.selected || "", expanded: false, scrollIndex: 0 });
        } else if (type === "SelectDropdown") {
          fieldStates.set(id, { selected: comp.selected || "", expanded: false, searchText: "", scrollIndex: 0 });
        } else if (type === "List") {
          fieldStates.set(id, { selected: comp.selected || "", scrollIndex: 0 });
        } else if (type === "Image") {
          fieldStates.set(id, {});
        }
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
        const comp = components.get(fieldId);

        if (!comp) continue;

        // Render by component type
        if (comp.component === "TextField") {
          const field = comp as TextFieldComponent;
          const label = field.label || fieldId;
          const value = fieldValues.get(fieldId) || "";

          const labelColor = isFocused ? "success" : "text";
          add(theme.fg(labelColor, `  ${label}:`));

          const displayValue = value || "(empty)";
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          add(prefix + theme.fg("muted", displayValue));
          add("");
        } else if (comp.component === "Checkbox") {
          const checkbox = comp as CheckboxComponent;
          const checked = fieldStates.get(fieldId) || false;
          const symbol = checked ? "☑" : "☐";
          const label = checkbox.label || fieldId;
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          add(prefix + theme.fg(isFocused ? "success" : "text", `${symbol} ${label}`));
          add("");
        } else if (comp.component === "RadioGroup") {
          const radio = comp as RadioGroupComponent;
          const state = fieldStates.get(fieldId) || { selected: "", expanded: false, scrollIndex: 0 };
          const label = radio.label || fieldId;
          const labelColor = isFocused ? "success" : "text";
          add(theme.fg(labelColor, `  ${label}:`));

          const options = radio.options || [];
          for (let j = 0; j < options.length; j++) {
            const opt = options[j];
            const isSelected = state.selected === opt.value;
            const symbol = isSelected ? "◉" : "○";
            const prefix = isFocused && j === 0 ? theme.fg("success", "> ") : "  ";
            add(prefix + theme.fg(isSelected ? "success" : "text", `${symbol} ${opt.label}`));
          }
          add("");
        } else if (comp.component === "SelectDropdown") {
          const select = comp as SelectDropdownComponent;
          const state = fieldStates.get(fieldId) || { selected: "", expanded: false, searchText: "", scrollIndex: 0 };
          const label = select.label || fieldId;
          const labelColor = isFocused ? "success" : "text";
          add(theme.fg(labelColor, `  ${label}:`));

          const options = select.options || [];
          const selectedOption = options.find(o => o.value === state.selected);
          const displayValue = selectedOption?.label || "(select)";
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";

          if (state.expanded && options.length > 0) {
            add(prefix + theme.fg("success", `▼ ${displayValue}`));
            for (let j = 0; j < Math.min(5, options.length); j++) {
              const opt = options[j];
              const isSelected = state.selected === opt.value;
              const marker = isSelected ? "→" : " ";
              add("    " + theme.fg(isSelected ? "success" : "text", `${marker} ${opt.label}`));
            }
            if (options.length > 5) {
              add(theme.fg("dim", `    ↓ ${options.length - 5} more`));
            }
          } else {
            add(prefix + theme.fg("muted", `▼ ${displayValue}`));
          }
          add("");
        } else if (comp.component === "List") {
          const list = comp as ListComponent;
          const state = fieldStates.get(fieldId) || { selected: "", scrollIndex: 0 };
          const label = list.label || fieldId;
          const labelColor = isFocused ? "success" : "text";
          add(theme.fg(labelColor, `  ${label}:`));

          const items = list.items || [];
          for (let j = 0; j < Math.min(5, items.length); j++) {
            const item = items[j];
            const isSelected = state.selected === item.id;
            const symbol = isSelected ? "▶" : " ";
            const prefix = isFocused && j === 0 ? theme.fg("success", "> ") : "  ";
            add(prefix + theme.fg(isSelected ? "success" : "text", `${symbol} ${item.label}`));
          }
          if (items.length > 5) {
            add(theme.fg("dim", `  ↓ ${items.length - 5} more`));
          }
          add("");
        } else if (comp.component === "Image") {
          const image = comp as ImageComponent;
          const label = image.alt || fieldId;
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          add(prefix + theme.fg("muted", `[IMAGE] ${label}`));
          add("");
        }
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
          "  ↑↓/Tab navigate • Space toggle • Enter select • Backspace delete • Esc cancel",
        ),
      );

      // Bottom border
      add(theme.fg("accent", "└" + "─".repeat(Math.max(0, width - 2)) + "┘"));

      // DEBUG: Show last key
      add(theme.fg("dim", `  [Last key: ${lastKeyReceived}]`));

      cachedLines = lines;
      cachedWidth = width;
      return lines;
    }

    // === INPUT HANDLING ===
    function handleInput(data: string) {
      lastKeyReceived = JSON.stringify(data); // DEBUG
      
      const focusedFieldId = focusedButtonIndex === -1 && focusedFieldIndex < fieldIds.length ? fieldIds[focusedFieldIndex] : null;
      const focusedComp = focusedFieldId ? components.get(focusedFieldId) : null;
      
      // IMPORTANT: Check special keys FIRST, before character input
      
      // Backspace - delete character or clear search
      const isBackspace = 
        matchesKey(data, Key.backspace) || 
        data === '\x08' ||     // ASCII 8
        data === '\x7f' ||     // ASCII 127 (DEL)
        data === '\u0008';     // Unicode backspace
      
      if (isBackspace) {
        if (focusedButtonIndex === -1 && focusedFieldId) {
          if (focusedComp?.component === "TextField") {
            const current = fieldValues.get(focusedFieldId) || "";
            if (current.length > 0) {
              fieldValues.set(focusedFieldId, current.slice(0, -1));
              refresh();
            }
          } else if (focusedComp?.component === "SelectDropdown") {
            const state = fieldStates.get(focusedFieldId);
            if (state && state.searchText) {
              state.searchText = state.searchText.slice(0, -1);
              refresh();
            }
          }
        }
        return;
      }
      
      // Escape - cancel
      if (matchesKey(data, Key.escape)) {
        done(null);
        return;
      }
      
      // Tab or Down arrow - move focus forward
      if (matchesKey(data, Key.tab) || matchesKey(data, Key.down)) {
        if (focusedButtonIndex === -1) {
          if (focusedFieldIndex === fieldIds.length - 1) {
            if (buttonIds.length > 0) {
              focusedButtonIndex = 0;
              refresh();
            }
          } else {
            focusedFieldIndex = (focusedFieldIndex + 1) % fieldIds.length;
            refresh();
          }
          return;
        } else {
          focusedButtonIndex = (focusedButtonIndex + 1) % buttonIds.length;
          refresh();
          return;
        }
      }

      // Shift+Tab or Up arrow - move focus backward
      if (matchesKey(data, Key.shift("tab")) || matchesKey(data, Key.up)) {
        if (focusedButtonIndex === -1) {
          if (focusedFieldIndex === 0 && buttonIds.length > 0) {
            focusedButtonIndex = buttonIds.length - 1;
            refresh();
          } else if (fieldIds.length > 1) {
            focusedFieldIndex = (focusedFieldIndex - 1 + fieldIds.length) % fieldIds.length;
            refresh();
          }
          return;
        } else {
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

      // Space - toggle checkbox, expand select/radio
      if (data === " ") {
        if (focusedButtonIndex === -1 && focusedFieldId && focusedComp) {
          if (focusedComp.component === "Checkbox") {
            const current = fieldStates.get(focusedFieldId) || false;
            fieldStates.set(focusedFieldId, !current);
            refresh();
            return;
          } else if (focusedComp.component === "RadioGroup") {
            const state = fieldStates.get(focusedFieldId) || { selected: "", expanded: false, scrollIndex: 0 };
            const options = focusedComp.options || [];
            if (options.length > 0) {
              state.selected = options[0].value;
              refresh();
            }
            return;
          } else if (focusedComp.component === "SelectDropdown") {
            const state = fieldStates.get(focusedFieldId) || { selected: "", expanded: false, searchText: "", scrollIndex: 0 };
            state.expanded = !state.expanded;
            refresh();
            return;
          }
        }
        return;
      }

      // Character input - add to TextField or filter SelectDropdown
      if (focusedButtonIndex === -1 && focusedFieldId && data.length === 1 && data.charCodeAt(0) >= 32) {
        if (focusedComp?.component === "TextField") {
          const current = fieldValues.get(focusedFieldId) || "";
          fieldValues.set(focusedFieldId, current + data);
          refresh();
          return;
        } else if (focusedComp?.component === "SelectDropdown") {
          const state = fieldStates.get(focusedFieldId);
          if (state) {
            state.searchText = (state.searchText || "") + data;
            refresh();
          }
          return;
        }
      }

      // Enter - submit or navigate
      if (matchesKey(data, Key.enter)) {
        if (focusedButtonIndex >= 0) {
          // On a button
          if (focusedButtonIndex === 0) {
            // Submit button
            const formData: FormData = {};
            for (const fieldId of fieldIds) {
              const comp = components.get(fieldId);
              if (comp?.component === "TextField") {
                formData[fieldId] = fieldValues.get(fieldId) || "";
              } else if (comp?.component === "Checkbox") {
                formData[fieldId] = fieldStates.get(fieldId) ? "true" : "false";
              } else if (comp?.component === "RadioGroup" || comp?.component === "SelectDropdown" || comp?.component === "List") {
                const state = fieldStates.get(fieldId);
                formData[fieldId] = state?.selected || "";
              }
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
          if (focusedComp?.component === "SelectDropdown") {
            const state = fieldStates.get(focusedFieldId);
            if (state) {
              state.expanded = !state.expanded;
            }
          } else if (focusedFieldIndex < fieldIds.length - 1) {
            focusedFieldIndex++;
            refresh();
          } else if (buttonIds.length > 0) {
            focusedButtonIndex = 0;
            refresh();
          }
        }
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
