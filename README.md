# Pipeline IQ

> *"Find the decisions your business is quietly paying for."*

**Pipeline IQ** is an Agentic Decision-Intelligence System that detects **Decision Debt** inside an enterprise's business pipeline.

Unlike generic CRM dashboards or lead-scoring chatbots, Pipeline IQ does not merely notify you that a customer has not been contacted. It calculates:
- **WHAT** action did not happen
- **WHY** it matters and how much revenue is quietly exposed
- **WHAT** is connected to it via a relationship graph (ripple effects)
- **WHAT** happens if nothing is done
- **WHO** owns the decision and **WHEN** they must act
- **ESCALATION** rules if the deadline passes
- **AUDITING** whether predictions were accurate against real-world verified outcomes

---

## 1. Hybrid AI Architecture

Pipeline IQ enforces the architectural principle:
> **GRAPH + CODE = calculate deterministically**  
> **LLM = explain / synthesize reasoning over grounded evidence**  
> **AGENT = execute explicit workflow state transitions**  
> **DATABASE = record state, telemetry, and verified outcomes**

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PIPELINE IQ ARCHITECTURE                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [A] DATA LAYER           SQLite / PostgreSQL (SQLAlchemy models)      │
│         │                 Accounts, Contacts, Deals, Activities,       │
│         │                 Decisions, Contracts, Predictions, Evidence │
│         ▼                                                              │
│  [B] GRAPH LAYER          Multi-entity relationship graph              │
│         │                 Ripple-path propagation & deadlock trace     │
│         ▼                                                              │
│  [C] RISK & DEBT ENGINE   Deterministic Mathematical Scoring:          │
│         │                 Severity × Urgency × Value × Impact × Delay  │
│         ▼                                                              │
│  [D] EVIDENCE LEDGER      Verifiable telemetry signals with sources    │
│         │                 Zero hallucination guarantee                 │
│         ▼                                                              │
│  [E] LLM REASONING        Grounded synthesis & natural query pipeline  │
│         │                 Configurable Gemini / deterministic fallback │
│         ▼                                                              │
│  [F] AGENT & CONTRACTS    Explicit state machine (DETECTED → RESOLVED) │
│         │                 Decision Contracts with auto-escalations    │
│         ▼                                                              │
│  [G] SELF-AUDIT LOOP      Historical outcome verification &            │
│         │                 empirical reliability calibration bins       │
│         ▼                                                              │
│  [H] EXECUTIVE FRONTEND   React + TypeScript + Tailwind CSS            │
│                           Linear/Stripe-level enterprise polish        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Concepts

### Decision Debt
Decision Debt measures the compounded cost of delayed, ignored, or unmade business decisions across a pipeline.

$$\text{Decision Debt} = \text{Severity} \times \text{Urgency} \times \text{Business Value} \times \text{Relationship Impact} \times \text{Delay Factor} \times \text{Confidence}$$

- **Increases** when actions are overdue, deals are stalled, contacts go dark, and warning signals are unaddressed.
- **Decreases** when decision contracts are completed, risks are mitigated, or customers re-engage.
- **Transparent Attribution**: Every score exposes its exact mathematical contributors (e.g. `+ 20 overdue follow-up`, `+ 18 deal stalled 19 days`, `+ 16 declining engagement`, `+ 15 inactive contacts`, `+ 13 churn pattern`).

### Decision Contracts
A binding commitment mechanism specifying:
- **Action**: The concrete business step required
- **Owner**: Assigned responsible individual
- **Deadline**: Strict time limit
- **Escalation Rule**: Triggered automatically if the deadline is missed
- **Expected Impact & Underlying Rationale**
- **Lifecycle Actions**: Complete, Snooze (+3d), Escalate, Reassign

### Autonomous Agent State Machine
```
DETECTED ──► ANALYZING ──► ACTION_REQUIRED ──► CONTRACT_CREATED
                                                      │
                                                      ▼
RESOLVED ◄── AUDITING ◄── COMPLETED ◄── OVERDUE / PENDING
   ▲                                         │
   └─────────────────── ESCALATED ───────────┘
```

