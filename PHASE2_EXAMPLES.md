# A2UI Phase 2: Component Examples & Mappings

## Overview
These 10 concrete examples show how to extend A2UI with new components and map them to pi-tui rendering patterns.

---

## Example 1: Checkbox Component

### A2UI Spec
```json
{
  "id": "newsletter_checkbox",
  "component": "Checkbox",
  "label": "Subscribe to newsletter",
  "checked": false,
  "attributes": {
    "required": false,
    "disabled": false
  }
}
```

### Pi-TUI Rendering
```typescript
interface CheckboxComponent {
  id: string;
  label: string;
  checked: boolean;
}

function renderCheckbox(cb: CheckboxComponent, focused: boolean, theme: any): string[] {
  const symbol = cb.checked ? "☑" : "☐";
  const color = focused ? "success" : "text";
  return [theme.fg(color, `  ${symbol}  ${cb.label}`)];
}
```

### Terminal Output
```
  ☑  Subscribe to newsletter        (checked)
  ☐  Subscribe to newsletter        (unchecked)
  ☑  Subscribe to newsletter        (focused, with green color)
```

### Input Handling
- **Space**: Toggle checkbox
- **Tab**: Move to next field
- **Enter**: Move to next field (same as Tab)

### Use Cases
- Confirmation dialogs
- Settings/preferences
- Terms of service acceptance
- Multi-select options

---

## Example 2: RadioButton Group

### A2UI Spec
```json
{
  "id": "shipping_method",
  "component": "RadioGroup",
  "label": "Shipping Method",
  "options": [
    {"id": "standard", "label": "Standard (5-7 days)", "value": "standard"},
    {"id": "express", "label": "Express (2-3 days)", "value": "express"},
    {"id": "overnight", "label": "Overnight", "value": "overnight"}
  ],
  "selected": "standard"
}
```

### Pi-TUI Rendering
```typescript
interface RadioOption {
  id: string;
  label: string;
  value: string;
}

interface RadioGroupComponent {
  id: string;
  label: string;
  options: RadioOption[];
  selected: string;
}

function renderRadioGroup(rg: RadioGroupComponent, focusedOptionIdx: number, theme: any): string[] {
  const lines = [theme.fg("accent", rg.label)];
  
  rg.options.forEach((opt, idx) => {
    const symbol = rg.selected === opt.value ? "◉" : "○";
    const isFocused = idx === focusedOptionIdx;
    const color = isFocused ? "success" : "text";
    lines.push(theme.fg(color, `    ${symbol}  ${opt.label}`));
  });
  
  return lines;
}
```

### Terminal Output
```
Shipping Method
    ◉  Standard (5-7 days)     (selected)
    ○  Express (2-3 days)      (unselected)
    ○  Overnight                (unselected)

Shipping Method
    ○  Standard (5-7 days)
    ◉  Express (2-3 days)       (focused)
    ○  Overnight
```

### Input Handling
- **↑/↓**: Navigate options
- **Space**: Select option
- **Tab**: Move to next field
- **Enter**: Confirm and move to next

### Use Cases
- Payment methods
- Shipping options
- Quality settings
- Preference selection

---

## Example 3: SelectDropdown (ComboBox)

### A2UI Spec
```json
{
  "id": "country_select",
  "component": "SelectDropdown",
  "label": "Country",
  "options": [
    {"label": "United States", "value": "us"},
    {"label": "United Kingdom", "value": "uk"},
    {"label": "Canada", "value": "ca"},
    {"label": "Australia", "value": "au"}
  ],
  "selected": "us",
  "searchable": true
}
```

### Pi-TUI Rendering

**Closed State:**
```
Country: [United States ▼]
```

**Expanded State:**
```
Country: [United States ▼]
  ⇒ United States      (highlighted/selected)
    United Kingdom
    Canada
    Australia
```

**With Search:**
```
Country: [Uni▼]  (user typed "Uni")
  ⇒ United States
    United Kingdom
```

