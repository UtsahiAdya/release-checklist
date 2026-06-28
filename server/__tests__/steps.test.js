const { STEPS, computeStatus } = require("../steps");

describe("STEPS", () => {
  it("should have exactly 8 steps", () => {
    expect(STEPS).toHaveLength(8);
  });

  it("each step should have an id and a label", () => {
    STEPS.forEach((step) => {
      expect(step).toHaveProperty("id");
      expect(step).toHaveProperty("label");
      expect(typeof step.id).toBe("number");
      expect(typeof step.label).toBe("string");
      expect(step.label.length).toBeGreaterThan(0);
    });
  });

  it("step ids should be sequential starting from 1", () => {
    STEPS.forEach((step, index) => {
      expect(step.id).toBe(index + 1);
    });
  });
});

describe("computeStatus", () => {
  it('returns "planned" when no steps are completed', () => {
    expect(computeStatus({})).toBe("planned");
  });

  it('returns "planned" when all steps are false', () => {
    const steps = Object.fromEntries(STEPS.map((s) => [s.id, false]));
    expect(computeStatus(steps)).toBe("planned");
  });

  it('returns "ongoing" when at least one step is completed', () => {
    expect(computeStatus({ 1: true })).toBe("ongoing");
  });

  it('returns "ongoing" when some but not all steps are completed', () => {
    const steps = { 1: true, 2: true, 3: false };
    expect(computeStatus(steps)).toBe("ongoing");
  });

  it('returns "done" when all steps are completed', () => {
    const steps = Object.fromEntries(STEPS.map((s) => [s.id, true]));
    expect(computeStatus(steps)).toBe("done");
  });

  it('returns "ongoing" when all but one step is completed', () => {
    const steps = Object.fromEntries(STEPS.map((s) => [s.id, true]));
    steps[1] = false;
    expect(computeStatus(steps)).toBe("ongoing");
  });
});
