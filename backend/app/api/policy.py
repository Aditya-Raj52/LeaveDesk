from typing import List, Dict
from fastapi import APIRouter, Depends
from app.core.rbac import require_employee
from app.models.user import User
from app.schemas.policy import PolicyQueryRequest, PolicyQueryResponse
from app.services.policy_rag_service import policy_rag_service

router = APIRouter(prefix="/policy", tags=["AI Policy Assistant (RAG)"])

SUGGESTED_PROMPTS = [
    {
        "id": "doc_note",
        "title": "Medical Certificate Rules",
        "prompt": "Do I need a doctor's note for 2 days of sick leave, or what if it's on a Friday?"
    },
    {
        "id": "rollover",
        "title": "Annual Leave Rollover",
        "prompt": "How many annual leaves can I carry forward into 2027 and when do they expire?"
    },
    {
        "id": "paternity",
        "title": "Paternity & Caregiver Leave",
        "prompt": "What is the duration of paternity leave and can it be taken in separate blocks?"
    },
    {
        "id": "casual",
        "title": "Casual Leave Limits",
        "prompt": "What is the maximum consecutive days allowed for casual leave?"
    },
    {
        "id": "overlap",
        "title": "Overlapping Leave Rules",
        "prompt": "Can I submit two leaves that overlap or clash with each other?"
    }
]

@router.post("/query", response_model=PolicyQueryResponse)
def query_policy_assistant(
    req: PolicyQueryRequest,
    current_user: User = Depends(require_employee)
):
    """
    Answers leave policy questions using the LeaveDesk RAG pipeline.
    Returns response with grounded citations, clause IDs, and confidence score.
    """
    return policy_rag_service.answer_query(req.question)

@router.get("/suggested", response_model=List[Dict[str, str]])
def get_suggested_prompts(
    current_user: User = Depends(require_employee)
):
    """Returns curated FAQ prompts for quick policy lookup."""
    return SUGGESTED_PROMPTS

@router.get("/handbook-clauses")
def get_all_clauses(
    current_user: User = Depends(require_employee)
):
    """Returns all indexed clauses for browsing the official policy document."""
    return [
        {
            "clause_id": c.clause_id,
            "section_title": c.section_title,
            "snippet": c.content[:200] + "..." if len(c.content) > 200 else c.content
        }
        for c in policy_rag_service.chunks
    ]
