import io
from fastapi.testclient import TestClient

def test_security_headers_present(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("Content-Security-Policy") == "default-src 'self'"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_cors_allowed_vs_disallowed_origin(client: TestClient) -> None:
    # Allowed origin
    res_allowed = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res_allowed.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"

    # Disallowed origin
    res_disallowed = client.options(
        "/health",
        headers={
            "Origin": "https://malicious-site.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res_disallowed.headers.get("Access-Control-Allow-Origin") is None


def test_pdf_upload_guard_magic_bytes(client: TestClient) -> None:
    # Admin login or auth mock check
    fake_pdf = io.BytesIO(b"NOT_A_PDF_CONTENT")
    response = client.post(
        "/api/v1/orders/parse-pdf",
        data={"customer_id": "00000000-0000-0000-0000-000000000000"},
        files={"file": ("test.txt", fake_pdf, "application/text")},
    )
    # Should reject due to unauthenticated OR invalid PDF format
    assert response.status_code in (400, 401)
