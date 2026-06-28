const STEPS = [
  { id: 1, label: "Code freeze" },
  { id: 2, label: "Run automated tests" },
  { id: 3, label: "Review pull requests" },
  { id: 4, label: "Update changelog" },
  { id: 5, label: "Staging deployment" },
  { id: 6, label: "QA sign-off" },
  { id: 7, label: "Production deployment" },
  { id: 8, label: "Post-deploy smoke test" },
];

const computeStatus = (steps) => {
  const completed = STEPS.filter((s) => steps[s.id] === true).length;
  if (completed === 0) return "planned";
  if (completed === STEPS.length) return "done";
  return "ongoing";
};

module.exports = { STEPS, computeStatus };
