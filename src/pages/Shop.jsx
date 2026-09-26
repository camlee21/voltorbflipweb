import { useState } from "react";
import { THEMES } from "../game/themes";
import { useAuthContext } from "../contexts/useAuthContext";
import { useWalletContext } from "../contexts/useWalletContext";
import { useEquippedTheme } from "../utils/useEquippedTheme";
import PageMeta from "../components/PageMeta";
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
    <main className="shop-page">
      <PageMeta
        title="Theme Shop | Voltorb Flip"
        description="Spend the Coins you win playing Voltorb Flip on Pokémon-inspired themes for the tiles and site colours."
        path="/shop"
      />
      <header className="page-intro">
        <h2 className="page-title">Shop</h2>
        <p className="page-lede">
          {user
            ? "Themes change the tiles and the site's colours. Buy one with Coins, then equip it whenever you like."
            : "Log in to buy and equip themes with the Coins you win."}
        </p>
      </header>

      <ul className="shop-grid">
        {THEMES.map((theme) => {
          const owned = isOwned(theme);
          const equipped = equippedTheme === theme.id;
          const isPending = pendingId === theme.id;
          const showError = errorId === theme.id;

          return (
            <li
              key={theme.id}
              className={`theme-card ${!user ? "theme-card--locked" : ""} ${equipped ? "theme-card--equipped" : ""}`}
              style={{ "--theme-bg": theme.bgColour, "--theme-accent": theme.accentColour }}
            >
              <div className="theme-card__preview">
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

              <div className="theme-card__body">
                <div className="theme-card__footer">
                  <span className="theme-card__name">{theme.label}</span>
                  {theme.id === "classic" ? (
                    <span className="theme-card__price">Free</span>
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
                    className={`theme-card__btn theme-card__btn--buy ${showError ? "theme-card__btn--error" : ""}`}
                    onClick={() => handleBuy(theme)}
                    disabled={!user || isPending || loading}
                  >
                    {isPending ? "Buying…" : showError ? "Not enough coins" : "Buy"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
