/**
 * Phase 2A Example: Product Survey Form
 * Demonstrates all 5 Phase 2A components in one form
 * 
 * Used by /a2ui-survey command for testing
 */

export function getPhase2ASurveyExample() {
  return `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "product_survey"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "product_survey",
    "components": [
      {"id": "title", "component": "Text", "text": "Product Survey", "attributes": {"textAlignment": "center"}},
      {"id": "description", "component": "Text", "text": "Thank you for your purchase! Please help us improve."},
      
      {"id": "avatar_image", "component": "Image", "source": {"type": "url", "url": "https://avatars.githubusercontent.com/u/11556?v=4&size=64"}, "alt": "Thank you avatar"},
      
      {"id": "satisfaction_label", "component": "Text", "text": "Overall Satisfaction"},
      {"id": "satisfaction_radio", "component": "RadioGroup", "label": "How satisfied are you?", "options": [
        {"id": "very_satisfied", "label": "Very satisfied", "value": "5"},
        {"id": "satisfied", "label": "Satisfied", "value": "4"},
        {"id": "neutral", "label": "Neutral", "value": "3"},
        {"id": "dissatisfied", "label": "Dissatisfied", "value": "2"},
        {"id": "very_dissatisfied", "label": "Very dissatisfied", "value": "1"}
      ], "selected": "5"},
      
      {"id": "features_label", "component": "Text", "text": "Which features did you use?"},
      {"id": "features_notifications", "component": "Checkbox", "label": "Notifications", "checked": true},
      {"id": "features_settings", "component": "Checkbox", "label": "Settings", "checked": false},
      {"id": "features_sharing", "component": "Checkbox", "label": "Sharing", "checked": false},
      {"id": "features_api", "component": "Checkbox", "label": "API Access", "checked": false},
      
      {"id": "rating_label", "component": "Text", "text": "Select your theme preference"},
      {"id": "theme_select", "component": "SelectDropdown", "label": "Theme", "options": [
        {"label": "Light", "value": "light"},
        {"label": "Dark", "value": "dark"},
        {"label": "Auto (system default)", "value": "auto"},
        {"label": "High Contrast", "value": "contrast"}
      ], "selected": "auto", "searchable": true},
      
      {"id": "products_label", "component": "Text", "text": "What product category was this for?"},
      {"id": "products_list", "component": "List", "label": "", "items": [
        {"id": "p_web", "label": "Web Application", "description": "Browser-based SaaS"},
        {"id": "p_mobile", "label": "Mobile App", "description": "iOS/Android native"},
        {"id": "p_desktop", "label": "Desktop Software", "description": "Windows/Mac/Linux"},
        {"id": "p_api", "label": "API / Backend", "description": "Server-side service"},
        {"id": "p_other", "label": "Other", "description": "Something else"}
      ], "selected": "p_web"},
      
      {"id": "submit_btn", "component": "Button", "child": "submit_label"},
      {"id": "submit_label", "component": "Text", "text": "Submit Survey"},
      
      {"id": "skip_btn", "component": "Button", "child": "skip_label"},
      {"id": "skip_label", "component": "Text", "text": "Skip Survey"}
    ]
  }}
]
---a2ui_JSON---
`;
}

/**
 * Phase 2A Example 2: Settings Form
 * Mix of checkboxes, radio, and select
 */
export function getPhase2ASettingsExample() {
  return `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "settings_form"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "settings_form",
    "components": [
      {"id": "title", "component": "Text", "text": "Account Settings", "attributes": {"textAlignment": "center"}},
      
      {"id": "general_header", "component": "Text", "text": "General Settings"},
      {"id": "notifications_cb", "component": "Checkbox", "label": "Enable notifications", "checked": true},
      {"id": "newsletter_cb", "component": "Checkbox", "label": "Subscribe to newsletter", "checked": false},
      {"id": "analytics_cb", "component": "Checkbox", "label": "Share usage analytics", "checked": true},
      
      {"id": "display_header", "component": "Text", "text": "Display"},
      {"id": "theme_select", "component": "SelectDropdown", "label": "Theme", "options": [
        {"label": "Light", "value": "light"},
        {"label": "Dark", "value": "dark"},
        {"label": "Auto", "value": "auto"}
      ], "selected": "dark"},
      
      {"id": "lang_label", "component": "Text", "text": "Language"},
      {"id": "language_radio", "component": "RadioGroup", "label": "", "options": [
        {"id": "en", "label": "English", "value": "en"},
        {"id": "es", "label": "Español", "value": "es"},
        {"id": "fr", "label": "Français", "value": "fr"},
        {"id": "de", "label": "Deutsch", "value": "de"}
      ], "selected": "en"},
      
      {"id": "save_btn", "component": "Button", "child": "save_label"},
      {"id": "save_label", "component": "Text", "text": "Save Settings"},
      
      {"id": "cancel_btn", "component": "Button", "child": "cancel_label"},
      {"id": "cancel_label", "component": "Text", "text": "Cancel"}
    ]
  }}
]
---a2ui_JSON---
`;
}

/**
 * Phase 2A Example 3: Product Selection
 * Showcase List component
 */
export function getPhase2AProductListExample() {
  return `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "product_selection"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "product_selection",
    "components": [
      {"id": "title", "component": "Text", "text": "Select a Product", "attributes": {"textAlignment": "center"}},
      
      {"id": "products_list", "component": "List", "label": "Available Products", "items": [
        {"id": "laptop", "label": "Laptop", "description": "High-end 16-inch", "avatar": "https://avatars.githubusercontent.com/u/11556?size=32"},
        {"id": "keyboard", "label": "Mechanical Keyboard", "description": "RGB with macros"},
        {"id": "mouse", "label": "Wireless Mouse", "description": "Ergonomic design"},
        {"id": "monitor", "label": "4K Monitor", "description": "32-inch HDR"},
        {"id": "headphones", "label": "Wireless Headphones", "description": "Noise-cancelling"}
      ], "selected": "laptop"},
      
      {"id": "shipping_label", "component": "Text", "text": "Shipping Method"},
      {"id": "shipping_radio", "component": "RadioGroup", "label": "", "options": [
        {"id": "standard", "label": "Standard (5-7 days)", "value": "standard"},
        {"id": "express", "label": "Express (2-3 days)", "value": "express"},
        {"id": "overnight", "label": "Overnight", "value": "overnight"}
      ], "selected": "standard"},
      
      {"id": "gift_wrap", "component": "Checkbox", "label": "Gift wrap this item", "checked": false},
      {"id": "insurance", "component": "Checkbox", "label": "Add shipping insurance", "checked": true},
      
      {"id": "checkout_btn", "component": "Button", "child": "checkout_label"},
      {"id": "checkout_label", "component": "Text", "text": "Proceed to Checkout"},
      
      {"id": "continue_btn", "component": "Button", "child": "continue_label"},
      {"id": "continue_label", "component": "Text", "text": "Continue Shopping"}
    ]
  }}
]
---a2ui_JSON---
`;
}
