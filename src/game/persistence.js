// persistence.js
// Thin wrapper around localStorage, mirroring the @AppStorage keys used in
// DailyVoltorbView.swift (lastPlayedDay, dailyStreak, numCoins).

const KEYS = {
  lastPlayedDay: "lastPlayedDay",
  dailyStreak: "dailyStreak",
  numCoins: "numCoins",
};

function getNumber(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function setNumber(key, value) {
  localStorage.setItem(key, String(value));
}

export function getLastPlayedDay() {
  return getNumber(KEYS.lastPlayedDay, 0);
}

export function setLastPlayedDay(day) {
  setNumber(KEYS.lastPlayedDay, day);
}

export function getDailyStreak() {
  return getNumber(KEYS.dailyStreak, 0);
}

export function setDailyStreak(streak) {
  setNumber(KEYS.dailyStreak, streak);
}

export function getNumCoins() {
  return getNumber(KEYS.numCoins, 20000);
}

export function setNumCoins(coins) {
  setNumber(KEYS.numCoins, coins);
}

export function shortenCoins(numCoins) {
  if (numCoins >= 1_000_000) return `${(numCoins / 1_000_000).toFixed(2)}M`;
  if (numCoins >= 1_000) return `${(numCoins / 1_000).toFixed(2)}K`;
  return String(numCoins);
}