### Terminal Output
```
// Closed dropdown
Country: [United States ▼]

// Expanded, first option focused
Country: [▲ ─────────────── ▼]
  ⇒ United States
    United Kingdom
    Canada
    Australia

// Search active
Country: [Can▼] (filtering)
  ⇒ Canada
```

### Input Handling
- **Enter/Space**: Toggle dropdown
- **↑/↓**: Navigate options (when expanded)
- **Type**: Filter options (if searchable)
- **Backspace**: Delete char from search
- **Escape**: Close dropdown
- **Tab**: Close and move to next field

### Use Cases
- Country/region selection
- Date/time picker
- Category selection
- Complex option selection

---

## Example 4: List / ListView

### A2UI Spec
```json
{
  "id": "user_list",
  "component": "List",
  "label": "Select a user",
  "items": [
    {
      "id": "user_1",
      "label": "Alice Johnson",
      "description": "Admin",
      "avatar": "https://avatars.githubusercontent.com/u/1?size=32"
    },
    {
      "id": "user_2",
      "label": "Bob Smith",
      "description": "Editor",
      "avatar": "https://avatars.githubusercontent.com/u/2?size=32"
    },
    {
      "id": "user_3",
      "label": "Carol White",
      "description": "Viewer",
      "avatar": "https://avatars.githubusercontent.com/u/3?size=32"
    }
  ],
  "selected": "user_1"
}
```

### Pi-TUI Rendering
```typescript
interface ListItem {
  id: string;
  label: string;
  description?: string;
  avatar?: string;
}

function renderList(items: ListItem[], selectedIdx: number, theme: any): string[] {
  const lines = [];
  const visibleCount = Math.min(5, items.length);
  
  items.slice(0, visibleCount).forEach((item, idx) => {
    const symbol = idx === selectedIdx ? "▶" : " ";
    const color = idx === selectedIdx ? "success" : "text";
    const desc = item.description ? ` (${item.description})` : "";
    lines.push(theme.fg(color, `  ${symbol}  ${item.label}${desc}`));
  });
  
  if (items.length > visibleCount) {
    lines.push(theme.fg("dim", `  ↓ ${items.length - visibleCount} more...`));
  }
  
  return lines;
}
```

### Terminal Output
```
Select a user
  ▶  Alice Johnson (Admin)       (selected)
     Bob Smith (Editor)
     Carol White (Viewer)
  ↓ 2 more...

(arrow up/down to navigate, Enter to select)
```

### Input Handling
- **↑/↓**: Navigate items
- **Page Up/Down**: Scroll by 5 items
- **Home/End**: Jump to start/end
- **Type**: Jump to item starting with letter
- **Enter**: Select item
- **Escape**: Cancel

### Use Cases
- User selection
- Search results
- Contact lists
- File/item browsers

---

## Example 5: Image Component (URL/Base64)

### A2UI Spec
```json
{
  "id": "user_avatar",
  "component": "Image",
  "source": {
    "type": "url",
    "url": "https://avatars.githubusercontent.com/u/11556?v=4&size=64"
  },
  "size": "medium",
  "alt": "User avatar"
}
```

### Alternative: Base64
```json
{
  "id": "logo",
  "component": "Image",
  "source": {
    "type": "base64",
    "data": "iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSbxZQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABGSURBVCiPY/hPAAxQABYaIAZkBiSA4T8UMECpgQkMUGpgAgOUGpjAAKUGJjBAqYEJDFBqYAIDlBqYwAClBiYwQKkBAK9OAO7Z0o2hAAAAAElFTkSuQmCC"
  },
  "size": "small"
}
```

### Pi-TUI Rendering Strategy

**Option A: ASCII Art (Limited)**
```typescript
function renderImageAsASCII(imageData: Buffer, width: number, height: number): string[] {
  // Convert pixel data to ASCII characters
  const ascii = "   ..::;---====|**##@@  ";
  // Map pixel brightness to ASCII
  // Result: 8x8 ASCII art representation
}
```

