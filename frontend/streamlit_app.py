from datetime import datetime

import pandas as pd
import requests
import streamlit as st

API_URL = "http://localhost:8000"

st.set_page_config(page_title="Sales Lead Qualifier", layout="wide")
st.title("Sales Lead Qualifier")


# ---------------------------------------------------------------------------
# ICP Profile presets
# ---------------------------------------------------------------------------

ICP_PRESETS = {
    "Custom": {
        "target_industries": [],
        "target_company_types": [],
        "target_geographies": [],
        "min_signals_of_budget": [],
        "preferred_business_models": [],
        "red_flags": [],
    },
    "B2B SaaS Agency": {
        "target_industries": ["SaaS", "Fintech", "E-commerce"],
        "target_company_types": ["Mid-market SaaS", "Series A-C startups"],
        "target_geographies": ["North America", "Europe"],
        "min_signals_of_budget": ["Recent funding", "Hiring engineers", "Enterprise clients"],
        "preferred_business_models": ["SaaS subscription", "Usage-based"],
        "red_flags": ["Pre-revenue", "Solo founder", "Free-tier only"],
    },
    "Marketing Services": {
        "target_industries": ["E-commerce", "Retail", "Consumer brands"],
        "target_company_types": ["DTC brands", "Retailers with online presence"],
        "target_geographies": ["Global"],
        "min_signals_of_budget": ["Active paid ads", "Multiple product lines", "Large catalog"],
        "preferred_business_models": ["E-commerce", "Subscription commerce"],
        "red_flags": ["Single-product hobby store", "No online sales"],
    },
}


def render_icp_sidebar() -> dict:
    st.sidebar.header("Ideal Customer Profile")

    preset_name = st.sidebar.selectbox("Preset", list(ICP_PRESETS.keys()))

    state_key = f"icp_state_{preset_name}"
    if state_key not in st.session_state:
        st.session_state[state_key] = {
            k: list(v) for k, v in ICP_PRESETS[preset_name].items()
        }
    icp = st.session_state[state_key]

    def list_input(label: str, field: str, help_text: str = "") -> None:
        raw = st.sidebar.text_area(
            label,
            value="\n".join(icp[field]),
            help=help_text or "One item per line.",
            key=f"{preset_name}_{field}",
            height=80,
        )
        icp[field] = [line.strip() for line in raw.splitlines() if line.strip()]

    list_input("Target Industries", "target_industries")
    list_input("Target Company Types", "target_company_types")
    list_input("Target Geographies", "target_geographies")
    list_input("Budget Signals", "min_signals_of_budget", "Signs the company can pay.")
    list_input("Preferred Business Models", "preferred_business_models")
    list_input("Red Flags", "red_flags", "Traits that disqualify a lead.")

    st.sidebar.caption("Scoring runs in Python using these criteria — not in the LLM.")
    return {"name": preset_name, **icp}


# ---------------------------------------------------------------------------
# Result rendering
# ---------------------------------------------------------------------------

def _render_breakdown(breakdown: dict) -> None:
    """Show per-category scores as progress bars."""
    categories = [
        ("Industry", "industry_match", 20),
        ("Company Type", "company_type_match", 15),
        ("Geography", "geography_match", 15),
        ("Business Model", "business_model_match", 25),
        ("Budget Signals", "budget_signals", 25),
    ]
    for label, key, max_pts in categories:
        value = breakdown.get(key, 0)
        st.write(f"**{label}:** {value}/{max_pts}")
        st.progress(min(value / max_pts, 1.0) if max_pts else 0)

    penalty = breakdown.get("red_flags_penalty", 0)
    if penalty < 0:
        st.write(f"**Red Flags Penalty:** {penalty}")


