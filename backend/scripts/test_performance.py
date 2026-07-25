import asyncio
import time
import httpx
from typing import List

BASE_URL = "http://127.0.0.1:8000"
API_PREFIX = "/api/v1"

async def test_endpoint_performance(client: httpx.AsyncClient, endpoint: str, requests: int = 100):
    start_time = time.time()
    
    tasks = []
    for _ in range(requests):
        tasks.append(client.get(f"{BASE_URL}{API_PREFIX}{endpoint}"))
        
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    
    end_time = time.time()
    duration = end_time - start_time
    
    success_count = sum(1 for r in responses if isinstance(r, httpx.Response) and r.status_code == 200)
    error_count = requests - success_count
    
    print(f"Endpoint: {endpoint}")
    print(f"Total Requests: {requests}")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Requests/sec: {requests/duration:.2f}")
    print(f"Success: {success_count}, Errors: {error_count}")
    print("-" * 40)

async def main():
    print("Starting Performance Tests...")
    async with httpx.AsyncClient() as client:
        # We test healthcheck or unauthenticated endpoints first to gauge raw speed
        # In a real scenario, you'd generate tokens for authenticated endpoints
        
        # Test basic root endpoint
        start = time.time()
        for _ in range(100):
            await client.get(f"{BASE_URL}/")
        duration = time.time() - start
        print(f"Root endpoint (100 requests): {duration:.2f} seconds")
        print("-" * 40)
        
        # In a real performance test, we would hit /invoices or /orders with auth

if __name__ == "__main__":
    asyncio.run(main())