**Option B: Unicode Blocks (Better)**
```typescript
function renderImageAsBlocks(imageData: Buffer, width: number, height: number): string[] {
  const blocks = "▐░▒▓█";  // Or with colors
  // Map 2x4 pixel groups to block characters
  // Result: More recognizable representation
}
```

**Option C: Placeholder (Pragmatic)**
```typescript
function renderImagePlaceholder(alt: string, size: string, theme: any): string[] {
  const sizeInfo = {
    small: "32x32",
    medium: "64x64",
    large: "128x128"
  };
  
  return [
    theme.fg("dim", "┌─────────────────┐"),
    theme.fg("dim", "│   [IMAGE]        │"),
    theme.fg("dim", `│   ${alt}      │`),
    theme.fg("dim", `│   ${sizeInfo[size]}        │`),
    theme.fg("dim", "└─────────────────┘")
  ];
}
```

### Terminal Output

**ASCII Art (32x32 from GitHub avatar):**
```
  ░░░░░░░░░░░░░░░░
  ░███████████░░░░
  ░███████████░░░░
  ░░░░░░░░░░░░░░░░
  ░░░░████████░░░░
  ░░░░████████░░░░
  ░░░░░░░░░░░░░░░░
```

**Placeholder (Pragmatic):**
```
┌─────────────────┐
│   [IMAGE]        │
│   User avatar     │
│   64x64           │
└─────────────────┘
```

### Implementation Details

**Download Strategy:**
```typescript
async function fetchImageAsBase64(url: string): Promise<string> {
  // Use node-fetch or https module
  // Convert response to base64
  // Cache for session
  // Fallback to placeholder on error
}
```

**Size Parameters:**
- `?size=32` for avatars (32x32px)
- `?size=64` for cards (64x64px)
- `?size=128` for larger display
- `?v=4` for cache-busting

### Use Cases
- User avatars
- Product images
- Icons
- Illustrations
- Logos

---

## Example 6: TextArea Component

### A2UI Spec
```json
{
  "id": "feedback_textarea",
  "component": "TextArea",
  "label": "Feedback",
  "placeholder": "Tell us what you think...",
  "rows": 4,
  "maxLength": 500,
  "attributes": {
    "required": true,
    "spellcheck": true
  }
}
```

### Pi-TUI Rendering
```typescript
interface TextAreaComponent {
  id: string;
  label: string;
  placeholder: string;
  rows: number;
  value: string;
  maxLength?: number;
}

function renderTextArea(ta: TextAreaComponent, focused: boolean, theme: any): string[] {
  const lines = [theme.fg("accent", ta.label)];
  
  // Top border
  lines.push(theme.fg(focused ? "success" : "muted", "╭" + "─".repeat(60) + "╮"));
  
  // Content lines
  const textLines = ta.value.split("\n").slice(0, ta.rows);
  for (let i = 0; i < ta.rows; i++) {
    const content = textLines[i] || "";
    const display = content.padEnd(60);
    lines.push(theme.fg(focused ? "success" : "text", "│" + display + "│"));
  }
  
  // Bottom border + char count
  const charCount = `${ta.value.length}/${ta.maxLength || '∞'}`;
  lines.push(theme.fg(focused ? "success" : "muted", "╰" + "─".repeat(60) + "╯"));
  lines.push(theme.fg("dim", `  Characters: ${charCount}`));
  
  return lines;
}
```

### Terminal Output
```
Feedback
╭────────────────────────────────────────────────────────────╮
│This is great feedback about your product                  │
│                                                            │
│I really like the new interface.                           │
│                                                            │
╰────────────────────────────────────────────────────────────╯
  Characters: 78/500
```

### Input Handling
- **Type**: Add characters
- **Backspace**: Delete character
- **Enter**: New line (or Tab to next if one-liner)
- **Ctrl+A**: Select all
- **Tab**: Move to next field (or insert tab)
- **Arrow keys**: Move cursor within text

