RESEARCH_PROMPT = """\
You are a company research analyst. You are given raw text extracted from a company's homepage.
Analyze it and return a structured research result.

## Company Name
{company_name}

## Stated Industry
{industry}

## Homepage Text (truncated)
{homepage_text}

## Instructions
1. Summarize the homepage in 1-2 sentences (what the site communicates).
2. Describe what the company appears to do (its primary business, not who it serves).
3. Infer a possible business model: SaaS subscription, Usage-based, Services/Consulting, \
Agency, E-commerce, Marketplace, Ads, or Unknown.
4. Extract 2-5 short evidence snippets (direct phrases from the text).
5. List industries the company SERVES (if mentioned). This is separate from the company's \
own primary industry. Examples: "We serve retail, e-commerce, and fintech" → ["retail", \
"e-commerce", "fintech"]. If not mentioned, leave empty.
6. Give a confidence_score (0-100):
   - 80-100: text clearly describes the business
   - 40-79: text is partial or marketing-heavy but useful
   - 0-39: little useful text or no text provided

## Rules
- Do NOT invent facts not supported by the text.
- Evidence snippets must be under 25 words each and drawn from the provided text.
- Distinguish: the company's PRIMARY industry (what it does) vs. industries it SERVES (what \
verticals it targets as a vendor/service provider).

## Output Format
Respond with valid JSON matching this exact schema:
{{
  "homepage_summary": "string",
  "detected_company_description": "string",
  "possible_business_model": "string",
  "evidence_snippets": ["string"],
  "served_industries": ["string"],
  "confidence_score": integer (0-100)
}}

Respond ONLY with the JSON object. No markdown, no commentary.
"""


NARRATIVE_PROMPT = """\
You are a sales intelligence analyst. Deterministic ICP fit scoring has ALREADY been computed \
for this lead (by our system, not by you). Your job is to write the narrative sections only.
DO NOT re-score; do not invent an ICP fit number.

## Lead Information
- Company Name: {company_name}
- Website: {website}
- Industry (stated): {industry}
- Additional Notes: {notes}

## Research Findings (from homepage analysis)
- Homepage Summary: {homepage_summary}
- Detected Description: {detected_company_description}
- Possible Business Model: {possible_business_model}
- Evidence Snippets: {evidence_snippets}
- Research Confidence: {confidence_score}/100

## Pre-computed ICP Analysis (from our system — treat as ground truth)
- ICP Fit Score: {icp_fit_score}/100
- Score Breakdown: {icp_score_breakdown}
- Confirmed Signals (from visible evidence): {confirmed_signals}
- Inferred Signals (from LLM inference): {inferred_signals}
- Red Flags Detected: {red_flags_detected}
- ICP Fit Reasoning: {icp_fit_reasoning}

## Instructions
1. Write a 1-2 sentence company_summary grounded in research.
2. Classify company_type (e.g. SaaS, Agency, E-commerce, Manufacturing, Consulting).
3. List 2-4 likely pain_points, grounded in research. Be conservative.
4. List 1-3 opportunities where a services vendor could help.
5. Write reasoning (2-3 sentences) that explicitly references the ICP Fit Score, any \
confirmed/inferred signals, and any red flags. Do not contradict the pre-computed scoring.
6. Write outreach_email (3-5 sentences, must be COMPLETE). Tie it to confirmed signals and \
research when possible. If red flags exist or ICP fit is low, the email should be exploratory, \
not a hard pitch. IMPORTANT: the email should be a complete, ready-to-send draft that is not \
truncated. Include a greeting, body with specific details, and a clear call-to-action or closing.

## Rules
- Do NOT fabricate revenue, headcount, tech stack, funding, or names.
- Do NOT produce an icp_fit_score or any score number — those are computed elsewhere.
- Ground claims in evidence.

## Output Format
Respond with valid JSON matching this exact schema:
{{
  "company_summary": "string",
  "company_type": "string",
  "pain_points": ["string"],
  "opportunities": ["string"],
  "reasoning": "string",
  "outreach_email": "string"
}}

Respond ONLY with the JSON object. No markdown, no commentary.
"""
