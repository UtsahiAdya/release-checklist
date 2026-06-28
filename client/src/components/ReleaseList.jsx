const fmt = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

export function ReleaseList({ releases, selected, onSelect, onNew }) {
  return (
    <div className="list-panel">
      <div className="list-header">
        <h2>Releases</h2>
        <button className="btn-primary" onClick={onNew}>+ New</button>
      </div>

      <div className="releases-list">
        {releases.length === 0 && (
          <div className="empty-list">
            <p>No releases yet.</p>
            <p>Create one to get started.</p>
          </div>
        )}
        {releases.map((r) => {
          const pct = r.totalSteps ? Math.round((r.completedCount / r.totalSteps) * 100) : 0;
          return (
            <div
              key={r.id}
              className={`release-item${selected?.id === r.id ? " active" : ""}`}
              onClick={() => onSelect(r)}
            >
              <div className="release-item-top">
                <span className="release-name">{r.name}</span>
                <span className={`badge ${r.status}`}>{r.status}</span>
              </div>
              <div className="release-date">{fmt(r.due_date)}</div>
              <div className="progress-bar">
                <div
                  className={`progress-fill${r.status === "done" ? " done" : ""}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
