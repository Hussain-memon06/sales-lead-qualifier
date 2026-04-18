"""Deterministic ICP fit scoring — conservative but sensitive to clear fits.

Scoring is computed in Python (not by the LLM) so it is consistent and auditable.

Point budget (total = 100):
    industry_match        0-20  (primary company industry, NOT served industries)
    company_type_match    0-15
    geography_match       0-15  (penalizes "global" alone)
    business_model_match  0-25  (clear mismatch = 0 points)
    budget_signals        0-25
    red_flags_penalty     -10 per detected flag, capped at -50

Homepage archetype detection (drives ecommerce/DTC scoring):
    is_direct_seller    — site sells products directly (cart/checkout/shop-now signals)
    is_vendor_platform  — site targets businesses as customers (API/SDK/platform signals)

These flags are used to correctly credit — or decline to credit — ecommerce/DTC/retail
ICP terms. A DTC brand like Allbirds scores as a confirmed ecommerce match; a platform
like Stripe does NOT get retail/consumer credit just because it serves those verticals.

Signal classification:
    confirmed  = found in visible website evidence (homepage text or evidence snippets)
    inferred   = only present in LLM-generated research fields (or notes)
    Confirmed earns full points; inferred earns 50% of possible points.
"""
from dataclasses import dataclass

from app.schemas import ICPProfile, ICPScoreBreakdown, ResearchResult


# Budget-signal synonyms — preset phrases are describe-the-buyer language,
# but homepages use commerce language. Mapping the intent to realistic
# homepage/evidence tokens lets budget signals actually fire against real
# content. Keys are normalized (lowercased) preset phrases; values are the
# tokens we look for in homepage text and evidence snippets.
BUDGET_SIGNAL_SYNONYMS: dict[str, list[str]] = {
    "active paid ads": [
        "sale", "% off", "promo code", "coupon", "discount", "discount code",
        "limited time", "free shipping", "flash sale", "bundle", "save on",
        "as seen on", "featured in",
    ],
    "multiple product lines": [
        "collection", "collections", "new arrivals", "bestsellers",
        "best sellers", "categories", "shop men", "shop women", "shop kids",
        "shop by", "product lines", "for men", "for women",
    ],
    "large catalog": [
        "shop all", "all products", "all collections", "view all",
        "browse all", "our catalog", "full range", "hundreds of",
        "thousands of",
    ],
    "recent funding": [
        "series a", "series b", "series c", "seed round", "raised",
        "raises", "funded by", "backed by", "investors", "announces funding",
    ],
    "hiring engineers": [
        "we're hiring", "were hiring", "join the team", "join our team",
        "open roles", "careers", "engineering roles", "software engineer",
        "backend engineer", "frontend engineer", "staff engineer",
    ],
    "enterprise clients": [
        "fortune 500", "fortune 1000", "trusted by", "case studies",
        "customer stories", "enterprise", "used by", "powering", "clients include",
    ],
}


def _resolve_budget_synonyms(phrase: str) -> list[str]:
    key = phrase.lower().strip()
    if key in BUDGET_SIGNAL_SYNONYMS:
        return BUDGET_SIGNAL_SYNONYMS[key]
    # Fuzzy fallback: match any synonym family whose key is a subset/superset.
    for k, vals in BUDGET_SIGNAL_SYNONYMS.items():
        if k in key or key in k:
            return vals
    # No known family — fall back to the literal phrase.
    return [key]


BUSINESS_MODEL_SYNONYMS: dict[str, list[str]] = {
    "saas subscription": ["saas", "subscription", "monthly plan", "annual plan", "seat-based"],
    "subscription": ["subscription", "monthly plan", "annual plan", "recurring"],
    "usage-based": ["usage-based", "pay-as-you-go", "pay as you go", "metered", "per-request"],
    "services/consulting": ["consulting", "agency", "professional services", "services"],
    "consulting": ["consulting", "professional services"],
    "services": ["services", "consulting", "agency"],
    "agency": ["agency", "studio", "consultancy"],
    "e-commerce": ["e-commerce", "ecommerce", "online store", "shop", "dtc"],
    "ecommerce": ["e-commerce", "ecommerce", "online store", "shop", "dtc"],
    "subscription commerce": ["subscription box", "auto-ship", "recurring delivery", "subscribe & save"],
    "marketplace": ["marketplace", "two-sided"],
    "ads": ["advertising", "ads", "ad-supported"],
}

