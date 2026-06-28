const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { STEPS, computeStatus } = require("../steps");

// Attach steps + status to a raw DB row
const format = (row) => {
  const steps = row.steps || {};
  return {
    ...row,
    steps,
    status: computeStatus(steps),
    stepDefs: STEPS,
    completedCount: STEPS.filter((s) => steps[s.id] === true).length,
    totalSteps: STEPS.length,
  };
};

// GET /api/releases
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM releases ORDER BY due_date ASC"
    );
    res.json(rows.map(format));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch releases" });
  }
});

// GET /api/releases/:id
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM releases WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch release" });
  }
});

// POST /api/releases
router.post("/", async (req, res) => {
  const { name, due_date, info } = req.body;
  if (!name || !due_date) {
    return res.status(400).json({ error: "name and due_date are required" });
  }
  try {
    const { rows } = await pool.query(
      "INSERT INTO releases (name, due_date, info, steps) VALUES ($1, $2, $3, $4) RETURNING *",
      [name.trim(), due_date, info?.trim() || null, {}]
    );
    res.status(201).json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create release" });
  }
});

// PATCH /api/releases/:id/steps  — toggle a step
router.patch("/:id/steps", async (req, res) => {
  const { stepId, value } = req.body;
  if (stepId === undefined || value === undefined) {
    return res.status(400).json({ error: "stepId and value are required" });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE releases
       SET steps = steps || jsonb_build_object($1::text, $2::boolean)
       WHERE id = $3
       RETURNING *`,
      [String(stepId), value, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update step" });
  }
});

// PATCH /api/releases/:id/info  — update additional info
router.patch("/:id/info", async (req, res) => {
  const { info } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE releases SET info = $1 WHERE id = $2 RETURNING *",
      [info?.trim() || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update info" });
  }
});

// DELETE /api/releases/:id
router.delete("/:id", async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM releases WHERE id = $1",
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete release" });
  }
});

module.exports = router;
