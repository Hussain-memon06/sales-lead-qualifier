import json
import os

from google import genai
import openai


def get_llm_response(prompt: str) -> str:
    """Send a prompt to the configured LLM and return the raw text response.

    Priority: GEMINI_API_KEY > OPENAI_API_KEY > mock fallback.
    """
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    if gemini_key:
        return _call_gemini(prompt, gemini_key)
    elif openai_key:
        return _call_openai(prompt, openai_key)
    else:
        return _mock_response(prompt)


def _call_gemini(prompt: str, api_key: str) -> str:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
        contents=prompt,
    )
    return response.text


def _call_openai(prompt: str, api_key: str) -> str:
    client = openai.OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    return response.choices[0].message.content


def _mock_response(prompt: str) -> str:
    """Mock responses for both the research prompt and the narrative prompt."""
    company_name = "the company"
    for line in prompt.split("\n"):
        if "Company Name:" in line:
            company_name = line.split("Company Name:")[-1].strip() or company_name
            break

    if "Homepage Text" in prompt or "homepage_summary" in prompt:
        return json.dumps({
            "homepage_summary": f"Homepage for {company_name} — mock mode, no analysis.",
            "detected_company_description": "Unknown in mock mode.",
            "possible_business_model": "Unknown",
            "evidence_snippets": [],
            "served_industries": [],
            "confidence_score": 15,
        })

    # Narrative prompt
    return json.dumps({
        "company_summary": f"{company_name} — mock summary. Install an API key for real analysis.",
        "company_type": "Unknown",
        "pain_points": [
            "Mock mode — pain points cannot be inferred without an LLM.",
        ],
        "opportunities": [
            "Set GEMINI_API_KEY or OPENAI_API_KEY to get real output.",
        ],
        "reasoning": "Mock response. ICP fit was still computed deterministically by the system.",
        "outreach_email": (
            f"Hi {company_name} team,\n\n"
            "(Mock email — configure an API key for real outreach drafts.)\n\n"
            "Best regards"
        ),
    })
