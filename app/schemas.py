from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ICPProfile(BaseModel):
    """Ideal Customer Profile definition."""
    name: str = Field(default="default")
    target_industries: list[str] = Field(default_factory=list)
    target_company_types: list[str] = Field(default_factory=list)
    target_geographies: list[str] = Field(default_factory=list)
    min_signals_of_budget: list[str] = Field(default_factory=list)
    preferred_business_models: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)


class LeadRequest(BaseModel):
    company_name: str = Field(..., min_length=1)
    website: str = Field(default="")
    industry: str = Field(default="")
    notes: str = Field(default="")
    icp: ICPProfile | None = Field(default=None)


class ResearchResult(BaseModel):
    homepage_summary: str = Field(default="")
    detected_company_description: str = Field(default="")
    possible_business_model: str = Field(default="")
    evidence_snippets: list[str] = Field(default_factory=list)
    served_industries: list[str] = Field(
        default_factory=list,
        description="Industries the company serves (separate from its primary industry)",
    )
    confidence_score: int = Field(default=0, ge=0, le=100)


class ICPScoreBreakdown(BaseModel):
    """Per-category ICP fit score contributions (computed in Python)."""
    industry_match: int = Field(default=0, description="0-20")
    company_type_match: int = Field(default=0, description="0-15")
    geography_match: int = Field(default=0, description="0-15")
    business_model_match: int = Field(default=0, description="0-25")
    budget_signals: int = Field(default=0, description="0-25")
    red_flags_penalty: int = Field(default=0, description="<= 0")
    total: int = Field(default=0, description="0-100, clamped")


class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    created_at: datetime | None = None

    company_name: str
    website: str = ""
    industry: str = ""
    notes: str = ""

    # Narrative fields (from LLM)
    company_summary: str
    company_type: str
    pain_points: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)
    reasoning: str
    outreach_email: str

    # Score fields (computed deterministically in Python)
    lead_score: int = Field(..., ge=0, le=100)
    qualification: str

    # Research fields
    research_summary: str = ""
    evidence_snippets: list[str] = Field(default_factory=list)
    served_industries: list[str] = Field(default_factory=list)
    confidence_score: int = Field(default=0, ge=0, le=100)

    # ICP fields (computed in Python)
    icp_fit_score: int = Field(default=0, ge=0, le=100)
    icp_score_breakdown: ICPScoreBreakdown = Field(default_factory=ICPScoreBreakdown)
    icp_fit_reasoning: str = ""
    matched_signals: list[str] = Field(default_factory=list)
    confirmed_signals: list[str] = Field(default_factory=list)
    inferred_signals: list[str] = Field(default_factory=list)
    red_flags_detected: list[str] = Field(default_factory=list)


class LeadSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    company_name: str
    industry: str
    lead_score: int
    qualification: str
    confidence_score: int
    icp_fit_score: int
