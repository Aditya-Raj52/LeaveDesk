from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Optional
from datetime import date, datetime
from app.models.leave import LeaveType, LeaveStatus

class LeaveCreate(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=3, max_length=1000)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date")
        return self

class LeaveReview(BaseModel):
    status: LeaveStatus  # Must be APPROVED or REJECTED
    manager_comment: Optional[str] = None

class LeaveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    department: Optional[str] = None
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: float
    reason: str
    status: LeaveStatus
    manager_comment: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class LeaveBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    leave_type: LeaveType
    year: int
    total_days: float
    used_days: float
    pending_days: float
    remaining_days: float

class BalanceAdjustment(BaseModel):
    user_id: int
    leave_type: LeaveType
    total_days: float = Field(..., ge=0)
    reason: str = Field(..., min_length=3)

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    action: str
    entity_type: str
    entity_id: int
    actor_id: Optional[int]
    actor_name: str
    details: Optional[str]
    timestamp: datetime
