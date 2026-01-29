import { useState, useEffect } from "react";
import { useConfigStore } from "./stores/config-store";
import OnboardingFlow from "./components/OnboardingFlow";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const { isConfigured, checkConfiguration } = useConfigStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConfiguration().finally(() => setLoading(false));
  }, [checkConfiguration]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {!isConfigured ? <OnboardingFlow /> : <Dashboard />}
    </div>
  );
}

export default App;
