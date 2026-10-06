import requests
import time

def run():
    print("Testing live endpoints...")
    base_url = "http://127.0.0.1:8000/api/v1"
    
    # 1. Signup
    print("Testing signup...")
    res = requests.post(f"{base_url}/auth/signup", json={
        "email": "live_test@example.com",
        "password": "password123",
        "full_name": "Live Test User"
    })
    if res.status_code == 400 and "already registered" in res.text:
        print("User exists, proceeding to login...")
    else:
        print("Signup:", res.status_code, res.text)
        
    # 2. Login
    print("\nTesting login...")
    res = requests.post(f"{base_url}/auth/login", json={
        "email": "live_test@example.com",
        "password": "password123"
    })
    print("Login:", res.status_code, res.text)
    if res.status_code != 200:
        return
        
    token = res.json()["access_token"]
    print("Got Token:", token)
    
    # 3. Balance (Protected)
    print("\nTesting protected route /credits/balance...")
    res = requests.get(f"{base_url}/credits/balance", headers={
        "Authorization": f"Bearer {token}"
    })
    print("Balance:", res.status_code, res.text)
    
    # 4. Unauthorized Access
    print("\nTesting unauthorized route /credits/balance...")
    res = requests.get(f"{base_url}/credits/balance")
    print("Unauthorized Balance:", res.status_code, res.text)

if __name__ == "__main__":
    run()
