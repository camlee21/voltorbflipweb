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

  // Stay in sync if the row changes from another tab, device, or a future
  // admin/purchase action that updates it server-side.
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

  // No-ops when signed out — coins are only ever tracked while logged in.
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

  return { ...wallet, loading, addCoins, refreshWallet: fetchWallet };
}