### Self-Audit & Calibration
Every prediction is tracked against factual outcomes. Pipeline IQ honestly reports:
- Verification rate and calibration accuracy (e.g., 74.1% - 88.4%)
- Brier calibration error score
- False positive vs false negative counts
- Empirical reliability across probability bins (0-30%, 30-50%, 50-70%, 70-90%, 90-100%)

---

## 3. Demo Scenario: ACME Technologies

The application includes a seeded canonical hero scenario demonstrating the complete decision lifecycle:

- **Account**: ACME Technologies (`acc-acme`)
- **Signals**:
  - $250,000 active pipeline ($200k Enterprise Expansion + $50k Security add-on)
  - 3 contacts, 2 inactive (CIO David Sterling & VP Eng Rachel Zhao)
  - 14 days without communication touchpoint
  - 19-day stalled deal in Negotiation stage
  - Engagement velocity down 42%
  - Overdue follow-up assigned to Sarah Chen
- **Deterministic Scores**:
  - Decision Debt: **82/100 (CRITICAL)**
  - Account Risk: **78%**
  - Revenue at Risk: **$180,000**
- **Relationship Graph**:
  Visually highlights the ripple chain:  
  *Inactive Contact → Engagement Velocity Drop → Pipeline Deal Deadlock → $180,000 Revenue at Risk*
- **Evidence Ledger**:
  5 verifiable signals with audit weights and telemetry sources.
- **Interactive Simulation**:
  Clicking **"Complete Action"** immediately recalculates metrics, resolving activities and decreasing Decision Debt in real time!

---

## 4. Tech Stack

- **Backend**: Python 3.14+, FastAPI, SQLAlchemy, Pydantic v2, Uvicorn
- **Database**: SQLite (default zero-configuration out-of-the-box) or PostgreSQL via `DATABASE_URL`
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Architecture**: Modular separation of API routes, deterministic calculation engines, agent state machine, and data models

---

## 5. Getting Started & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup & Run

```bash
# Navigate to repository root
cd buildAI

# (Optional) Set up virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Seed the database (creates 55 accounts, 190+ contacts, 110+ deals, 600+ interactions)
python -m backend.seed.seed_data

# Run FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be running at `http://127.0.0.1:8000`  
Interactive Swagger docs available at `http://127.0.0.1:8000/docs`

### 2. Frontend Setup & Run

```bash
# Navigate to frontend
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```

Frontend application will be running at `http://localhost:5173/`

---

## 6. Running Tests

Pipeline IQ includes unit and integration tests covering calculation formulas, graph construction, state machine transitions, self-audit metrics, and AI queries:

```bash
# From workspace root:
python -m backend.tests.run_tests
```

To verify all REST API endpoints via HTTP client:
```bash
python backend/tests/verify_endpoints.py
```

---

## 7. API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Top KPI metrics, trend charts, risk distribution, attention accounts |
| `GET` | `/api/accounts` | Filterable and sortable list of all 55 accounts |
| `GET` | `/api/accounts/{id}` | Account overview, debt breakdown, risks, timeline, and contracts |
| `GET` | `/api/accounts/{id}/graph` | Node-link relationship graph with ripple effect critical path |
| `GET` | `/api/accounts/{id}/evidence`| Verifiable evidence ledger entries |
| `GET` | `/api/decision-debt` | Aggregate debt metrics, debt by owner, aging velocity |
| `GET` | `/api/actions/center` | Prioritized human attention queue |
| `GET` | `/api/decision-contracts` | Decision contracts filtered by status and owner |
| `POST`| `/api/decision-contracts` | Create a new binding decision contract |
| `POST`| `/api/decision-contracts/{id}/complete` | Complete contract action & recalculate debt |
| `POST`| `/api/decision-contracts/{id}/escalate` | Escalate contract according to rules |
| `POST`| `/api/decision-contracts/{id}/snooze` | Extend contract deadline by specified days |
| `GET` | `/api/self-audit` | Calibration accuracy, Brier score, outcome evaluation log |
| `POST`| `/api/ai/query` | Grounded AI query answering using application telemetry |

---

## 8. License

MIT License. Designed and built for enterprise decision intelligence.