def render_result(data: dict) -> None:
    st.divider()
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Lead Score", f"{data['lead_score']}/100")
    with col2:
        qual = data["qualification"]
        color = {"Hot": "red", "Warm": "orange", "Cold": "blue"}.get(qual, "gray")
        st.markdown(f"### :{color}[{qual}]")
    with col3:
        st.metric("ICP Fit", f"{data.get('icp_fit_score', 0)}/100")
    with col4:
        st.metric("Research Confidence", f"{data.get('confidence_score', 0)}/100")

    # ICP breakdown
    breakdown = data.get("icp_score_breakdown") or {}
    if breakdown:
        st.subheader("ICP Score Breakdown")
        left, right = st.columns([2, 3])
        with left:
            _render_breakdown(breakdown)
        with right:
            st.markdown("**Scoring Logic**")
            st.caption(data.get("icp_fit_reasoning", ""))

    # Signals
    confirmed = data.get("confirmed_signals", [])
    inferred = data.get("inferred_signals", [])
    flags = data.get("red_flags_detected", [])

    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("**✅ Confirmed Signals**")
        st.caption("Directly visible on the website.")
        if confirmed:
            for s in confirmed:
                st.write(f"- {s}")
        else:
            st.caption("None")
    with c2:
        st.markdown("**🔎 Inferred Signals**")
        st.caption("From research/notes, not directly visible.")
        if inferred:
            for s in inferred:
                st.write(f"- {s}")
        else:
            st.caption("None")
    with c3:
        st.markdown("**🚩 Red Flags**")
        if flags:
            for s in flags:
                st.write(f"- {s}")
        else:
            st.caption("None")

    # Research
    if data.get("research_summary"):
        st.subheader("Research Findings")
        st.write(data["research_summary"])

    if data.get("served_industries"):
        st.markdown("**Industries Served (if the company is a vendor):**")
        for ind in data["served_industries"]:
            st.write(f"- {ind}")

    if data.get("evidence_snippets"):
        with st.expander("Evidence from the website"):
            for snippet in data["evidence_snippets"]:
                st.write(f"- \"{snippet}\"")

    # Narrative
    st.subheader("Company Summary")
    st.write(data["company_summary"])
    st.write(f"**Type:** {data['company_type']}")

    col_a, col_b = st.columns(2)
    with col_a:
        st.subheader("Pain Points")
        for point in data["pain_points"]:
            st.write(f"- {point}")
    with col_b:
        st.subheader("Opportunities")
        for opp in data["opportunities"]:
            st.write(f"- {opp}")

    st.subheader("Reasoning")
    st.write(data["reasoning"])

    st.subheader("Outreach Email Draft")
    st.code(data["outreach_email"], language=None)


# ---------------------------------------------------------------------------
# Layout
# ---------------------------------------------------------------------------

icp_payload = render_icp_sidebar()

tab_qualify, tab_bulk, tab_history = st.tabs(["Qualify a Lead", "Bulk Upload", "Lead History"])

with tab_qualify:
    st.markdown("Enter lead details. ICP in the sidebar drives deterministic scoring.")

    with st.form("lead_form"):
        company_name = st.text_input("Company Name *", placeholder="e.g. Acme Corp")
        website = st.text_input("Website", placeholder="e.g. https://acme.com")
        industry = st.text_input("Industry", placeholder="e.g. SaaS, Manufacturing")
        notes = st.text_area("Notes", placeholder="Any additional context...")
        submitted = st.form_submit_button("Qualify Lead")

    if submitted:
        if not company_name.strip():
            st.error("Company name is required.")
        else:
            with st.spinner("Researching and scoring against ICP..."):
                try:
                    response = requests.post(
                        f"{API_URL}/qualify-lead",
                        json={
                            "company_name": company_name.strip(),
                            "website": website.strip(),
                            "industry": industry.strip(),
                            "notes": notes.strip(),
                            "icp": icp_payload,
                        },
                        timeout=90,
                    )
                    if response.status_code != 200:
                        st.error(f"API error: {response.status_code} — {response.text}")
                    else:
                        render_result(response.json())
                except requests.ConnectionError:
                    st.error("Could not connect to the API. Start it with: uvicorn app.main:app --reload")
                except requests.Timeout:
                    st.error("Request timed out.")


# ---------------------------------------------------------------------------
# Bulk CSV upload
# ---------------------------------------------------------------------------

REQUIRED_CSV_COLS = ["company_name"]
OPTIONAL_CSV_COLS = ["website", "industry", "notes"]
EXPORT_COLS = [
    "company_name",
    "website",
    "lead_score",
    "qualification",
    "icp_fit_score",
    "confidence_score",
    "company_summary",
    "business_model",
    "confirmed_signals",
    "inferred_signals",
    "red_flags_detected",
    "outreach_email_compact",
    "status",
    "error",
]


def _compact(text: str) -> str:
    """Flatten newlines/tabs to single spaces — safer for CSV cells."""
    if not text:
        return ""
    return " ".join(text.split())