### Use Cases
- Feedback forms
- Comments
- Descriptions
- Message composition

---

## Example 7: Slider / NumberInput

### A2UI Spec
```json
{
  "id": "rating_slider",
  "component": "Slider",
  "label": "Rate this experience",
  "min": 1,
  "max": 5,
  "step": 1,
  "value": 3,
  "showLabel": true
}
```

### Pi-TUI Rendering
```typescript
interface SliderComponent {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

function renderSlider(slider: SliderComponent, focused: boolean, theme: any): string[] {
  const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  const barLength = 40;
  const filledLength = Math.round((percentage / 100) * barLength);
  
  const filled = "█".repeat(filledLength);
  const empty = "░".repeat(barLength - filledLength);
  const color = focused ? "success" : "muted";
  
  return [
    theme.fg("accent", slider.label),
    theme.fg(color, `  ${filled}${empty}`),
    theme.fg("text", `  Value: ${slider.value} (${slider.min}-${slider.max})`)
  ];
}
```

### Terminal Output
```
Rate this experience
  █████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (3/5)
  Value: 3 (1-5)

(← → to adjust, Tab to next)
```

### Input Handling
- **←/→**: Decrease/increase value by step
- **↓/↑**: Same as ←/→
- **Home/End**: Jump to min/max
- **Type digit**: Jump to value (if < max)
- **Tab**: Move to next field

### Use Cases
- Ratings (1-5 stars)
- Volume/brightness control
- Quality/speed selection
- Quantity input

---

## Example 8: Card with Image

### A2UI Spec
```json
{
  "id": "product_card",
  "component": "Card",
  "attributes": {
    "title": "Premium Headphones",
    "elevation": 2
  },
  "children": ["product_image", "product_title", "product_price", "product_action"]
}
```

### Pi-TUI Rendering
```
┌─────────────────────────────────┐
│   [IMAGE]                       │
│   Premium Headphones            │
│   $199.99                       │
│   [ Add to Cart ]  [ Details ]  │
└─────────────────────────────────┘
```

### Use Cases
- Product selection
- User profiles
- Search results
- Dashboard cards

---

## Example 9: Tabbed Interface

### A2UI Spec
```json
{
  "id": "content_tabs",
  "component": "Tabs",
  "tabs": [
    {
      "id": "tab_overview",
      "label": "Overview",
      "content": "overview_content"
    },
    {
      "id": "tab_details",
      "label": "Details",
      "content": "details_content"
    },
    {
      "id": "tab_reviews",
      "label": "Reviews",
      "content": "reviews_content"
    }
  ],
  "activeTab": "tab_overview"
}
```

### Pi-TUI Rendering
```
[Overview] [Details] [Reviews]
─────────────────────────────────
Overview content goes here...
```

### Terminal Output
```
[Overview] [Details] [Reviews]          (active tab has color/underline)
─────────────────────────────────────
Welcome to the overview. This product...

[Overview] [Details] [Reviews]          (switch tabs with ←/→ or Tab)
─────────────────────────────────────
Specifications:
  - Weight: 200g
  - Cable Length: 1.5m
  - Frequency Response: 20-20kHz
```

### Input Handling
- **←/→**: Switch tabs
- **↑/↓**: Not used for tabs
- **Tab**: Move to content or next field
- **Ctrl+Tab**: Cycle through tabs

### Use Cases
- Product details
- Documentation
- Settings sections
- Account pages

---

## Example 10: Accordion / Collapsible Sections

### A2UI Spec
```json
{
  "id": "faq_accordion",
  "component": "Accordion",
  "items": [
    {
      "id": "faq_1",
      "title": "How do I reset my password?",
      "content": "Click 'Forgot Password' on the login page..."
    },
    {
      "id": "faq_2",
      "title": "What payment methods do you accept?",
      "content": "We accept credit cards, PayPal, and bank transfers..."
    },
    {
      "id": "faq_3",
      "title": "Is there a free trial?",
      "content": "Yes, 30-day free trial with no credit card required..."
    }
  ],
  "expandedItems": ["faq_1"]
}
```

