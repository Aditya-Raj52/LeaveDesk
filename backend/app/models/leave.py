from datetime import datetime, date, timezone
import enum
from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, ForeignKey, 
    Enum as SQLEnum, Text, Index, event, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base, engine, is_sqlite

class LeaveType(str, enum.Enum):
    ANNUAL = "ANNUAL"
    SICK = "SICK"
    CASUAL = "CASUAL"
    PARENTAL = "PARENTAL"
    UNPAID = "UNPAID"

class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type = Column(SQLEnum(LeaveType), nullable=False)
    year = Column(Integer, nullable=False, default=2026)
    total_days = Column(Float, nullable=False, default=21.0)
    used_days = Column(Float, nullable=False, default=0.0)
    pending_days = Column(Float, nullable=False, default=0.0)

    user = relationship("User", back_populates="leave_balances")

    __table_args__ = (
        Index("idx_user_type_year", "user_id", "leave_type", "year", unique=True),
    )

    @property
    def remaining_days(self) -> float:
        return max(0.0, self.total_days - (self.used_days + self.pending_days))

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type = Column(SQLEnum(LeaveType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(SQLEnum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False, index=True)
    
    # Review details
    manager_comment = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="leave_requests", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])

# On PostgreSQL, attach the exclusion constraint dynamically to prevent overlapping leaves
if not is_sqlite:
    from sqlalchemy.dialects.postgresql import ExcludeConstraint
    
    # EXCLUDE USING gist (user_id WITH =, daterange(start_date, end_date, '[]') WITH &&) 
    # WHERE (status IN ('PENDING', 'APPROVED'))
    pg_exclusion = ExcludeConstraint(
        ('user_id', '='),
        (func.daterange(LeaveRequest.start_date, LeaveRequest.end_date, '[]'), '&&'),
        where=LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
        name="exclude_overlapping_leave_requests"
    )
    LeaveRequest.__table__.append_constraint(pg_exclusion)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)  # LEAVE_REQUESTED, LEAVE_APPROVED, LEAVE_REJECTED, etc.
    entity_type = Column(String(50), nullable=False)  # LEAVE_REQUEST, BALANCE
    entity_id = Column(Integer, nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_name = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
