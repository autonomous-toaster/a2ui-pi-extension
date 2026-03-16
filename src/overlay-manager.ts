/**
 * A2UI Overlay Manager
 * 
 * Provides overlay display for A2UI forms with:
 * - Toggle on/off with keyboard shortcut (Ctrl+U)
 * - Persistent state across invocations
 * - Graceful cleanup
 * 
 * Pattern follows doom-overlay example from pi-mono
 */

import type { Component } from "@mariozechner/pi-tui";
import { matchesKey, Key, type TUI } from "@mariozechner/pi-tui";
import type { A2UIComponent } from "./types";
import type { FormData } from "./interactive-form-v3";
import { createA2UIFormComponent } from "./interactive-form-v3";

export interface OverlayState {
  isVisible: boolean;
  components: Map<string, A2UIComponent>;
  formData: FormData | null;
}

let globalOverlayState: OverlayState | null = null;
let onOverlaySubmit: ((data: FormData | null) => void) | null = null;

/**
 * Create an overlay manager component
 * 
 * Handles:
 * - Display/hide toggle with Ctrl+U
 * - Keyboard pass-through to form when visible
 * - Persistent state across interactions
 */
export function createA2UIOverlayManager(
  components: Map<string, A2UIComponent>,
  theme: any,
  onSubmit?: (data: FormData | null) => void
) {
  return (tui: TUI, _theme: any, _kb: any, done: (data: FormData | null) => void) => {
    // Initialize global state
    globalOverlayState = {
      isVisible: true,
      components,
      formData: null,
    };
    onOverlaySubmit = onSubmit;

    // Create the inner form component
    const formComponent = createA2UIFormComponent(components, theme);
    let innerComponent: Component | null = null;
    let isFormActive = false;

    const wrapper: Component = {
      render: (width: number): string[] => {
        // If overlay not visible, render empty (transparent)
        if (!globalOverlayState?.isVisible) {
          return [];
        }

        // Initialize form component on first render
        if (!isFormActive) {
          isFormActive = true;
          innerComponent = formComponent(tui, theme, _kb, (formData) => {
            globalOverlayState!.formData = formData;
            if (onOverlaySubmit) {
              onOverlaySubmit(formData);
            }
            done(formData);
          });
        }

        // Delegate to form rendering
        return innerComponent ? innerComponent.render(width) : [];
      },

      handleInput: (data: string): void => {
        // Ctrl+U toggles overlay visibility
        if (matchesKey(data, "ctrl+u")) {
          if (globalOverlayState) {
            globalOverlayState.isVisible = !globalOverlayState.isVisible;
            tui.requestRender();
          }
          return;
        }

        // Pass input to form only if overlay is visible
        if (globalOverlayState?.isVisible && innerComponent && isFormActive) {
          innerComponent.handleInput(data);
        }
      },

      invalidate: (): void => {
        if (innerComponent) {
          innerComponent.invalidate();
        }
      },
    };

    return wrapper;
  };
}

/**
 * Toggle overlay visibility without closing
 * Can be called from anywhere to show/hide the overlay
 */
export function toggleA2UIOverlay(): boolean {
  if (globalOverlayState) {
    globalOverlayState.isVisible = !globalOverlayState.isVisible;
    return globalOverlayState.isVisible;
  }
  return false;
}

/**
 * Get current overlay visibility state
 */
export function isA2UIOverlayVisible(): boolean {
  return globalOverlayState?.isVisible ?? false;
}

/**
 * Get current form data (if any)
 */
export function getA2UIFormData(): FormData | null {
  return globalOverlayState?.formData ?? null;
}
