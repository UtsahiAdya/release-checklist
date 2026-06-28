import { useState, useEffect, useRef } from "react";
import { api } from "../api";

const fmt = (dateStr) =>
  new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const Checkmark = () => (
  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
    <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function ReleaseDetail({ release, onUpdate, onDelete, onToast }) {
  const [info, setInfo] = useState(release.info || "");
  const [savingInfo, setSavingInfo] = useState(false);
  const [togglingStep, setTogglingStep] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const infoRef = useRef(release.info || "");

  // Sync info when release changes
  useEffect(() => {
    setInfo(release.info || "");
    infoRef.current = release.info || "";
  }, [release.id, release.info]);

  const handleStepToggle = async (stepId, current) => {
    if (togglingStep !== null) return;
    setTogglingStep(stepId);
    try {
      const updated = await api.toggleStep(release.id, stepId, !current);
      onUpdate(updated);
    } catch (err) {
      onToast("Failed to update step");
    } finally {
      setTogglingStep(null);
    }
  };

  const handleInfoBlur = async () => {
    const trimmed = info.trim();
    if (trimmed === (infoRef.current || "").trim()) return;
    setSavingInfo(true);
    try {
      const updated = await api.updateInfo(release.id, trimmed);
      infoRef.current = trimmed;
      onUpdate(updated);
      onToast("Info saved");
    } catch (err) {
      onToast("Failed to save info");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteRelease(release.id);
      onDelete(release.id);
    } catch (err) {
      onToast("Failed to delete release");
    }
  };

  const pct = release.totalSteps
    ? Math.round((release.completedCount / release.totalSteps) * 100)
    : 0;

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <div className="detail-title">{release.name}</div>
          <div className="detail-meta">
            <span className={`badge ${release.status}`}>{release.status}</span>
            <span>Due {fmt(release.due_date)}</span>
          </div>
        </div>
        <div className="detail-actions">
          {confirmDelete ? (
            <>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Confirm Delete</button>
            </>
          ) : (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="card">
        <div className="card-title">Checklist</div>
        <div className="steps-progress">
          <div className="progress-bar">
            <div
              className={`progress-fill${release.status === "done" ? " done" : ""}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="steps-progress-text">
            {release.completedCount} / {release.totalSteps} steps
          </span>
        </div>
        <div className="steps-list">
          {release.stepDefs.map((step) => {
            const checked = release.steps[step.id] === true;
            const loading = togglingStep === step.id;
            return (
              <div
                key={step.id}
                className={`step-row${checked ? " checked" : ""}`}
                onClick={() => !loading && handleStepToggle(step.id, checked)}
              >
                <span className="step-num">{step.id}</span>
                <div className="step-checkbox">
                  {checked && <Checkmark />}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional info */}
      <div className="card">
        <div className="card-title">Additional Info</div>
        <textarea
          className="info-textarea"
          placeholder="Add notes, links, or context for this release…"
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          onBlur={handleInfoBlur}
        />
        <p className="info-hint">
          {savingInfo ? "Saving…" : "Auto-saves when you click away"}
        </p>
      </div>
    </div>
  );
}
