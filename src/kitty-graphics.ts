/**
 * Kitty Graphics Protocol Escape Sequence Generator
 * 
 * Generates raw escape sequences for displaying images via Kitty protocol
 * These sequences can be embedded in terminal output
 */

/**
 * Create a Kitty graphics escape sequence for displaying base64 image data
 * 
 * Kitty Protocol Format:
 * ESC_G ... ESC \
 * 
 * Example:
 * \x1b_Ga=T,f=100,c=40,r=20;iVBORw0KGgoAAAA...\x1b\\
 */
export function createKittyGraphicsSequence(
  base64Data: string,
  options?: {
    width?: number;  // Width in cells
    height?: number; // Height in cells
    imageId?: number; // Image ID for reuse
    zIndex?: number; // Z-index (negative = under text, default -1)
  }
): string {
  const width = options?.width || 40;
  const height = options?.height || 20;
  const zIndex = options?.zIndex !== undefined ? options.zIndex : -1; // Default to under text
  
  // Build control sequence
  const controls: string[] = [
    "a=T",           // Action: transmit and display
    "f=100",         // Format: PNG (100)
    `c=${width}`,    // Columns (width in cells)
    `r=${height}`,   // Rows (height in cells)
    `z=${zIndex}`,   // Z-index: negative = under text (prevents floating)
  ];
  
  if (options?.imageId) {
    controls.push(`i=${options.imageId}`); // Image ID
  }
  
  const controlStr = controls.join(",");
  
  // Escape sequence: ESC _ ... ESC \
  // In JavaScript: \x1b_ for start, \x1b\\ for end
  return `\x1b_G${controlStr};${base64Data}\x1b\\`;
}

/**
 * Wrap Kitty escape sequence as a string that can be printed
 * 
 * Parameters:
 * - base64Data: Base64-encoded image data
 * - width: Width in cells (default 24)
 * - height: Height in cells (default 12)
 * - zIndex: Z-stacking order, negative = under text (default -1)
 */
export function kittyImageLine(
  base64Data: string,
  width?: number,
  height?: number,
  zIndex?: number
): string {
  return createKittyGraphicsSequence(base64Data, { width, height, zIndex });
}
