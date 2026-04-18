from sqlalchemy.orm import Session

from app.models import Lead
from app.schemas import LeadRequest, LeadResponse


def save_lead(db: Session, request: LeadRequest, result: LeadResponse) -> Lead:
    """Persist a qualified lead and return the ORM instance."""
    lead = Lead(
        company_name=request.company_name,
        website=request.website,
        industry=request.industry,
        notes=request.notes,
        company_summary=result.company_summary,
        company_type=result.company_type,
        pain_points=result.pain_points,
        opportunities=result.opportunities,
        lead_score=result.lead_score,
        qualification=result.qualification,
        reasoning=result.reasoning,
        outreach_email=result.outreach_email,
        research_summary=result.research_summary,
        evidence_snippets=result.evidence_snippets,
        served_industries=result.served_industries,
        confidence_score=result.confidence_score,
        icp_fit_score=result.icp_fit_score,
        icp_fit_reasoning=result.icp_fit_reasoning,
        icp_score_breakdown=result.icp_score_breakdown.model_dump(),
        matched_signals=result.matched_signals,
        confirmed_signals=result.confirmed_signals,
        inferred_signals=result.inferred_signals,
        red_flags_detected=result.red_flags_detected,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def list_leads(db: Session, limit: int = 50) -> list[Lead]:
    return (
        db.query(Lead)
        .order_by(Lead.created_at.desc())
        .limit(limit)
        .all()
    )


def get_lead(db: Session, lead_id: int) -> Lead | None:
    return db.query(Lead).filter(Lead.id == lead_id).first()
