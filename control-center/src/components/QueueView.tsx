import { useEffect, useState } from "react";
import { api } from "../services/api";
import "./QueueView.css";

export default function QueueView() {
  const [queue, setQueue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const status = await api.getStatus();
      setQueue(status.queue);
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !queue) {
    return (
      <div className="queue-view">
        <h2>Task Queue</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="queue-view">
        <h2>Task Queue</h2>
        <p>No queue data available</p>
      </div>
    );
  }

  return (
    <div className="queue-view">
      <h2>Task Queue</h2>

      <div className="queue-stats">
        <div className="queue-stat">
          <div className="queue-stat-value">{queue.pending || 0}</div>
          <div className="queue-stat-label">Pending</div>
        </div>
        <div className="queue-stat">
          <div className="queue-stat-value">{queue.posted || 0}</div>
          <div className="queue-stat-label">Posted</div>
        </div>
        <div className="queue-stat">
          <div className="queue-stat-value">{queue.completed || 0}</div>
          <div className="queue-stat-label">Completed</div>
        </div>
        <div className="queue-stat">
          <div className="queue-stat-value">{queue.failed || 0}</div>
          <div className="queue-stat-label">Failed</div>
        </div>
      </div>

      {queue.total > 0 && (
        <div className="queue-total">Total: {queue.total} commands</div>
      )}
    </div>
  );
}
