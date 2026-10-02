import urllib.request
import json

base = "http://127.0.0.1:8000"
endpoints = [
    "/health",
    "/api/health",
    "/api/dashboard",
    "/api/accounts",
    "/api/accounts/acc-acme",
    "/api/accounts/acc-acme/graph",
    "/api/accounts/acc-acme/decision-debt",
    "/api/accounts/acc-acme/timeline",
    "/api/accounts/acc-acme/audit-events",
    "/api/decisions",
    "/api/decisions/dec-acme-1",
    "/api/decisions/dec-acme-1/ripple",
    "/api/decision-contracts",
    "/api/actions/center",
    "/api/self-audit",
]

all_pass = True
for ep in endpoints:
    url = base + ep
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            count = len(data) if isinstance(data, (dict, list)) else 1
            print(f"[OK] {resp.status} GET {ep} -> {count} items")
    except Exception as e:
        print(f"[FAIL] GET {ep} -> {e}")
        all_pass = False

# POST /api/ask
try:
    ask_req = urllib.request.Request(
        base + "/api/ask",
        data=json.dumps({"query": "Why is ACME high risk?"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(ask_req) as resp:
        data = json.loads(resp.read().decode())
        print(f"[OK] {resp.status} POST /api/ask -> intent: {data.get('intent')}")
except Exception as e:
    print(f"[FAIL] POST /api/ask -> {e}")
    all_pass = False

print(f"\nAPI Verification Result: {'ALL PASS' if all_pass else 'SOME FAILED'}")
