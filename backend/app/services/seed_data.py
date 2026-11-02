from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, init_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.leave import LeaveBalance, LeaveRequest, LeaveType, LeaveStatus, AuditLog

def seed_database(db: Session):
    # Check if already seeded
    existing_user = db.query(User).filter(User.email == "sarah.chen@leavedesk.internal").first()
    if existing_user:
        print("Database already contains seed data.")
        return

    print("Seeding initial LeaveDesk users, balances, and sample requests...")

    default_pw = get_password_hash("Password123!")

    # 1. Create Manager
    manager = User(
        email="marcus.brody@leavedesk.internal",
        full_name="Marcus Brody",
        hashed_password=default_pw,
        role=UserRole.MANAGER,
        department="Engineering",
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
    )
    db.add(manager)
    db.flush()

    # 2. Create HR Admin
    hr_admin = User(
        email="elena.rostova@leavedesk.internal",
        full_name="Elena Rostova",
        hashed_password=default_pw,
        role=UserRole.HR_ADMIN,
        department="Human Resources",
        avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250"
    )
    db.add(hr_admin)
    db.flush()

    # 3. Create Employees
    employee1 = User(
        email="sarah.chen@leavedesk.internal",
        full_name="Sarah Chen",
        hashed_password=default_pw,
        role=UserRole.EMPLOYEE,
        department="Engineering",
        manager_id=manager.id,
        avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250"
    )
    
    employee2 = User(
        email="alex.rivera@leavedesk.internal",
        full_name="Alex Rivera",
        hashed_password=default_pw,
        role=UserRole.EMPLOYEE,
        department="Engineering",
        manager_id=manager.id,
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250"
    )

    employee3 = User(
        email="priya.patel@leavedesk.internal",
        full_name="Priya Patel",
        hashed_password=default_pw,
        role=UserRole.EMPLOYEE,
        department="Engineering",
        manager_id=manager.id,
        avatar_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250"
    )

    db.add_all([employee1, employee2, employee3])
    db.flush()

    all_users = [manager, hr_admin, employee1, employee2, employee3]

    # Seed Balances for each user
    for u in all_users:
        balances = [
            LeaveBalance(user_id=u.id, leave_type=LeaveType.ANNUAL, year=2026, total_days=21.0, used_days=0.0, pending_days=0.0),
            LeaveBalance(user_id=u.id, leave_type=LeaveType.SICK, year=2026, total_days=10.0, used_days=0.0, pending_days=0.0),
            LeaveBalance(user_id=u.id, leave_type=LeaveType.CASUAL, year=2026, total_days=7.0, used_days=0.0, pending_days=0.0),
            LeaveBalance(user_id=u.id, leave_type=LeaveType.PARENTAL, year=2026, total_days=15.0, used_days=0.0, pending_days=0.0),
        ]
        db.add_all(balances)

    db.flush()

    # Create realistic sample requests
    today = date.today()
    
    # Sarah Chen: 1 Approved Annual Leave (last month), 1 Pending Annual Leave (next month)
    sarah_bal_annual = db.query(LeaveBalance).filter(LeaveBalance.user_id == employee1.id, LeaveBalance.leave_type == LeaveType.ANNUAL).first()
    
    past_start = today - timedelta(days=20)
    past_end = today - timedelta(days=16)
    req_past = LeaveRequest(
        user_id=employee1.id,
        leave_type=LeaveType.ANNUAL,
        start_date=past_start,
        end_date=past_end,
        total_days=5.0,
        reason="Family vacation to Yosemite National Park",
        status=LeaveStatus.APPROVED,
        manager_comment="Approved. Have a great time!",
        reviewed_by=manager.id,
        reviewed_at=datetime.now(timezone.utc) - timedelta(days=22)
    )
    sarah_bal_annual.used_days += 5.0
    
    future_start = today + timedelta(days=14)
    future_end = today + timedelta(days=17)
    req_pending = LeaveRequest(
        user_id=employee1.id,
        leave_type=LeaveType.ANNUAL,
        start_date=future_start,
        end_date=future_end,
        total_days=4.0,
        reason="Attending sibling's wedding and family gathering",
        status=LeaveStatus.PENDING
    )
    sarah_bal_annual.pending_days += 4.0

    # Alex Rivera: Upcoming Approved Sick Leave
    alex_bal_sick = db.query(LeaveBalance).filter(LeaveBalance.user_id == employee2.id, LeaveBalance.leave_type == LeaveType.SICK).first()
    alex_req = LeaveRequest(
        user_id=employee2.id,
        leave_type=LeaveType.SICK,
        start_date=today + timedelta(days=2),
        end_date=today + timedelta(days=3),
        total_days=2.0,
        reason="Scheduled wisdom tooth dental extraction",
        status=LeaveStatus.APPROVED,
        manager_comment="Get well soon Alex. Take care.",
        reviewed_by=manager.id,
        reviewed_at=datetime.now(timezone.utc) - timedelta(days=1)
    )
    alex_bal_sick.used_days += 2.0

    # Priya Patel: Pending Casual Leave awaiting Marcus's review
    priya_bal_casual = db.query(LeaveBalance).filter(LeaveBalance.user_id == employee3.id, LeaveBalance.leave_type == LeaveType.CASUAL).first()
    priya_req = LeaveRequest(
        user_id=employee3.id,
        leave_type=LeaveType.CASUAL,
        start_date=today + timedelta(days=5),
        end_date=today + timedelta(days=6),
        total_days=2.0,
        reason="Apartment lease signing and relocation",
        status=LeaveStatus.PENDING
    )
    priya_bal_casual.pending_days += 2.0

    db.add_all([req_past, req_pending, alex_req, priya_req])
    
    # Initial Audit Trail
    audit1 = AuditLog(
        action="SEED_DATA_INITIALIZATION",
        entity_type="SYSTEM",
        entity_id=1,
        actor_id=hr_admin.id,
        actor_name="Elena Rostova",
        details="System seed initialized with standard 2026 Leave policies, test personas, and sample balances."
    )
    db.add(audit1)
    
    db.commit()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    init_db()
    with SessionLocal() as session:
        seed_database(session)