# Keywords that strongly indicate the site sells products directly to end consumers.
DIRECT_SELLER_KEYWORDS: list[str] = [
    "add to cart", "add to bag", "add to basket", "checkout", "free shipping",
    "shop now", "buy now", "shop all", "size guide", "size chart",
    "my account", "my bag", "wishlist", "returns policy", "free returns",
    "in stock", "out of stock", "product details", "new arrivals",
    "bestseller", "bestsellers", "collection", "our products",
]

# Keywords that indicate the site targets businesses / is a platform or infrastructure
# provider — NOT a direct consumer brand.
VENDOR_PLATFORM_KEYWORDS: list[str] = [
    "api", "sdk", "developer", "developers", "documentation",
    "integration", "integrations", "infrastructure", "platform",
    "for merchants", "for businesses", "for enterprise",
    "we power", "powering", "built for", "trusted by",
    "case studies", "pricing plans", "enterprise plan",
    "request a demo", "book a demo", "contact sales",
]

# ICP terms that should match a direct-consumer seller archetype.
ECOMMERCE_ICP_HINTS: list[str] = [
    "dtc", "direct-to-consumer", "direct to consumer",
    "retail", "retailer", "retailers",
    "e-commerce", "ecommerce",
    "consumer brand", "consumer brands",
    "online store", "online presence", "online sales",
    "brand", "brands",
]


def _matches_ecommerce_hint(icp_item: str) -> bool:
    item = icp_item.lower()
    return any(hint in item for hint in ECOMMERCE_ICP_HINTS)


@dataclass
class Signal:
    category: str
    label: str
    confirmed: bool


def _contains(text: str, keyword: str) -> bool:
    if not text or not keyword:
        return False
    return keyword.strip().lower() in text.lower()


def _any_contains(texts: list[str], keyword: str) -> bool:
    return any(_contains(t, keyword) for t in texts)


def _count_keyword_hits(sources: list[str], keywords: list[str]) -> int:
    return sum(1 for kw in keywords if _any_contains(sources, kw))


def _confirmed_text(research: ResearchResult, homepage_text: str) -> list[str]:
    return [homepage_text, *research.evidence_snippets]


def _inferred_text(research: ResearchResult, notes: str) -> list[str]:
    return [
        research.homepage_summary,
        research.detected_company_description,
        research.possible_business_model,
        notes,
    ]


def _classify_match(
    needle: str,
    confirmed_sources: list[str],
    inferred_sources: list[str],
) -> Signal | None:
    if not needle.strip():
        return None
    if _any_contains(confirmed_sources, needle):
        return Signal(category="", label=needle, confirmed=True)
    if _any_contains(inferred_sources, needle):
        return Signal(category="", label=needle, confirmed=False)
    return None


def _score_budget_signals(
    icp_items: list[str],
    max_points: int,
    confirmed_sources: list[str],
    inferred_sources: list[str],
) -> tuple[int, list[Signal]]:
    """Budget signals with synonym expansion.

    Preset phrases describe the buyer; homepages use different wording.
    For each preset phrase, check if any of its synonym tokens appear in
    confirmed or inferred sources. Count distinct synonym hits per phrase
    to get partial credit instead of binary match-or-miss.
    """
    if not icp_items:
        return max_points // 2, []

    matched: list[Signal] = []
    weight_sum = 0.0

    for phrase in icp_items:
        synonyms = _resolve_budget_synonyms(phrase)
        confirmed_hits = sum(1 for s in synonyms if _any_contains(confirmed_sources, s))
        inferred_hits = sum(1 for s in synonyms if _any_contains(inferred_sources, s))

        if confirmed_hits == 0 and inferred_hits == 0:
            continue

        # Partial credit based on richness of evidence, capped at 1.0.
        # 2+ confirmed hits = full credit; 1 confirmed = 0.7; inferred-only = 0.4.
        if confirmed_hits >= 2:
            weight = 1.0
            matched.append(Signal("budget", phrase, confirmed=True))
        elif confirmed_hits == 1:
            weight = 0.7
            matched.append(Signal("budget", phrase, confirmed=True))
        else:
            weight = 0.4
            matched.append(Signal("budget", phrase, confirmed=False))
        weight_sum += weight

    fraction = weight_sum / len(icp_items)
    points = round(max_points * min(fraction, 1.0))
    return points, matched


def _score_list_category(
    icp_items: list[str],
    max_points: int,
    confirmed_sources: list[str],
    inferred_sources: list[str],
    category: str,
    stricter: bool = False,
) -> tuple[int, list[Signal]]:
    if not icp_items:
        return max_points // 2, []

    matched: list[Signal] = []
    weight_sum = 0.0
    for item in icp_items:
        signal = _classify_match(item, confirmed_sources, inferred_sources)
        if signal is None:
            continue
        signal.category = category
        matched.append(signal)
        if signal.confirmed:
            weight_sum += 1.0
        elif not stricter:
            weight_sum += 0.5

    fraction = weight_sum / len(icp_items)
    points = round(max_points * min(fraction, 1.0))
    return points, matched


