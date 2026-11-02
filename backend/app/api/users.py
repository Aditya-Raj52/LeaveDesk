from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import require_employee, require_hr_admin
from app.models.user import User, UserRole
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """Returns organizational directory of users."""
    return db.query(User).order_by(User.full_name.asc()).all()

@router.get("/team", response_model=List[UserResponse])
def get_team_members(
    current_user: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """Returns users in the same department or direct reports."""
    if current_user.role == UserRole.MANAGER:
        return db.query(User).filter(
            (User.manager_id == current_user.id) | (User.department == current_user.department)
        ).all()
    else:
        return db.query(User).filter(User.department == current_user.department).all()
