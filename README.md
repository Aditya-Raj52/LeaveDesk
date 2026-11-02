# LeaveDesk: Enterprise HR Leave Management with AI Policy Assistant

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://www.postgresql.org)
[![Pytest](https://img.shields.io/badge/Pytest-13%20Passed-0A9EDC.svg?style=flat&logo=pytest&logoColor=white)](https://docs.pytest.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com)

**LeaveDesk** is an enterprise-grade full-stack leave management and attendance governance platform engineered with **React + TypeScript**, **FastAPI**, **PostgreSQL**, **JWT Authentication**, and an integrated **RAG-powered AI Policy Assistant**.

---

## 🌟 Key Engineering Highlights

### 1. Database-Level Overlap Prevention via PostgreSQL GiST Exclusion Constraint
Traditional web applications rely solely on application-level checks to prevent double booking of dates, which creates severe race conditions when multiple requests are submitted simultaneously.

LeaveDesk enforces non-overlapping leave bookings directly at the database storage engine using PostgreSQL's `btree_gist` extension:
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE leave_requests
ADD CONSTRAINT exclude_overlapping_leave_requests
EXCLUDE USING gist (
  user_id WITH =,
  daterange(start_date, end_date, '[]') WITH &&
) WHERE (status IN ('PENDING', 'APPROVED'));
```
- Prevents concurrent transactions from booking overlapping date ranges (`&&`).
- Scoped to `status IN ('PENDING', 'APPROVED')` so rejected or cancelled requests automatically release the date slots.
- Handled in FastAPI with clean HTTP 409 Conflict responses.

### 2. Atomic Balance Updates Inside ACID Transactions with Row Locking
All leave requests and manager reviews execute inside atomic database transactions with row-level locking (`SELECT ... FOR UPDATE`):
- **Submission**: Moves requested days from `Available` to `Pending` reserve atomically.
- **Approval**: Decrements `Pending` reserve, credits `Used` days, and marks status as `APPROVED`.
- **Rejection / Cancellation**: Immediately refunds `Pending` days back to `Available` balance.
- **Audit Log**: An immutable compliance log record is appended within the same atomic transaction.

### 3. RAG-Powered AI Policy Assistant with Grounded Citations
An integrated Retrieval-Augmented Generation (RAG) assistant indexes the official **LeaveDesk 2026 Employee Handbook** (`POL-HR-2026-V4`):
- **Chunking & Indexing**: Parses sections and individual clauses (e.g., `Clause 3.2 - Medical Certification Requirements`, `Clause 2.3 - Carry-Forward Rollover`).
- **Vector Retrieval**: Computes semantic similarity to retrieve relevant regulatory clauses.
- **Grounded Verification**: Returns verbatim quote snippets, clause badges, key policy takeaways, and a confidence score.

### 4. Role-Based Access Control (RBAC) & Hierarchy
- 👩‍💻 **Employee (Sarah Chen)**: Apply for leaves, view real-time balance meters, track application history, and chat with the AI Policy Assistant.
- 👨‍💼 **Manager (Marcus Brody)**: Direct reporting approval queue, 1-click Approve / Reject with review comments, team leave calendar.
- 🛡️ **HR Admin (Elena Rostova)**: Company-wide leave governance, discretionary balance adjustments with mandatory audit justification, and immutable compliance log inspection.

---

## 🏗️ Architecture

```
                                  +----------------------------+
                                  | React 19 + TypeScript SPA  |
                                  | (Vite, Glassmorphism UI)   |
                                  +--------------+-------------+
                                                 |
                                     HTTP / REST | (JWT Bearer)
                                                 v
                                  +----------------------------+
                                  |     FastAPI Backend        |
                                  |  - RBAC Middleware         |
                                  |  - Leave & Balance Service |
                                  |  - TF-IDF / Vector RAG     |
                                  +--------------+-------------+
                                                 |
                   +-----------------------------+-----------------------------+
                   |                                                           |
                   v                                                           v
+------------------------------------+                    +------------------------------------+
|       PostgreSQL 16 Database       |                    |        Policy Knowledge Base       |
| - btree_gist Extension             |                    | - LeaveDesk Handbook 2026          |
| - GiST Exclusion Constraint        |                    | - Chunks & Clause Metadata         |
| - ACID Row-Locking Transactions    |                    +------------------------------------+
+------------------------------------+
```

---

## 🚀 Running the Project

### Option A: Running with Docker Compose (Recommended)
Make sure Docker Desktop is running:
```bash
docker compose up --build
```
- **Frontend**: `http://localhost:3000`
- **FastAPI API & Docs**: `http://localhost:8000/docs`
- **PostgreSQL**: Port `5432`

---

### Option B: Running Locally

#### 1. Backend
```bash
cd backend

# Install dependencies
pip install -r requirements.txt email-validator

# Run tests
python -m pytest -v

# Start the server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

#### 2. Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Pytest Test Suite

The backend includes a 13-test automated test suite:
```bash
cd backend
python -m pytest -v
```

| Test File | Description | Status |
| :--- | :--- | :---: |
| `test_leaves_overlap.py` | Validates rejection of overlapping leave dates (409 Conflict) | **PASSED** |
| `test_atomic_balance.py` | Verifies pending reservation, approval debit, and rejection refund | **PASSED** |
| `test_rbac.py` | Enforces permissions (Employees cannot self-approve, HR balance adjustments) | **PASSED** |
| `test_policy_rag.py` | Tests RAG query answering and exact clause citation grounding | **PASSED** |
| `test_auth.py` | Validates JWT generation, role claims, and credential verification | **PASSED** |

---

## 👥 Demo Personas

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Employee** | Sarah Chen | `sarah.chen@leavedesk.internal` | `Password123!` |
| **Manager** | Marcus Brody | `marcus.brody@leavedesk.internal` | `Password123!` |
| **HR Admin** | Elena Rostova | `elena.rostova@leavedesk.internal` | `Password123!` |

*(Use the one-click Role Demo switcher bar at the top of the app to seamlessly switch personas.)*
