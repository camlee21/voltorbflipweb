import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const DEFAULT_WALLET = { coins: 0, themes: ["classic"], inventory: {} };

function toWallet(row) {
  return {
    coins: row.coins ?? 0,
    themes: row.themes ?? ["classic"],
    inventory: row.inventory ?? {},
  };
}

// Resolves to the user's wallet, or null if it couldn't be loaded.
async function loadWallet(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("coins, themes, inventory")
      .eq("user_id", userId)
      .single();
    return !error && data ? toWallet(data) : null;
  } catch {
    return null;
  }
}

// Everything keys off the user's id rather than the user object, which
// Supabase replaces on every token refresh.
export function useWallet(user) {
  const userId = user?.id ?? null;
  const [wallet, setWallet] = useState(DEFAULT_WALLET);
  // The user id whose wallet is currently loaded; loading until it matches.
  const [loadedFor, setLoadedFor] = useState(undefined);

  const fetchWallet = useCallback(async () => {
    if (!userId) return;
    const loaded = await loadWallet(userId);
    if (loaded) setWallet(loaded);
    setLoadedFor(userId);
  }, [userId]);

  // Signed out: drop the previous wallet.
  if (loadedFor !== userId && !userId) {
    setWallet(DEFAULT_WALLET);
    setLoadedFor(null);
  }

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    loadWallet(userId).then((loaded) => {
      if (cancelled) return;
      if (loaded) setWallet(loaded);
      setLoadedFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${userId}` },
        (payload) => setWallet(toWallet(payload.new))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const addCoins = useCallback(
    async (amount) => {
      if (!userId || !amount || amount <= 0) return;
      const { data, error } = await supabase.rpc("add_coins", { amount: Math.round(amount) });
      if (!error && typeof data === "number") {
        setWallet((w) => ({ ...w, coins: data }));
      }
    },
    [userId]
  );

  // Buys a theme via the server-side RPC (see supabase/migrations). The
  // server looks the price up itself; `price` is still sent so this works
  // against the older function signature too, but it's ignored. Returns
  // { error: null } on success, or { error: "insufficient-coins" | string }.
  const purchaseTheme = useCallback(
    async (themeId, price) => {
      if (!userId) return { error: "not-signed-in" };
      const { data, error } = await supabase.rpc("purchase_theme", {
        theme_key: themeId,
        price,
      });

      if (error) {
        const message = error.message?.includes("Insufficient")
          ? "insufficient-coins"
          : error.message;
        return { error: message };
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setWallet((w) => ({
          ...w,
          coins: row.coins ?? w.coins,
          themes: row.themes ?? w.themes,
        }));
      }
      return { error: null };
    },
    [userId]
  );

  const loading = loadedFor !== userId;

  return { ...wallet, loading, addCoins, purchaseTheme, refreshWallet: fetchWallet };
}
