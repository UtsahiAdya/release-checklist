import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import { ReleaseList } from "./components/ReleaseList";
import { ReleaseDetail } from "./components/ReleaseDetail";
import { CreateReleaseModal } from "./components/CreateReleaseModal";

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="toast">{message}</div>;
}

const EmptyDetail = () => (
  <div className="detail-panel">
    <div className="detail-empty">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="4" width="32" height="40" rx="3" stroke="#9ca3af" strokeWidth="2"/>
        <path d="M16 14h16M16 20h16M16 26h10" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p>Select a release to view its checklist</p>
    </div>
  </div>
);

export default function App() {
  const [releases, setReleases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = useCallback((msg) => setToast(msg), []);

  const load = useCallback(async () => {
    try {
      const data = await api.getReleases();
      setReleases(data);
      // Keep selected in sync
      if (selected) {
        const fresh = data.find((r) => r.id === selected.id);
        if (fresh) setSelected(fresh);
      }
    } catch {
      showToast("Failed to load releases");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    const created = await api.createRelease(data);
    setReleases((prev) => [...prev, created].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    setSelected(created);
    showToast("Release created");
  };

  const handleUpdate = (updated) => {
    setReleases((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    setSelected(updated);
  };

  const handleDelete = (id) => {
    setReleases((prev) => prev.filter((r) => r.id !== id));
    setSelected(null);
    showToast("Release deleted");
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>Release Checklist <span>{releases.length} release{releases.length !== 1 ? "s" : ""}</span></h1>
      </header>

      <div className="main">
        <ReleaseList
          releases={releases}
          selected={selected}
          onSelect={setSelected}
          onNew={() => setShowModal(true)}
        />

        {loading ? (
          <div className="detail-panel"><div className="detail-empty"><p>Loading…</p></div></div>
        ) : selected ? (
          <ReleaseDetail
            key={selected.id}
            release={selected}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onToast={showToast}
          />
        ) : (
          <EmptyDetail />
        )}
      </div>

      {showModal && (
        <CreateReleaseModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
