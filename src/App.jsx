import Home from "./pages/Home";
import Layout from './components/Layout'
import Privacy from './pages/Privacy'
import Shop from './pages/Shop'
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext'
import { WalletProvider } from './contexts/WalletContext'

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/shop" element={<Shop />} />
            </Routes>
        </Layout>
      </WalletProvider>
    </AuthProvider>
  )
}