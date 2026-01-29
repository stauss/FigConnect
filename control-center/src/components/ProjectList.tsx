import { useEffect, useState } from "react";
import { useConnectionStore } from "../stores/connection-store";
import { api } from "../services/api";
import "./ProjectList.css";

export default function ProjectList() {
  const { projects, fetchProjects, disconnectProject } = useConnectionStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [fileKeyInput, setFileKeyInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const toggleExpand = (fileKey: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(fileKey)) {
      newExpanded.delete(fileKey);
    } else {
      newExpanded.add(fileKey);
    }
    setExpanded(newExpanded);
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      await api.connectProject({
        fileKey: fileKeyInput.trim(),
        enabled: true,
      });
      setFileKeyInput("");
      setShowAddForm(false);
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || "Failed to connect file");
    } finally {
      setAdding(false);
    }
  };

  const handleDisconnect = async (fileKey: string) => {
    if (!confirm(`Disconnect ${fileKey}?`)) return;

    try {
      await disconnectProject(fileKey);
    } catch (err: any) {
      alert(`Failed to disconnect: ${err.message}`);
    }
  };

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2>Project Connections</h2>
        <button
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "+ Add File"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddFile} className="add-file-form">
          <input
            type="text"
            value={fileKeyInput}
            onChange={(e) => {
              setFileKeyInput(e.target.value);
              setError("");
            }}
            placeholder="Enter Figma file key"
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={adding}>
            {adding ? "Connecting..." : "Connect"}
          </button>
        </form>
      )}

      {projects.length === 0 ? (
        <p className="empty-state">
          No files connected yet. Add one to get started!
        </p>
      ) : (
        <div className="projects">
          {projects.map((project) => (
            <div key={project.fileKey} className="project-item">
              <div className="project-header">
                <input
                  type="checkbox"
                  checked={project.enabled}
                  onChange={() => {
                    // Toggle enabled state
                    api
                      .connectProject({
                        fileKey: project.fileKey,
                        enabled: !project.enabled,
                      })
                      .then(() => fetchProjects());
                  }}
                />
                <span
                  className="project-name"
                  onClick={() => toggleExpand(project.fileKey)}
                >
                  {project.fileName || project.fileKey}
                </span>
                <button
                  className="disconnect-button"
                  onClick={() => handleDisconnect(project.fileKey)}
                  title="Disconnect"
                >
                  ×
                </button>
              </div>

              {expanded.has(project.fileKey) && (
                <div className="project-details">
                  <div className="detail-row">
                    <span className="detail-label">File Key:</span>
                    <code className="detail-value">{project.fileKey}</code>
                  </div>
                  {project.lastSeenAt && (
                    <div className="detail-row">
                      <span className="detail-label">Last Seen:</span>
                      <span className="detail-value">
                        {new Date(project.lastSeenAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
