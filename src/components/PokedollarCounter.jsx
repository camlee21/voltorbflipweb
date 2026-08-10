import { usePokedollars } from "../utils/usePokedollars";

function formatPokedollars(amount) {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  const units = [
    { value: 1e12, suffix: "T" },
    { value: 1e9, suffix: "B" },
    { value: 1e6, suffix: "M" },
  ];

  for (const { value, suffix } of units) {
    if (abs >= value) {
      // Truncate to 3 decimal places (not rounded, so 999.9999M won't jump to 1000.000M)
      const truncated = Math.floor((abs / value) * 1000) / 1000;
      return `${sign}${truncated.toFixed(3)}${suffix}`;
    }
  }

  return `${sign}${abs.toLocaleString()}`;
}

export default function PokedollarCounter({ compact = false }) {
  const amount = usePokedollars();

  return (
    <div
      title="Pokedollars"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        height: "40px",
        padding: compact ? "0 10px" : "0 14px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
        flexShrink: 0,
        whiteSpace: "nowrap",
      }}
    >
      <img
        src="/pokedollar.png"
        alt=""
        style={{ width: compact ? "16px" : "18px", height: compact ? "16px" : "18px", objectFit: "contain" }}
      />
      <span style={{ fontWeight: 600, fontSize: compact ? "13px" : "14px" }}>
        {formatPokedollars(amount)}
      </span>
    </div>
  );
}