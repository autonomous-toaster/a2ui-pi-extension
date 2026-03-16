/**
 * Advanced A2UI Examples for Phase 2B+ Development
 * 
 * This file explores:
 * 1. Real image rendering using pi-tui Image component
 * 2. Advanced form layouts and combinations
 * 3. All A2UI component possibilities
 * 4. Terminal capabilities and fallbacks
 */

/**
 * ASSESSMENT: IMAGE RENDERING IN TERMINAL
 * ========================================
 * 
 * Good news! Terminal images ARE possible in modern terminals.
 * 
 * Supported Terminals:
 *   ✅ Kitty Terminal (native graphics protocol)
 *   ✅ WezTerm (Kitty protocol support)
 *   ✅ iTerm2 (inline image protocol)
 *   ✅ Ghostty (Kitty protocol)
 *   ⚠️  VSCode Terminal (no images, but pi-tui handles gracefully)
 *   ⚠️  Alacritty (no native support, but falling back is fine)
 * 
 * How pi-tui Does It:
 *   1. Detects terminal via TERM_PROGRAM, KITTY_WINDOW_ID, etc.
 *   2. Uses Kitty graphics protocol for supported terminals
 *   3. Falls back to text-based descriptions gracefully
 * 
 * Implementation:
 *   - pi-tui has Image component in dist/components/image.d.ts
 *   - Accepts base64-encoded image data
 *   - Supports maxWidthCells, maxHeightCells options
 *   - Auto-detects PNG, JPEG, GIF, WebP dimensions
 *   - Renders via Kitty protocol or shows [Image: type] fallback
 * 
 * To Render Remote Images:
 *   1. Fetch image from URL
 *   2. Convert to base64
 *   3. Pass to pi-tui Image component
 *   4. Done! (works in Kitty, WezTerm, iTerm2, etc.)
 */

/**
 * Example 1: Profile Card with Avatar Thumbnail
 * Compact profile display with small avatar image
 */
export function getProfileCardExample(): string {
  return `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "profile_card"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "profile_card",
    "components": [
      {
        "id": "profile_title",
        "component": "Text",
        "text": "User Profile",
        "attributes": {"style": "bold"}
      },
      {
        "id": "avatar",
        "component": "Image",
        "source": {
          "type": "url",
          "url": "https://avatars.githubusercontent.com/u/264779216?s=100&u=3b359b93a5bae1fa184b74a1b725058a62195493&v=4"
        },
        "size": "small",
        "alt": "Avatar"
      },
      {
        "id": "username",
        "component": "Text",
        "text": "GitHub User",
        "attributes": {"style": "bold"}
      },
      {
        "id": "email",
        "component": "Text",
        "text": "user@github.com"
      },
      {
        "id": "bio_label",
        "component": "Text",
        "text": "Bio:"
      },
      {
        "id": "bio",
        "component": "TextField",
        "label": "Edit your bio",
        "placeholder": "Tell us about yourself",
        "value": "Open source enthusiast"
      },
      {
        "id": "save_btn",
        "component": "Button",
        "child": "save_label"
      },
      {
        "id": "save_label",
        "component": "Text",
        "text": "Save Profile"
      }
    ]
  }}
]
---a2ui_JSON---
`;
}

/**
 * Example 2: Team Selection with Avatars
 * Shows multiple images in a form
 */
export function getTeamSelectionExample(): string {
  return `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "team_select"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "team_select",
    "components": [
      {
        "id": "title",
        "component": "Text",
        "text": "Select Team Members",
        "attributes": {"style": "bold"}
      },
      {
        "id": "member1_avatar",
        "component": "Image",
        "source": {
          "type": "url",
          "url": "https://avatars.githubusercontent.com/u/11556?v=4&size=64"
        },
        "size": "small",
        "alt": "Member 1"
      },
      {
        "id": "member1_select",
        "component": "Checkbox",
        "label": "Alice (Developer)",
        "checked": true
      },
      {
        "id": "member2_avatar",
        "component": "Image",
        "source": {
          "type": "url",
          "url": "https://avatars.githubusercontent.com/u/11556?v=4&size=64"
        },
        "size": "small",
        "alt": "Member 2"
      },
      {
        "id": "member2_select",
        "component": "Checkbox",
        "label": "Bob (Designer)",
        "checked": false
      },
      {
        "id": "member3_avatar",
        "component": "Image",
        "source": {
          "type": "url",
          "url": "https://avatars.githubusercontent.com/u/264779216?s=400&u=3b359b93a5bae1fa184b74a1b725058a62195493&v=4"
        },
        "size": "small",
        "alt": "Member 3"
      },
      {
        "id": "member3_select",
        "component": "Checkbox",
        "label": "Carol (PM)",
        "checked": true
      },
      {
        "id": "confirm_btn",
        "component": "Button",
        "child": "confirm_label"
      },
      {
        "id": "confirm_label",
        "component": "Text",
        "text": "Confirm Selection"
      }
    ]
  }}
]
---a2ui_JSON---
`;
}

