/**
 * Interactive A2UI Form Component
 * 
 * Implements a real, interactive form for pi-TUI that collects user input.
 * This is what users actually interact with - not a static display.
 */

import { matchesKey, Key, truncateToWidth } from "@mariozechner/pi-tui";
import type { TextFieldComponent, ButtonComponent, TextComponent } from "./types";
import type { A2UIComponent } from "./types";

export interface FormData {
  [fieldId: string]: string;
}

export class InteractiveA2UIForm {
  private fieldIds: string[] = [];
  private buttonIds: string[] = [];
  private focusedFieldIndex: number = 0;
  private focusedButtonIndex: number = -1; // -1 means focused on fields
  private fieldValues: Map<string, string> = new Map();
  private cachedRender?: string[];
  private cachedWidth?: number;

  public onSubmit?: (data: FormData) => void;
  public onCancel?: () => void;

  constructor(
    private components: Map<string, A2UIComponent>,
    private theme: any,
  ) {
    this.scanComponents();
  }

  private scanComponents() {
    // Find all TextFields and Buttons in order
    for (const [id, comp] of this.components) {
      if (comp.component === "TextField") {
        this.fieldIds.push(id);
        this.fieldValues.set(id, "");
      } else if (comp.component === "Button") {
        this.buttonIds.push(id);
      }
    }
  }

  render(width: number): string[] {
    console.log("[InteractiveA2UIForm] render called, width:", width, "fieldIds:", this.fieldIds.length, "buttonIds:", this.buttonIds.length);
    
    if (this.cachedRender && this.cachedWidth === width) {
      console.log("[InteractiveA2UIForm] returning cached render");
      return this.cachedRender;
    }

    const lines: string[] = [];
    const add = (s: string) => lines.push(truncateToWidth(s, width));

    // Top border
    add(this.theme.fg("accent", "┌" + "─".repeat(Math.max(0, width - 2)) + "┐"));

    // Title
    add(this.theme.fg("accent", "  Interactive Form"));
    add("");

    // Render fields
    for (let i = 0; i < this.fieldIds.length; i++) {
      const fieldId = this.fieldIds[i];
      const isFocused = this.focusedButtonIndex === -1 && i === this.focusedFieldIndex;
      const field = this.components.get(fieldId) as TextFieldComponent;
      const label = field?.label || fieldId;
      const value = this.fieldValues.get(fieldId) || "";

      // Label
      const labelColor = isFocused ? "success" : "text";
      add(this.theme.fg(labelColor, `  ${label}:`));

      // Input field
      const displayValue = value || "(empty)";
      const prefix = isFocused ? this.theme.fg("success", "> ") : "  ";
      add(prefix + this.theme.fg("muted", displayValue));
      add("");
    }

    // Buttons
    if (this.buttonIds.length > 0) {
      const buttonTexts: string[] = [];
      for (let i = 0; i < this.buttonIds.length; i++) {
        const buttonId = this.buttonIds[i];
        const btn = this.components.get(buttonId) as ButtonComponent;
        let label = btn?.id || "Button";

        // Try to get label from child Text component
        if (btn?.child) {
          const child = this.components.get(btn.child) as TextComponent;
          if (child) label = child.text;
        }

        const isFocused = this.focusedButtonIndex === i;
        const buttonText = `[ ${label} ]`;
        const styled = isFocused
          ? this.theme.bg("selectedBg", this.theme.fg("text", buttonText))
          : this.theme.fg("accent", buttonText);

        buttonTexts.push(styled);
      }
      add("  " + buttonTexts.join("  "));
    }

    add("");
    add(
      this.theme.fg(
        "dim",
        "  ↑↓/Tab navigate • Enter select • Backspace delete • Esc cancel",
      ),
    );

    // Bottom border
    add(this.theme.fg("accent", "└" + "─".repeat(Math.max(0, width - 2)) + "┘"));

    console.log("[InteractiveA2UIForm] rendered", lines.length, "lines");
    
    this.cachedRender = lines;
    this.cachedWidth = width;
    return lines;
  }

