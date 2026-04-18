from urllib.parse import urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup


MAX_TEXT_LENGTH = 12000
REQUEST_TIMEOUT = 10
MIN_USEFUL_TEXT = 120

# Common informational subpaths we'll try to enrich the homepage text.
# Each adds real content when present — about pages describe business model,
# product pages expose catalog depth, contact/pricing pages expose maturity.
SUBPATHS = ("/about", "/about-us", "/products", "/collections", "/pricing", "/services")
MAX_SUBPATH_FETCHES = 3

# Using a real-browser UA string significantly reduces bot-blocking by
# sites on CDNs like Cloudflare/Akamai, which was returning near-empty
# HTML for brands like Warby Parker under our previous SDK-looking UA.
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,image/apng,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    # Only advertise encodings `requests` can decode without the optional
    # `brotli` dep. Advertising `br` to a CDN that then sends brotli-encoded
    # bytes would give us garbled content.
    "Accept-Encoding": "gzip, deflate",
    "Cache-Control": "no-cache",
    # Sec-Fetch + client-hint headers help get past CDN bot rules (e.g.
    # Warby Parker's Cloudflare) that gate on "does this look like a real
    # top-level navigation?" rather than UA alone.
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "Sec-Fetch-Dest": "document",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Ch-Ua": '"Chromium";v="121", "Not A(Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
}


def fetch_website_text(url: str) -> tuple[str, bool]:
    """Fetch homepage + a few info subpaths and return (combined_text, ok).

    Modern DTC/SaaS sites are often JS-rendered single-page apps, so the
    homepage alone yields a thin shell. Fetching a handful of routes that
    typically exist on server-rendered pages (about/products/pricing)
    reliably multiplies the usable signal without needing a headless
    browser. On every failure path, returns ('', False).
    """
    if not url:
        return "", False

    candidates = _candidate_urls(url)
    base_url = ""
    homepage_text = ""
    for candidate in candidates:
        text = _try_fetch(candidate)
        if text and len(text) >= MIN_USEFUL_TEXT:
            homepage_text = text
            base_url = candidate
            break

    if not homepage_text:
        # Salvage: take the best partial we saw.
        best = ""
        best_url = ""
        for candidate in candidates:
            text = _try_fetch(candidate)
            if len(text) > len(best):
                best = text
                best_url = candidate
        if not best.strip():
            return "", False
        homepage_text = best
        base_url = best_url

    # Enrich with a few subpaths. Stop after MAX_SUBPATH_FETCHES successful
    # hits so slow sites don't balloon total latency.
    combined = [homepage_text]
    hits = 0
    for sub in SUBPATHS:
        if hits >= MAX_SUBPATH_FETCHES:
            break
        sub_url = urljoin(base_url, sub)
        sub_text = _try_fetch(sub_url)
        if sub_text and len(sub_text) >= MIN_USEFUL_TEXT:
            combined.append(sub_text)
            hits += 1

    blob = "\n\n".join(combined)
    return blob[:MAX_TEXT_LENGTH], True


def _candidate_urls(url: str) -> list[str]:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    host = parsed.netloc or parsed.path
    host = host.strip("/")

    bare = host[4:] if host.startswith("www.") else host
    with_www = host if host.startswith("www.") else f"www.{host}"

    variants = []
    for h in (host, with_www, bare):
        if not h:
            continue
        for scheme in ("https", "http"):
            u = urlunparse((scheme, h, parsed.path or "/", "", "", ""))
            if u not in variants:
                variants.append(u)
    return variants


def _try_fetch(url: str) -> str:
    try:
        response = requests.get(
            url,
            timeout=REQUEST_TIMEOUT,
            headers=BROWSER_HEADERS,
            allow_redirects=True,
        )
        if response.status_code >= 400:
            return ""
    except requests.RequestException:
        return ""
    return _extract_visible_text(response.text)


def _extract_visible_text(html: str) -> str:
    """Strip scripts/styles and return clean visible text."""
    if not html:
        return ""
    soup = BeautifulSoup(html, "lxml")

    for tag in soup(["script", "style", "noscript", "header", "footer", "nav"]):
        tag.decompose()

    text = soup.get_text(separator=" ", strip=True)
    # Collapse whitespace
    return " ".join(text.split())