/**
 * Example 3: Product Showcase
 * Real use case: e-commerce with images
 */
export function getProductShowcaseExample(): string {
  return `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "product_showcase"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "product_showcase",
    "components": [
      {
        "id": "product_title",
        "component": "Text",
        "text": "Featured Product",
        "attributes": {"style": "bold"}
      },
      {
        "id": "product_image",
        "component": "Image",
        "source": {
          "type": "url",
          "url": "https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Product+Image"
        },
        "size": "large",
        "alt": "Product"
      },
      {
        "id": "product_name",
        "component": "Text",
        "text": "Premium Widget v2"
      },
      {
        "id": "price_label",
        "component": "Text",
        "text": "Price: \$99.99"
      },
      {
        "id": "quantity_field",
        "component": "TextField",
        "label": "Quantity",
        "value": "1"
      },
      {
        "id": "color_group",
        "component": "RadioGroup",
        "label": "Color",
        "options": [
          {"label": "Black", "value": "black"},
          {"label": "White", "value": "white"},
          {"label": "Red", "value": "red"}
        ],
        "selected": "black"
      },
      {
        "id": "add_to_cart_btn",
        "component": "Button",
        "child": "add_label"
      },
      {
        "id": "add_label",
        "component": "Text",
        "text": "Add to Cart"
      }
    ]
  }}
]
---a2ui_JSON---
`;
}

/**
 * Example 4: Dashboard with Data and Images
 * Complex layout with multiple sections
 */
export function getDashboardExample(): string {
  return `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "dashboard"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "dashboard",
    "components": [
      {
        "id": "dashboard_title",
        "component": "Text",
        "text": "User Dashboard",
        "attributes": {"style": "bold"}
      },
      {
        "id": "profile_section",
        "component": "Text",
        "text": "Profile",
        "attributes": {"style": "bold"}
      },
      {
        "id": "profile_avatar",
        "component": "Image",
        "source": {
          "type": "url",
          "url": "https://avatars.githubusercontent.com/u/264779216?s=400&u=3b359b93a5bae1fa184b74a1b725058a62195493&v=4"
        },
        "size": "small",
        "alt": "Profile"
      },
      {
        "id": "name_field",
        "component": "TextField",
        "label": "Name",
        "value": "John Doe"
      },
      {
        "id": "preferences_section",
        "component": "Text",
        "text": "Preferences",
        "attributes": {"style": "bold"}
      },
      {
        "id": "dark_mode",
        "component": "Checkbox",
        "label": "Dark Mode",
        "checked": true
      },
      {
        "id": "notifications",
        "component": "Checkbox",
        "label": "Email Notifications",
        "checked": true
      },
      {
        "id": "language",
        "component": "SelectDropdown",
        "label": "Language",
        "options": [
          {"label": "English", "value": "en"},
          {"label": "Spanish", "value": "es"},
          {"label": "French", "value": "fr"}
        ],
        "selected": "en"
      },
      {
        "id": "save_prefs_btn",
        "component": "Button",
        "child": "save_prefs_label"
      },
      {
        "id": "save_prefs_label",
        "component": "Text",
        "text": "Save Preferences"
      }
    ]
  }}
]
---a2ui_JSON---
`;
}

/**
 * Example 5: Article with Featured Image
 * Content + image combination
 */
