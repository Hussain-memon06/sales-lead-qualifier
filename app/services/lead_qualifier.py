import json
import re

from app.prompts import NARRATIVE_PROMPT
from app.schemas import (
    ICPProfile,
    LeadRequest,
    LeadResponse,
    ResearchResult,
)
from app.services.icp_scoring import ICPFitResult, compute_lead_score, score_icp_fit
from app.services.llm import get_llm_response
from app.services.research_agent import research_company


EMPTY_ICP = ICPProfile()


def qualify_lead(lead: LeadRequest) -> LeadResponse:
    """Full pipeline:
        1. Research the company website
        2. Score ICP fit deterministically in Python
        3. Ask the LLM only for narrative fields
        4. Compute overall lead_score from ICP fit + confidence
    """
    research, homepage_text = research_company(
        company_name=lead.company_name,
        website=lead.website,
        industry=lead.industry,
    )

    icp = lead.icp or EMPTY_ICP
    icp_result = score_icp_fit(
        icp, research, homepage_text, lead.notes, user_industry=lead.industry,
    )
    lead_score, qualification = compute_lead_score(icp_result.score, research.confidence_score)

    # When the homepage can't be fetched (e.g. bot-protected sites like
    # Warby Parker returning 403 from Cloudflare), skip the LLM and return
    # an honest canned narrative. Otherwise the model would happily invent
    # pain points from the company name alone, contaminating the output.
    if not homepage_text.strip():
        narrative = _fallback_narrative(lead)
    else:
        narrative = _run_narrative(lead, research, icp_result)

    return LeadResponse(
        company_name=lead.company_name,
        website=lead.website,
        industry=lead.industry,
        notes=lead.notes,
        company_summary=narrative.get("company_summary", ""),
        company_type=narrative.get("company_type", ""),
        pain_points=narrative.get("pain_points", []),
        opportunities=narrative.get("opportunities", []),
        reasoning=narrative.get("reasoning", ""),
        outreach_email=narrative.get("outreach_email", ""),
        lead_score=lead_score,
        qualification=qualification,
        research_summary=_build_research_summary(research),
        evidence_snippets=research.evidence_snippets,
        served_industries=research.served_industries,
        confidence_score=research.confidence_score,
        icp_fit_score=icp_result.score,
        icp_score_breakdown=icp_result.breakdown,
        icp_fit_reasoning=icp_result.reasoning,
        matched_signals=icp_result.matched_signals,
        confirmed_signals=icp_result.confirmed_signals,
        inferred_signals=icp_result.inferred_signals,
        red_flags_detected=icp_result.red_flags_detected,
    )


def _run_narrative(
    lead: LeadRequest,
    research: ResearchResult,
    icp: ICPFitResult,
) -> dict:
    prompt = NARRATIVE_PROMPT.format(
        company_name=lead.company_name,
        website=lead.website or "Not provided",
        industry=lead.industry or "Not provided",
        notes=lead.notes or "None",
        homepage_summary=research.homepage_summary or "Not available",
        detected_company_description=research.detected_company_description or "Not available",
        possible_business_model=research.possible_business_model or "Unknown",
        evidence_snippets=research.evidence_snippets or [],
        confidence_score=research.confidence_score,
        icp_fit_score=icp.score,
        icp_score_breakdown=icp.breakdown.model_dump(),
        confirmed_signals=icp.confirmed_signals or [],
        inferred_signals=icp.inferred_signals or [],
        red_flags_detected=icp.red_flags_detected or [],
        icp_fit_reasoning=icp.reasoning,
    )

    raw = get_llm_response(prompt)
    narrative = _parse_json(raw)
    _validate_narrative(narrative)
    return narrative


def _fallback_narrative(lead: LeadRequest) -> dict:
    """Honest canned narrative when the homepage couldn't be fetched.

    Bot-protected sites (Cloudflare 403, TLS fingerprinting) leave us with
    no evidence. Asking the LLM to write "pain points" and an outreach
    email in that state invites hallucination from the company name alone,
    so we short-circuit with a neutral, accurate response.
    """
    name = lead.company_name or "this company"
    industry = lead.industry or "their industry"
    return {
        "company_summary": (
            f"{name}'s website could not be fetched — it may be bot-protected or "
            "temporarily unavailable. No homepage evidence was analyzed."
        ),
        "company_type": "Unknown (website inaccessible)",
        "pain_points": [
            "Unknown — homepage evidence unavailable for analysis.",
        ],
        "opportunities": [
            "Re-run once the site is reachable, or provide additional notes describing the business.",
        ],
        "reasoning": (
            f"We could not retrieve {name}'s homepage, so ICP fit and confidence are "
            f"scored from user-provided inputs only ({industry}, plus any notes). "
            "Treat this result as preliminary — the low confidence reflects missing evidence, not a weak fit."
        ),
        "outreach_email": (
            f"Hi {name} team,\n\n"
            f"I tried to learn a bit about your work in {industry} before reaching out, but "
            "your site wasn't loading for me at the time. Rather than guess, I wanted to ask "
            "directly: are you currently exploring partners in this space, and if so, what "
            "would a useful first conversation look like?\n\n"
            "Happy to share context on our end once I understand yours.\n\n"
            "Best regards"
        ),
    }


def _build_research_summary(research: ResearchResult) -> str:
    parts = []
    if research.homepage_summary:
        parts.append(research.homepage_summary)
    if research.detected_company_description:
        parts.append(f"Appears to do: {research.detected_company_description}")
    if research.possible_business_model:
        parts.append(f"Business model: {research.possible_business_model}")
    return " ".join(parts)


def _parse_json(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\nRaw response:\n{text}")


def _validate_narrative(narrative: dict) -> None:
    """Validate that narrative fields are complete and not truncated."""
    outreach = narrative.get("outreach_email", "").strip()
    if len(outreach) < 20:
        raise ValueError(
            "outreach_email is too short or empty — LLM may have truncated output. "
            "Ensure the email includes greeting, details, and closing."
        )
    if not any(c in outreach for c in [".", "?", "!"]):
        raise ValueError("outreach_email does not contain sentence punctuation — likely truncated.")
    reasoning = narrative.get("reasoning", "").strip()
    if len(reasoning) < 30:
        raise ValueError("reasoning field is too short — likely incomplete.")
