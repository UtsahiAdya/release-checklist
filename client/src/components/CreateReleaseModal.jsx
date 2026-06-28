import { useState } from "react";

export function CreateReleaseModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [info, setInfo] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!dueDate) e.dueDate = "Due date is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), due_date: dueDate, info: info.trim() || null });
      onClose();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Escape") onClose(); };

  return (
    <div className="modal-backdrop" onClick={onClose} onKeyDown={handleKey}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Release</h2>

        <div className="form-group">
          <label htmlFor="rel-name">Name *</label>
          <input
            id="rel-name"
            type="text"
            placeholder="e.g. v2.4.0"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: null })); }}
            autoFocus
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="rel-date">Due Date *</label>
          <input
            id="rel-date"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => { setDueDate(e.target.value); setErrors((p) => ({ ...p, dueDate: null })); }}
          />
          {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="rel-info">Additional Info</label>
          <textarea
            id="rel-info"
            placeholder="Optional notes about this release…"
            value={info}
            onChange={(e) => setInfo(e.target.value)}
          />
        </div>

        {errors.submit && <p className="form-error">{errors.submit}</p>}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating…" : "Create Release"}
          </button>
        </div>
      </div>
    </div>
  );
}
