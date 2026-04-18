# Sales Lead Qualifier Project

## Project Goal
Build a practical AI agent that qualifies inbound sales leads for a business workflow.

The product should:
- accept a company name, website, industry, and optional notes
- analyze the company using provided context and available tools
- estimate likely business pain points
- score the lead from 0 to 100
- classify the lead as Cold, Warm, or Hot
- generate a short personalized outreach draft
- return structured, reliable output that can be stored in a database and shown in a UI

## Product Priorities
Prioritize these in order:
1. correctness and usefulness
2. structured outputs
3. simple maintainable code
4. fast iteration
5. polish

Do not add unnecessary complexity unless explicitly requested.

## Technical Direction
Use this stack unless told otherwise:
- Python
- FastAPI backend
- Pydantic schemas
- SQLite for initial development
- Streamlit for the first frontend
- Environment variables via `.env`

Prefer a simple single-agent architecture first.
Do not introduce LangGraph, Redis, Celery, background workers, auth, or microservices unless there is a clear need.

## Code Organization
Use this structure where possible:

- `app/main.py` for FastAPI app and routes
- `app/schemas.py` for request/response models
- `app/prompts.py` for prompt templates
- `app/services/llm.py` for model API access
- `app/services/lead_qualifier.py` for business logic
- `app/services/storage.py` for persistence
- `frontend/streamlit_app.py` for the demo UI

## Working Style
When asked to build, do the work instead of only describing it.
Before making larger edits, briefly state the plan.
Prefer small, testable changes.
Keep functions focused and readable.
Avoid overengineering.

When something is unclear, make the most reasonable assumption and state it briefly.
Only ask for clarification when the decision would materially change architecture or product behavior.

## Lead Qualification Rules
The application should evaluate leads using practical business reasoning, not fantasy assumptions.

When qualifying a lead:
- use only the provided input and clearly available evidence
- distinguish facts from inferences
- do not invent precise company details if unknown
- if information is missing, say it is uncertain
- infer likely pain points conservatively
- keep outreach short, specific, and relevant

A lead score should reflect:
- relevance to the target offer
- likely budget or buying capacity
- urgency or pain likelihood
- operational complexity where the offer may help
- clarity of fit based on available information

## Output Requirements
Model outputs should be structured and machine-friendly.
Prefer JSON-compatible responses that map cleanly to Pydantic schemas.

Unless a task explicitly asks for prose, return results in fields similar to:

- `company_summary`
- `company_type`
- `industry`
- `pain_points`
- `opportunities`
- `lead_score`
- `qualification`
- `reasoning`
- `outreach_email`

Do not return unstructured walls of text when structured output is possible.

## Prompting Guidance
When creating prompts for the model:
- separate role, context, task, constraints, and output format clearly
- use explicit instructions
- ask for grounded reasoning
- prefer structured output
- avoid vague style-only prompting
- include a strict schema or exact JSON shape whenever possible

Prompt templates should clearly distinguish:
- known inputs
- allowed inference
- forbidden behavior
- expected output format

## Reliability Rules
Do not fabricate:
- revenue numbers
- employee counts
- tech stack details
- funding status
- decision-maker names
- internal business priorities

If a detail is uncertain:
- say it is inferred or unknown
- lower confidence
- avoid presenting guesses as facts

## Implementation Preferences
Prefer:
- type hints
- small service functions
- Pydantic validation
- clear route handlers
- simple error handling
- environment-based configuration

Avoid:
- giant files
- deeply nested abstractions
- premature design patterns
- hidden magic behavior

## UI Preferences
The first UI should be simple and useful:
- a form for lead input
- a submit button
- a clear result view
- visible lead score
- visible qualification label
- copyable outreach draft

## Commands
Common commands should be kept updated here as the project evolves.

Example commands:
- create env: `python -m venv .venv`
- activate env on Windows: `.venv\Scripts\activate`
- install deps: `pip install -r requirements.txt`
- run api: `uvicorn app.main:app --reload`
- run frontend: `streamlit run frontend/streamlit_app.py`

## Collaboration Rules
When editing this project:
- preserve existing working code unless changing it is necessary
- explain major tradeoffs briefly
- keep diffs easy to review
- prefer shipping a working MVP over designing an ideal future system

## Definition of Done
A task is complete when:
- the feature works end-to-end
- inputs and outputs are validated
- the code is readable
- the result is demonstrable from UI or API
- obvious failure cases are handled
