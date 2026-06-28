const BASE = import.meta.env.VITE_API_URL || "";

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
};

export const api = {
  getReleases: () => req("GET", "/releases"),
  getRelease: (id) => req("GET", `/releases/${id}`),
  createRelease: (data) => req("POST", "/releases", data),
  toggleStep: (id, stepId, value) =>
    req("PATCH", `/releases/${id}/steps`, { stepId, value }),
  updateInfo: (id, info) => req("PATCH", `/releases/${id}/info`, { info }),
  deleteRelease: (id) => req("DELETE", `/releases/${id}`),
};
