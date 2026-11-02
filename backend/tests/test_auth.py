def test_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "employee@test.com", "password": "TestPass123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "employee@test.com"
    assert data["user"]["role"] == "EMPLOYEE"

def test_login_invalid_password(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "employee@test.com", "password": "WrongPassword!"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_get_me_authenticated(client, employee_token):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {employee_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "employee@test.com"

def test_get_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 403 or response.status_code == 401
