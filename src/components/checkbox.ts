/**
 * Checkbox Component
 * Boolean toggle with label
 * 
 * Terminal: "  ☑  Subscribe to newsletter"
 * Input: Space to toggle, Tab to next
 */

import { matchesKey, Key } from "@mariozechner/pi-tui";

export interface CheckboxComponent {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
}

export interface CheckboxState {
  checked: boolean;
}

/**
 * Create a checkbox component factory
 * Returns a pi-tui component callback
 */
export function createCheckbox(comp: CheckboxComponent, theme: any) {
  return (tui: any, _theme: any, _kb: any, done: (data: CheckboxState) => void) => {
    let checked = comp.checked;
    let cachedLines: string[] | undefined;
    let cachedWidth: number | undefined;

    function refresh() {
      cachedLines = undefined;
      tui.requestRender();
    }

    function render(width: number): string[] {
      if (cachedLines && cachedWidth === width) {
        return cachedLines;
      }

      const symbol = checked ? "☑" : "☐";
      const line = theme.fg("success", `  ${symbol}  ${comp.label}`);
      const lines = [line];

      cachedLines = lines;
      cachedWidth = width;
      return lines;
    }

    function handleInput(data: string) {
      // Space to toggle
      if (matchesKey(data, Key.space)) {
        checked = !checked;
        refresh();
        return;
      }

      // Enter to confirm
      if (matchesKey(data, Key.enter)) {
        done({ checked });
        return;
      }

      // Escape to cancel (return without change)
      if (matchesKey(data, Key.escape)) {
        done(null);
        return;
      }
    }

    function invalidate() {
      cachedLines = undefined;
    }

    return {
      render,
      handleInput,
      invalidate,
    };
  };
}

/**
 * Render checkbox in form context (not standalone)
 * Returns string lines for display
 */
export function renderCheckboxInForm(
  comp: CheckboxComponent,
  focused: boolean,
  checked: boolean,
  theme: any
): string[] {
  const symbol = checked ? "☑" : "☐";
  const color = focused ? "success" : "text";
  return [theme.fg(color, `  ${symbol}  ${comp.label}`)];
}
