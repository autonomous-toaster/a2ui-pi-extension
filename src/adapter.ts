/**
 * A2UI to Pi-TUI Adapter
 * Converts A2UI components to pi-tui renderable components
 */

import {
  Box,
  Component,
  Container,
  Input,
  Text,
  type Theme,
} from "@mariozechner/pi-tui";
import type {
  A2UIComponent,
  ButtonComponent,
  CardComponent,
  ColumnComponent,
  RowComponent,
  TextComponent,
  TextFieldComponent,
} from "./types";

export interface ComponentRenderContext {
  theme: Theme;
  dataModel: Map<string, any>;
  components: Map<string, A2UIComponent>;
  onAction?: (componentId: string, actionName: string, context?: any) => void;
}

/**
 * Convert A2UI component to pi-tui Component
 */
export function a2uiToTUI(
  componentId: string,
  context: ComponentRenderContext,
): Component {
  const comp = context.components.get(componentId);

  if (!comp) {
    return new Text(`[Component not found: ${componentId}]`, 0, 0);
  }

  try {
    switch (comp.component) {
      case "Text":
        return renderText(comp as TextComponent, context);
      case "Button":
        return renderButton(comp as ButtonComponent, context);
      case "TextField":
        return renderTextField(comp as TextFieldComponent, context);
      case "Card":
        return renderCard(comp as CardComponent, context);
      case "Column":
        return renderColumn(comp as ColumnComponent, context);
      case "Row":
        return renderRow(comp as RowComponent, context);
      default:
        return new Text(`[Unknown component type: ${comp.component}]`, 0, 0);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Text(`[Render error: ${errorMsg}]`, 0, 0);
  }
}

/**
 * Render Text component
 */
function renderText(
  component: TextComponent,
  context: ComponentRenderContext,
): Component {
  const text = interpolateDataPath(component.text, context.dataModel);

  const alignment = component.attributes?.textAlignment ?? "start";
  const padding = alignment === "center" ? 1 : 0;

  return new Text(text, padding, 0);
}

/**
 * Render Button component
 * Shows as inverted text
 */
function renderButton(
  component: ButtonComponent,
  context: ComponentRenderContext,
): Component {
  let label = `[ ${component.id} ]`;

  // Get child label if provided
  if (component.child) {
    const childComp = context.components.get(component.child);
    if (childComp && childComp.component === "Text") {
      label = `[ ${(childComp as TextComponent).text} ]`;
    }
  }

  // Style the button
  let styledLabel = context.theme.inverted(label);

  if (component.attributes?.disabled) {
    styledLabel = context.theme.fg("muted", label);
  } else if (component.attributes?.primary) {
    styledLabel = context.theme.fg("success", context.theme.bold(label));
  }

  return new Text(styledLabel, 1, 0);
}

/**
 * Render TextField component
 */
function renderTextField(
  component: TextFieldComponent,
  context: ComponentRenderContext,
): Component {
  const value = component.value
    ? typeof component.value === "string"
      ? component.value
      : interpolateDataPath(component.value.path ?? "", context.dataModel)
    : "";

  const label = component.label ? `${component.label}: ` : "";
  const placeholder = component.placeholder ? `(${component.placeholder})` : "";

  const container = new Container();

  if (label) {
    container.addChild(new Text(label, 0, 0));
  }

  // Create input field
  const input = new Input(
    (text) => {
      // On input change - could emit event here
    },
    value,
  );

  container.addChild(input);

  if (placeholder) {
    container.addChild(new Text(context.theme.fg("muted", placeholder), 0, 0));
  }

  return container;
}

/**
 * Render Card component
 */
function renderCard(
  component: CardComponent,
  context: ComponentRenderContext,
): Component {
  const title = component.attributes?.title;
  const elevation = component.attributes?.elevation ?? 1;

  const box = new Box(
    elevation,
    context.theme.fg("warning", title ? `┌ ${title} ┐` : "┌─┐"),
  );

  // Add children
  if (component.children && component.children.length > 0) {
    const container = new Container();
    for (const childId of component.children) {
      const child = a2uiToTUI(childId, context);
      container.addChild(child);
    }
    box.addChild(container);
  }

  return box;
}

/**
 * Render Column component (vertical layout)
 */
function renderColumn(
  component: ColumnComponent,
  context: ComponentRenderContext,
): Component {
  const container = new Container();

  if (component.children && component.children.length > 0) {
    const spacing = component.attributes?.spacing ?? 0;

    for (let i = 0; i < component.children.length; i++) {
      const childId = component.children[i];
      const child = a2uiToTUI(childId, context);
      container.addChild(child);

      // Add spacing between items
      if (spacing > 0 && i < component.children.length - 1) {
        for (let j = 0; j < spacing; j++) {
          container.addChild(new Text("", 0, 0));
        }
      }
    }
  }

  return container;
}

/**
 * Render Row component (horizontal layout)
 * Note: Limited support in terminal - renders items vertically with horizontal context
 */
function renderRow(
  component: RowComponent,
  context: ComponentRenderContext,
): Component {
  const container = new Container();

  if (component.children && component.children.length > 0) {
    // In terminal, we can't truly do horizontal layout
    // Instead, render items separated by spaces/separators
    const children: Component[] = [];

    for (const childId of component.children) {
      const child = a2uiToTUI(childId, context);
      children.push(child);
    }

    // For now, render vertically with separators
    for (let i = 0; i < children.length; i++) {
      container.addChild(children[i]);

      if (i < children.length - 1) {
        container.addChild(new Text("---", 0, 0));
      }
    }
  }

  return container;
}

/**
 * Interpolate data path references in text
 * Supports {/path/to/value} syntax
 */
export function interpolateDataPath(text: string, dataModel: Map<string, any>): string {
  if (!text) return "";

  // Replace {/path} with data model values
  return text.replace(/\{(\/[^\}]+)\}/g, (match, path) => {
    const value = dataModel.get(path);
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Render complete A2UI surface
 * Returns a TUI component representing the entire surface
 */
export function renderA2UISurface(
  surfaceId: string,
  context: ComponentRenderContext,
): Component {
  // Find root component (first one created, or explicit root)
  let rootId: string | undefined;

  // Strategy 1: Look for component with children (container)
  for (const [id, comp] of context.components) {
    if (("children" in comp || "child" in comp) && !rootId) {
      rootId = id;
      break;
    }
  }

  // Strategy 2: Use first component if nothing found
  if (!rootId && context.components.size > 0) {
    rootId = context.components.keys().next().value;
  }

  if (!rootId) {
    return new Text(`[Empty surface: ${surfaceId}]`, 0, 0);
  }

  try {
    return a2uiToTUI(rootId, context);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Text(`[Surface render error: ${errorMsg}]`, 0, 0);
  }
}
