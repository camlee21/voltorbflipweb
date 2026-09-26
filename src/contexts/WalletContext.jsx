import { useAuthContext } from "./useAuthContext";
import { WalletContext } from "./useWalletContext";
import { useWallet } from "../hooks/useWallet";

export function WalletProvider({ children }) {
  const { user } = useAuthContext();
  const wallet = useWallet(user);
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}
