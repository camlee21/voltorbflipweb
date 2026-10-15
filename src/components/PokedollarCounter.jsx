import { Link } from "react-router-dom";
import { useAuthContext } from "../contexts/useAuthContext";
import { useWalletContext } from "../contexts/useWalletContext";

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

// Coin balance in the header; doubles as the link to the Shop.
export default function PokedollarCounter() {
  const { user } = useAuthContext();
  const { coins, loading } = useWalletContext();

  const label = !user ? "Shop" : loading ? "…" : formatPokedollars(coins);

  return (
    <Link
      to="/shop"
      className="topbar-btn coin-btn"
      aria-label={user && !loading ? `${coins.toLocaleString()} coins, open the Shop` : "Open the Shop"}
    >
      <img src="/pokedollar.png" alt="" />
      {label}
    </Link>
  );
}
