/**
 * A2UI Example Components
 * Pre-built UI examples for demonstration and testing
 */

import type { A2UIServerMessage } from "./types";

/**
 * Simple Contact Form
 */
export const EXAMPLE_CONTACT_FORM: A2UIServerMessage[] = [
  {
    version: "v0.9",
    createSurface: { surfaceId: "contact_form" },
  },
  {
    version: "v0.9",
    updateComponents: {
      surfaceId: "contact_form",
      components: [
        {
          id: "root",
          component: "Card",
          children: ["title", "form_fields", "actions"],
        },
        {
          id: "title",
          component: "Text",
          text: "Contact Us",
        },
        {
          id: "form_fields",
          component: "Column",
          children: ["name_field", "email_field", "message_field"],
        },
        {
          id: "name_field",
          component: "TextField",
          label: "Your Name",
          value: { path: "/contact/name" },
        },
        {
          id: "email_field",
          component: "TextField",
          label: "Email Address",
          value: { path: "/contact/email" },
        },
        {
          id: "message_field",
          component: "TextField",
          label: "Message",
          value: { path: "/contact/message" },
        },
        {
          id: "actions",
          component: "Row",
          children: ["cancel_btn", "submit_btn"],
        },
        {
          id: "cancel_btn",
          component: "Button",
          child: "cancel_text",
          action: { name: "cancel" },
        },
        {
          id: "cancel_text",
          component: "Text",
          text: "Cancel",
        },
        {
          id: "submit_btn",
          component: "Button",
          child: "submit_text",
          action: { name: "submit" },
        },
        {
          id: "submit_text",
          component: "Text",
          text: "Send",
        },
      ],
    },
  },
];

/**
 * Simple Product List
 */
export const EXAMPLE_PRODUCT_LIST: A2UIServerMessage[] = [
  {
    version: "v0.9",
    createSurface: { surfaceId: "product_list" },
  },
  {
    version: "v0.9",
    updateComponents: {
      surfaceId: "product_list",
      components: [
        {
          id: "root",
          component: "Column",
          children: ["header", "products"],
        },
        {
          id: "header",
          component: "Text",
          text: "Products",
        },
        {
          id: "products",
          component: "Column",
          children: ["product_1", "product_2", "product_3"],
        },
        {
          id: "product_1",
          component: "Card",
          children: ["p1_name", "p1_price", "p1_btn"],
        },
        {
          id: "p1_name",
          component: "Text",
          text: "Laptop",
        },
        {
          id: "p1_price",
          component: "Text",
          text: "$999",
        },
        {
          id: "p1_btn",
          component: "Button",
          child: "p1_btn_text",
          action: { name: "add_to_cart", context: { product_id: "1" } },
        },
        {
          id: "p1_btn_text",
          component: "Text",
          text: "Add to Cart",
        },
        {
          id: "product_2",
          component: "Card",
          children: ["p2_name", "p2_price", "p2_btn"],
        },
        {
          id: "p2_name",
          component: "Text",
          text: "Mouse",
        },
        {
          id: "p2_price",
          component: "Text",
          text: "$25",
        },
        {
          id: "p2_btn",
          component: "Button",
          child: "p2_btn_text",
          action: { name: "add_to_cart", context: { product_id: "2" } },
        },
        {
          id: "p2_btn_text",
          component: "Text",
          text: "Add to Cart",
        },
        {
          id: "product_3",
          component: "Card",
          children: ["p3_name", "p3_price", "p3_btn"],
        },
        {
          id: "p3_name",
          component: "Text",
          text: "Keyboard",
        },
        {
          id: "p3_price",
          component: "Text",
          text: "$79",
        },
        {
          id: "p3_btn",
          component: "Button",
          child: "p3_btn_text",
          action: { name: "add_to_cart", context: { product_id: "3" } },
        },
        {
          id: "p3_btn_text",
          component: "Text",
          text: "Add to Cart",
        },
      ],
    },
  },
];

/**
 * Simple Dashboard
 */
export const EXAMPLE_DASHBOARD: A2UIServerMessage[] = [
  {
    version: "v0.9",
    createSurface: { surfaceId: "dashboard" },
  },
  {
    version: "v0.9",
    updateComponents: {
      surfaceId: "dashboard",
      components: [
        {
          id: "root",
          component: "Column",
          children: ["title", "stats", "actions"],
        },
        {
          id: "title",
          component: "Text",
          text: "Dashboard",
        },
        {
          id: "stats",
          component: "Row",
          children: ["stat_1", "stat_2", "stat_3"],
        },
        {
          id: "stat_1",
          component: "Card",
          children: ["s1_label", "s1_value"],
        },
        {
          id: "s1_label",
          component: "Text",
          text: "Total Users",
        },
        {
          id: "s1_value",
          component: "Text",
          text: "1,234",
        },
        {
          id: "stat_2",
          component: "Card",
          children: ["s2_label", "s2_value"],
        },
        {
          id: "s2_label",
          component: "Text",
          text: "Active Sessions",
        },
        {
          id: "s2_value",
          component: "Text",
          text: "567",
        },
        {
          id: "stat_3",
          component: "Card",
          children: ["s3_label", "s3_value"],
        },
        {
          id: "s3_label",
          component: "Text",
          text: "Revenue",
        },
        {
          id: "s3_value",
          component: "Text",
          text: "$12,345",
        },
        {
          id: "actions",
          component: "Row",
          children: ["refresh_btn", "export_btn"],
        },
        {
          id: "refresh_btn",
          component: "Button",
          child: "refresh_text",
          action: { name: "refresh" },
        },
        {
          id: "refresh_text",
          component: "Text",
          text: "Refresh",
        },
        {
          id: "export_btn",
          component: "Button",
          child: "export_text",
          action: { name: "export" },
        },
        {
          id: "export_text",
          component: "Text",
          text: "Export",
        },
      ],
    },
  },
];