  handleInput(data: string): void {
    console.log("[InteractiveA2UIForm] handleInput called with:", JSON.stringify(data));
    
    // Navigation: Tab or Down arrow
    if (matchesKey(data, Key.tab) || matchesKey(data, Key.down)) {
      console.log("[InteractiveA2UIForm] Tab/Down pressed");
      if (this.focusedButtonIndex === -1) {
        // In fields - move to next field or buttons
        if (this.fieldIds.length > 1) {
          this.focusedFieldIndex = (this.focusedFieldIndex + 1) % this.fieldIds.length;
        } else if (this.buttonIds.length > 0) {
          this.focusedButtonIndex = 0;
        }
      } else {
        // In buttons - cycle
        this.focusedButtonIndex = (this.focusedButtonIndex + 1) % this.buttonIds.length;
      }
      this.invalidate();
      return;
    }

    // Navigation: Shift+Tab or Up arrow
    if (matchesKey(data, Key.shift("tab")) || matchesKey(data, Key.up)) {
      if (this.focusedButtonIndex === -1) {
        // In fields - move to previous
        if (this.fieldIds.length > 1) {
          this.focusedFieldIndex = (this.focusedFieldIndex - 1 + this.fieldIds.length) % this.fieldIds.length;
        }
      } else {
        // In buttons - move back to fields or prev button
        if (this.focusedButtonIndex === 0) {
          this.focusedButtonIndex = -1;
          this.focusedFieldIndex = this.fieldIds.length - 1;
        } else {
          this.focusedButtonIndex--;
        }
      }
      this.invalidate();
      return;
    }

    // Character input - add to focused field
    if (this.focusedButtonIndex === -1 && data.length === 1 && data.charCodeAt(0) >= 32) {
      const fieldId = this.fieldIds[this.focusedFieldIndex];
      if (fieldId) {
        const current = this.fieldValues.get(fieldId) || "";
        this.fieldValues.set(fieldId, current + data);
        this.invalidate();
      }
      return;
    }

    // Backspace - delete character
    if (matchesKey(data, Key.backspace)) {
      if (this.focusedButtonIndex === -1) {
        const fieldId = this.fieldIds[this.focusedFieldIndex];
        if (fieldId) {
          const current = this.fieldValues.get(fieldId) || "";
          if (current.length > 0) {
            this.fieldValues.set(fieldId, current.slice(0, -1));
            this.invalidate();
          }
        }
      }
      return;
    }

    // Enter - submit or click button
    if (matchesKey(data, Key.enter)) {
      console.log("[InteractiveA2UIForm] Enter pressed, focusedButtonIndex:", this.focusedButtonIndex);
      if (this.focusedButtonIndex >= 0) {
        const buttonId = this.buttonIds[this.focusedButtonIndex];
        if (buttonId) {
          const btn = this.components.get(buttonId) as ButtonComponent;
          // First button is Submit, second is Cancel
          if (this.focusedButtonIndex === 0) {
            console.log("[InteractiveA2UIForm] Submitting form");
            const formData: FormData = {};
            for (const [fieldId, value] of this.fieldValues) {
              formData[fieldId] = value;
            }
            this.onSubmit?.(formData);
          } else if (this.focusedButtonIndex === 1) {
            console.log("[InteractiveA2UIForm] Cancelling form");
            this.onCancel?.();
          }
        }
      } else if (this.fieldIds.length > 1) {
        // In field, move to next
        this.focusedFieldIndex = (this.focusedFieldIndex + 1) % this.fieldIds.length;
        this.invalidate();
      } else if (this.buttonIds.length > 0) {
        // Only one field, move to buttons
        this.focusedButtonIndex = 0;
        this.invalidate();
      }
      return;
    }

    // Escape - cancel
    if (matchesKey(data, Key.escape)) {
      console.log("[InteractiveA2UIForm] Escape pressed, cancelling");
      this.onCancel?.();
      return;
    }
  }

  invalidate(): void {
    this.cachedRender = undefined;
    this.cachedWidth = undefined;
  }
}
