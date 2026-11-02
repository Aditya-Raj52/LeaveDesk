from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, and_
from app.models.leave import LeaveRequest, LeaveBalance, LeaveType, LeaveStatus, AuditLog
from app.models.user import User, UserRole
from app.schemas.leave import LeaveCreate, LeaveReview
from app.core.database import is_sqlite

def calculate_working_days(start_date: date, end_date: date) -> float:
    """
    Calculates number of working days between start_date and end_date (inclusive),
    skipping weekends (Saturdays and Sundays).
    """
    if start_date > end_date:
        raise ValueError("start_date cannot be after end_date")
    
    current = start_date
    working_days = 0
    while current <= end_date:
        # 0 = Monday, 4 = Friday, 5 = Saturday, 6 = Sunday
        if current.weekday() < 5:
            working_days += 1
        current += timedelta(days=1)
    
    # If a weekend-only range was selected, default to 1 day for non-standard schedules
    return float(max(1, working_days))

class LeaveService:
    @staticmethod
    def check_overlap(db: Session, user_id: int, start_date: date, end_date: date, exclude_request_id: Optional[int] = None) -> Optional[LeaveRequest]:
        """
        Detects overlapping leaves where:
        (existing.start_date <= new.end_date) AND (existing.end_date >= new.start_date)
        and status is either PENDING or APPROVED.
        """
        query = db.query(LeaveRequest).filter(
            LeaveRequest.user_id == user_id,
            LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date
        )
        if exclude_request_id:
            query = query.filter(LeaveRequest.id != exclude_request_id)
        return query.first()

    @staticmethod
    def create_leave_request(db: Session, user: User, data: LeaveCreate) -> LeaveRequest:
        """
        Submits a new leave request atomically:
        1. Checks for overlapping dates (enforced by exclusion query and Postgres GiST constraint)
        2. Locks balance row with SELECT ... FOR UPDATE (if supported)
        3. Validates adequate remaining balance
        4. Updates balance pending_days atomically
        5. Inserts leave request and audit log inside transaction
        """
        working_days = calculate_working_days(data.start_date, data.end_date)
        
        # 1. Check overlap programmatically first
        existing_overlap = LeaveService.check_overlap(db, user.id, data.start_date, data.end_date)
        if existing_overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Overlapping leave request detected: You already have a {existing_overlap.status.value} request (#{existing_overlap.id}) from {existing_overlap.start_date} to {existing_overlap.end_date}."
            )

        try:
            # 2. Acquire row-level lock on balance
            balance_query = db.query(LeaveBalance).filter(
                LeaveBalance.user_id == user.id,
                LeaveBalance.leave_type == data.leave_type,
                LeaveBalance.year == data.start_date.year
            )
            if not is_sqlite:
                balance_query = balance_query.with_for_update()
            
            balance = balance_query.first()
            if not balance:
                # If balance doesn't exist for the year, initialize it
                default_days = 21.0 if data.leave_type == LeaveType.ANNUAL else 10.0 if data.leave_type == LeaveType.SICK else 7.0
                balance = LeaveBalance(
                    user_id=user.id,
                    leave_type=data.leave_type,
                    year=data.start_date.year,
                    total_days=default_days,
                    used_days=0.0,
                    pending_days=0.0
                )
                db.add(balance)
                db.flush()

            # 3. Check remaining balance
            remaining = balance.total_days - (balance.used_days + balance.pending_days)
            if data.leave_type != LeaveType.UNPAID and working_days > remaining:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient leave balance: Requested {working_days} day(s), but only {remaining:.1f} day(s) remain in your {data.leave_type.value} balance."
                )

            # 4. Atomic balance allocation
            balance.pending_days += working_days

            # 5. Create LeaveRequest record
            leave_req = LeaveRequest(
                user_id=user.id,
                leave_type=data.leave_type,
                start_date=data.start_date,
                end_date=data.end_date,
                total_days=working_days,
                reason=data.reason,
                status=LeaveStatus.PENDING
            )
            db.add(leave_req)
            db.flush()

            # 6. Audit Trail
            audit = AuditLog(
                action="LEAVE_REQUESTED",
                entity_type="LEAVE_REQUEST",
                entity_id=leave_req.id,
                actor_id=user.id,
                actor_name=user.full_name,
                details=f"Requested {working_days} day(s) of {data.leave_type.value} from {data.start_date} to {data.end_date}. Reason: {data.reason}"
            )
            db.add(audit)

            db.commit()
            db.refresh(leave_req)
            return leave_req

        except IntegrityError as ie:
            db.rollback()
            # Catches PostgreSQL Exclusion Constraint 'exclude_overlapping_leave_requests'
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Database exclusion constraint violation: Overlapping leave request dates detected for this employee."
            )
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def review_leave_request(db: Session, request_id: int, reviewer: User, review: LeaveReview) -> LeaveRequest:
        """
        Executes atomic review transition:
        - If APPROVED: deducts pending_days, credits used_days, updates status to APPROVED
        - If REJECTED: refunds pending_days back to available balance, updates status to REJECTED
        Enforced inside an atomic transaction with row locking.
        """
        if review.status not in [LeaveStatus.APPROVED, LeaveStatus.REJECTED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review status must be either APPROVED or REJECTED"
            )

        try:
            # 1. Lock leave request row
            req_query = db.query(LeaveRequest).filter(LeaveRequest.id == request_id)
            if not is_sqlite:
                req_query = req_query.with_for_update()
            
            leave_req = req_query.first()
            if not leave_req:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

            if leave_req.status != LeaveStatus.PENDING:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot review request #{request_id}: current status is already {leave_req.status.value}"
                )

            # Verify authorization (Managers can approve their subordinates; HR can approve anyone)
            if reviewer.role == UserRole.MANAGER and leave_req.user.manager_id != reviewer.id and leave_req.user.department != reviewer.department:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Managers can only review requests for employees within their department or direct reporting line."
                )

            # 2. Lock balance row
            bal_query = db.query(LeaveBalance).filter(
                LeaveBalance.user_id == leave_req.user_id,
                LeaveBalance.leave_type == leave_req.leave_type,
                LeaveBalance.year == leave_req.start_date.year
            )
            if not is_sqlite:
                bal_query = bal_query.with_for_update()
            
            balance = bal_query.first()
            if not balance:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated leave balance record not found")

            # 3. Apply state machine transition atomically
            days = leave_req.total_days
            if review.status == LeaveStatus.APPROVED:
                balance.pending_days = max(0.0, balance.pending_days - days)
                balance.used_days += days
                leave_req.status = LeaveStatus.APPROVED
                action_name = "LEAVE_APPROVED"
            else:
                balance.pending_days = max(0.0, balance.pending_days - days)
                leave_req.status = LeaveStatus.REJECTED
                action_name = "LEAVE_REJECTED"

            leave_req.manager_comment = review.manager_comment
            leave_req.reviewed_by = reviewer.id
            leave_req.reviewed_at = datetime.now(timezone.utc)

            # 4. Record audit log
            audit = AuditLog(
                action=action_name,
                entity_type="LEAVE_REQUEST",
                entity_id=leave_req.id,
                actor_id=reviewer.id,
                actor_name=reviewer.full_name,
                details=f"Reviewer {reviewer.full_name} ({reviewer.role.value}) marked request as {review.status.value}. Comment: {review.manager_comment or 'No comment provided'}"
            )
            db.add(audit)

            db.commit()
            db.refresh(leave_req)
            return leave_req

        except Exception:
            db.rollback()
            raise

    @staticmethod
    def cancel_leave_request(db: Session, request_id: int, user: User) -> LeaveRequest:
        """
        Allows an employee to cancel their pending leave request and immediately refund pending days.
        """
        try:
            req_query = db.query(LeaveRequest).filter(LeaveRequest.id == request_id)
            if not is_sqlite:
                req_query = req_query.with_for_update()
            leave_req = req_query.first()

            if not leave_req:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

            if leave_req.user_id != user.id and user.role != UserRole.HR_ADMIN:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own leave requests")

            if leave_req.status != LeaveStatus.PENDING:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Only PENDING requests can be cancelled directly. Current status is {leave_req.status.value}"
                )

            # Refund pending balance
            bal_query = db.query(LeaveBalance).filter(
                LeaveBalance.user_id == leave_req.user_id,
                LeaveBalance.leave_type == leave_req.leave_type,
                LeaveBalance.year == leave_req.start_date.year
            )
            if not is_sqlite:
                bal_query = bal_query.with_for_update()
            balance = bal_query.first()

            if balance:
                balance.pending_days = max(0.0, balance.pending_days - leave_req.total_days)

            leave_req.status = LeaveStatus.CANCELLED
            
            audit = AuditLog(
                action="LEAVE_CANCELLED",
                entity_type="LEAVE_REQUEST",
                entity_id=leave_req.id,
                actor_id=user.id,
                actor_name=user.full_name,
                details=f"Leave request #{leave_req.id} cancelled by {user.full_name}. Pending {leave_req.total_days} days released back to balance."
            )
            db.add(audit)

            db.commit()
            db.refresh(leave_req)
            return leave_req

        except Exception:
            db.rollback()
            raise
