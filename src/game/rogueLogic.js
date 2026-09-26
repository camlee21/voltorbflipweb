// rogueLogic.js
// Rules for Rogue mode's powers, kept free of React so they can be unit tested.

export const POWERS = {
  Protect: {
    icon: "/sprites/powers/protect.png",
    desc: "Survive a Voltorb instead of losing. This power stacks, each copy adding one charge.",
  },
  "Corner Count": {
    icon: "/sprites/powers/corner-count.png",
    desc: "Reveals the stat counter for the main diagonal.",
  },
  "Money Multiplier": {
    icon: "/sprites/powers/money-multiplier.png",
    desc: "Doubles the bonus score offered when you level up.",
  },
  "Reveal 3": {
    icon: "/sprites/powers/reveal-3.png",
    desc: "Automatically flips a 3 tile (or a 2, if no 3 is on the board) at the start of each level.",
  },
  Peek: {
    icon: "/sprites/powers/peek.png",
    desc: "Reveal a tile for a second without flipping it. This power stacks, each copy adding two charges.",
  },
  "No Ones": {
    icon: "/sprites/powers/no-ones.png",
    desc: "Flipping a 1 costs you 10% of your total score — but your banked score doubles each level.",
  },
  "Mega Stone": {
    icon: "/sprites/powers/mega-stone.png",
    desc: "Your total score quadruples if the first tile you flip for the level is a Voltorb. Reveal 3's automatic flip doesn't count.",
  },
};

export const ALL_POWER_NAMES = Object.keys(POWERS);

// Powers that can be picked up again while already owned; each pickup adds charges.
export const POWER_CHARGES = { Protect: 1, Peek: 2 };

/**
 * A power to offer on level-up: anything not yet owned, plus the stackable
 * powers, which can always be offered again.
 */
export function randomPower(ownedPowers, rng = Math.random) {
  const pool = ALL_POWER_NAMES.filter((p) => !ownedPowers.includes(p) || p in POWER_CHARGES);
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Adds a power to the owned list and charge counts.
 * Returns { powers, charges } without mutating the inputs.
 */
export function takePower(ownedPowers, charges, power) {
  const powers = ownedPowers.includes(power) ? ownedPowers : [...ownedPowers, power];
  const nextCharges = { ...charges };
  if (power in POWER_CHARGES) {
    nextCharges[power] = (nextCharges[power] ?? 0) + POWER_CHARGES[power];
  }
  return { powers, charges: nextCharges };
}

/**
 * Uses one charge of a stackable power, dropping the power once it's empty.
 * Returns { powers, charges }.
 */
export function spendCharge(ownedPowers, charges, power) {
  const left = Math.max(0, (charges[power] ?? 0) - 1);
  return {
    powers: left > 0 ? ownedPowers : ownedPowers.filter((p) => p !== power),
    charges: { ...charges, [power]: left },
  };
}

/** The tile Reveal 3 flips at the start of a level: a 3, else a 2, else null. */
export function pickReveal3Target(grid) {
  for (const value of [3, 2]) {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c].value === value && !grid[r][c].revealed) return { row: r, col: c };
      }
    }
  }
  return null;
}

/** How much a cleared level's score adds to the run total. */
export function bankedLevelScore(score, powers) {
  return score * (powers.includes("No Ones") ? 2 : 1);
}

/** The bonus-score reward offered on level-up. */
export function bonusScore(level, powers) {
  return level * 50 * (powers.includes("Money Multiplier") ? 2 : 1);
}

/** Total after flipping a 1 with No Ones: lose 10%, rounded. */
export function noOnesPenalty(total) {
  return Math.round(total - total * 0.1);
}
