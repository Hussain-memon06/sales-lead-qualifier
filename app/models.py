from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Input fields
    company_name: Mapped[str] = mapped_column(String(255))
    website: Mapped[str] = mapped_column(String(512), default="")
    industry: Mapped[str] = mapped_column(String(255), default="")
    notes: Mapped[str] = mapped_column(Text, default="")

    # Qualification output
    company_summary: Mapped[str] = mapped_column(Text, default="")
    company_type: Mapped[str] = mapped_column(String(255), default="")
    pain_points: Mapped[list] = mapped_column(JSON, default=list)
    opportunities: Mapped[list] = mapped_column(JSON, default=list)
    lead_score: Mapped[int] = mapped_column(Integer, default=0)
    qualification: Mapped[str] = mapped_column(String(50), default="")
    reasoning: Mapped[str] = mapped_column(Text, default="")
    outreach_email: Mapped[str] = mapped_column(Text, default="")

    # Research output
    research_summary: Mapped[str] = mapped_column(Text, default="")
    evidence_snippets: Mapped[list] = mapped_column(JSON, default=list)
    served_industries: Mapped[list] = mapped_column(JSON, default=list)
    confidence_score: Mapped[int] = mapped_column(Integer, default=0)

    # ICP output (computed deterministically in Python)
    icp_fit_score: Mapped[int] = mapped_column(Integer, default=0)
    icp_fit_reasoning: Mapped[str] = mapped_column(Text, default="")
    icp_score_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)
    matched_signals: Mapped[list] = mapped_column(JSON, default=list)
    confirmed_signals: Mapped[list] = mapped_column(JSON, default=list)
    inferred_signals: Mapped[list] = mapped_column(JSON, default=list)
    red_flags_detected: Mapped[list] = mapped_column(JSON, default=list)
