/**
 * A2UI Validation Utilities
 * Validates messages and components against the A2UI schema
 */

import type {
  A2UIComponent,
  A2UIServerMessage,
  A2UIValidationResult,
} from "./types";

// ===== Message Validation =====

export function validateA2UIMessage(message: any): A2UIValidationResult {
  const errors: string[] = [];

  if (!message || typeof message !== "object") {
    errors.push("Message must be an object");
    return { valid: false, errors };
  }

  if (message.version !== "v0.9") {
    errors.push(`Invalid A2UI version: ${message.version}. Expected v0.9`);
  }

  if (message.createSurface) {
    const validation = validateCreateSurface(message);
    errors.push(...validation.errors);
  } else if (message.updateComponents) {
    const validation = validateUpdateComponents(message);
    errors.push(...validation.errors);
  } else if (message.updateDataModel) {
    const validation = validateUpdateDataModel(message);
    errors.push(...validation.errors);
  } else if (message.deleteSurface) {
    const validation = validateDeleteSurface(message);
    errors.push(...validation.errors);
  } else {
    errors.push("Message must contain one of: createSurface, updateComponents, updateDataModel, deleteSurface");
  }

  return { valid: errors.length === 0, errors };
}

export function validateA2UIMessages(messages: any[]): A2UIValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(messages)) {
    return { valid: false, errors: ["Messages must be an array"] };
  }

  if (messages.length === 0) {
    return { valid: false, errors: ["Messages array cannot be empty"] };
  }

  // Check for createSurface as first message
  const firstMsg = messages[0];
  if (!firstMsg.createSurface) {
    errors.push("First message must be createSurface");
  }

  // Validate each message
  for (let i = 0; i < messages.length; i++) {
    const validation = validateA2UIMessage(messages[i]);
    if (!validation.valid) {
      errors.push(`Message ${i}: ${validation.errors.join("; ")}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ===== Component Validation =====

export function validateComponent(component: any): A2UIValidationResult {
  const errors: string[] = [];

  if (!component || typeof component !== "object") {
    errors.push("Component must be an object");
    return { valid: false, errors };
  }

  // Check required fields
  if (!component.id) {
    errors.push("Component missing required field: id");
  } else if (typeof component.id !== "string") {
    errors.push("Component.id must be a string");
  }

  if (!component.component) {
    errors.push("Component missing required field: component");
  } else if (!["Text", "Button", "TextField", "TextArea", "Slider", "Tabs", "Accordion", "Checkbox", "RadioGroup", "SelectDropdown", "List", "Image", "Card", "Column", "Row"].includes(component.component)) {
    errors.push(`Invalid component type: ${component.component}`);
  }

  // Type-specific validation
  switch (component.component) {
    case "Text":
      if (!component.text) {
        errors.push("Text component missing required field: text");
      }
      break;
    case "Button":
      if (component.action && !component.action.name) {
        errors.push("Button action missing required field: name");
      }
      break;
    case "TextField":
      if (component.value?.path) {
        if (!validateDataPath(component.value.path)) {
          errors.push(`Invalid data path: ${component.value.path}`);
        }
      }
      break;
    case "TextArea":
      if (component.value?.path) {
        if (!validateDataPath(component.value.path)) {
          errors.push(`Invalid data path: ${component.value.path}`);
        }
      }
      break;
    case "Slider":
      if (component.min !== undefined && component.max !== undefined && component.min > component.max) {
        errors.push("Slider: min cannot be greater than max");
      }
      if (component.step !== undefined && component.step <= 0) {
        errors.push("Slider: step must be positive");
      }
      break;
    case "Tabs":
      if (!component.tabs || !Array.isArray(component.tabs) || component.tabs.length === 0) {
        errors.push("Tabs component must have at least one tab");
      }
      break;
    case "Accordion":
      if (!component.sections || !Array.isArray(component.sections) || component.sections.length === 0) {
        errors.push("Accordion component must have at least one section");
      }
      break;
    case "Checkbox":
      if (!component.label) {
        errors.push("Checkbox component missing required field: label");
      }
      break;
    case "RadioGroup":
      if (!component.options || !Array.isArray(component.options)) {
        errors.push("RadioGroup component missing required field: options (must be array)");
      }
      break;
    case "SelectDropdown":
      if (!component.options || !Array.isArray(component.options)) {
        errors.push("SelectDropdown component missing required field: options (must be array)");
      }
      break;
    case "List":
      if (!component.items || !Array.isArray(component.items)) {
        errors.push("List component missing required field: items (must be array)");
      }
      break;
    case "Image":
      if (!component.source || !component.source.type) {
        errors.push("Image component missing required field: source.type");
      }
      break;
    case "Card":
    case "Column":
    case "Row":
      if (component.children && !Array.isArray(component.children)) {
        errors.push(`${component.component} children must be an array`);
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

// ===== Message-Specific Validation =====

function validateCreateSurface(message: any): A2UIValidationResult {
  const errors: string[] = [];

  if (!message.createSurface) {
    errors.push("Missing createSurface field");
    return { valid: false, errors };
  }

  const { surfaceId } = message.createSurface;
  if (!surfaceId) {
    errors.push("createSurface missing required field: surfaceId");
  } else if (typeof surfaceId !== "string") {
    errors.push("createSurface.surfaceId must be a string");
  }

  return { valid: errors.length === 0, errors };
}

function validateUpdateComponents(message: any): A2UIValidationResult {
  const errors: string[] = [];

  if (!message.updateComponents) {
    errors.push("Missing updateComponents field");
    return { valid: false, errors };
  }

  const { surfaceId, components } = message.updateComponents;

  if (!surfaceId) {
    errors.push("updateComponents missing required field: surfaceId");
  }

  if (!components) {
    errors.push("updateComponents missing required field: components");
  } else if (!Array.isArray(components)) {
    errors.push("updateComponents.components must be an array");
  } else if (components.length === 0) {
    errors.push("updateComponents.components cannot be empty");
  } else {
    // Validate each component
    const seenIds = new Set<string>();
    for (let i = 0; i < components.length; i++) {
      const validation = validateComponent(components[i]);
      if (!validation.valid) {
        errors.push(`Component ${i}: ${validation.errors.join("; ")}`);
      }

      // Check for duplicate IDs
      if (components[i].id && seenIds.has(components[i].id)) {
        errors.push(`Duplicate component ID: ${components[i].id}`);
      }
      seenIds.add(components[i].id);
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateUpdateDataModel(message: any): A2UIValidationResult {
  const errors: string[] = [];

  if (!message.updateDataModel) {
    errors.push("Missing updateDataModel field");
    return { valid: false, errors };
  }

  const { surfaceId, path, value } = message.updateDataModel;

  if (!surfaceId) {
    errors.push("updateDataModel missing required field: surfaceId");
  }

  if (!path) {
    errors.push("updateDataModel missing required field: path");
  } else if (!validateDataPath(path)) {
    errors.push(`Invalid data path: ${path}`);
  }

  if (value === undefined) {
    errors.push("updateDataModel missing required field: value");
  }

  return { valid: errors.length === 0, errors };
}

function validateDeleteSurface(message: any): A2UIValidationResult {
  const errors: string[] = [];

  if (!message.deleteSurface) {
    errors.push("Missing deleteSurface field");
    return { valid: false, errors };
  }

  const { surfaceId } = message.deleteSurface;
  if (!surfaceId) {
    errors.push("deleteSurface missing required field: surfaceId");
  }

  return { valid: errors.length === 0, errors };
}

// ===== Helper Functions =====

/**
 * Validate JSON path format (e.g., /form/name)
 */
function validateDataPath(path: string): boolean {
  if (typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  // Basic validation: must have at least one segment after /
  return path.length > 1;
}

/**
 * Get component ID from a component object
 */
export function getComponentId(component: A2UIComponent): string {
  return component.id;
}

/**
 * Find all component IDs referenced in children
 */
export function getReferencedIds(component: A2UIComponent): Set<string> {
  const ids = new Set<string>();

  if ("child" in component && component.child) {
    ids.add(component.child);
  }

  if ("children" in component && Array.isArray(component.children)) {
    component.children.forEach((id) => ids.add(id));
  }

  return ids;
}

/**
 * Check if all referenced component IDs exist in the component map
 */
export function validateComponentReferences(
  components: A2UIComponent[],
): A2UIValidationResult {
  const errors: string[] = [];
  const componentIds = new Set(components.map((c) => c.id));

  for (const component of components) {
    const referencedIds = getReferencedIds(component);
    for (const refId of referencedIds) {
      if (!componentIds.has(refId)) {
        errors.push(`Component ${component.id} references non-existent component: ${refId}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
