import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useConnectionStore } from "../stores/connection-store";
import "./ConnectionStatus.css";

export default function ConnectionStatus() {
  const { currentFile } = useConnectionStore();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.getStatus();
        setStatus(data);
      } catch (error) {
        console.error("Failed to fetch status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="connection-status">
        <h2>Connection Status</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="connection-status">
      <h2>Connection Status</h2>

      <div className="status-item">
        <span className="status-label">Bridge Server:</span>
        <div style={{ textAlign: "right" }}>
          <span
            className={`status-value ${status?.bridgeServer?.running ? "online" : "offline"}`}
          >
            {status?.bridgeServer?.running ? "● Online" : "○ Offline"}
          </span>
          {status?.bridgeServer?.running && (
            <small className="status-hint">
              Port {status.bridgeServer.port} - Connects plugin & control center
            </small>
          )}
        </div>
      </div>

      <div className="status-item">
        <span className="status-label">MCP Server:</span>
        <div style={{ textAlign: "right" }}>
          <span className="status-value online">
            ● Running (waiting for AI client)
          </span>
          <small className="status-hint">
            AI assistants connect TO this server via MCP protocol
          </small>
        </div>
      </div>

      {currentFile && (
        <div className="status-item">
          <span className="status-label">Active File:</span>
          <span className="status-value">
            {currentFile.fileName}
            <br />
            <small>{currentFile.fileKey}</small>
          </span>
        </div>
      )}

      {status?.queue && (
        <div className="status-item">
          <span className="status-label">Queue:</span>
          <span className="status-value">
            {status.queue.pending} pending, {status.queue.completed} completed
          </span>
        </div>
      )}

      <button
        className="test-button"
        onClick={async () => {
          try {
            await api.getStatus();
            alert("Connection test successful!");
          } catch (error: any) {
            alert(`Connection test failed: ${error.message}`);
          }
        }}
      >
        Test Connection
      </button>
    </div>
  );
}
