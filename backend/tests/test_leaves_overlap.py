from datetime import date, timedelta

def test_prevent_overlapping_leave_requests(client, employee_token):
    headers = {"Authorization": f"Bearer {employee_token}"}
    today = date.today()
    
    # 1. First leave request: from day 10 to day 15
    start1 = (today + timedelta(days=10)).isoformat()
    end1 = (today + timedelta(days=15)).isoformat()
    
    res1 = client.post(
        "/api/leaves",
        headers=headers,
        json={
            "leave_type": "ANNUAL",
            "start_date": start1,
            "end_date": end1,
            "reason": "First vacation trip"
        }
    )
    assert res1.status_code == 200, res1.text
    first_req = res1.json()
    assert first_req["status"] == "PENDING"

    # 2. Attempt overlapping request (day 12 to day 18) - should be blocked with 409 Conflict!
    start2 = (today + timedelta(days=12)).isoformat()
    end2 = (today + timedelta(days=18)).isoformat()
    
    res2 = client.post(
        "/api/leaves",
        headers=headers,
        json={
            "leave_type": "ANNUAL",
            "start_date": start2,
            "end_date": end2,
            "reason": "Overlapping conference trip"
        }
    )
    assert res2.status_code == 409, "Expected 409 Conflict on overlapping leave request"
    assert "Overlapping leave request" in res2.json()["detail"]

    # 3. Attempt subset overlapping request (day 11 to day 13) - should also be blocked with 409 Conflict!
    start3 = (today + timedelta(days=11)).isoformat()
    end3 = (today + timedelta(days=13)).isoformat()
    
    res3 = client.post(
        "/api/leaves",
        headers=headers,
        json={
            "leave_type": "SICK",
            "start_date": start3,
            "end_date": end3,
            "reason": "Doctor appointment inside existing leave window"
        }
    )
    assert res3.status_code == 409

    # 4. Non-overlapping request (day 25 to day 28) - should succeed!
    start4 = (today + timedelta(days=25)).isoformat()
    end4 = (today + timedelta(days=28)).isoformat()
    
    res4 = client.post(
        "/api/leaves",
        headers=headers,
        json={
            "leave_type": "ANNUAL",
            "start_date": start4,
            "end_date": end4,
            "reason": "Non-overlapping trip later in month"
        }
    )
    assert res4.status_code == 200
    assert res4.json()["status"] == "PENDING"
