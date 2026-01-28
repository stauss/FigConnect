/**
 * Color utility functions for Figma plugin
 */

/**
 * Convert Figma RGB (0-1 range) to hex string
 */
export function figmaColorToHex(color: RGB): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Convert hex string to Figma RGB (0-1 range)
 */
export function hexToFigmaColor(hex: string): RGB {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Handle shorthand hex (e.g., #FFF)
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((c) => c + c)
          .join("")
      : cleanHex;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);

  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * Convert RGB object (0-1 range) to Figma RGB
 */
export function rgbToFigmaColor(rgb: { r: number; g: number; b: number }): RGB {
  return {
    r: Math.max(0, Math.min(1, rgb.r)),
    g: Math.max(0, Math.min(1, rgb.g)),
    b: Math.max(0, Math.min(1, rgb.b)),
  };
}

/**
 * Convert RGB255 (0-255 range) to Figma RGB (0-1 range)
 */
export function rgb255ToFigmaColor(rgb: {
  r: number;
  g: number;
  b: number;
}): RGB {
  return {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255,
  };
}

/**
 * Create a solid fill from Figma color
 */
export function createSolidFill(color: RGB, opacity: number = 1): SolidPaint {
  return {
    type: "SOLID",
    color,
    opacity,
  };
}

/**
 * Create a solid fill from hex color
 */
export function createSolidFillFromHex(
  hex: string,
  opacity: number = 1,
): SolidPaint {
  return createSolidFill(hexToFigmaColor(hex), opacity);
}

/**
 * Parse a color from various formats
 */
export function parseColor(
  color: string | RGB | { r: number; g: number; b: number },
): RGB {
  if (typeof color === "string") {
    return hexToFigmaColor(color);
  }
  return rgbToFigmaColor(color);
}
