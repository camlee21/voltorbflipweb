import { useState } from "react";
import { THEMES } from "../game/themes";
import { useAuthContext } from "../contexts/AuthContext";
import { useWalletContext } from "../contexts/WalletContext";
import { useEquippedTheme } from "../utils/useEquippedTheme";
import "./Shop.css";

const TILE_VALUES = [0, 1, 2, 3];

export default function Shop() {
  const { user } = useAuthContext();
  const { coins, themes: ownedThemes, loading, purchaseTheme } = useWalletContext();
  const [equippedTheme, equip] = useEquippedTheme();

  // Which theme (by id) currently has a purchase in flight, and which
  // theme (by id) should flash an error state, e.g. "can't afford this".
  const [pendingId, setPendingId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  function isOwned(theme) {
    return theme.id === "classic" || (ownedThemes ?? []).includes(theme.id);
  }

  function flashError(themeId) {
    setErrorId(themeId);
    setTimeout(() => setErrorId((current) => (current === themeId ? null : current)), 2000);
  }

  async function handleBuy(theme) {
    if (!user || pendingId) return;
    if (coins < theme.price) {
      flashError(theme.id);
      return;
    }
    setPendingId(theme.id);
    const { error } = await purchaseTheme(theme.id, theme.price);
    setPendingId(null);
    if (error) {
      flashError(theme.id);
    } else {
      equip(theme.id);
    }
  }

  function handleEquip(theme) {
    if (!user) return;
    equip(theme.id);
  }

  return (
    <div className="shop-page">
      <h1 className="shop-title">Shop</h1>
      <p className="shop-subtitle">
        {user
          ? "Spend your Pokedollars on new themes!"
          : "Log in to purchase and equip themes with your Pokedollars!"}
      </p>

      <div className="shop-grid">
        {THEMES.map((theme) => {
          const owned = isOwned(theme);
          const equipped = equippedTheme === theme.id;
          const isPending = pendingId === theme.id;
          const showError = errorId === theme.id;

          return (
            <div
              key={theme.id}
              className={`theme-card ${!user ? "theme-card--locked" : ""} ${
                equipped ? "theme-card--equipped" : ""
              }`}
              style={{ "--theme-bg": theme.bgColour, "--theme-accent": theme.accentColour }}
            >
              <div className="theme-card__swatches">
                {TILE_VALUES.map((v) => (
                  <img
                    key={v}
                    src={`/sprites/${v}_${theme.id}.png`}
                    alt=""
                    className="theme-card__tile"
                    draggable={false}
                  />
                ))}
              </div>

              <div className="theme-card__colors">
                <span className="theme-card__swatch" style={{ background: theme.bgColour }} title="Background" />
                <span className="theme-card__swatch" style={{ background: theme.accentColour }} title="Accent" />
              </div>

              <div className="theme-card__footer">
                <span className="theme-card__name">{theme.label}</span>
                {theme.id === "classic" ? (
                  <span className="theme-card__price theme-card__price--free">Default</span>
                ) : (
                  <span className="theme-card__price">
                    <img src="/pokedollar.png" alt="" className="theme-card__coin-icon" />
                    {theme.price.toLocaleString()}
                  </span>
                )}
              </div>

              {equipped ? (
                <button type="button" className="theme-card__btn theme-card__btn--equipped" disabled>
                  Equipped
                </button>
              ) : owned ? (
                <button
                  type="button"
                  className="theme-card__btn"
                  onClick={() => handleEquip(theme)}
                  disabled={!user}
                >
                  Equip
                </button>
              ) : (
                <button
                  type="button"
                  className={`theme-card__btn theme-card__btn--buy ${
                    showError ? "theme-card__btn--error" : ""
                  }`}
                  onClick={() => handleBuy(theme)}
                  disabled={!user || isPending || loading}
                >
                  {isPending ? "…" : showError ? "Can't afford" : "Buy"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}