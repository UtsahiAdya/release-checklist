const request = require("supertest");

// ─── Mock the DB pool before requiring the app ───────────────────────────────
jest.mock("../db", () => ({
  pool: { query: jest.fn() },
  migrate: jest.fn().mockResolvedValue(),
}));

const { pool } = require("../db");
const { STEPS } = require("../steps");
const app = require("../index");

// A realistic DB row returned by Postgres
const makeRow = (overrides = {}) => ({
  id: 1,
  name: "v1.0.0",
  due_date: "2025-08-01T10:00:00.000Z",
  info: null,
  steps: {},
  created_at: "2025-07-01T00:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── GET /api/health ─────────────────────────────────────────────────────────
describe("GET /api/health", () => {
  it("returns 200 with ok: true", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

// ─── GET /api/releases ───────────────────────────────────────────────────────
describe("GET /api/releases", () => {
  it("returns an array of formatted releases", async () => {
    pool.query.mockResolvedValue({ rows: [makeRow()] });

    const res = await request(app).get("/api/releases");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({
      id: 1,
      name: "v1.0.0",
      status: "planned",
      completedCount: 0,
      totalSteps: STEPS.length,
    });
  });

  it("returns an empty array when there are no releases", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const res = await request(app).get("/api/releases");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 500 on a database error", async () => {
    pool.query.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/api/releases");

    expect(res.status).toBe(500);
  });
});

// ─── GET /api/releases/:id ───────────────────────────────────────────────────
describe("GET /api/releases/:id", () => {
  it("returns a single release", async () => {
    pool.query.mockResolvedValue({ rows: [makeRow()] });

    const res = await request(app).get("/api/releases/1");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("returns 404 when release does not exist", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const res = await request(app).get("/api/releases/999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 422 for a non-integer id", async () => {
    const res = await request(app).get("/api/releases/abc");

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("errors");
  });
});

// ─── POST /api/releases ──────────────────────────────────────────────────────
describe("POST /api/releases", () => {
  it("creates a release and returns 201", async () => {
    const newRow = makeRow({ name: "v2.0.0", due_date: "2025-09-01T10:00:00.000Z" });
    pool.query.mockResolvedValue({ rows: [newRow] });

    const res = await request(app)
      .post("/api/releases")
      .send({ name: "v2.0.0", due_date: "2025-09-01T10:00:00.000Z" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("v2.0.0");
    expect(res.body.status).toBe("planned");
  });

  it("returns 422 when name is missing", async () => {
    const res = await request(app)
      .post("/api/releases")
      .send({ due_date: "2025-09-01T10:00:00.000Z" });

    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "name")).toBe(true);
  });

  it("returns 422 when due_date is missing", async () => {
    const res = await request(app)
      .post("/api/releases")
      .send({ name: "v2.0.0" });

    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "due_date")).toBe(true);
  });

  it("returns 422 when due_date is not a valid date", async () => {
    const res = await request(app)
      .post("/api/releases")
      .send({ name: "v2.0.0", due_date: "not-a-date" });

    expect(res.status).toBe(422);
  });

  it("returns 422 when name exceeds 200 characters", async () => {
    const res = await request(app)
      .post("/api/releases")
      .send({ name: "a".repeat(201), due_date: "2025-09-01T10:00:00.000Z" });

    expect(res.status).toBe(422);
  });
});

// ─── PATCH /api/releases/:id/steps ──────────────────────────────────────────
describe("PATCH /api/releases/:id/steps", () => {
  it("toggles a step on and returns updated release", async () => {
    const updated = makeRow({ steps: { 1: true } });
    pool.query.mockResolvedValue({ rows: [updated] });

    const res = await request(app)
      .patch("/api/releases/1/steps")
      .send({ stepId: 1, value: true });

    expect(res.status).toBe(200);
    expect(res.body.steps["1"]).toBe(true);
    expect(res.body.status).toBe("ongoing");
  });

  it("returns 422 for an invalid stepId", async () => {
    const res = await request(app)
      .patch("/api/releases/1/steps")
      .send({ stepId: 99, value: true });

    expect(res.status).toBe(422);
  });

  it("returns 422 when value is not a boolean", async () => {
    const res = await request(app)
      .patch("/api/releases/1/steps")
      .send({ stepId: 1, value: "yes" });

    expect(res.status).toBe(422);
  });

  it("returns 404 when release does not exist", async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .patch("/api/releases/999/steps")
      .send({ stepId: 1, value: true });

    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/releases/:id/info ───────────────────────────────────────────
describe("PATCH /api/releases/:id/info", () => {
  it("updates the info field", async () => {
    const updated = makeRow({ info: "Hotfix included" });
    pool.query.mockResolvedValue({ rows: [updated] });

    const res = await request(app)
      .patch("/api/releases/1/info")
      .send({ info: "Hotfix included" });

    expect(res.status).toBe(200);
    expect(res.body.info).toBe("Hotfix included");
  });

  it("accepts null info (clearing notes)", async () => {
    const updated = makeRow({ info: null });
    pool.query.mockResolvedValue({ rows: [updated] });

    const res = await request(app)
      .patch("/api/releases/1/info")
      .send({ info: null });

    expect(res.status).toBe(200);
  });

  it("returns 422 when info exceeds 2000 characters", async () => {
    const res = await request(app)
      .patch("/api/releases/1/info")
      .send({ info: "x".repeat(2001) });

    expect(res.status).toBe(422);
  });
});

// ─── DELETE /api/releases/:id ────────────────────────────────────────────────
describe("DELETE /api/releases/:id", () => {
  it("deletes a release and returns success", async () => {
    pool.query.mockResolvedValue({ rowCount: 1 });

    const res = await request(app).delete("/api/releases/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("returns 404 when release does not exist", async () => {
    pool.query.mockResolvedValue({ rowCount: 0 });

    const res = await request(app).delete("/api/releases/999");

    expect(res.status).toBe(404);
  });

  it("returns 422 for a non-integer id", async () => {
    const res = await request(app).delete("/api/releases/abc");

    expect(res.status).toBe(422);
  });
});

// ─── Status computation via API ──────────────────────────────────────────────
describe("Status computation", () => {
  it('shows "done" status when all steps are completed', async () => {
    const allSteps = Object.fromEntries(STEPS.map((s) => [s.id, true]));
    pool.query.mockResolvedValue({ rows: [makeRow({ steps: allSteps })] });

    const res = await request(app).get("/api/releases/1");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("done");
    expect(res.body.completedCount).toBe(STEPS.length);
  });
});