def _score_ecom_aware_category(
    icp_items: list[str],
    max_points: int,
    confirmed_sources: list[str],
    inferred_sources: list[str],
    category: str,
    direct_seller_strength: float,
    vendor_platform_strength: float,
) -> tuple[int, list[Signal]]:
    """Industry/company-type scoring, aware of ecommerce/platform archetype.

    Archetype is expressed as a continuous 0.0-1.0 strength so two
    companies with different signal density produce different scores.
    A DTC site with 3 cart keywords and one with 10 are no longer
    identical — they credit ecom terms proportionally.
    """
    if not icp_items:
        return max_points // 2, []

    matched: list[Signal] = []
    weight_sum = 0.0
    net_direct = max(0.0, direct_seller_strength - vendor_platform_strength)

    for item in icp_items:
        is_ecom_term = _matches_ecommerce_hint(item)

        if is_ecom_term and net_direct > 0.0:
            # Credit ecom terms in proportion to direct-seller strength.
            is_confirmed = net_direct >= 0.5
            matched.append(Signal(category, item, confirmed=is_confirmed))
            weight_sum += net_direct
            continue

        if is_ecom_term and vendor_platform_strength > direct_seller_strength:
            # Suppress — vendor/platform mentioning "retail" doesn't make it retail.
            continue

        signal = _classify_match(item, confirmed_sources, inferred_sources)
        if signal is None:
            continue
        signal.category = category
        matched.append(signal)
        weight_sum += 1.0 if signal.confirmed else 0.5

    fraction = weight_sum / len(icp_items)
    points = round(max_points * min(fraction, 1.0))
    return points, matched


def _score_geography(
    icp: ICPProfile,
    confirmed_sources: list[str],
    inferred_sources: list[str],
) -> tuple[int, list[Signal]]:
    target_geos = icp.target_geographies
    max_points = 15
    if not target_geos:
        return max_points // 2, []

    matched: list[Signal] = []
    confirmed_count = 0

    for geo in target_geos:
        geo_lower = geo.lower().strip()
        found_confirmed = False
        for source in confirmed_sources:
            if source and geo_lower in source.lower() and "global" not in geo_lower:
                matched.append(Signal("geography", geo, confirmed=True))
                found_confirmed = True
                confirmed_count += 1
                break

        if not found_confirmed:
            for source in inferred_sources:
                if source and geo_lower in source.lower():
                    matched.append(Signal("geography", geo, confirmed=False))
                    break

    if confirmed_count == 0:
        return 0, matched
    fraction = confirmed_count / len(target_geos)
    points = round(max_points * min(fraction, 1.0))
    return points, matched


def _score_business_model(
    icp: ICPProfile,
    research: ResearchResult,
    homepage_text: str,
    is_direct_seller: bool,
    is_vendor_platform: bool,
) -> tuple[int, list[Signal]]:
    preferred = icp.preferred_business_models
    max_points = 25

    if not preferred:
        return max_points // 2, []

    preferred_lower = [p.lower() for p in preferred]
    wants_ecom = any(
        any(t in p for t in ["e-commerce", "ecommerce", "subscription commerce", "dtc", "online store"])
        for p in preferred_lower
    )

    # Direct seller + ecommerce preference → confirmed full match.
    if wants_ecom and is_direct_seller:
        pref_label = next(
            (p for p, pl in zip(preferred, preferred_lower)
             if any(t in pl for t in ["e-commerce", "ecommerce", "subscription commerce", "dtc", "online store"])),
            preferred[0],
        )
        return max_points, [Signal("business_model", pref_label, confirmed=True)]

    # Vendor/platform with ecommerce preference and NOT a direct seller → hard mismatch.
    if wants_ecom and is_vendor_platform and not is_direct_seller:
        return 0, []

    detected = (research.possible_business_model or "").lower()
    detected_is_unknown = (not detected) or "unknown" in detected
    matched: list[Signal] = []

    for pref in preferred:
        pref_key = pref.lower().strip()
        if pref_key and detected and (pref_key in detected or detected in pref_key):
            matched.append(Signal("business_model", pref, confirmed=True))
            return max_points, matched
        synonyms = BUSINESS_MODEL_SYNONYMS.get(pref_key, [pref_key])
        if detected and any(_contains(detected, syn) for syn in synonyms):
            matched.append(Signal("business_model", pref, confirmed=True))
            return max_points, matched

    if detected_is_unknown:
        confirmed_sources = _confirmed_text(research, homepage_text)
        for pref in preferred:
            pref_key = pref.lower().strip()
            synonyms = BUSINESS_MODEL_SYNONYMS.get(pref_key, [pref_key])
            for syn in synonyms:
                if _any_contains(confirmed_sources, syn):
                    matched.append(Signal("business_model", pref, confirmed=True))
                    return round(max_points * 0.7), matched
        return max_points // 3, []

    return 0, []


