const API_BASE = "/api/ui";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Config
  async getConfig() {
    return fetchJson<any>(`/config`);
  },

  async saveConfig(config: Partial<any>) {
    return fetchJson<{ success: boolean }>(`/config`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  },

  // Projects
  async getProjects() {
    return fetchJson<{ projects: any[] }>(`/projects`);
  },

  async connectProject(connection: {
    fileKey: string;
    fileName?: string;
    projectId?: string;
    projectName?: string;
    pages?: string[];
    enabled?: boolean;
  }) {
    return fetchJson<{ success: boolean; connection: any }>(
      `/projects/connect`,
      {
        method: "POST",
        body: JSON.stringify(connection),
      },
    );
  },

  async disconnectProject(fileKey: string) {
    return fetchJson<{ success: boolean }>(`/projects/disconnect`, {
      method: "POST",
      body: JSON.stringify({ fileKey }),
    });
  },

  // History
  async getHistory(filters?: {
    fileKey?: string;
    status?: string;
    after?: string;
    before?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.fileKey) params.set("fileKey", filters.fileKey);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.after) params.set("after", filters.after);
    if (filters?.before) params.set("before", filters.before);
    if (filters?.limit) params.set("limit", filters.limit.toString());

    const query = params.toString();
    return fetchJson<{ history: any[] }>(`/history${query ? `?${query}` : ""}`);
  },

  // Conversations
  async getConversations(filters?: {
    fileKey?: string;
    after?: string;
    before?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.fileKey) params.set("fileKey", filters.fileKey);
    if (filters?.after) params.set("after", filters.after);
    if (filters?.before) params.set("before", filters.before);
    if (filters?.limit) params.set("limit", filters.limit.toString());

    const query = params.toString();
    return fetchJson<{ conversations: any[] }>(
      `/conversations${query ? `?${query}` : ""}`,
    );
  },

  // Backups
  async getBackups(fileKey: string) {
    return fetchJson<{ backups: any[] }>(`/backups?fileKey=${fileKey}`);
  },

  async restoreBackup(backupId: string) {
    return fetchJson<any>(`/backups/restore`, {
      method: "POST",
      body: JSON.stringify({ backupId }),
    });
  },

  // Status
  async getStatus() {
    return fetchJson<{
      bridgeServer: { running: boolean; port: number };
      currentFile: { fileKey: string; fileName: string } | null;
      queue: any;
      mcpServer: { connected: boolean };
    }>(`/status`);
  },
};
