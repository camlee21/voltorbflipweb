import { Link, useLocation } from "react-router-dom";
import PageMeta from "../components/PageMeta";

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <main>
      <PageMeta title="Page Not Found | Voltorb Flip" path={pathname} noindex />
      <header className="page-intro">
        <h2 className="page-title">Page not found</h2>
        <p className="page-lede">
          There's nothing at this address. <Link to="/">Go back to the game</Link>.
        </p>
      </header>
    </main>
  );
}
