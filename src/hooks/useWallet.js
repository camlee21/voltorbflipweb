import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const DEFAULT_WALLET = { coins: 0, themes: ["classic"], inventory: {} };

export function useWallet(user) {
  const [wallet, setWallet] = useState(DEFAULT_WALLET);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWallet(DEFAULT_WALLET);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("coins, themes, inventory")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setWallet({
        coins: data.coins ?? 0,
        themes: data.themes ?? ["classic"],
        inventory: data.inventory ?? {},
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setWallet({
            coins: payload.new.coins ?? 0,
            themes: payload.new.themes ?? ["classic"],
            inventory: payload.new.inventory ?? {},
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addCoins = useCallback(
    async (amount) => {
      if (!user || !amount || amount <= 0) return;
      const { data, error } = await supabase.rpc("add_coins", { amount: Math.round(amount) });
      if (!error && typeof data === "number") {
        setWallet((w) => ({ ...w, coins: data }));
      }
    },
    [user]
  );

  // Buys a theme via the server-side RPC (see SQL: purchase_theme). Returns
  // { error: null } on success, or { error: "insufficient-coins" | string }
  // on failure — the caller decides how to surface that.
  const purchaseTheme = useCallback(
    async (themeId, price) => {
      if (!user) return { error: "not-signed-in" };
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
    [user]
  );

  return { ...wallet, loading, addCoins, purchaseTheme, refreshWallet: fetchWallet };
}