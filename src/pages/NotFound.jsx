import { Link, useLocation } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import "./Privacy.css";

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <main className="static-page">
      <PageMeta title="Page Not Found | Voltorb Flip" path={pathname} noindex />
      <h2 className="static-page-title">Page not found</h2>
      <p>
        There's nothing here. <Link to="/">Head back to the game</Link>.
      </p>
    </main>
  );
}
