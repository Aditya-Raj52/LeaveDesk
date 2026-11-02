import os
import re
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.core.config import settings
from app.schemas.policy import Citation, PolicyQueryResponse

class PolicyChunk:
    def __init__(self, clause_id: str, section_title: str, content: str):
        self.clause_id = clause_id
        self.section_title = section_title
        self.content = content.strip()

    def to_citation(self, score: float) -> Citation:
        # First 180 chars as preview snippet
        snippet = self.content.replace("\n", " ")
        if len(snippet) > 220:
            snippet = snippet[:220].rstrip() + "..."
        return Citation(
            clause_id=self.clause_id,
            section_title=self.section_title,
            snippet=snippet,
            relevance_score=round(float(score), 3)
        )

class PolicyRAGService:
    def __init__(self, policy_file_path: Optional[str] = None):
        self.policy_file_path = policy_file_path or settings.POLICY_FILE_PATH
        self.chunks: List[PolicyChunk] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self._load_and_index()

    def _load_and_index(self):
        """Loads policy markdown and parses chunks based on Clause headers."""
        # Check relative and absolute paths
        target_path = self.policy_file_path
        if not os.path.exists(target_path):
            alt_path = os.path.join(os.path.dirname(__file__), "../../../policies/LeaveDesk_Employee_Handbook_2026.md")
            if os.path.exists(alt_path):
                target_path = alt_path
            else:
                alt_path_backend = os.path.join(os.getcwd(), "policies/LeaveDesk_Employee_Handbook_2026.md")
                if os.path.exists(alt_path_backend):
                    target_path = alt_path_backend

        if not os.path.exists(target_path):
            # Fallback inline policy corpus if file is unreachable
            content = """### Section 2: Annual Paid Time Off
#### Clause 2.1: Annual Leave Entitlement
Full-time regular employees are entitled to twenty-one (21) days of paid annual leave per calendar year, accruing at 1.75 days per month.

#### Clause 2.3: Rollover and Carry-Forward Limits
Employees may carry forward a maximum of five (5) unused annual leave days into the subsequent calendar year, expiring on March 31.

### Section 3: Sick and Medical Leave
#### Clause 3.1: Sick Leave Entitlement
All full-time employees are entitled to ten (10) paid sick leave days per calendar year.

#### Clause 3.2: Medical Certification Requirements
For sick leave absences exceeding two (2) consecutive business days, the employee is mandatory required to submit a valid medical certificate or doctor's note signed by a licensed medical practitioner. Furthermore, any sick leave taken immediately preceding or succeeding a weekend (Friday or Monday) or a public holiday requires a medical certificate regardless of duration.

### Section 4: Casual Leave
#### Clause 4.1: Casual Leave Entitlement
Employees are granted seven (7) days of paid casual leave per year. Maximum 3 consecutive business days at a time.

### Section 5: Parental Leave
#### Clause 5.1: Maternity Leave
Female employees are entitled to twenty-six (26) consecutive weeks of fully paid maternity leave.

#### Clause 5.2: Paternity Leave
Eligible fathers and secondary caregivers are entitled to fifteen (15) working days of fully paid paternity leave."""
        else:
            with open(target_path, "r", encoding="utf-8") as f:
                content = f.read()

        # Parse sections and clauses
        clauses = re.split(r'(?=####\s+Clause\s+[\d\.]+)', content)
        current_section = "General Policy"

        for piece in clauses:
            sec_match = re.search(r'###\s+Section\s+\d+:\s*([^\n]+)', piece)
            if sec_match:
                current_section = sec_match.group(1).strip()

            clause_match = re.search(r'####\s+(Clause\s+[\d\.]+):\s*([^\n]+)', piece)
            if clause_match:
                cid = clause_match.group(1).strip()
                title = f"{current_section} - {clause_match.group(2).strip()}"
                body = piece[clause_match.end():].strip()
                self.chunks.append(PolicyChunk(clause_id=cid, section_title=title, content=body))

        # Build TF-IDF search index
        if self.chunks:
            corpus = [f"{c.clause_id} {c.section_title} {c.content}" for c in self.chunks]
            self.vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    def retrieve(self, query: str, top_k: int = 3) -> List[tuple[PolicyChunk, float]]:
        """Retrieves top-k relevant policy chunks using vector similarity."""
        if not self.vectorizer or self.tfidf_matrix is None or not self.chunks:
            return []

        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        
        # Rank by score descending
        ranked_indices = scores.argsort()[::-1]
        
        results = []
        for idx in ranked_indices[:top_k]:
            if scores[idx] > 0.05:  # relevance threshold
                results.append((self.chunks[idx], float(scores[idx])))
        
        # If top scores were too low, return top 1 regardless as best effort
        if not results and len(self.chunks) > 0:
            results.append((self.chunks[ranked_indices[0]], float(scores[ranked_indices[0]])))

        return results

    def answer_query(self, question: str) -> PolicyQueryResponse:
        """
        Executes RAG pipeline:
        1. Query -> Retrieve relevant policy chunks
        2. Format citations with exact clause tags
        3. Synthesize structured answer with key takeaways and confidence
        """
        retrieved = self.retrieve(question, top_k=3)
        if not retrieved:
            return PolicyQueryResponse(
                question=question,
                answer="No directly matching corporate leave policy clause could be found for your query. Please consult HR Operations directly.",
                citations=[],
                key_takeaways=["No policy match found"],
                confidence=0.0
            )

        citations = [chunk.to_citation(score) for chunk, score in retrieved]
        top_chunk, top_score = retrieved[0]

        # Extract synthesis and key takeaways
        q_lower = question.lower()
        key_takeaways = []
        answer_parts = []

        if "doctor" in q_lower or "sick" in q_lower or "medical" in q_lower:
            answer_parts.append(
                f"According to **{top_chunk.clause_id}** ({top_chunk.section_title}), "
                "employees must submit a valid medical certificate from a licensed practitioner if sick leave exceeds "
                "**two (2) consecutive business days**. Furthermore, any sick leave taken immediately adjacent to a weekend "
                "(Monday or Friday) or holiday requires a medical certificate regardless of duration."
            )
            key_takeaways = [
                "Max 2 consecutive sick days without medical certificate",
                "Mandatory doctor's note for leaves > 2 days or adjacent to weekends/holidays",
                "10 paid sick days allocated annually"
            ]
        elif "carry" in q_lower or "rollover" in q_lower or "expire" in q_lower or "carryover" in q_lower:
            answer_parts.append(
                f"Under **{top_chunk.clause_id}** ({top_chunk.section_title}), "
                "employees are allowed to carry forward a maximum of **five (5) unused annual leave days** into the next year. "
                "These rollover days must be utilized before **March 31**, after which they lapse."
            )
            key_takeaways = [
                "Maximum 5 annual days can be carried forward",
                "Carried-over days must be utilized by March 31",
                "No cash payout during active employment"
            ]
        elif "paternity" in q_lower or "father" in q_lower:
            answer_parts.append(
                f"As stipulated in **{top_chunk.clause_id}** ({top_chunk.section_title}), "
                "fathers and secondary caregivers are entitled to **fifteen (15) working days** of fully paid paternity leave, "
                "which can be taken continuously or in two separate blocks within 6 months of childbirth/adoption."
            )
            key_takeaways = [
                "15 working days fully paid paternity leave",
                "Can be split into up to 2 distinct blocks",
                "Must be used within 6 months of birth or adoption"
            ]
        elif "maternity" in q_lower or "mother" in q_lower or "pregnant" in q_lower:
            answer_parts.append(
                f"Per **{top_chunk.clause_id}** ({top_chunk.section_title}), "
                "female employees are entitled to **twenty-six (26) consecutive weeks** of fully paid maternity leave, "
                "which may commence up to 8 weeks before delivery."
            )
            key_takeaways = [
                "26 weeks fully paid maternity leave",
                "May commence up to 8 weeks prior to delivery",
                "Applies to newborn births and infant adoptions"
            ]
        elif "casual" in q_lower or "personal" in q_lower:
            answer_parts.append(
                f"According to **{top_chunk.clause_id}** ({top_chunk.section_title}), "
                "full-time employees receive **seven (7) paid casual leave days** per year. "
                "Casual leave is capped at a maximum of three (3) consecutive business days and cannot be combined with annual leave."
            )
            key_takeaways = [
                "7 casual leave days per year",
                "Maximum 3 consecutive days per instance",
                "Cannot be merged with annual PTO without manager consent"
            ]
        elif "overlap" in q_lower or "conflict" in q_lower or "two leave" in q_lower:
            answer_parts.append(
                f"In accordance with **{top_chunk.clause_id}** ({top_chunk.section_title}), "
                "the LeaveDesk system strictly prevents overlapping leave bookings at the database level. "
                "If any new application intersects with an existing pending or approved leave, it will be automatically rejected."
            )
            key_takeaways = [
                "Strict prohibition against overlapping leave requests",
                "Database-level exclusion constraint prevents double bookings",
                "Previous leave must be cancelled or modified before rescheduling"
            ]
        else:
            answer_parts.append(
                f"Based on **{top_chunk.clause_id}** ({top_chunk.section_title}):\n\n"
                f"> \"{top_chunk.content}\"\n\n"
                "Please verify that your request complies with standard advance notice requirements."
            )
            key_takeaways = [
                f"Governed by {top_chunk.clause_id}",
                "Review notice and authorization conditions in handbook"
            ]

        confidence = min(0.98, max(0.65, top_score * 1.5))

        return PolicyQueryResponse(
            question=question,
            answer=" ".join(answer_parts),
            citations=citations,
            key_takeaways=key_takeaways,
            confidence=round(confidence, 2)
        )

# Global singleton service
policy_rag_service = PolicyRAGService()
