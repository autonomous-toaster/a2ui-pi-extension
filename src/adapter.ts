/**
 * A2UI to Pi-TUI Adapter
 * Converts A2UI components to pi-tui renderable components
 * 
 * Note: This is a simplified adapter for terminal display.
 * Real interactivity would require integration with pi's tool system.
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
  return new Text(text, 0, 0);
}

/**
 * Render Button component
 * Shows as bracketed text with styling
 */
function renderButton(
  component: ButtonComponent,
  context: ComponentRenderContext,
): Component {
  let label = component.id;

  // Get child label if provided
  if (component.child) {
    const childComp = context.components.get(component.child);
    if (childComp && childComp.component === "Text") {
      label = (childComp as TextComponent).text;
    }
  }

  // Style button based on attributes
  const isDisabled = component.attributes?.disabled ?? false;
  const isPrimary = component.attributes?.primary ?? false;

  let styledLabel: string;

  if (isDisabled) {
    styledLabel = context.theme.fg("muted", `[ ${label} ]`);
  } else if (isPrimary) {
    styledLabel = context.theme.fg("success", `[ ${label} ]`);
  } else {
    // Default button style
    styledLabel = context.theme.fg("accent", `[ ${label} ]`);
  }

  return new Text(styledLabel, 1, 0);
}

/**
 * Render TextField component
 * Shows as labeled input
 */
function renderTextField(
  component: TextFieldComponent,
  context: ComponentRenderContext,
): Component {
  const label = component.label ? `${component.label}:` : "";
  const value = component.value
    ? typeof component.value === "string"
      ? component.value
      : interpolateDataPath(component.value.path ?? "", context.dataModel)
    : "";

  const container = new Container();

  // Add label if present
  if (label) {
    container.addChild(new Text(context.theme.fg("accent", label), 0, 0));
  }

  // Add input field (read-only in this adapter, for display only)
  // In real interactive mode, this would be editable
  const inputDisplay = value ? `> ${value}` : "> ";
  container.addChild(new Text(context.theme.fg("muted", inputDisplay), 0, 0));

  return container;
}

/**
 * Render Card component
 * Shows as boxed content with optional title
 */
function renderCard(
  component: CardComponent,
  context: ComponentRenderContext,
): Component {
  const title = component.attributes?.title;
  const elevation = component.attributes?.elevation ?? 1;

  // Create box with border
  const borderStyle = title ? `┌ ${title} ┐` : "┌─┐";
  const box = new Box(elevation, context.theme.fg("warning", borderStyle));

  // Add children to box
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
    for (const childId of component.children) {
      const child = a2uiToTUI(childId, context);
      container.addChild(child);
    }
  }

  return container;
}

/**
 * Render Row component (horizontal layout)
 * Note: Terminal limitation - renders items on separate lines
 */
function renderRow(
  component: RowComponent,
  context: ComponentRenderContext,
): Component {
  const container = new Container();

  if (component.children && component.children.length > 0) {
    for (let i = 0; i < component.children.length; i++) {
      const childId = component.children[i];
      const child = a2uiToTUI(childId, context);
      container.addChild(child);
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
  // Find root component - look for component with children first
  let rootId: string | undefined;

  for (const [id, comp] of context.components) {
    if ("children" in comp && (comp as any).children?.length > 0) {
      rootId = id;
      break;
    }
  }

  // Fallback: use first component
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
