/**
 * A2UI Type Definitions for Pi Extension
 * Minimal v0.9 schema supporting 5 core components
 */

// ===== Component Types =====

export interface A2UIComponent {
  id: string;
  component: "Text" | "Button" | "TextField" | "Card" | "Column" | "Row" | "Checkbox" | "RadioGroup" | "SelectDropdown" | "List" | "Image";
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

export interface TextAreaComponent extends A2UIComponent {
  component: "TextArea";
  label?: string;
  value?: string | { path: string };
  placeholder?: string;
  rows?: number;
  attributes?: {
    required?: boolean;
    disabled?: boolean;
    maxLength?: number;
  };
}

export interface SliderComponent extends A2UIComponent {
  component: "Slider";
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  attributes?: {
    required?: boolean;
    disabled?: boolean;
  };
}

export interface TabsComponent extends A2UIComponent {
  component: "Tabs";
  tabs: Array<{
    id: string;
    label: string;
    content?: string;
  }>;
  defaultTab?: string;
}

export interface AccordionComponent extends A2UIComponent {
  component: "Accordion";
  sections: Array<{
    id: string;
    title: string;
    content: string;
    expanded?: boolean;
  }>;
  allowMultiple?: boolean;
}

export interface ToggleComponent extends A2UIComponent {
  component: "Toggle";
  label?: string;
  checked?: boolean;
  attributes?: {
    required?: boolean;
    disabled?: boolean;
  };
}

export interface NumberInputComponent extends A2UIComponent {
  component: "NumberInput";
  label?: string;
  value?: number;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  attributes?: {
    required?: boolean;
    disabled?: boolean;
  };
}

export interface RatingComponent extends A2UIComponent {
  component: "Rating";
  label?: string;
  value?: number;
  maxStars?: number;
  attributes?: {
    required?: boolean;
    disabled?: boolean;
  };
}

export interface ComboboxComponent extends A2UIComponent {
  component: "Combobox";
  label?: string;
  value?: string;
  placeholder?: string;
  options: Array<{ label: string; value: string }>;
  attributes?: {
    required?: boolean;
    disabled?: boolean;
  };
}

export interface DatePickerComponent extends A2UIComponent {
  component: "DatePicker";
  label?: string;
  value?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  attributes?: {
    required?: boolean;
    disabled?: boolean;
  };
}

export interface FileUploadComponent extends A2UIComponent {
  component: "FileUpload";
  label?: string;
  accept?: string;
  multiple?: boolean;
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

// ===== Phase 2A Components =====

export interface CheckboxComponent extends A2UIComponent {
  component: "Checkbox";
  label?: string;
  checked?: boolean;
  attributes?: {
    disabled?: boolean;
  };
}

export interface RadioGroupComponent extends A2UIComponent {
  component: "RadioGroup";
  label?: string;
  selected?: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  attributes?: {
    disabled?: boolean;
  };
}

export interface SelectDropdownComponent extends A2UIComponent {
  component: "SelectDropdown";
  label?: string;
  selected?: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  placeholder?: string;
  attributes?: {
    searchable?: boolean;
    disabled?: boolean;
  };
}

export interface ListComponent extends A2UIComponent {
  component: "List";
  label?: string;
  selected?: string;
  items: Array<{
    id: string;
    label: string;
  }>;
  attributes?: {
    disabled?: boolean;
  };
}

export interface ImageComponent extends A2UIComponent {
  component: "Image";
  source: {
    type: "url" | "base64";
    url?: string;
    data?: string;
  };
  size?: "small" | "medium" | "large";
  alt?: string;
  attributes?: {
    maxWidthCells?: number;
    maxHeightCells?: number;
  };
}

// ===== End Phase 2A Components =====


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