def _signal_density_bonus(
    direct_hits: int,
    vendor_hits: int,
    research: ResearchResult,
) -> int:
    """Bonus (0-10) for sites with rich evidence density.

    Purpose: break ties between companies whose categorical scores are
    identical but whose underlying evidence differs. E.g. two DTC sites
    both max industry/type/model, but one has 9 cart keywords + 4 evidence
    snippets and the other has 3 + 1. This makes that real difference
    surface in the final icp_fit number.

    The bonus is continuous rather than coarsely bucketed so two DTC
    brands with moderately different evidence densities don't collapse
    to the same number.
    """
    archetype_total = direct_hits + vendor_hits
    evidence_count = len([s for s in research.evidence_snippets if s and s.strip()])
    served_count = len([s for s in research.served_industries if s and s.strip()])

    # Weighted sum — each component contributes proportionally to the
    # richness it actually adds. Keyword hits dominate (they're direct
    # evidence), evidence snippets next, served industries last.
    raw = archetype_total * 0.5 + evidence_count * 1.0 + served_count * 0.75
    bonus = min(10, round(raw))
    return bonus


def _detect_red_flags(
    icp: ICPProfile,
    research: ResearchResult,
    homepage_text: str,
    notes: str,
) -> tuple[int, list[str]]:
    if not icp.red_flags:
        return 0, []

    all_sources = [
        homepage_text,
        *research.evidence_snippets,
        research.homepage_summary,
        research.detected_company_description,
        research.possible_business_model,
        notes,
    ]

    detected: list[str] = []
    for flag in icp.red_flags:
        if _any_contains(all_sources, flag):
            detected.append(flag)

    penalty = max(-50, -10 * len(detected))
    return penalty, detected


@dataclass
class ICPFitResult:
    score: int
    breakdown: ICPScoreBreakdown
    matched_signals: list[str]
    confirmed_signals: list[str]
    inferred_signals: list[str]
    red_flags_detected: list[str]
    reasoning: str