### Pi-TUI Rendering
```
▼ How do I reset my password?
  Click 'Forgot Password' on the login page...
  
  1. Click the link
  2. Check your email
  3. Follow the instructions

► What payment methods do you accept?

► Is there a free trial?

(↑/↓ to navigate, Space/Enter to expand/collapse)
```

### Terminal Output
```
▼ How do I reset my password?
  Click 'Forgot Password' on the login page...
  
  1. Click the link
  2. Check your email
  3. Follow the instructions

► What payment methods do you accept?

► Is there a free trial?


▼ How do I reset my password?
  Click 'Forgot Password' on the login page...

▼ What payment methods do you accept?  (focused)
  We accept credit cards, PayPal, and bank transfers

► Is there a free trial?
```

### Input Handling
- **↑/↓**: Navigate items
- **Space/Enter**: Toggle expansion
- **→**: Expand section
- **←**: Collapse section
- **Tab**: Move to next accordion or field

### Use Cases
- FAQs
- Feature documentation
- Settings groups
- Nested navigation

---

## Implementation Strategy Summary

### Phase 2A (MVP - 5 Examples)
1. ✅ Checkbox
2. ✅ RadioButton/Group
3. ✅ SelectDropdown
4. ✅ List
5. ✅ Image (with placeholder fallback)

### Phase 2B (Extended - 5 Examples)
6. ✅ TextArea
7. ✅ Slider/NumberInput
8. ✅ Card with Image
9. ✅ Tabs
10. ✅ Accordion

### Code Organization
```
src/
├── components/
│   ├── checkbox.ts
│   ├── radio.ts
│   ├── select.ts
│   ├── list.ts
│   ├── image.ts
│   ├── textarea.ts
│   ├── slider.ts
│   ├── card.ts
│   ├── tabs.ts
│   └── accordion.ts
├── interactive-form-v2.ts  (extend)
└── types.ts               (extend)
```

### Data Binding for All
Every component supports A2UI data paths:
```json
{
  "value": { "path": "/form/field/name" }
}
```

When agent updates:
```json
{
  "updateDataModel": {
    "path": "/form/field/name",
    "value": "new value"
  }
}
```

Component re-renders automatically.

---

## Testing Examples

### Example Session: Product Survey
```
Welcome to our survey!

┌─────────────────────────────┐
│ [AVATAR IMAGE]              │
│ Thank you for your purchase  │
└─────────────────────────────┘

Overall satisfaction:
  ◉ Very satisfied
  ○ Satisfied
  ○ Neutral
  ○ Dissatisfied

Quality rating:
  ███░░░░░░ (7/10)

Which features did you use?
  ☑ Notifications
  ☐ Settings
  ☐ Sharing

[Submit Survey]  [Skip]
```

### Example Session: Account Settings
```
Account Settings

[General] [Security] [Privacy] [Notifications]
─────────────────────────────────────

Name
  > [John Doe________________]

Email
    [john@example.com________]

Change Password
  [Change Password Button]

Two-Factor Authentication
  ☑ Enabled
```

### Example Session: Product List Selection
```
Select a product:

  ▶  Laptop ($999)     (selected)
     Keyboard ($89)
     Mouse ($29)
     Monitor ($399)
  ↓ 2 more products...

Product Details:
  ┌──────────────────┐
  │   [IMAGE]        │
  │   Laptop         │
  │   High-end 16"   │
  │   $999           │
  └──────────────────┘

[Add to Cart]  [View Details]
```

---

## Next Steps

1. **Implement Components**: Create ~10 component modules (Phase 2A)
2. **Update Types.ts**: Add TypeScript interfaces
3. **Extend Interactive Form**: Handle new component types
4. **Test Coverage**: Create examples for each component
5. **Document**: API docs for component usage
6. **Polish**: Keyboard shortcuts, accessibility, theming

