import json
import re

from app.prompts import RESEARCH_PROMPT
from app.schemas import ResearchResult
from app.services.llm import get_llm_response
from app.services.tools import fetch_website_text


def _deterministic_confidence(
    homepage_text: str,
    evidence_snippets: list[str],
    business_model: str,
    served_industries: list[str],
) -> int:
    """Compute confidence deterministically from hard signals.

    LLM-self-reported confidence was uninformative (anchored near 85 for
    normal pages, near 10 for thin ones) so we ignore it. Instead we
    derive confidence from measurable evidence density. Ranges are tuned
    so normal sites land ~55-80 and only exceptionally rich content
    approaches the 90+ ceiling — avoiding the old 90/100 cluster.

        text length        0-35  (scraping yield, finer bins)
        unique-word count  0-10  (vocabulary richness, proxy for signal)
        evidence snippets  0-18  (the LLM found concrete quotes)
        business model     0-8   (resolved vs. Unknown — binary, small)
        served industries  0-12  (LLM could enumerate customer verticals)
        base floor         5     (prevents 0 on edge inputs)

    The result is naturally differentiated across companies because each
    input varies independently. It is also stable — a company scraped
    twice produces nearly identical confidence.
    """
    stripped = homepage_text.strip()
    text_len = len(stripped)
    evidence_count = len([s for s in evidence_snippets if s and s.strip()])
    served_count = len([s for s in served_industries if s and s.strip()])
    model_known = (
        bool(business_model) and "unknown" not in business_model.lower()
    )

    # Text length contribution — more bins for differentiation between
    # similar-richness sites (e.g. two DTC homepages with 4200 vs 6800 chars).
    if text_len == 0:
        text_pts = 0
    elif text_len < 200:
        text_pts = 5
    elif text_len < 500:
        text_pts = 11
    elif text_len < 1000:
        text_pts = 17
    elif text_len < 1800:
        text_pts = 22
    elif text_len < 2800:
        text_pts = 26
    elif text_len < 4000:
        text_pts = 29
    elif text_len < 6000:
        text_pts = 32
    else:
        text_pts = 35

    # Vocabulary richness — distinct tokens in scraped text. Cheap proxy
    # for "is this page actually dense content or just nav/boilerplate?".
    unique_words = len({w for w in stripped.lower().split() if len(w) > 2})
    if unique_words >= 900:
        vocab_pts = 10
    elif unique_words >= 500:
        vocab_pts = 7
    elif unique_words >= 250:
        vocab_pts = 5
    elif unique_words >= 80:
        vocab_pts = 2
    else:
        vocab_pts = 0

    # Evidence snippet contribution — each distinct snippet adds signal.
    evidence_pts = min(18, evidence_count * 3)

    # Business model: small binary contribution; shouldn't dominate the score.
    model_pts = 8 if model_known else 0

    # Served industries: rewards richer vertical enumeration.
    served_pts = min(12, served_count * 3)

    raw = 5 + text_pts + vocab_pts + evidence_pts + model_pts + served_pts
    return max(5, min(100, raw))


def research_company(
    company_name: str,
    website: str,
    industry: str,
) -> tuple[ResearchResult, str]:
    """Fetch homepage and return (structured research, raw homepage text).

    The raw text is returned so downstream deterministic scoring can check
    directly for keyword evidence rather than relying only on the LLM.
    Gracefully falls back when the site can't be fetched.
    """
    homepage_text, ok = fetch_website_text(website)

    if not ok or not homepage_text.strip():
        result = ResearchResult(
            homepage_summary="Website could not be fetched or was empty.",
            detected_company_description="Unknown — no usable website content available.",
            possible_business_model="Unknown — insufficient evidence.",
            evidence_snippets=[],
            confidence_score=5,
        )
        return result, ""

    prompt = RESEARCH_PROMPT.format(
        company_name=company_name,
        industry=industry or "Not provided",
        homepage_text=homepage_text,
    )

    try:
        raw = get_llm_response(prompt)
        parsed = _parse_json(raw)
        result = ResearchResult(**parsed)
    except Exception:
        result = ResearchResult(
            homepage_summary=homepage_text[:300],
            detected_company_description="Could not analyze homepage — LLM parsing failed.",
            possible_business_model="Unknown",
            evidence_snippets=[],
        )
        result.confidence_score = _deterministic_confidence(
            homepage_text, [], "", [],
        )
        return result, homepage_text

    # Overwrite LLM confidence with a deterministic evidence-density score.
    result.confidence_score = _deterministic_confidence(
        homepage_text,
        result.evidence_snippets,
        result.possible_business_model,
        result.served_industries,
    )
    return result, homepage_text


def _parse_json(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)
