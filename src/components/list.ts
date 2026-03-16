/**
 * List / ListView Component
 * Scrollable selectable list of items
 * 
 * Terminal: "  ▶  Alice Johnson (Admin)"
 *           "     Bob Smith (Editor)"
 *           "  ↓ 2 more..."
 * Input: ↑/↓ to navigate, Enter to select
 */

import { matchesKey, Key } from "@mariozechner/pi-tui";

export interface ListItem {
  id: string;
  label: string;
  description?: string;
  avatar?: string; // URL or base64
}

export interface ListComponent {
  id: string;
  label?: string;
  items: ListItem[];
  selected?: string; // id of selected item
  disabled?: boolean;
}

export interface ListState {
  selected: string; // id of selected item
}

const VISIBLE_ITEMS = 5;

/**
 * Create a list component factory
 */
export function createList(comp: ListComponent, theme: any) {
  return (tui: any, _theme: any, _kb: any, done: (data: ListState) => void) => {
    let selectedId = comp.selected || (comp.items.length > 0 ? comp.items[0].id : "");
    let focusedIndex = 0;
    let scrollOffset = 0;
    let cachedLines: string[] | undefined;
    let cachedWidth: number | undefined;

    function refresh() {
      cachedLines = undefined;
      tui.requestRender();
    }

    function ensureVisible() {
      // Ensure focused item is visible
      if (focusedIndex < scrollOffset) {
        scrollOffset = focusedIndex;
      } else if (focusedIndex >= scrollOffset + VISIBLE_ITEMS) {
        scrollOffset = focusedIndex - VISIBLE_ITEMS + 1;
      }
    }

    function render(width: number): string[] {
      if (cachedLines && cachedWidth === width) {
        return cachedLines;
      }

      const lines: string[] = [];

      // Label
      if (comp.label) {
        lines.push(theme.fg("accent", comp.label));
      }

      // Items
      ensureVisible();
      const visibleCount = Math.min(VISIBLE_ITEMS, comp.items.length);

      for (let i = 0; i < visibleCount; i++) {
        const itemIndex = scrollOffset + i;
        const item = comp.items[itemIndex];
        const symbol = focusedIndex === itemIndex ? "▶" : " ";
        const isSelected = selectedId === item.id;
        const isFocused = focusedIndex === itemIndex;
        const color = isFocused ? "success" : "text";

        const desc = item.description ? ` (${item.description})` : "";
        const line = theme.fg(color, `  ${symbol}  ${item.label}${desc}`);
        lines.push(line);
      }

      // More indicator
      if (comp.items.length > visibleCount) {
        const remainingCount = comp.items.length - (scrollOffset + visibleCount);
        if (remainingCount > 0) {
          lines.push(theme.fg("dim", `  ↓ ${remainingCount} more...`));
        }
      }

      cachedLines = lines;
      cachedWidth = width;
      return lines;
    }

    function handleInput(data: string) {
      // Up arrow - navigate up
      if (matchesKey(data, Key.up)) {
        if (focusedIndex > 0) {
          focusedIndex--;
          refresh();
        }
        return;
      }

      // Down arrow - navigate down
      if (matchesKey(data, Key.down)) {
        if (focusedIndex < comp.items.length - 1) {
          focusedIndex++;
          refresh();
        }
        return;
      }

      // Page Up - scroll up by 5
      if (matchesKey(data, Key.pageUp)) {
        focusedIndex = Math.max(0, focusedIndex - VISIBLE_ITEMS);
        refresh();
        return;
      }

      // Page Down - scroll down by 5
      if (matchesKey(data, Key.pageDown)) {
        focusedIndex = Math.min(comp.items.length - 1, focusedIndex + VISIBLE_ITEMS);
        refresh();
        return;
      }

      // Home - jump to first
      if (matchesKey(data, Key.home)) {
        focusedIndex = 0;
        refresh();
        return;
      }

      // End - jump to last
      if (matchesKey(data, Key.end)) {
        focusedIndex = comp.items.length - 1;
        refresh();
        return;
      }

      // Enter - select focused item
      if (matchesKey(data, Key.enter)) {
        selectedId = comp.items[focusedIndex].id;
        done({ selected: selectedId });
        return;
      }

      // Escape - cancel
      if (matchesKey(data, Key.escape)) {
        done(null);
        return;
      }

      // Character - jump to item starting with that letter
      if (data.length === 1 && data.charCodeAt(0) >= 65 && data.charCodeAt(0) <= 90) {
        const target = data.toUpperCase();
        for (let i = 0; i < comp.items.length; i++) {
          if (comp.items[i].label.charAt(0).toUpperCase() === target) {
            focusedIndex = i;
            refresh();
            return;
          }
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
 * Render list in form context
 */
export function renderListInForm(
  comp: ListComponent,
  focused: boolean,
  focusedIndex: number,
  selectedId: string,
  scrollOffset: number,
  theme: any
): string[] {
  const lines: string[] = [];

  // Label
  if (comp.label) {
    lines.push(theme.fg("accent", comp.label));
  }

  // Items
  const visibleCount = Math.min(VISIBLE_ITEMS, comp.items.length);

  for (let i = 0; i < visibleCount; i++) {
    const itemIndex = scrollOffset + i;
    const item = comp.items[itemIndex];
    const symbol = focused && focusedIndex === itemIndex ? "▶" : " ";
    const isFocused = focused && focusedIndex === itemIndex;
    const color = isFocused ? "success" : "text";

    const desc = item.description ? ` (${item.description})` : "";
    const line = theme.fg(color, `  ${symbol}  ${item.label}${desc}`);
    lines.push(line);
  }

  // More indicator
  if (comp.items.length > visibleCount) {
    const remainingCount = comp.items.length - (scrollOffset + visibleCount);
    if (remainingCount > 0) {
      lines.push(theme.fg("dim", `  ↓ ${remainingCount} more...`));
    }
  }

  return lines;
}
