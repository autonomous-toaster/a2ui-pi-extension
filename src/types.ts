/**
 * A2UI Type Definitions for Pi Extension
 * Minimal v0.9 schema supporting 5 core components
 */

// ===== Component Types =====

export interface A2UIComponent {
  id: string;
  component: "Text" | "Button" | "TextField" | "Card" | "Column" | "Row";
  attributes?: Record<string, any>;
}

export interface TextComponent extends A2UIComponent {
  component: "Text";
  text: string;
  attributes?: {
    textAlignment?: "start" | "center" | "end";
    style?: string;
  };
}

export interface ButtonComponent extends A2UIComponent {
  component: "Button";
  child?: string; // ID of child component (typically Text)
  action?: A2UIAction;
  attributes?: {
    primary?: boolean;
    disabled?: boolean;
  };
}

export interface TextFieldComponent extends A2UIComponent {
  component: "TextField";
  label?: string;
  value?: string | { path: string };
  placeholder?: string;
  attributes?: {
    required?: boolean;
    disabled?: boolean;
  };
}

export interface CardComponent extends A2UIComponent {
  component: "Card";
  children?: string[]; // IDs of child components
  attributes?: {
    title?: string;
    elevation?: number;
  };
}

export interface ColumnComponent extends A2UIComponent {
  component: "Column";
  children?: string[];
  attributes?: {
    spacing?: number;
    mainAxisAlignment?: "start" | "center" | "end" | "spaceBetween";
  };
}

export interface RowComponent extends A2UIComponent {
  component: "Row";
  children?: string[];
  attributes?: {
    spacing?: number;
    mainAxisAlignment?: "start" | "center" | "end" | "spaceBetween";
  };
}

// ===== Message Types =====

export interface A2UIMessage {
  version: "v0.9";
}

export interface CreateSurfaceMessage extends A2UIMessage {
  createSurface: {
    surfaceId: string;
    catalogId?: string;
  };
}

export interface UpdateComponentsMessage extends A2UIMessage {
  updateComponents: {
    surfaceId: string;
    components: A2UIComponent[];
  };
}

export interface UpdateDataModelMessage extends A2UIMessage {
  updateDataModel: {
    surfaceId: string;
    path: string;
    value: any;
  };
}

export interface DeleteSurfaceMessage extends A2UIMessage {
  deleteSurface: {
    surfaceId: string;
  };
}

export type A2UIServerMessage =
  | CreateSurfaceMessage
  | UpdateComponentsMessage
  | UpdateDataModelMessage
  | DeleteSurfaceMessage;

// ===== Action Types =====

export interface A2UIAction {
  name: string;
  context?: Record<string, any>;
}

export interface A2UIUserAction {
  version: "v0.9";
  action: {
    name: string;
    sourceComponentId: string;
    surfaceId: string;
    value?: any;
    context?: Record<string, any>;
  };
}

// ===== Validation Result =====

export interface A2UIValidationResult {
  valid: boolean;
  errors: string[];
}

// ===== Renderer State =====

export interface A2UISurface {
  surfaceId: string;
  components: Map<string, A2UIComponent>;
  dataModel: Map<string, any>;
}

export interface A2UIRendererState {
  surfaces: Map<string, A2UISurface>;
}