def _extract_business_model(research_summary: str) -> str:
    if not research_summary:
        return ""
    marker = "Business model:"
    idx = research_summary.find(marker)
    if idx == -1:
        return ""
    return research_summary[idx + len(marker):].strip()


def _qualify_one_row(row: dict, icp_payload: dict) -> dict:
    """Call the API for a single row. Returns a flat dict suitable for the results table."""
    company_name = str(row.get("company_name", "")).strip()
    base = {
        "company_name": company_name,
        "website": str(row.get("website", "") or "").strip(),
        "lead_score": None,
        "qualification": None,
        "icp_fit_score": None,
        "confidence_score": None,
        "company_summary": "",
        "business_model": "",
        "confirmed_signals": "",
        "inferred_signals": "",
        "red_flags_detected": "",
        "outreach_email_compact": "",
        "status": "ok",
        "error": "",
    }

    if not company_name:
        base["status"] = "skipped"
        base["error"] = "company_name is empty"
        return base

    try:
        resp = requests.post(
            f"{API_URL}/qualify-lead",
            json={
                "company_name": company_name,
                "website": str(row.get("website", "") or "").strip(),
                "industry": str(row.get("industry", "") or "").strip(),
                "notes": str(row.get("notes", "") or "").strip(),
                "icp": icp_payload,
            },
            timeout=120,
        )
        if resp.status_code != 200:
            base["status"] = "error"
            base["error"] = f"HTTP {resp.status_code}: {resp.text[:200]}"
            return base
        data = resp.json()
        base.update({
            "lead_score": data.get("lead_score"),
            "qualification": data.get("qualification"),
            "icp_fit_score": data.get("icp_fit_score"),
            "confidence_score": data.get("confidence_score"),
            "company_summary": _compact(data.get("company_summary", "")),
            "business_model": _extract_business_model(data.get("research_summary", "")),
            "confirmed_signals": "; ".join(data.get("confirmed_signals", []) or []),
            "inferred_signals": "; ".join(data.get("inferred_signals", []) or []),
            "red_flags_detected": "; ".join(data.get("red_flags_detected", []) or []),
            "outreach_email_compact": _compact(data.get("outreach_email", "")),
        })
        return base
    except requests.ConnectionError:
        base["status"] = "error"
        base["error"] = "Could not connect to API"
        return base
    except requests.Timeout:
        base["status"] = "error"
        base["error"] = "Request timed out"
        return base
    except Exception as e:
        base["status"] = "error"
        base["error"] = f"{type(e).__name__}: {e}"
        return base


with tab_bulk:
    st.markdown(
        "Upload a CSV with columns: **company_name** (required), "
        "and optionally **website**, **industry**, **notes**. "
        "Each row is qualified using the ICP in the sidebar and saved to the database."
    )

    if "bulk_results" not in st.session_state:
        st.session_state.bulk_results = None

    uploaded = st.file_uploader("CSV file", type=["csv"], key="bulk_csv_uploader")

    if uploaded is not None:
        try:
            df_in = pd.read_csv(uploaded)
        except Exception as e:
            st.error(f"Could not parse CSV: {e}")
            df_in = None

        if df_in is not None:
            missing = [c for c in REQUIRED_CSV_COLS if c not in df_in.columns]
            if missing:
                st.error(f"Missing required column(s): {', '.join(missing)}")
            else:
                for col in OPTIONAL_CSV_COLS:
                    if col not in df_in.columns:
                        df_in[col] = ""

                st.caption(f"Preview ({len(df_in)} rows):")
                st.dataframe(df_in.head(20), width="stretch")

                if st.button(f"Qualify {len(df_in)} leads", type="primary"):
                    results = []
                    progress = st.progress(0.0)
                    status_line = st.empty()
                    total = len(df_in)
                    for i, row in enumerate(df_in.to_dict(orient="records"), start=1):
                        status_line.write(
                            f"Qualifying {i}/{total}: {row.get('company_name', '(blank)')}"
                        )
                        results.append(_qualify_one_row(row, icp_payload))
                        progress.progress(i / total)
                    status_line.success(f"Done. Processed {total} rows.")
                    st.session_state.bulk_results = results

    if st.session_state.bulk_results:
        results = st.session_state.bulk_results
        ok = sum(1 for r in results if r["status"] == "ok")
        errs = sum(1 for r in results if r["status"] == "error")
        skipped = sum(1 for r in results if r["status"] == "skipped")
        st.markdown(f"**Results:** {ok} qualified · {errs} errors · {skipped} skipped")

        df_out = pd.DataFrame(results).reindex(columns=EXPORT_COLS)
        df_out.insert(0, "exported_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        st.dataframe(df_out, width="stretch", hide_index=True)

        # UTF-8 BOM so Excel opens non-ASCII characters correctly.
        csv_bytes = df_out.to_csv(index=False).encode("utf-8-sig")
        filename = f"qualified_leads_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        st.download_button(
            "Download enriched CSV",
            data=csv_bytes,
            file_name=filename,
            mime="text/csv",
        )

        if st.button("Clear bulk results"):
            st.session_state.bulk_results = None
            st.rerun()


