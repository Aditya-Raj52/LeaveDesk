from datetime import date, timedelta

def test_employee_cannot_review_requests(client, employee_token):
    headers = {"Authorization": f"Bearer {employee_token}"}
    today = date.today()

    # Employee submits request
    req_res = client.post(
        "/api/leaves",
        headers=headers,
        json={
            "leave_type": "CASUAL",
            "start_date": (today + timedelta(days=8)).isoformat(),
            "end_date": (today + timedelta(days=9)).isoformat(),
            "reason": "Family gathering"
        }
    )
    assert req_res.status_code == 200
    req_id = req_res.json()["id"]

    # Employee attempts to approve their own request -> 403 Forbidden
    hack_res = client.post(
        f"/api/leaves/{req_id}/review",
        headers=headers,
        json={"status": "APPROVED"}
    )
    assert hack_res.status_code == 403

def test_only_hr_can_adjust_balance(client, employee_token, manager_token, hr_token):
    emp_headers = {"Authorization": f"Bearer {employee_token}"}
    mgr_headers = {"Authorization": f"Bearer {manager_token}"}
    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    payload = {
        "user_id": 2,
        "leave_type": "ANNUAL",
        "total_days": 25.0,
        "reason": "Loyalty tenure bonus"
    }

    # Employee cannot adjust
    assert client.post("/api/leaves/balance-adjust", headers=emp_headers, json=payload).status_code == 403

    # Manager cannot adjust company entitlement balances
    assert client.post("/api/leaves/balance-adjust", headers=mgr_headers, json=payload).status_code == 403

    # HR Admin can adjust
    hr_res = client.post("/api/leaves/balance-adjust", headers=hr_headers, json=payload)
    assert hr_res.status_code == 200
    assert hr_res.json()["total_days"] == 25.0
