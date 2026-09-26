import { createContext, useContext } from "react";

export const WalletContext = createContext(null);

export function useWalletContext() {
  return useContext(WalletContext);
}
