from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class PolicyDocument(Base):
    __tablename__ = "policy_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False, default="2026-V4")
    effective_date = Column(String(50), nullable=False, default="2026-01-01")
    raw_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    chunks = relationship("PolicyChunk", back_populates="document", cascade="all, delete-orphan")

class PolicyChunk(Base):
    __tablename__ = "policy_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("policy_documents.id", ondelete="CASCADE"), nullable=False)
    section_title = Column(String(255), nullable=False)
    clause_id = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    keywords = Column(Text, nullable=True)

    document = relationship("PolicyDocument", back_populates="chunks")
