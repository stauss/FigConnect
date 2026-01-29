import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { CommandHistoryEntry } from "../types/history";
import "./HistoryTimeline.css";

export default function HistoryTimeline() {
  const [history, setHistory] = useState<CommandHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ fileKey?: string; status?: string }>(
    {},
  );

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchHistory = async () => {
    try {
      const response = await api.getHistory({ ...filter, limit: 50 });
      setHistory(response.history);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusEmoji: Record<string, string> = {
    pending: "⏳",
    posted: "📤",
    completed: "✅",
    failed: "❌",
    timeout: "⏰",
  };

  if (loading && history.length === 0) {
    return (
      <div className="history-timeline">
        <h2>History Timeline</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="history-timeline">
      <div className="history-header">
        <h2>History Timeline</h2>
        <div className="history-filters">
          <select
            value={filter.status || ""}
            onChange={(e) =>
              setFilter({ ...filter, status: e.target.value || undefined })
            }
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="posted">Posted</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="timeout">Timeout</option>
          </select>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="empty-state">No history yet</p>
      ) : (
        <div className="history-list">
          {history.map((entry) => (
            <div key={entry.id} className={`history-item ${entry.status}`}>
              <div className="history-item-header">
                <span className="history-status">
                  {statusEmoji[entry.status]} {entry.status}
                </span>
                <span className="history-time">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="history-command">
                <strong>{entry.command}</strong>
                {entry.fileKey && (
                  <span className="history-file">
                    {" "}
                    • {entry.fileKey.slice(0, 8)}...
                  </span>
                )}
              </div>
              {entry.error && (
                <div className="history-error">{entry.error}</div>
              )}
              {entry.result && (
                <div className="history-result">
                  <details>
                    <summary>Result</summary>
                    <pre>{JSON.stringify(entry.result, null, 2)}</pre>
                  </details>
                </div>
              )}
              {entry.backupId && (
                <div className="history-backup">
                  Backup: {entry.backupId.slice(0, 8)}...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
