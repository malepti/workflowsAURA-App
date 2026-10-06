from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("Testing signup...")
    res = client.post("/api/v1/auth/signup", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    })
    
    if res.status_code == 400 and "already registered" in res.text:
        print("User already exists, continuing to login...")
    else:
        assert res.status_code == 200, f"Signup failed: {res.text}"
        print("Signup successful:", res.json())
        
    print("\nTesting login...")
    res = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    print("Login successful, got token:", token)
    
    print("\nTesting protected endpoint (balance)...")
    res = client.get("/api/v1/credits/balance", headers={
        "Authorization": f"Bearer {token}"
    })
    assert res.status_code == 200, f"Balance failed: {res.text}"
    print("Balance retrieved successfully:", res.json())
    
    print("\nTesting unauthorized access...")
    res = client.get("/api/v1/credits/balance")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("Unauthorized access correctly blocked.")
    
    print("\nALL TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
