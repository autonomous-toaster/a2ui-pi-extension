/**
 * SelectDropdown / ComboBox Component
 * Searchable dropdown list
 * 
 * Terminal (closed): "Country: [United States ▼]"
 * Terminal (open):   "  ⇒ United States"
 *                    "    United Kingdom"
 * Input: Enter to toggle, ↑/↓ to navigate, Type to filter
 */

import { matchesKey, Key } from "@mariozechner/pi-tui";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectDropdownComponent {
  id: string;
  label: string;
  options: SelectOption[];
  selected: string; // value of selected option
  searchable?: boolean;
  disabled?: boolean;
}

export interface SelectDropdownState {
  selected: string;
}

/**
 * Create a select dropdown component factory
 */
export function createSelectDropdown(comp: SelectDropdownComponent, theme: any) {
  return (tui: any, _theme: any, _kb: any, done: (data: SelectDropdownState) => void) => {
    let selected = comp.selected;
    let isOpen = false;
    let focusedOptionIndex = 0;
    let searchFilter = "";
    let cachedLines: string[] | undefined;
    let cachedWidth: number | undefined;

    function getFilteredOptions() {
      if (!searchFilter) return comp.options;
      return comp.options.filter((opt) =>
        opt.label.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    function refresh() {
      cachedLines = undefined;
      tui.requestRender();
    }

    function render(width: number): string[] {
      if (cachedLines && cachedWidth === width) {
        return cachedLines;
      }

      const lines: string[] = [];
      const selectedOption = comp.options.find((o) => o.value === selected);
      const selectedLabel = selectedOption?.label || "(none)";

      // Label and control line
      const displayText = isOpen ? `${selectedLabel} (search: ${searchFilter})` : selectedLabel;
      const arrow = isOpen ? "▲" : "▼";
      lines.push(
        theme.fg("accent", `${comp.label}: [${displayText} ${arrow}]`)
      );

      // Options list (if open)
      if (isOpen) {
        const filtered = getFilteredOptions();
        const visibleCount = Math.min(5, filtered.length);

        for (let i = 0; i < visibleCount; i++) {
          const opt = filtered[i];
          const symbol = selected === opt.value ? "⇒" : " ";
          const isFocused = i === focusedOptionIndex;
          const color = isFocused ? "success" : "text";
          lines.push(theme.fg(color, `  ${symbol}  ${opt.label}`));
        }

        if (filtered.length > visibleCount) {
          lines.push(theme.fg("dim", `  ↓ ${filtered.length - visibleCount} more...`));
        }
      }

      cachedLines = lines;
      cachedWidth = width;
      return lines;
    }

    function handleInput(data: string) {
      if (!isOpen) {
        // Dropdown closed
        if (matchesKey(data, Key.enter) || matchesKey(data, Key.space)) {
          isOpen = true;
          focusedOptionIndex = 0;
          searchFilter = "";
          refresh();
          return;
        }

        if (matchesKey(data, Key.escape)) {
          done(null);
          return;
        }
      } else {
        // Dropdown open
        if (matchesKey(data, Key.escape)) {
          isOpen = false;
          searchFilter = "";
          refresh();
          return;
        }

        const filtered = getFilteredOptions();

        // Up arrow - navigate up
        if (matchesKey(data, Key.up)) {
          if (focusedOptionIndex > 0) {
            focusedOptionIndex--;
            refresh();
          }
          return;
        }

        // Down arrow - navigate down
        if (matchesKey(data, Key.down)) {
          if (focusedOptionIndex < filtered.length - 1) {
            focusedOptionIndex++;
            refresh();
          }
          return;
        }

        // Space or Enter - select focused option
        if (matchesKey(data, Key.space) || matchesKey(data, Key.enter)) {
          if (focusedOptionIndex < filtered.length) {
            selected = filtered[focusedOptionIndex].value;
            isOpen = false;
            searchFilter = "";
            refresh();
          }
          return;
        }

        // Backspace - delete from search
        if (matchesKey(data, Key.backspace)) {
          if (searchFilter.length > 0) {
            searchFilter = searchFilter.slice(0, -1);
            focusedOptionIndex = 0;
            refresh();
          }
          return;
        }

        // Character input - add to search
        if (data.length === 1 && data.charCodeAt(0) >= 32) {
          searchFilter += data;
          focusedOptionIndex = 0;
          refresh();
          return;
        }
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
 * Render select dropdown in form context
 */
export function renderSelectDropdownInForm(
  comp: SelectDropdownComponent,
  focused: boolean,
  selected: string,
  isOpen: boolean,
  focusedOptionIndex: number,
  searchFilter: string,
  theme: any
): string[] {
  const lines: string[] = [];
  const selectedOption = comp.options.find((o) => o.value === selected);
  const selectedLabel = selectedOption?.label || "(none)";

  // Label and control
  const displayText = isOpen ? `${selectedLabel} (search: ${searchFilter})` : selectedLabel;
  const arrow = isOpen ? "▲" : "▼";
  const color = focused ? "success" : "text";
  lines.push(
    theme.fg(color, `  ${comp.label}: [${displayText} ${arrow}]`)
  );

  // Options (if open)
  if (isOpen) {
    const filtered = comp.options.filter((opt) =>
      searchFilter ? opt.label.toLowerCase().includes(searchFilter.toLowerCase()) : true
    );
    const visibleCount = Math.min(5, filtered.length);

    for (let i = 0; i < visibleCount; i++) {
      const opt = filtered[i];
      const symbol = selected === opt.value ? "⇒" : " ";
      const isFocused = i === focusedOptionIndex;
      const optColor = isFocused ? "success" : "text";
      lines.push(theme.fg(optColor, `    ${symbol}  ${opt.label}`));
    }

    if (filtered.length > visibleCount) {
      lines.push(theme.fg("dim", `    ↓ ${filtered.length - visibleCount} more...`));
    }
  }

  return lines;
}
