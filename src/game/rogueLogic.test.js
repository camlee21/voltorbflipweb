import { describe, expect, it } from "vitest";
import {
  ALL_POWER_NAMES,
  randomPower,
  takePower,
  spendCharge,
  pickReveal3Target,
  bankedLevelScore,
  bonusScore,
  noOnesPenalty,
} from "./rogueLogic";

const gridOf = (values) =>
  values.map((row) => row.map((value) => ({ value, revealed: false, noted: false })));

describe("randomPower", () => {
  it("never offers a non-stackable power that's already owned", () => {
    const owned = ["Corner Count", "No Ones", "Reveal 3"];
    for (let i = 0; i < 50; i++) {
      const offered = randomPower(owned, () => i / 50);
      expect(owned).not.toContain(offered);
    }
  });

  it("keeps offering stackable powers once everything is owned", () => {
    const offers = new Set([0, 0.99].map((x) => randomPower(ALL_POWER_NAMES, () => x)));
    expect([...offers].every((p) => p === "Protect" || p === "Peek")).toBe(true);
  });
});

describe("takePower / spendCharge", () => {
  it("adds charges for stackable powers without duplicating them", () => {
    let kit = takePower([], {}, "Protect");
    kit = takePower(kit.powers, kit.charges, "Protect");
    kit = takePower(kit.powers, kit.charges, "Peek");
    expect(kit.powers).toEqual(["Protect", "Peek"]);
    expect(kit.charges).toEqual({ Protect: 2, Peek: 2 });
  });

  it("drops a power when its last charge is spent", () => {
    let kit = { powers: ["Protect", "Corner Count"], charges: { Protect: 2 } };
    kit = spendCharge(kit.powers, kit.charges, "Protect");
    expect(kit.powers).toContain("Protect");
    kit = spendCharge(kit.powers, kit.charges, "Protect");
    expect(kit.powers).toEqual(["Corner Count"]);
    expect(kit.charges.Protect).toBe(0);
  });

  it("gives non-stackable powers no charges", () => {
    expect(takePower([], {}, "Mega Stone")).toEqual({ powers: ["Mega Stone"], charges: {} });
  });
});

describe("pickReveal3Target", () => {
  it("prefers a 3, falls back to a 2, else nothing", () => {
    expect(pickReveal3Target(gridOf([[1, 2], [0, 3]]))).toEqual({ row: 1, col: 1 });
    expect(pickReveal3Target(gridOf([[1, 1], [2, 0]]))).toEqual({ row: 1, col: 0 });
    expect(pickReveal3Target(gridOf([[1, 1], [0, 0]]))).toBeNull();
  });
});

describe("scoring", () => {
  it("doubles banked level score with No Ones", () => {
    expect(bankedLevelScore(12, [])).toBe(12);
    expect(bankedLevelScore(12, ["No Ones"])).toBe(24);
  });

  it("doubles the level-up bonus with Money Multiplier", () => {
    expect(bonusScore(3, [])).toBe(150);
    expect(bonusScore(3, ["Money Multiplier"])).toBe(300);
  });

  it("takes 10% off the total for a 1 under No Ones", () => {
    expect(noOnesPenalty(100)).toBe(90);
    expect(noOnesPenalty(15)).toBe(14);
  });
});
