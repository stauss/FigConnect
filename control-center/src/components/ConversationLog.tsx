import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { ConversationLogEntry } from "../types/history";
import "./ConversationLog.css";

export default function ConversationLog() {
  const [conversations, setConversations] = useState<ConversationLogEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [filter] = useState<{ fileKey?: string }>({});

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchConversations = async () => {
    try {
      const response = await api.getConversations({ ...filter, limit: 30 });
      setConversations(response.conversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="conversation-log">
        <h2>Conversation Log</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="conversation-log">
      <h2>Conversation Log</h2>

      {conversations.length === 0 ? (
        <p className="empty-state">No conversations yet</p>
      ) : (
        <div className="conversation-list">
          {conversations.map((entry) => (
            <div key={entry.id} className="conversation-item">
              <div className="conversation-header">
                <span className="conversation-author">{entry.author}</span>
                <span className="conversation-time">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="conversation-message">{entry.message}</div>
              {entry.fileKey && (
                <div className="conversation-file">
                  File: {entry.fileKey.slice(0, 8)}...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
