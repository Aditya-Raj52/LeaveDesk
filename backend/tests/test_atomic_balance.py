from datetime import date, timedelta

def test_atomic_balance_deduction_and_approval(client, employee_token, manager_token):
    emp_headers = {"Authorization": f"Bearer {employee_token}"}
    mgr_headers = {"Authorization": f"Bearer {manager_token}"}
    today = date.today()

    # 1. Fetch initial balances
    bal_res0 = client.get("/api/leaves/balances", headers=emp_headers)
    assert bal_res0.status_code == 200
    annual_bal0 = next(b for b in bal_res0.json() if b["leave_type"] == "ANNUAL")
    assert annual_bal0["total_days"] == 21.0
    assert annual_bal0["used_days"] == 0.0
    assert annual_bal0["pending_days"] == 0.0
    assert annual_bal0["remaining_days"] == 21.0

    # 2. Submit a 3-day leave request
    start = (today + timedelta(days=5)).isoformat()
    end = (today + timedelta(days=7)).isoformat()
    req_res = client.post(
        "/api/leaves",
        headers=emp_headers,
        json={
            "leave_type": "ANNUAL",
            "start_date": start,
            "end_date": end,
            "reason": "Personal rest days"
        }
    )
    assert req_res.status_code == 200
    req_data = req_res.json()
    req_id = req_data["id"]
    days = req_data["total_days"]

    # 3. Verify balance has allocated pending_days
    bal_res1 = client.get("/api/leaves/balances", headers=emp_headers)
    annual_bal1 = next(b for b in bal_res1.json() if b["leave_type"] == "ANNUAL")
    assert annual_bal1["pending_days"] == days
    assert annual_bal1["used_days"] == 0.0
    assert annual_bal1["remaining_days"] == 21.0 - days

    # 4. Manager reviews and approves request
    review_res = client.post(
        f"/api/leaves/{req_id}/review",
        headers=mgr_headers,
        json={
            "status": "APPROVED",
            "manager_comment": "Approved by manager Bob."
        }
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "APPROVED"

    # 5. Verify pending_days converted atomically to used_days
    bal_res2 = client.get("/api/leaves/balances", headers=emp_headers)
    annual_bal2 = next(b for b in bal_res2.json() if b["leave_type"] == "ANNUAL")
    assert annual_bal2["pending_days"] == 0.0
    assert annual_bal2["used_days"] == days
    assert annual_bal2["remaining_days"] == 21.0 - days

def test_atomic_balance_refund_on_rejection(client, employee_token, manager_token):
    emp_headers = {"Authorization": f"Bearer {employee_token}"}
    mgr_headers = {"Authorization": f"Bearer {manager_token}"}
    today = date.today()

    start = (today + timedelta(days=30)).isoformat()
    end = (today + timedelta(days=32)).isoformat()
    req_res = client.post(
        "/api/leaves",
        headers=emp_headers,
        json={
            "leave_type": "ANNUAL",
            "start_date": start,
            "end_date": end,
            "reason": "Conference attendance"
        }
    )
    assert req_res.status_code == 200
    req_id = req_res.json()["id"]

    # Reject request
    review_res = client.post(
        f"/api/leaves/{req_id}/review",
        headers=mgr_headers,
        json={
            "status": "REJECTED",
            "manager_comment": "Critical sprint deadline, please reschedule."
        }
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "REJECTED"

    # Verify pending days refunded
    bal_res = client.get("/api/leaves/balances", headers=emp_headers)
    annual_bal = next(b for b in bal_res.json() if b["leave_type"] == "ANNUAL")
    assert annual_bal["pending_days"] == 0.0

def test_insufficient_balance_rejection(client, employee_token):
    emp_headers = {"Authorization": f"Bearer {employee_token}"}
    today = date.today()

    # Request 40 days (exceeds 21 days annual balance)
    start = (today + timedelta(days=10)).isoformat()
    end = (today + timedelta(days=65)).isoformat()
    req_res = client.post(
        "/api/leaves",
        headers=emp_headers,
        json={
            "leave_type": "ANNUAL",
            "start_date": start,
            "end_date": end,
            "reason": "Extended trip"
        }
    )
    assert req_res.status_code == 400
    assert "Insufficient leave balance" in req_res.json()["detail"]
