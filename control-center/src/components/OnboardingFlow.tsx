import { useState } from "react";
import { useConfigStore } from "../stores/config-store";
import { useConnectionStore } from "../stores/connection-store";
import "./OnboardingFlow.css";

export default function OnboardingFlow() {
  const { saveConfig, loading, error } = useConfigStore();
  const { connectProject, fetchProjects } = useConnectionStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    figmaAccessToken: "",
    deploymentLocation: "local" as "local" | "cloud",
  });
  const [fileKey, setFileKey] = useState("");
  const [fileKeyError, setFileKeyError] = useState("");

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileKeyError("");

    if (!formData.figmaAccessToken) {
      setFileKeyError("Figma access token is required");
      return;
    }

    if (!formData.figmaAccessToken.startsWith("figd_")) {
      setFileKeyError('Invalid token format. Figma tokens start with "figd_"');
      return;
    }

    try {
      await saveConfig(formData);
      setStep(2);
      await fetchProjects();
    } catch (err: any) {
      setFileKeyError(err.message || "Failed to save configuration");
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileKeyError("");

    if (!fileKey.trim()) {
      setFileKeyError("File key is required");
      return;
    }

    try {
      await connectProject({
        fileKey: fileKey.trim(),
        enabled: true,
      });
      // Onboarding complete - will be handled by App.tsx detecting isConfigured
    } catch (err: any) {
      setFileKeyError(err.message || "Failed to connect file");
    }
  };

  if (step === 1) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card">
          <h1>Welcome to FigYah</h1>
          <p className="subtitle">Set up your AI-powered Figma collaboration</p>

          <form onSubmit={handleStep1Submit} className="onboarding-form">
            <div className="form-group">
              <label htmlFor="figmaAccessToken">
                Figma Access Token <span className="required">*</span>
              </label>
              <input
                type="password"
                id="figmaAccessToken"
                value={formData.figmaAccessToken}
                onChange={(e) =>
                  setFormData({ ...formData, figmaAccessToken: e.target.value })
                }
                placeholder="figd_xxxxxxxxxxxxxxxxxxxxx"
                required
              />
              <small>
                Get your token from Figma → Settings → Account → Personal Access
                Tokens
              </small>
            </div>

            <div className="form-group">
              <div className="info-box">
                <strong>How it works:</strong>
                <ul>
                  <li>
                    The MCP server exposes tools that AI assistants (like Claude
                    in Cursor) can use
                  </li>
                  <li>
                    Your AI assistant connects <em>to</em> this server - you
                    don't need to configure which model
                  </li>
                  <li>
                    Just provide your Figma token and the server will be ready
                    for AI connections
                  </li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label>Deployment Location</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="local"
                    checked={formData.deploymentLocation === "local"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deploymentLocation: e.target.value as "local" | "cloud",
                      })
                    }
                  />
                  Local Machine
                </label>
                <label>
                  <input
                    type="radio"
                    value="cloud"
                    checked={formData.deploymentLocation === "cloud"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deploymentLocation: e.target.value as "local" | "cloud",
                      })
                    }
                  />
                  Cloud Hosted
                </label>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {fileKeyError && (
              <div className="error-message">{fileKeyError}</div>
            )}

            <button type="submit" disabled={loading} className="primary-button">
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <h1>Connect Your First File</h1>
        <p className="subtitle">
          Add a Figma file to start collaborating with AI
        </p>

        <form onSubmit={handleStep2Submit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="fileKey">
              Figma File Key <span className="required">*</span>
            </label>
            <input
              type="text"
              id="fileKey"
              value={fileKey}
              onChange={(e) => {
                setFileKey(e.target.value);
                setFileKeyError("");
              }}
              placeholder="Enter file key from Figma URL"
              required
            />
            <small>
              You can find the file key in your Figma file URL:
              <br />
              <code>https://www.figma.com/file/[FILE_KEY]/...</code>
              <br />
              <br />
              Or simply open a file in Figma with the plugin running - it will
              auto-detect!
            </small>
          </div>

          {fileKeyError && <div className="error-message">{fileKeyError}</div>}

          <div className="button-group">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="secondary-button"
            >
              Back
            </button>
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? "Connecting..." : "Connect File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
