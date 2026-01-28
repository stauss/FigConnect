import { Logger } from "./logger";

const logger = new Logger("Fonts");

// Cache of loaded fonts
const fontCache: Set<string> = new Set();

/**
 * Font weight to style name mapping
 */
const FONT_WEIGHT_STYLES: Record<number, string> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi Bold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
};

/**
 * Get font style name from weight
 */
export function getFontStyle(weight: number): string {
  // Find closest weight
  const weights = Object.keys(FONT_WEIGHT_STYLES).map(Number);
  const closest = weights.reduce((prev, curr) =>
    Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev,
  );
  return FONT_WEIGHT_STYLES[closest] || "Regular";
}

/**
 * Create a FontName object
 */
export function createFontName(family: string, weight: number = 400): FontName {
  return {
    family,
    style: getFontStyle(weight),
  };
}

/**
 * Load a font asynchronously
 */
export async function loadFont(
  family: string = "Inter",
  weight: number = 400,
): Promise<FontName> {
  const style = getFontStyle(weight);
  const fontName: FontName = { family, style };
  const key = `${family}-${style}`;

  // Check cache
  if (fontCache.has(key)) {
    return fontName;
  }

  try {
    await figma.loadFontAsync(fontName);
    fontCache.add(key);
    logger.debug(`Loaded font: ${family} ${style}`);
    return fontName;
  } catch (error) {
    logger.warn(`Failed to load font ${family} ${style}, trying fallback`);

    // Try common fallbacks
    const fallbacks: FontName[] = [
      { family: "Inter", style: "Regular" },
      { family: "Roboto", style: "Regular" },
      { family: "Arial", style: "Regular" },
    ];

    for (const fallback of fallbacks) {
      try {
        await figma.loadFontAsync(fallback);
        fontCache.add(`${fallback.family}-${fallback.style}`);
        logger.info(
          `Using fallback font: ${fallback.family} ${fallback.style}`,
        );
        return fallback;
      } catch {
        // Continue to next fallback
      }
    }

    throw new Error(`Failed to load any font for ${family} ${style}`);
  }
}

/**
 * Load font from an existing text node
 */
export async function loadFontFromNode(textNode: TextNode): Promise<FontName> {
  const fontName = textNode.fontName as FontName;
  if (fontName === figma.mixed) {
    // If mixed fonts, load Inter as default
    return loadFont("Inter", 400);
  }
  await figma.loadFontAsync(fontName);
  const key = `${fontName.family}-${fontName.style}`;
  fontCache.add(key);
  return fontName;
}

/**
 * Check if a font is available
 */
export async function isFontAvailable(
  family: string,
  style: string = "Regular",
): Promise<boolean> {
  try {
    const fonts = await figma.listAvailableFontsAsync();
    return fonts.some(
      (f) => f.fontName.family === family && f.fontName.style === style,
    );
  } catch {
    return false;
  }
}

/**
 * Clear font cache
 */
export function clearFontCache(): void {
  fontCache.clear();
}
