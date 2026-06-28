const express = require("express");
const { body, param, validationResult } = require("express-validator");
const router = express.Router();
const { pool } = require("../db");
const { STEPS, computeStatus } = require("../steps");

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Attach computed fields to a raw DB row */
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

/** Return 422 if express-validator found errors */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

const VALID_STEP_IDS = STEPS.map((s) => s.id);

// ─── Validation rules ────────────────────────────────────────────────────────

const createRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 200 }).withMessage("Name must be 200 characters or fewer"),
  body("due_date")
    .notEmpty().withMessage("Due date is required")
    .isISO8601().withMessage("Due date must be a valid ISO 8601 datetime"),
  body("info")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }).withMessage("Info must be 2000 characters or fewer"),
];

const stepRules = [
  param("id").isInt({ min: 1 }).withMessage("Release ID must be a positive integer"),
  body("stepId")
    .notEmpty().withMessage("stepId is required")
    .isInt().withMessage("stepId must be an integer")
    .toInt()
    .custom((v) => VALID_STEP_IDS.includes(v))
    .withMessage(`stepId must be one of: ${VALID_STEP_IDS.join(", ")}`),
  body("value")
    .notEmpty().withMessage("value is required")
    .isBoolean().withMessage("value must be a boolean")
    .toBoolean(),
];

const infoRules = [
  param("id").isInt({ min: 1 }).withMessage("Release ID must be a positive integer"),
  body("info")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }).withMessage("Info must be 2000 characters or fewer"),
];

const idRule = [
  param("id").isInt({ min: 1 }).withMessage("Release ID must be a positive integer"),
];

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /api/releases
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM releases ORDER BY due_date ASC"
    );
    res.json(rows.map(format));
  } catch (err) {
    next(err);
  }
});

// GET /api/releases/:id
router.get("/:id", idRule, validate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM releases WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Release not found" });
    res.json(format(rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/releases
router.post("/", createRules, validate, async (req, res, next) => {
  const { name, due_date, info } = req.body;
  try {
    const { rows } = await pool.query(
      "INSERT INTO releases (name, due_date, info, steps) VALUES ($1, $2, $3, $4) RETURNING *",
      [name.trim(), due_date, info?.trim() || null, {}]
    );
    res.status(201).json(format(rows[0]));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/releases/:id/steps
router.patch("/:id/steps", stepRules, validate, async (req, res, next) => {
  const { stepId, value } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE releases
       SET steps = steps || jsonb_build_object($1::text, $2::boolean)
       WHERE id = $3
       RETURNING *`,
      [String(stepId), value, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Release not found" });
    res.json(format(rows[0]));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/releases/:id/info
router.patch("/:id/info", infoRules, validate, async (req, res, next) => {
  const { info } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE releases SET info = $1 WHERE id = $2 RETURNING *",
      [info?.trim() || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Release not found" });
    res.json(format(rows[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/releases/:id
router.delete("/:id", idRule, validate, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM releases WHERE id = $1",
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Release not found" });
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
