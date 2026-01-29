export interface ConfigData {
  figmaAccessToken?: string;
  // Note: defaultModel and defaultProvider are deprecated - not needed since
  // AI clients connect to the MCP server, not the other way around
  defaultModel?: string; // Deprecated - not used
  defaultProvider?: string; // Deprecated - not used
  deploymentLocation?: "local" | "cloud";
  createdAt: string;
  updatedAt: string;
}

export interface ProjectConnection {
  fileKey: string;
  fileName: string;
  projectId?: string;
  projectName?: string;
  pages?: string[];
  enabled: boolean;
  connectedAt: string;
  lastSeenAt?: string;
}