export function getArticleExample(): string {
  return `
---a2ui_JSON---
[
  {"version": "v0.9", "createSurface": {"surfaceId": "article"}},
  {"version": "v0.9", "updateComponents": {
    "surfaceId": "article",
    "components": [
      {
        "id": "featured_image",
        "component": "Image",
        "source": {
          "type": "url",
          "url": "https://via.placeholder.com/800x400/4ECDC4/FFFFFF?text=Featured+Image"
        },
        "size": "large",
        "alt": "Article Featured Image"
      },
      {
        "id": "article_title",
        "component": "Text",
        "text": "Building Terminal UIs with A2UI",
        "attributes": {"style": "bold"}
      },
      {
        "id": "article_date",
        "component": "Text",
        "text": "Published: March 16, 2025"
      },
      {
        "id": "article_content",
        "component": "Text",
        "text": "Terminal user interfaces have become increasingly powerful. This article explores how A2UI makes it easy to build interactive forms in the terminal..."
      },
      {
        "id": "like_label",
        "component": "Text",
        "text": "Did you find this helpful?"
      },
      {
        "id": "rating",
        "component": "RadioGroup",
        "label": "Rating",
        "options": [
          {"label": "👍 Yes", "value": "yes"},
          {"label": "👎 No", "value": "no"},
          {"label": "🤷 Not Sure", "value": "unsure"}
        ],
        "selected": ""
      },
      {
        "id": "share_email",
        "component": "Checkbox",
        "label": "Email me similar articles",
        "checked": false
      },
      {
        "id": "submit_btn",
        "component": "Button",
        "child": "submit_label"
      },
      {
        "id": "submit_label",
        "component": "Text",
        "text": "Submit Feedback"
      }
    ]
  }}
]
---a2ui_JSON---
`;
}

/**
 * All Supported A2UI Components (Current + Planned)
 * 
 * Phase 1 (Complete):
 *   - Text (display)
 *   - Button (action)
 *   - TextField (single-line input)
 * 
 * Phase 2A (Complete):
 *   - Checkbox (boolean)
 *   - RadioGroup (single select)
 *   - SelectDropdown (searchable select)
 *   - List (scrollable list)
 *   - Image (display images)
 * 
 * Phase 2B (Planned):
 *   - TextArea (multi-line input)
 *   - Slider (range input)
 *   - Card (container/grouping)
 *   - Tabs (tab navigation)
 *   - Accordion (collapsible sections)
 * 
 * Phase 2C+ (Future):
 *   - DateInput / DateRangePicker
 *   - TimeInput
 *   - NumberInput
 *   - Rating / Stars
 *   - Badge / Tag
 *   - Progress Bar
 *   - Modal / Dialog
 *   - Toast / Notification
 *   - And more...
 */

/**
 * Image Rendering Assessment Summary
 * 
 * CAPABILITY: Terminal images ARE supported
 * 
 * Technology Stack:
 *   ├─ Kitty Graphics Protocol
 *   │  └─ Used by: Kitty, WezTerm, Ghostty
 *   │  └─ Base64 encoded, sent via escape sequences
 *   │  └─ Can render PNG, JPEG, GIF, WebP
 *   │  └─ Supports image IDs for updates/animations
 *   │
 *   ├─ iTerm2 Inline Image Protocol
 *   │  └─ Used by: iTerm2, other Mac terminals
 *   │  └─ Also base64 encoded
 *   │  └─ Similar capability to Kitty
 *   │
 *   └─ Text Fallback
 *      └─ Used by: VSCode, Alacritty, others
 *      └─ Shows [Image: type dimensions] when no protocol support
 *      └─ Graceful degradation
 * 
 * Implementation in pi-tui:
 *   1. Terminal detection (TERM_PROGRAM env var)
 *   2. Image component with base64 input
 *   3. Automatic protocol selection
 *   4. Dimension detection for PNG/JPEG/GIF/WebP
 *   5. Fallback text for unsupported terminals
 * 
 * Usage Example:
 *   {
 *     "id": "avatar",
 *     "component": "Image",
 *     "source": {
 *       "type": "url",
 *       "url": "https://avatars.githubusercontent.com/u/264779216?..."
 *     },
 *     "size": "medium"
 *   }
 * 
 * How It Works:
 *   1. A2UI passes image source (URL or base64)
 *   2. Pi adapter fetches URL if needed
 *   3. Converts to base64 if not already
 *   4. Creates pi-tui Image component
 *   5. pi-tui detects terminal & chooses protocol
 *   6. Renders in Kitty/iTerm2, or shows fallback text
 * 
 * Performance:
 *   - Network: Only fetched once (when form loads)
 *   - Caching: Pi-tui can cache/reuse image IDs
 *   - Size: Base64 encoding ~33% overhead
 *   - Display: Instant rendering in supported terminals
 * 
 * Limitations:
 *   - File-based images need full paths (for now)
 *   - Animation requires image ID updates (Phase 3)
 *   - Unsupported terminals show text fallback
 *   - Image size limited by terminal viewport
 * 
 * Next Steps:
 *   1. Implement image URL fetching in adapter.ts
 *   2. Add base64 conversion to Image component handler
 *   3. Use pi-tui Image component directly
 *   4. Test in Kitty, WezTerm, iTerm2
 *   5. Verify fallback in VSCode/Alacritty
 */
