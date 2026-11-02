def test_policy_rag_sick_leave_medical_note(client, employee_token):
    headers = {"Authorization": f"Bearer {employee_token}"}
    response = client.post(
        "/api/policy/query",
        headers=headers,
        json={"question": "Do I need a doctor's note for 2 days of sick leave?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "citations" in data
    assert len(data["citations"]) > 0
    
    # Verify Clause 3.2 is cited
    clause_ids = [c["clause_id"] for c in data["citations"]]
    assert any("Clause 3.2" in cid or "Clause 3.1" in cid for cid in clause_ids)
    assert data["confidence"] > 0.6
    assert len(data["key_takeaways"]) > 0

def test_policy_rag_carryover_query(client, employee_token):
    headers = {"Authorization": f"Bearer {employee_token}"}
    response = client.post(
        "/api/policy/query",
        headers=headers,
        json={"question": "How many annual leaves can I carry forward to next year?"}
    )
    assert response.status_code == 200
    data = response.json()
    clause_ids = [c["clause_id"] for c in data["citations"]]
    assert any("Clause 2.3" in cid or "Clause 2.1" in cid for cid in clause_ids)
    assert "5" in data["answer"] or "five" in data["answer"].lower()

def test_suggested_prompts(client, employee_token):
    headers = {"Authorization": f"Bearer {employee_token}"}
    response = client.get("/api/policy/suggested", headers=headers)
    assert response.status_code == 200
    prompts = response.json()
    assert len(prompts) >= 4
