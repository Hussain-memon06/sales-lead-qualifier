from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db import get_session, init_db
from app.schemas import LeadRequest, LeadResponse, LeadSummary
from app.services.lead_qualifier import qualify_lead
from app.services.storage import get_lead, list_leads, save_lead

load_dotenv()

app = FastAPI(
    title="Sales Lead Qualifier",
    description="AI-powered sales lead qualification API with research + history",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/qualify-lead", response_model=LeadResponse)
def qualify_lead_endpoint(
    lead: LeadRequest,
    db: Session = Depends(get_session),
):
    try:
        result = qualify_lead(lead)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")

    saved = save_lead(db, lead, result)
    return LeadResponse.model_validate(saved)


@app.get("/leads", response_model=list[LeadSummary])
def list_leads_endpoint(db: Session = Depends(get_session)):
    return list_leads(db)


@app.get("/lead/{lead_id}", response_model=LeadResponse)
def get_lead_endpoint(lead_id: int, db: Session = Depends(get_session)):
    lead = get_lead(db, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail=f"Lead {lead_id} not found")
    return LeadResponse.model_validate(lead)
