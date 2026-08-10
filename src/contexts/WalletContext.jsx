import { createContext, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import { useWallet } from "../hooks/useWallet";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { user } = useAuthContext();
  const wallet = useWallet(user);
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  return useContext(WalletContext);
}