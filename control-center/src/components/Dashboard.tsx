import { useEffect } from "react";
import { useConnectionStore } from "../stores/connection-store";
import ConnectionStatus from "./ConnectionStatus";
import ProjectList from "./ProjectList";
import HistoryTimeline from "./HistoryTimeline";
import QueueView from "./QueueView";
import ConversationLog from "./ConversationLog";
import "./Dashboard.css";

export default function Dashboard() {
  const { refreshStatus, fetchProjects } = useConnectionStore();

  useEffect(() => {
    refreshStatus();
    fetchProjects();

    // Refresh status every 5 seconds
    const interval = setInterval(() => {
      refreshStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshStatus, fetchProjects]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>FigYah Control Center</h1>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-section">
            <ConnectionStatus />
          </div>

          <div className="dashboard-section">
            <ProjectList />
          </div>

          <div className="dashboard-section full-width">
            <HistoryTimeline />
          </div>

          <div className="dashboard-section">
            <QueueView />
          </div>

          <div className="dashboard-section">
            <ConversationLog />
          </div>
        </div>
      </div>
    </div>
  );
}
