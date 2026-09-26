import { useEffect } from "react";

const SITE_URL = "https://voltorbflip.app";
const DEFAULT_TITLE = "Voltorb Flip";
const DEFAULT_DESCRIPTION =
  "Play my modern port of Voltorb Flip from Pokémon HeartGold and SoulSilver! Earn Coins and purchase themes to customise the website to your liking.";

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// Per-route <title>, description, canonical URL and social tags. index.html
// holds the home page's values so crawlers that don't run JS still get them.
export default function PageMeta({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, path = "/", noindex = false }) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setCanonical(url);

    if (!noindex) return;
    setMeta("name", "robots", "noindex");
    return () => document.head.querySelector('meta[name="robots"]')?.remove();
  }, [title, description, path, noindex]);

  return null;
}
