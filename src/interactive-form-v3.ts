/**
 * Interactive A2UI Form Component - V3 with Image Support
 * 
 * Enhanced version that:
 * - Handles async image fetching with loading states
 * - Uses pi-tui Image component for proper rendering
 * - Maintains backward compatibility with V2
 * - Graceful fallback for image errors
 */

import { matchesKey, Key, truncateToWidth } from "@mariozechner/pi-tui";
import type { 
  TextFieldComponent,
  TextAreaComponent,
  SliderComponent,
  TabsComponent,
  AccordionComponent,
  ButtonComponent, 
  TextComponent, 
  CheckboxComponent,
  RadioGroupComponent,
  SelectDropdownComponent,
  ListComponent,
  ImageComponent,
  A2UIComponent 
} from "./types";
import { convertImageUrlToBase64, clearImageCache } from "./image-fetcher";
import { kittyImageLine } from "./kitty-graphics";

export interface FormData {
  [fieldId: string]: string;
}

// Image cache per session
interface ImageState {
  base64?: string;
  error?: string;
  loading: boolean;
}

/**
 * Create an interactive form component for ctx.ui.custom()
 * 
 * Enhanced to:
 * - Fetch images from URLs asynchronously
 * - Show loading states while fetching
 * - Gracefully handle image errors
 * - Render using pi-tui Image component
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
    let focusedButtonIndex = -1;
    const fieldValues = new Map<string, string>();
    const fieldStates = new Map<string, any>();
    const imageStates = new Map<string, ImageState>(); // NEW: Track image loading state
    // Removed: use Kitty escape sequences instead
    let cachedLines: string[] | undefined;
    let cachedWidth: number | undefined;

    // Scan for interactive components
    for (const [id, comp] of components) {
      const type = comp.component;
      if (type === "TextField" || type === "TextArea" || type === "Slider" || type === "Tabs" || type === "Accordion" || type === "Checkbox" || type === "RadioGroup" || 
          type === "SelectDropdown" || type === "List" || type === "Image") {
        fieldIds.push(id);
        if (type === "TextField" || type === "TextArea") {
          fieldValues.set(id, (comp as TextFieldComponent | TextAreaComponent).value || "");
        } else if (type === "Slider") {
          fieldValues.set(id, String((comp as SliderComponent).value || (comp as SliderComponent).min || 0));
        } else if (type === "Tabs") {
          const tabs = comp as TabsComponent;
          const defaultTab = tabs.defaultTab || (tabs.tabs[0]?.id || "");
          fieldValues.set(id, defaultTab);
        } else if (type === "Accordion") {
          const accordion = comp as AccordionComponent;
          const expanded: Record<string, boolean> = {};
          for (const section of accordion.sections) {
            expanded[section.id] = section.expanded || false;
          }
          fieldStates.set(id, { expanded, selectedIndex: 0 });
        } else if (type === "Checkbox") {
          fieldStates.set(id, (comp as CheckboxComponent).checked || false);
        } else if (type === "RadioGroup") {
          fieldStates.set(id, { selected: (comp as RadioGroupComponent).selected || "", expanded: false, scrollIndex: 0 });
        } else if (type === "SelectDropdown") {
          fieldStates.set(id, { selected: (comp as SelectDropdownComponent).selected || "", expanded: false, searchText: "", scrollIndex: 0 });
        } else if (type === "List") {
          fieldStates.set(id, { selected: (comp as ListComponent).selected || "", scrollIndex: 0 });
        } else if (type === "Image") {
          // Initialize image with loading state
          imageStates.set(id, { loading: true });
          // Start async fetch
          const imageComp = comp as ImageComponent;
          if (imageComp.source.type === "url" && imageComp.source.url) {
            fetchAndCacheImage(id, imageComp.source.url);
          } else if (imageComp.source.type === "base64" && imageComp.source.data) {
            imageStates.set(id, { base64: imageComp.source.data, loading: false });
          }
        }
      } else if (comp.component === "Button") {
        buttonIds.push(id);
      }
    }

    // === ASYNC IMAGE FETCHING ===
    async function fetchAndCacheImage(fieldId: string, url: string) {
      try {
        const result = await convertImageUrlToBase64(url);
        if (result.base64) {
          imageStates.set(fieldId, { base64: result.base64, loading: false });
          refresh();
        } else {
          imageStates.set(fieldId, { error: result.error, loading: false });
          refresh();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        imageStates.set(fieldId, { error: msg, loading: false });
        refresh();
      }
    }

    function getMimeTypeFromUrl(url: string): string {
      const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
      const mimeTypes: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
      };
      return mimeTypes[ext] || "image/png";
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
      add(theme.fg("accent", "  Interactive Form"));
      add("");

      // Render fields
      for (let i = 0; i < fieldIds.length; i++) {
        const fieldId = fieldIds[i];
        const comp = components.get(fieldId)!;
        const isFocused = focusedButtonIndex === -1 && focusedFieldIndex === i;

        if (comp.component === "TextField") {
          const tf = comp as TextFieldComponent;
          const label = tf.label || fieldId;
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          const value = fieldValues.get(fieldId) || "";
          const displayValue = value || theme.fg("dim", tf.placeholder || "(empty)");
          add(prefix + theme.fg("text", label + ":"));
          add("  " + displayValue);
        } else if (comp.component === "TextArea") {
          const ta = comp as TextAreaComponent;
          const label = ta.label || fieldId;
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          const value = fieldValues.get(fieldId) || "";
          const rows = ta.rows || 3;
          const displayValue = value || theme.fg("dim", ta.placeholder || "(empty)");
          add(prefix + theme.fg("text", label + ":"));
          const valueLines = displayValue.split("\n");
          for (let i = 0; i < rows; i++) {
            add("  " + (valueLines[i] || ""));
          }
          add("");
        } else if (comp.component === "Slider") {
          const slider = comp as SliderComponent;
          const label = slider.label || fieldId;
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          const currentVal = parseInt(fieldValues.get(fieldId) || String(slider.min || 0));
          const min = slider.min || 0;
          const max = slider.max || 100;
          const step = slider.step || 1;
          
          // Draw slider bar
          const barWidth = 20;
          const ratio = (currentVal - min) / (max - min);
          const filledPos = Math.floor(barWidth * ratio);
          let bar = "[";
          for (let i = 0; i < barWidth; i++) {
            if (i < filledPos) bar += "=";
            else if (i === filledPos) bar += ">";
            else bar += " ";
          }
          bar += "]";
          
          add(prefix + theme.fg("text", label + ":"));
          add("  " + theme.fg("accent", bar) + ` ${currentVal}/${max}`);
          add("");
        } else if (comp.component === "Tabs") {
          const tabs = comp as TabsComponent;
          const selectedTab = fieldValues.get(fieldId) || tabs.defaultTab || tabs.tabs[0]?.id || "";
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          
          // Render tab headers
          let tabBar = "";
          for (const tab of tabs.tabs) {
            if (tab.id === selectedTab) {
              tabBar += theme.fg("accent", `[ ${tab.label} ]`);
            } else {
              tabBar += `[ ${tab.label} ]`;
            }
            tabBar += " ";
          }
          
          add(prefix + theme.fg("text", "Tabs:"));
          add("  " + tabBar);
          
          // Render selected tab content
          const selectedTabObj = tabs.tabs.find(t => t.id === selectedTab);
          if (selectedTabObj?.content) {
            add("  " + theme.fg("dim", "─".repeat(40)));
            const contentLines = selectedTabObj.content.split("\n");
            for (const line of contentLines) {
              add("  " + line);
            }
            add("  " + theme.fg("dim", "─".repeat(40)));
          }
          add("");
        } else if (comp.component === "Accordion") {
          const accordion = comp as AccordionComponent;
          const state = fieldStates.get(fieldId) || { expanded: {}, selectedIndex: 0 };
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          
          add(prefix + theme.fg("text", "Sections:"));
          
          for (let i = 0; i < accordion.sections.length; i++) {
            const section = accordion.sections[i];
            const isExpanded = state.expanded[section.id] || false;
            const symbol = isExpanded ? "▼" : "▶";
            const isSelected = i === state.selectedIndex;
            const sectionLine = `  ${symbol} ${section.title}`;
            
            if (isSelected && isFocused) {
              add(theme.fg("accent", sectionLine));
            } else {
              add(sectionLine);
            }
            
            if (isExpanded) {
              const contentLines = section.content.split("\n");
              for (const line of contentLines) {
                add("    " + line);
              }
            }
          }
          add("");
        } else if (comp.component === "Checkbox") {
          const cb = comp as CheckboxComponent;
          const checked = fieldStates.get(fieldId) || false;
          const checkbox = checked ? "☑ " : "☐ ";
          const label = cb.label || fieldId;
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          add(prefix + theme.fg("text", checkbox + label));
          add("");
        } else if (comp.component === "RadioGroup") {
          const rg = comp as RadioGroupComponent;
          const state = fieldStates.get(fieldId) || { selected: "", expanded: false };
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          add(prefix + theme.fg("text", rg.label || "Options"));
          for (const option of rg.options) {
            const isSelected = option.value === state.selected;
            const radio = isSelected ? "◉ " : "○ ";
            const color = isSelected ? "success" : "muted";
            add("    " + theme.fg(color, radio + option.label));
          }
          add("");
        } else if (comp.component === "SelectDropdown") {
          const sd = comp as SelectDropdownComponent;
          const state = fieldStates.get(fieldId) || { selected: "", expanded: false };
          const selected = sd.options.find((o) => o.value === state.selected);
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          const label = sd.label || fieldId;
          const displayValue = selected?.label || sd.placeholder || "(select)";
          add(prefix + theme.fg("text", label + ":"));
          add("  " + theme.fg("muted", displayValue + (state.expanded ? " ▲" : " ▼")));
          add("");
        } else if (comp.component === "List") {
          const list = comp as ListComponent;
          const state = fieldStates.get(fieldId) || { selected: "", scrollIndex: 0 };
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";
          add(prefix + theme.fg("text", list.label || "Items"));
          const startIdx = state.scrollIndex;
          const endIdx = Math.min(startIdx + 5, list.items.length);
          for (let j = startIdx; j < endIdx; j++) {
            const item = list.items[j];
            const isSelected = item.id === state.selected;
            const marker = isSelected ? "▶ " : "  ";
            const color = isSelected ? "success" : "muted";
            add("    " + theme.fg(color, marker + item.label));
          }
          if (list.items.length > 5) {
            add(theme.fg("dim", `  ↓ ${list.items.length - endIdx} more`));
          }
          add("");
        } else if (comp.component === "Image") {
          const image = comp as ImageComponent;
          const imgState = imageStates.get(fieldId) || { loading: true };
          const label = image.alt || fieldId;
          const prefix = isFocused ? theme.fg("success", "> ") : "  ";

          if (imgState.loading) {
            add(prefix + theme.fg("text", `[Loading image...] ${label}`));
            add("");
          } else if (imgState.error) {
            add(prefix + theme.fg("warning", `[Image error] ${label}`));
            add(theme.fg("dim", `  ${imgState.error}`));
            add("");
          } else if (imgState.base64) {
            // Use Kitty graphics protocol with size-based dimensions
            const sizeMap: Record<string, [number, number]> = {
              small: [16, 8],     // 16 cols x 8 rows - thumbnail
              medium: [24, 12],   // 24 cols x 12 rows - card
              large: [40, 20]     // 40 cols x 20 rows - full
            };
            const size = (image as ImageComponent).size || "medium";
            const [width, height] = sizeMap[size] || [24, 12];
            
            add(prefix + theme.fg("success", `[${label}]`));
            add(kittyImageLine(imgState.base64, width, height));
            add("");
          }
        }
      }

      // Buttons
      if (buttonIds.length > 0) {
        add(theme.fg("accent", "─".repeat(Math.max(0, width - 2))));
        const buttonTexts: string[] = [];
        for (let i = 0; i < buttonIds.length; i++) {
          const buttonId = buttonIds[i];
          const btn = components.get(buttonId) as ButtonComponent;
          let label = btn?.id || "Button";

          if (btn?.child) {
            const child = components.get(btn.child) as TextComponent;
            if (child) label = child.text;
          }

          const isFocused = focusedButtonIndex === i;
          const prefix = isFocused ? theme.fg("success", "[ ") : "[ ";
          const suffix = isFocused ? theme.fg("success", " ]") : " ]";
          const color = isFocused ? "success" : "text";
          buttonTexts.push(prefix + theme.fg(color, label) + suffix);
        }
        add(buttonTexts.join("   "));
      }

      // Bottom border
      add(theme.fg("accent", "└" + "─".repeat(Math.max(0, width - 2)) + "┘"));

      cachedLines = lines;
      cachedWidth = width;
      return lines;
    }

    // === INPUT HANDLING ===
    function handleInput(data: string) {
      if (!data) return;
      
      const key = data;
      const focusedComp = focusedButtonIndex === -1 ? components.get(fieldIds[focusedFieldIndex]) : null;
      const isList = focusedComp?.component === "List";
      const isRadioGroup = focusedComp?.component === "RadioGroup";

      // SPECIAL KEYS: Check before anything else
      if (matchesKey(key, Key.escape)) {
        clearImageCache();
        done(null);
        return;
      }

      // Handle shift+tab BEFORE tab (order matters!)
      if (matchesKey(key, "shift+tab")) {
        // Shift+Tab: previous field
        focusedButtonIndex = -1;
        focusedFieldIndex = (focusedFieldIndex - 1 + fieldIds.length) % fieldIds.length;
        refresh();
        return;
      }

      if (matchesKey(key, Key.tab)) {
        // Tab: next field or first button
        if (focusedButtonIndex >= 0) {
          focusedButtonIndex = (focusedButtonIndex + 1) % buttonIds.length;
        } else if (focusedFieldIndex < fieldIds.length - 1) {
          focusedFieldIndex++;
        } else if (buttonIds.length > 0) {
          focusedButtonIndex = 0;
        }
        refresh();
        return;
      }

      if (matchesKey(key, Key.enter)) {
        if (focusedButtonIndex >= 0) {
          const buttonId = buttonIds[focusedButtonIndex];
          const btn = components.get(buttonId) as ButtonComponent;
          if (btn?.id === "submit_btn" || btn?.child?.includes("submit")) {
            clearImageCache();
            // Collect form data
            const data: FormData = {};
            for (const fieldId of fieldIds) {
              const comp = components.get(fieldId)!;
              if (comp.component === "TextField" || comp.component === "TextArea") {
                data[fieldId] = fieldValues.get(fieldId) || "";
              } else if (comp.component === "Slider") {
                data[fieldId] = fieldValues.get(fieldId) || "0";
              } else if (comp.component === "Tabs") {
                data[fieldId] = fieldValues.get(fieldId) || "";
              } else if (comp.component === "Accordion") {
                const state = fieldStates.get(fieldId) || { expanded: {}, selectedIndex: 0 };
                data[fieldId] = JSON.stringify(state.expanded);
              } else if (comp.component === "Checkbox") {
                data[fieldId] = String(fieldStates.get(fieldId) || false);
              } else if (comp.component === "RadioGroup" || comp.component === "SelectDropdown" || comp.component === "List") {
                data[fieldId] = (fieldStates.get(fieldId) || {}).selected || "";
              }
            }
            done(data);
            return;
          }
        } else {
          // In field - move to next
          focusedFieldIndex = Math.min(focusedFieldIndex + 1, fieldIds.length - 1);
          if (focusedFieldIndex === fieldIds.length - 1 && buttonIds.length > 0) {
            focusedButtonIndex = 0;
          }
        }
        refresh();
        return;
      }

      // Arrow keys - Handle component-specific navigation
      if (matchesKey(key, Key.down)) {
        if (isList) {
          const state = fieldStates.get(fieldIds[focusedFieldIndex]);
          const comp = components.get(fieldIds[focusedFieldIndex]) as ListComponent;
          state.scrollIndex = Math.min(state.scrollIndex + 1, Math.max(0, comp.items.length - 5));
          state.selected = comp.items[Math.min(focusedFieldIndex + state.scrollIndex, comp.items.length - 1)]?.id || state.selected;
          refresh();
          return;
        } else if (isRadioGroup) {
          const state = fieldStates.get(fieldIds[focusedFieldIndex]);
          const comp = components.get(fieldIds[focusedFieldIndex]) as RadioGroupComponent;
          const currentIdx = comp.options.findIndex((o) => o.value === state.selected);
          const nextIdx = Math.min(currentIdx + 1, comp.options.length - 1);
          state.selected = comp.options[nextIdx]?.value || state.selected;
          refresh();
          return;
        } else {
          focusedButtonIndex = -1;
          focusedFieldIndex = Math.min(focusedFieldIndex + 1, fieldIds.length - 1);
          refresh();
          return;
        }
      }

      if (matchesKey(key, Key.up)) {
        if (isList) {
          const state = fieldStates.get(fieldIds[focusedFieldIndex]);
          state.scrollIndex = Math.max(state.scrollIndex - 1, 0);
          refresh();
          return;
        } else if (isRadioGroup) {
          const state = fieldStates.get(fieldIds[focusedFieldIndex]);
          const comp = components.get(fieldIds[focusedFieldIndex]) as RadioGroupComponent;
          const currentIdx = comp.options.findIndex((o) => o.value === state.selected);
          const nextIdx = Math.max(currentIdx - 1, 0);
          state.selected = comp.options[nextIdx]?.value || state.selected;
          refresh();
          return;
        } else {
          focusedButtonIndex = -1;
          focusedFieldIndex = Math.max(focusedFieldIndex - 1, 0);
          refresh();
          return;
        }
      }

      // Handle component-specific interactions
      const currentField = fieldIds[focusedButtonIndex === -1 ? focusedFieldIndex : -1];
      if (currentField) {
        const comp = components.get(currentField)!;

        if (comp.component === "TextField" || comp.component === "TextArea") {
          // Handle backspace
          const isBackspace = 
            matchesKey(key, Key.backspace) || 
            key === '\x08' ||     // ASCII 8
            key === '\x7f' ||     // ASCII 127 (DEL)
            key === '\u0008';     // Unicode backspace
          
          if (isBackspace) {
            const current = fieldValues.get(currentField) || "";
            fieldValues.set(currentField, current.slice(0, -1));
            refresh();
            return;
          }

          // Handle character input (single printable character)
          if (key && key.length === 1 && key.charCodeAt(0) >= 32 && key.charCodeAt(0) < 127) {
            const current = fieldValues.get(currentField) || "";
            fieldValues.set(currentField, current + key);
            refresh();
            return;
          }

          // TextArea-specific: Handle Enter for newlines
          if (comp.component === "TextArea" && matchesKey(key, Key.enter)) {
            const current = fieldValues.get(currentField) || "";
            fieldValues.set(currentField, current + "\n");
            refresh();
            return;
          }
        }

        if (comp.component === "Slider") {
          const slider = comp as SliderComponent;
          const min = slider.min || 0;
          const max = slider.max || 100;
          const step = slider.step || 1;
          const currentVal = parseInt(fieldValues.get(currentField) || String(min));
          
          if (matchesKey(key, Key.left)) {
            const newVal = Math.max(min, currentVal - step);
            fieldValues.set(currentField, String(newVal));
            refresh();
            return;
          }
          
          if (matchesKey(key, Key.right)) {
            const newVal = Math.min(max, currentVal + step);
            fieldValues.set(currentField, String(newVal));
            refresh();
            return;
          }
          
          // Direct number input
          if (key && key.length === 1 && key >= "0" && key <= "9") {
            const digit = parseInt(key);
            const newVal = Math.min(max, digit * 10 + (digit < Math.floor(max / 10) ? 0 : 0));
            if (newVal >= min && newVal <= max) {
              fieldValues.set(currentField, String(newVal));
              refresh();
              return;
            }
          }
        }

        if (comp.component === "Tabs") {
          const tabs = comp as TabsComponent;
          const currentTabId = fieldValues.get(currentField) || tabs.defaultTab || tabs.tabs[0]?.id || "";
          const currentIndex = tabs.tabs.findIndex(t => t.id === currentTabId);
          
          if (matchesKey(key, Key.left)) {
            const newIndex = (currentIndex - 1 + tabs.tabs.length) % tabs.tabs.length;
            fieldValues.set(currentField, tabs.tabs[newIndex].id);
            refresh();
            return;
          }
          
          if (matchesKey(key, Key.right)) {
            const newIndex = (currentIndex + 1) % tabs.tabs.length;
            fieldValues.set(currentField, tabs.tabs[newIndex].id);
            refresh();
            return;
          }
        }

        if (comp.component === "Accordion") {
          const accordion = comp as AccordionComponent;
          let state = fieldStates.get(currentField);
          if (!state) {
            // Initialize if missing
            const expanded: Record<string, boolean> = {};
            for (const section of accordion.sections) {
              expanded[section.id] = section.expanded || false;
            }
            state = { expanded, selectedIndex: 0 };
            fieldStates.set(currentField, state);
          }
          
          // Space: Toggle current section
          if (matchesKey(key, Key.space)) {
            const currentSection = accordion.sections[state.selectedIndex];
            if (currentSection) {
              state.expanded[currentSection.id] = !state.expanded[currentSection.id];
              fieldStates.set(currentField, state); // Ensure state is saved
            }
            refresh();
            return;
          }
          
          // Down arrow: Move to next section
          if (matchesKey(key, Key.down)) {
            state.selectedIndex = Math.min(state.selectedIndex + 1, accordion.sections.length - 1);
            fieldStates.set(currentField, state);
            refresh();
            return;
          }
          
          // Up arrow: Move to previous section
          if (matchesKey(key, Key.up)) {
            state.selectedIndex = Math.max(state.selectedIndex - 1, 0);
            fieldStates.set(currentField, state);
            refresh();
            return;
          }
        }

        if (comp.component === "Checkbox") {
          if (matchesKey(key, Key.space)) {
            const current = fieldStates.get(currentField) || false;
            fieldStates.set(currentField, !current);
            refresh();
            return;
          }
        }

        if (comp.component === "RadioGroup") {
          const state = fieldStates.get(currentField);
          const rgComp = comp as RadioGroupComponent;

          if (matchesKey(key, Key.space)) {
            state.expanded = !state.expanded;
            refresh();
            return;
          }

          if (matchesKey(key, Key.right)) {
            const idx = rgComp.options.findIndex((o) => o.value === state.selected);
            if (idx < rgComp.options.length - 1) {
              state.selected = rgComp.options[idx + 1].value;
            }
            refresh();
            return;
          }

          if (matchesKey(key, Key.left)) {
            const idx = rgComp.options.findIndex((o) => o.value === state.selected);
            if (idx > 0) {
              state.selected = rgComp.options[idx - 1].value;
            }
            refresh();
            return;
          }
        }

        if (comp.component === "SelectDropdown") {
          const state = fieldStates.get(currentField);
          const sdComp = comp as SelectDropdownComponent;

          if (matchesKey(key, Key.space)) {
            state.expanded = !state.expanded;
            refresh();
            return;
          }

          if (state.expanded) {
            if (matchesKey(key, Key.down)) {
              const idx = sdComp.options.findIndex((o) => o.value === state.selected);
              if (idx < sdComp.options.length - 1) {
                state.selected = sdComp.options[idx + 1].value;
                refresh();
              }
              return;
            }

            if (matchesKey(key, Key.up)) {
              const idx = sdComp.options.findIndex((o) => o.value === state.selected);
              if (idx > 0) {
                state.selected = sdComp.options[idx - 1].value;
                refresh();
              }
              return;
            }
          }
        }
      }
    }

    // === COMPONENT INTERFACE ===
    return {
      render: (width: number) => render(width),
      handleInput: (key: string) => handleInput(key),
      getStatus: () => "Interactive Form",
    };
  };
}