def score_icp_fit(
    icp: ICPProfile,
    research: ResearchResult,
    homepage_text: str,
    notes: str,
    user_industry: str = "",
) -> ICPFitResult:
    """Compute ICP fit deterministically, aware of direct-seller vs platform archetypes."""
    # Treat the user-provided industry as a high-confidence confirmed signal.
    # It's user-asserted ground truth; ignoring it meant two companies with
    # the same scrape yield but different declared industries scored identically.
    extra_confirmed = [user_industry] if user_industry else []
    confirmed_sources = _confirmed_text(research, homepage_text) + extra_confirmed
    inferred_sources = _inferred_text(research, notes)

    # Continuous archetype strengths (0.0-1.0) — replaces the old binary
    # gate. Saturation at /10 (not /6) so dense DTC sites (Brooklinen with
    # 10 cart keywords) diverge from moderate ones (Glossier with 6)
    # instead of both pinning to 1.0.
    direct_hits = _count_keyword_hits(confirmed_sources, DIRECT_SELLER_KEYWORDS)
    vendor_hits = _count_keyword_hits(confirmed_sources, VENDOR_PLATFORM_KEYWORDS)
    direct_seller_strength = min(1.0, direct_hits / 10.0)
    vendor_platform_strength = min(1.0, vendor_hits / 10.0)

    # Preserve the old booleans for legacy consumers below (reasoning text,
    # business-model scorer). A "clear" archetype needs >=2 hits AND dominance.
    is_direct_seller = direct_hits >= 2 and direct_hits >= vendor_hits
    is_vendor_platform = vendor_hits >= 2 and vendor_hits > direct_hits

    industry_pts, industry_signals = _score_ecom_aware_category(
        icp.target_industries, 20, confirmed_sources, inferred_sources,
        "industry", direct_seller_strength, vendor_platform_strength,
    )

    company_type_pts, type_signals = _score_ecom_aware_category(
        icp.target_company_types, 15, confirmed_sources, inferred_sources,
        "company_type", direct_seller_strength, vendor_platform_strength,
    )

    geo_pts, geo_signals = _score_geography(icp, confirmed_sources, inferred_sources)

    budget_pts, budget_signals_list = _score_budget_signals(
        icp.min_signals_of_budget, 25, confirmed_sources, inferred_sources,
    )

    bm_pts, bm_signals = _score_business_model(
        icp, research, homepage_text, is_direct_seller, is_vendor_platform,
    )
    penalty, red_flags_detected = _detect_red_flags(icp, research, homepage_text, notes)

    # Signal-density bonus: reward companies whose homepage has rich evidence,
    # regardless of which archetype they fall into. Caps at +6 so it nudges
    # differentiation without overwhelming the primary categories.
    density_bonus = _signal_density_bonus(direct_hits, vendor_hits, research)

    raw_total = (
        industry_pts + company_type_pts + geo_pts + bm_pts
        + budget_pts + density_bonus + penalty
    )
    total = max(0, min(100, raw_total))

    breakdown = ICPScoreBreakdown(
        industry_match=industry_pts,
        company_type_match=company_type_pts,
        geography_match=geo_pts,
        business_model_match=bm_pts,
        budget_signals=budget_pts,
        red_flags_penalty=penalty,
        total=total,
    )

    all_signals: list[Signal] = (
        industry_signals + type_signals + geo_signals + budget_signals_list + bm_signals
    )

    # Expose archetype detection as a visible signal so demos are transparent.
    archetype_signals: list[Signal] = []
    if is_direct_seller:
        archetype_signals.append(Signal("archetype", "Direct consumer seller", confirmed=True))
    if is_vendor_platform:
        archetype_signals.append(Signal("archetype", "Vendor/platform (B2B)", confirmed=True))
    all_signals = archetype_signals + all_signals

    matched_signals = [_format_signal(s) for s in all_signals]
    confirmed_signals = [_format_signal(s) for s in all_signals if s.confirmed]
    inferred_signals = [_format_signal(s) for s in all_signals if not s.confirmed]

    reasoning = _build_reasoning(
        breakdown, confirmed_signals, inferred_signals, red_flags_detected,
        is_direct_seller, is_vendor_platform,
    )

    return ICPFitResult(
        score=total,
        breakdown=breakdown,
        matched_signals=matched_signals,
        confirmed_signals=confirmed_signals,
        inferred_signals=inferred_signals,
        red_flags_detected=red_flags_detected,
        reasoning=reasoning,
    )


def _format_signal(s: Signal) -> str:
    tag = "confirmed" if s.confirmed else "inferred"
    return f"{s.category}: {s.label} ({tag})"


def _build_reasoning(
    b: ICPScoreBreakdown,
    confirmed: list[str],
    inferred: list[str],
    red_flags: list[str],
    is_direct_seller: bool,
    is_vendor_platform: bool,
) -> str:
    parts = [f"Total ICP fit: {b.total}/100."]
    parts.append(
        f"Breakdown — industry {b.industry_match}/20, type {b.company_type_match}/15, "
        f"geography {b.geography_match}/15, model {b.business_model_match}/25, "
        f"budget {b.budget_signals}/25."
    )
    if is_direct_seller:
        parts.append("Archetype: direct consumer seller (cart/checkout signals on site).")
    elif is_vendor_platform:
        parts.append("Archetype: vendor/platform (API/SDK/for-businesses signals). "
                     "Ecommerce industry terms were not credited.")
    if confirmed:
        parts.append(f"{len(confirmed)} confirmed signal(s) from visible evidence.")
    if inferred:
        parts.append(f"{len(inferred)} inferred signal(s) not directly visible.")
    if red_flags:
        parts.append(f"Red flags: {', '.join(red_flags)} (penalty {b.red_flags_penalty}).")
    if b.business_model_match == 0 and b.total < 40:
        parts.append("Business model does not match preferred models.")
    return " ".join(parts)


def compute_lead_score(icp_fit: int, confidence: int) -> tuple[int, str]:
    """Final lead score: 70% ICP fit, 30% research confidence.

    Thresholds:
    - Hot  (blended >= 65 AND icp_fit >= 60): strong fit with reasonable confidence
    - Warm (blended >= 45 AND icp_fit >= 35): moderate fit
    - Cold: weak fit or low confidence
    """
    blended = round(icp_fit * 0.7 + confidence * 0.3)

    if confidence < 30:
        blended = round(blended * 0.80)

    blended = max(0, min(100, blended))

    if blended >= 65 and icp_fit >= 60:
        label = "Hot"
    elif blended >= 45 and icp_fit >= 35:
        label = "Warm"
    else:
        label = "Cold"

    return blended, label
