from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.rbac import get_current_user, require_manager, require_hr_admin, require_employee
from app.models.user import User, UserRole
from app.models.leave import LeaveRequest, LeaveBalance, LeaveStatus, LeaveType, AuditLog
from app.schemas.leave import (
    LeaveCreate, LeaveReview, LeaveResponse, LeaveBalanceResponse,
    BalanceAdjustment, AuditLogResponse
)
from app.services.leave_service import LeaveService

router = APIRouter(prefix="/leaves", tags=["Leaves Management"])

def format_leave_response(req: LeaveRequest) -> LeaveResponse:
    return LeaveResponse(
        id=req.id,
        user_id=req.user_id,
        user_name=req.user.full_name if req.user else "Unknown",
        user_email=req.user.email if req.user else "",
        department=req.user.department if req.user else "",
        leave_type=req.leave_type,
        start_date=req.start_date,
        end_date=req.end_date,
        total_days=req.total_days,
        reason=req.reason,
        status=req.status,
        manager_comment=req.manager_comment,
        reviewed_by=req.reviewed_by,
        reviewed_by_name=req.reviewer.full_name if req.reviewer else None,
        reviewed_at=req.reviewed_at,
        created_at=req.created_at,
        updated_at=req.updated_at
    )

@router.post("", response_model=LeaveResponse)
def submit_leave_request(
    data: LeaveCreate,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """
    Submits a new leave request.
    Enforces non-overlapping constraint and atomic balance reservation.
    """
    req = LeaveService.create_leave_request(db, current_user, data)
    return format_leave_response(req)

@router.get("/my", response_model=List[LeaveResponse])
def get_my_leave_requests(
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """Fetches all leave requests submitted by the current user."""
    requests = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id
    ).order_by(desc(LeaveRequest.created_at)).all()
    return [format_leave_response(r) for r in requests]

@router.get("/balances", response_model=List[LeaveBalanceResponse])
def get_my_balances(
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """Fetches leave balances for current user."""
    balances = db.query(LeaveBalance).filter(
        LeaveBalance.user_id == current_user.id
    ).all()
    return [
        LeaveBalanceResponse(
            id=b.id,
            user_id=b.user_id,
            leave_type=b.leave_type,
            year=b.year,
            total_days=b.total_days,
            used_days=b.used_days,
            pending_days=b.pending_days,
            remaining_days=b.remaining_days
        )
        for b in balances
    ]

@router.get("/pending", response_model=List[LeaveResponse])
def get_pending_approvals(
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    """
    Returns pending leave requests for review.
    - Managers see requests from their direct reports / department
    - HR Admins see all pending requests company-wide
    """
    query = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.PENDING)
    
    if current_user.role == UserRole.MANAGER:
        # Filter for reporting line or same department
        query = query.join(User, LeaveRequest.user_id == User.id).filter(
            (User.manager_id == current_user.id) | (User.department == current_user.department)
        )
    
    requests = query.order_by(LeaveRequest.created_at.asc()).all()
    return [format_leave_response(r) for r in requests]

@router.post("/{request_id}/review", response_model=LeaveResponse)
def review_leave_request(
    request_id: int,
    review: LeaveReview,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    """
    Approves or rejects a leave request inside an atomic database transaction.
    Debits or releases balance days and updates audit trail.
    """
    updated_req = LeaveService.review_leave_request(db, request_id, current_user, review)
    return format_leave_response(updated_req)

@router.post("/{request_id}/cancel", response_model=LeaveResponse)
def cancel_leave_request(
    request_id: int,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """
    Cancels a pending request and unlocks reserved balance days.
    """
    cancelled_req = LeaveService.cancel_leave_request(db, request_id, current_user)
    return format_leave_response(cancelled_req)

@router.get("/team-calendar", response_model=List[LeaveResponse])
def get_team_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """
    Returns approved leaves for team schedule coordination.
    """
    query = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.APPROVED)
    requests = query.order_by(LeaveRequest.start_date.asc()).all()
    return [format_leave_response(r) for r in requests]

@router.get("/all", response_model=List[LeaveResponse])
def get_all_leaves(
    status_filter: Optional[LeaveStatus] = None,
    current_user: User = Depends(require_hr_admin),
    db: Session = Depends(get_db)
):
    """HR Admin portal endpoint to view all leaves across the enterprise."""
    query = db.query(LeaveRequest)
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    requests = query.order_by(desc(LeaveRequest.created_at)).all()
    return [format_leave_response(r) for r in requests]

@router.post("/balance-adjust", response_model=LeaveBalanceResponse)
def adjust_balance(
    adj: BalanceAdjustment,
    current_user: User = Depends(require_hr_admin),
    db: Session = Depends(get_db)
):
    """HR Admin endpoint to credit, debit, or adjust an employee's total annual entitlement."""
    target_user = db.query(User).filter(User.id == adj.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    balance = db.query(LeaveBalance).filter(
        LeaveBalance.user_id == adj.user_id,
        LeaveBalance.leave_type == adj.leave_type,
        LeaveBalance.year == 2026
    ).first()

    old_total = balance.total_days if balance else 0.0
    if not balance:
        balance = LeaveBalance(
            user_id=adj.user_id,
            leave_type=adj.leave_type,
            year=2026,
            total_days=adj.total_days,
            used_days=0.0,
            pending_days=0.0
        )
        db.add(balance)
    else:
        balance.total_days = adj.total_days

    audit = AuditLog(
        action="BALANCE_ADJUSTED",
        entity_type="BALANCE",
        entity_id=adj.user_id,
        actor_id=current_user.id,
        actor_name=current_user.full_name,
        details=f"Adjusted {adj.leave_type.value} balance for {target_user.full_name} from {old_total} to {adj.total_days} days. Reason: {adj.reason}"
    )
    db.add(audit)
    db.commit()
    db.refresh(balance)

    return LeaveBalanceResponse(
        id=balance.id,
        user_id=balance.user_id,
        leave_type=balance.leave_type,
        year=balance.year,
        total_days=balance.total_days,
        used_days=balance.used_days,
        pending_days=balance.pending_days,
        remaining_days=balance.remaining_days
    )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, le=200),
    current_user: User = Depends(require_hr_admin),
    db: Session = Depends(get_db)
):
    """HR Audit trail inspection endpoint."""
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return logs