# ---------------------------------------------------------------------------
# Lead history helpers
# ---------------------------------------------------------------------------

def _fetch_history() -> list | None:
    """Fetch the list of leads. Returns list on success, None on failure."""
    try:
        resp = requests.get(f"{API_URL}/leads", timeout=10)
        if resp.status_code == 200:
            return resp.json()
        st.error(f"Could not load history: {resp.status_code}")
        return None
    except requests.ConnectionError:
        st.error("Could not connect to the API.")
        return None
    except requests.Timeout:
        st.error("Request timed out while loading history.")
        return None


def _fetch_lead_detail(lead_id: int) -> dict | None:
    """Fetch one lead's full details."""
    try:
        resp = requests.get(f"{API_URL}/lead/{lead_id}", timeout=10)
        if resp.status_code == 200:
            return resp.json()
        st.error(f"Could not load lead {lead_id}: {resp.status_code}")
        return None
    except requests.ConnectionError:
        st.error("Could not connect to the API.")
        return None
    except requests.Timeout:
        st.error("Request timed out while loading lead details.")
        return None


with tab_history:
    st.markdown("Previously qualified leads, newest first.")

    # Initialize session state once (None means "not loaded yet")
    if "lead_history" not in st.session_state:
        st.session_state.lead_history = None
    if "selected_lead_id" not in st.session_state:
        st.session_state.selected_lead_id = None
    if "selected_lead_data" not in st.session_state:
        st.session_state.selected_lead_data = None

    # --- Controls row ----------------------------------------------------
    col_load, col_clear = st.columns([3, 1])
    with col_load:
        if st.button("Load / Refresh History"):
            st.session_state.lead_history = _fetch_history()
            # Keep the current selection if the lead still exists; otherwise clear.
            sel_id = st.session_state.selected_lead_id
            if sel_id is not None and st.session_state.lead_history is not None:
                still_exists = any(
                    lead["id"] == sel_id for lead in st.session_state.lead_history
                )
                if still_exists:
                    st.session_state.selected_lead_data = _fetch_lead_detail(sel_id)
                else:
                    st.session_state.selected_lead_id = None
                    st.session_state.selected_lead_data = None
    with col_clear:
        if st.session_state.selected_lead_id is not None:
            if st.button("Clear selection"):
                st.session_state.selected_lead_id = None
                st.session_state.selected_lead_data = None
                st.rerun()

    # --- Selected lead details ------------------------------------------
    if st.session_state.selected_lead_data is not None:
        st.subheader(f"Lead #{st.session_state.selected_lead_id} — Details")
        render_result(st.session_state.selected_lead_data)
        st.divider()

    # --- History list ----------------------------------------------------
    if st.session_state.lead_history is None:
        st.info("Click **Load / Refresh History** to view saved leads.")
    elif not st.session_state.lead_history:
        st.info("No leads saved yet.")
    else:
        st.subheader("All Leads")
        for lead in st.session_state.lead_history:
            is_selected = lead["id"] == st.session_state.selected_lead_id
            label = (
                f"#{lead['id']} — {lead['company_name']} "
                f"({lead['qualification']}, Lead {lead['lead_score']}/100, "
                f"ICP {lead.get('icp_fit_score', 0)}/100)"
            )
            if is_selected:
                label = "✓ " + label
            with st.expander(label, expanded=is_selected):
                st.write(f"**Industry:** {lead['industry'] or 'Not provided'}")
                st.write(f"**Created:** {lead['created_at']}")

                if is_selected:
                    st.caption("Currently selected — details shown above.")
                else:
                    if st.button("View full details", key=f"view_{lead['id']}"):
                        st.session_state.selected_lead_id = lead["id"]
                        st.session_state.selected_lead_data = _fetch_lead_detail(lead["id"])
                        st.rerun()
