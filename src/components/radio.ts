/**
 * RadioButton / RadioGroup Component
 * Single selection from multiple options
 * 
 * Terminal: "    ◉  Standard (5-7 days)"
 * Input: ↑/↓ to navigate, Space to select
 */

import { matchesKey, Key } from "@mariozechner/pi-tui";

export interface RadioOption {
  id: string;
  label: string;
  value: string;
}

export interface RadioGroupComponent {
  id: string;
  label: string;
  options: RadioOption[];
  selected: string; // value of selected option
  disabled?: boolean;
}

export interface RadioGroupState {
  selected: string;
}

/**
 * Create a radio group component factory
 */
export function createRadioGroup(comp: RadioGroupComponent, theme: any) {
  return (tui: any, _theme: any, _kb: any, done: (data: RadioGroupState) => void) => {
    let selected = comp.selected;
    let focusedOptionIndex = 0; // which option is focused
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

      const lines: string[] = [];

      // Label
      lines.push(theme.fg("accent", comp.label));

      // Options
      comp.options.forEach((opt, idx) => {
        const symbol = selected === opt.value ? "◉" : "○";
        const isFocused = idx === focusedOptionIndex;
        const color = isFocused ? "success" : "text";
        const line = theme.fg(color, `    ${symbol}  ${opt.label}`);
        lines.push(line);
      });

      cachedLines = lines;
      cachedWidth = width;
      return lines;
    }

    function handleInput(data: string) {
      // Up arrow - move focus up
      if (matchesKey(data, Key.up)) {
        if (focusedOptionIndex > 0) {
          focusedOptionIndex--;
          refresh();
        }
        return;
      }

      // Down arrow - move focus down
      if (matchesKey(data, Key.down)) {
        if (focusedOptionIndex < comp.options.length - 1) {
          focusedOptionIndex++;
          refresh();
        }
        return;
      }

      // Space - select focused option
      if (matchesKey(data, Key.space)) {
        selected = comp.options[focusedOptionIndex].value;
        refresh();
        return;
      }

      // Enter - confirm selection
      if (matchesKey(data, Key.enter)) {
        done({ selected });
        return;
      }

      // Escape - cancel
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
 * Render radio group in form context
 */
export function renderRadioGroupInForm(
  comp: RadioGroupComponent,
  focusedOptionIndex: number,
  selected: string,
  theme: any
): string[] {
  const lines: string[] = [];

  // Label
  lines.push(theme.fg("accent", comp.label));

  // Options
  comp.options.forEach((opt, idx) => {
    const symbol = selected === opt.value ? "◉" : "○";
    const isFocused = idx === focusedOptionIndex;
    const color = isFocused ? "success" : "text";
    const line = theme.fg(color, `    ${symbol}  ${opt.label}`);
    lines.push(line);
  });

  return lines;
}