/**
 * Login Form
 */
export const EXAMPLE_LOGIN_FORM: A2UIServerMessage[] = [
  {
    version: "v0.9",
    createSurface: { surfaceId: "login" },
  },
  {
    version: "v0.9",
    updateComponents: {
      surfaceId: "login",
      components: [
        {
          id: "root",
          component: "Card",
          children: ["title", "fields", "footer"],
        },
        {
          id: "title",
          component: "Text",
          text: "Sign In",
        },
        {
          id: "fields",
          component: "Column",
          children: ["username_field", "password_field"],
        },
        {
          id: "username_field",
          component: "TextField",
          label: "Username",
          value: { path: "/login/username" },
        },
        {
          id: "password_field",
          component: "TextField",
          label: "Password",
          value: { path: "/login/password" },
        },
        {
          id: "footer",
          component: "Column",
          children: ["remember_text", "login_btn"],
        },
        {
          id: "remember_text",
          component: "Text",
          text: "Remember me",
        },
        {
          id: "login_btn",
          component: "Button",
          child: "login_text",
          action: { name: "login" },
        },
        {
          id: "login_text",
          component: "Text",
          text: "Sign In",
        },
      ],
    },
  },
];

/**
 * Settings Panel
 */
export const EXAMPLE_SETTINGS_PANEL: A2UIServerMessage[] = [
  {
    version: "v0.9",
    createSurface: { surfaceId: "settings" },
  },
  {
    version: "v0.9",
    updateComponents: {
      surfaceId: "settings",
      components: [
        {
          id: "root",
          component: "Column",
          children: ["title", "settings", "actions"],
        },
        {
          id: "title",
          component: "Text",
          text: "Settings",
        },
        {
          id: "settings",
          component: "Column",
          children: ["email_setting", "theme_setting", "notifications_setting"],
        },
        {
          id: "email_setting",
          component: "Card",
          children: ["email_label", "email_field"],
        },
        {
          id: "email_label",
          component: "Text",
          text: "Email Address",
        },
        {
          id: "email_field",
          component: "TextField",
          label: "Email",
          value: { path: "/settings/email" },
        },
        {
          id: "theme_setting",
          component: "Card",
          children: ["theme_label", "theme_info"],
        },
        {
          id: "theme_label",
          component: "Text",
          text: "Theme",
        },
        {
          id: "theme_info",
          component: "Text",
          text: "Current: Dark Mode",
        },
        {
          id: "notifications_setting",
          component: "Card",
          children: ["notif_label", "notif_info"],
        },
        {
          id: "notif_label",
          component: "Text",
          text: "Notifications",
        },
        {
          id: "notif_info",
          component: "Text",
          text: "Enabled",
        },
        {
          id: "actions",
          component: "Row",
          children: ["cancel_btn", "save_btn"],
        },
        {
          id: "cancel_btn",
          component: "Button",
          child: "cancel_text",
          action: { name: "cancel" },
        },
        {
          id: "cancel_text",
          component: "Text",
          text: "Cancel",
        },
        {
          id: "save_btn",
          component: "Button",
          child: "save_text",
          action: { name: "save" },
        },
        {
          id: "save_text",
          component: "Text",
          text: "Save",
        },
      ],
    },
  },
];

/**
 * Example registry
 */
export const EXAMPLES = {
  contact_form: {
    name: "Contact Form",
    description: "Simple contact form with name, email, and message fields",
    messages: EXAMPLE_CONTACT_FORM,
  },
  product_list: {
    name: "Product List",
    description: "Product listing with cards and add-to-cart buttons",
    messages: EXAMPLE_PRODUCT_LIST,
  },
  dashboard: {
    name: "Dashboard",
    description: "Dashboard with statistics cards and action buttons",
    messages: EXAMPLE_DASHBOARD,
  },
  login_form: {
    name: "Login Form",
    description: "Simple login form with username and password",
    messages: EXAMPLE_LOGIN_FORM,
  },
  settings_panel: {
    name: "Settings Panel",
    description: "Settings panel with editable fields and save/cancel buttons",
    messages: EXAMPLE_SETTINGS_PANEL,
  },
};

/**
 * Get example by key
 */
export function getExample(key: string): A2UIServerMessage[] | undefined {
  const example = EXAMPLES[key as keyof typeof EXAMPLES];
  return example?.messages;
}

/**
 * Get all example keys
 */
export function listExamples(): string[] {
  return Object.keys(EXAMPLES);
}

/**
 * Get example info
 */
export function getExampleInfo(key: string): { name: string; description: string } | undefined {
  const example = EXAMPLES[key as keyof typeof EXAMPLES];
  if (!example) return undefined;
  return { name: example.name, description: example.description };
}
