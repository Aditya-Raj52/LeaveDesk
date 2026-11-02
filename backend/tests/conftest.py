import os
import pytest
from datetime import date, datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.models.leave import LeaveBalance, LeaveType, LeaveRequest, LeaveStatus
from main import app

# Test database engine
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Create test users
    pw = get_password_hash("TestPass123!")
    
    mgr = User(
        email="manager@test.com",
        full_name="Manager Bob",
        hashed_password=pw,
        role=UserRole.MANAGER,
        department="Engineering"
    )
    session.add(mgr)
    session.flush()

    emp = User(
        email="employee@test.com",
        full_name="Employee Alice",
        hashed_password=pw,
        role=UserRole.EMPLOYEE,
        department="Engineering",
        manager_id=mgr.id
    )
    hr = User(
        email="hr@test.com",
        full_name="HR Carol",
        hashed_password=pw,
        role=UserRole.HR_ADMIN,
        department="Human Resources"
    )
    session.add_all([emp, hr])
    session.flush()

    # Balances for Employee Alice
    session.add_all([
        LeaveBalance(user_id=emp.id, leave_type=LeaveType.ANNUAL, year=2026, total_days=21.0, used_days=0.0, pending_days=0.0),
        LeaveBalance(user_id=emp.id, leave_type=LeaveType.SICK, year=2026, total_days=10.0, used_days=0.0, pending_days=0.0),
        LeaveBalance(user_id=emp.id, leave_type=LeaveType.CASUAL, year=2026, total_days=7.0, used_days=0.0, pending_days=0.0),
    ])
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def employee_token(db_session):
    emp = db_session.query(User).filter(User.email == "employee@test.com").first()
    return create_access_token(subject=emp.id, extra_claims={"role": emp.role.value})

@pytest.fixture
def manager_token(db_session):
    mgr = db_session.query(User).filter(User.email == "manager@test.com").first()
    return create_access_token(subject=mgr.id, extra_claims={"role": mgr.role.value})

@pytest.fixture
def hr_token(db_session):
    hr = db_session.query(User).filter(User.email == "hr@test.com").first()
    return create_access_token(subject=hr.id, extra_claims={"role": hr.role.value})
