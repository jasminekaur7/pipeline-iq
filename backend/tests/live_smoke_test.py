import urllib.request
import json
import ssl

ctx = ssl.create_default_context()

BASE_URL = "https://pipeline-iq-production-903c.up.railway.app"

tests = [
    ("Health check", "/health", "GET", None),
    ("Root frontend HTML", "/", "GET", None),
    ("Dashboard API", "/api/dashboard", "GET", None),
    ("Accounts list API", "/api/accounts", "GET", None),
    ("ACME Account Detail API", "/api/accounts/acc-acme", "GET", None),
    ("ACME Graph API", "/api/accounts/acc-acme/graph", "GET", None),
    ("Action Center API", "/api/actions/center", "GET", None),
    ("Decision Debt API", "/api/decision-debt", "GET", None),
    ("Decision Contracts API", "/api/decision-contracts", "GET", None),
    ("Self-Audit API", "/api/self-audit", "GET", None),
    ("AI Copilot Query API", "/api/ai/query", "POST", {"query": "What is the decision debt for ACME Corp?", "account_id": "acc-acme"}),
]

print(f"Testing live production deployment at: {BASE_URL}\n" + "="*60, flush=True)
all_passed = True

for name, endpoint, method, payload in tests:
    url = f"{BASE_URL}{endpoint}"
    try:
        req = urllib.request.Request(url, method=method)
        req.add_header("User-Agent", "PipelineIQ-SmokeTest/1.0")
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            req.add_header("Content-Type", "application/json")
        else:
            data = None

        with urllib.request.urlopen(req, data=data, timeout=8, context=ctx) as resp:
            status = resp.status
            content = resp.read().decode("utf-8", errors="replace")
            content_preview = content[:70].replace("\n", " ")
            print(f"[{status}] {name} ({endpoint}) -> OK ({len(content)} bytes) | {content_preview}", flush=True)
    except Exception as e:
        print(f"[FAIL] {name} ({endpoint}) -> Error: {e}", flush=True)
        all_passed = False

print("="*60, flush=True)
if all_passed:
    print("ALL PRODUCTION SMOKE TESTS PASSED SUCCESSFULLY!", flush=True)
else:
    print("SOME SMOKE TESTS FAILED!", flush=True)
