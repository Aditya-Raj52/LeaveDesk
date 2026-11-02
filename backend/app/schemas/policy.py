from pydantic import BaseModel, Field
from typing import List, Optional

class Citation(BaseModel):
    clause_id: str
    section_title: str
    snippet: str
    relevance_score: float

class PolicyQueryRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)

class PolicyQueryResponse(BaseModel):
    question: str
    answer: str
    citations: List[Citation]
    key_takeaways: List[str]
    confidence: float
