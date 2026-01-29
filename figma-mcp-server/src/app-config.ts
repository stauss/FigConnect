/**
 * Central application configuration
 * Update the app name here and it will propagate throughout the application
 */
export const APP_CONFIG = {
  name: "FigYah",
  nameLower: "figyah",
  nameKebab: "figyah",
  version: "1.0.0",
  description: "AI-powered Figma design collaborator",
  storageDir: ".figyah", // Directory name in user's home directory
} as const;
