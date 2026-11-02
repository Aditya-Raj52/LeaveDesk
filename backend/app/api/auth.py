from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.rbac import get_current_user
from app.models.user import User, UserRole
from app.models.leave import LeaveBalance, LeaveType
from app.schemas.auth import UserLogin, TokenResponse, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(
        subject=user.id,
        extra_claims={
            "email": user.email,
            "role": user.role.value,
            "name": user.full_name
        }
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        department=user_in.department,
        manager_id=user_in.manager_id,
        avatar_url=user_in.avatar_url or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250"
    )
    db.add(new_user)
    db.flush()

    # Automatically initialize 2026 default balances
    balances = [
        LeaveBalance(user_id=new_user.id, leave_type=LeaveType.ANNUAL, year=2026, total_days=21.0),
        LeaveBalance(user_id=new_user.id, leave_type=LeaveType.SICK, year=2026, total_days=10.0),
        LeaveBalance(user_id=new_user.id, leave_type=LeaveType.CASUAL, year=2026, total_days=7.0),
        LeaveBalance(user_id=new_user.id, leave_type=LeaveType.PARENTAL, year=2026, total_days=15.0),
    ]
    db.add_all(balances)
    db.commit()
    db.refresh(new_user)
    return new_user
