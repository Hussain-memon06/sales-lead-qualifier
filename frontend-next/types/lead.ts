export interface ICPProfile {
  name?: string;
  target_industries: string[];
  target_company_types: string[];
  target_geographies: string[];
  min_signals_of_budget: string[];
  preferred_business_models: string[];
  red_flags: string[];
}

export interface LeadRequest {
  company_name: string;
  website?: string;
  industry?: string;
  notes?: string;
  icp?: ICPProfile | null;
}

export interface ICPScoreBreakdown {
  industry_match: number;
  company_type_match: number;
  geography_match: number;
  business_model_match: number;
  budget_signals: number;
  red_flags_penalty: number;
  total: number;
}

export type Qualification = "Hot" | "Warm" | "Cold";

export interface LeadResponse {
  id?: number | null;
  created_at?: string | null;

  company_name: string;
  website: string;
  industry: string;
  notes: string;

  company_summary: string;
  company_type: string;
  pain_points: string[];
  opportunities: string[];
  reasoning: string;
  outreach_email: string;

  lead_score: number;
  qualification: Qualification;

  research_summary: string;
  evidence_snippets: string[];
  served_industries: string[];
  confidence_score: number;

  icp_fit_score: number;
  icp_score_breakdown: ICPScoreBreakdown;
  icp_fit_reasoning: string;
  matched_signals: string[];
  confirmed_signals: string[];
  inferred_signals: string[];
  red_flags_detected: string[];
}

export interface LeadSummary {
  id: number;
  created_at: string;
  company_name: string;
  industry: string;
  lead_score: number;
  qualification: Qualification;
  confidence_score: number;
  icp_fit_score: number;
}
