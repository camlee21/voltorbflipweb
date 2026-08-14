import Home from "./pages/Home";
import Layout from './components/Layout'
import Privacy from './pages/Privacy'
import Shop from './pages/Shop'
import HowToPlay from './pages/HowToPlay'
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext'
import { WalletProvider } from './contexts/WalletContext'
import ScrollToTop from "./components/ScrollToTop";

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <WalletProvider>
        <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/how-to-play" element={<HowToPlay />} />
            </Routes>
        </Layout>
      </WalletProvider>
    </AuthProvider>
  )
}