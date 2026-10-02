import urllib.request
import json
import sys

base = "http://127.0.0.1:8000"

def test(name, url, is_json=True):
    try:
        with urllib.request.urlopen(base + url) as r:
            body = r.read().decode("utf-8")
            if is_json:
                data = json.loads(body)
                print(f"[OK] {r.status} {name}: {url} -> {type(data).__name__}")
                return data
            else:
                print(f"[OK] {r.status} {name}: {url} (Length: {len(body)} bytes)")
                return body
    except Exception as e:
        print(f"[FAIL] {name}: {url} -> {e}")
        sys.exit(1)

print("--- Testing Unified Production Server ---")
health = test("Health Check", "/health", is_json=True)
assert health["status"] == "ok", f"Expected status 'ok', got {health['status']}"

root_html = test("Root SPA Index", "/", is_json=False)
assert '<div id="root">' in root_html or "<div id='root'>" in root_html or "root" in root_html

accounts_html = test("SPA Fallback /accounts", "/accounts", is_json=False)
assert "html" in accounts_html.lower()

dash = test("API Dashboard", "/api/dashboard", is_json=True)
assert dash["total_decision_debt"] > 0

accs = test("API Accounts", "/api/accounts", is_json=True)
assert len(accs) >= 50

acme = test("API ACME Hero", "/api/accounts/acc-acme", is_json=True)
assert acme["account"]["company_name"] == "ACME Technologies"

graph = test("API Graph Ripple", "/api/accounts/acc-acme/graph", is_json=True)
assert len(graph["nodes"]) >= 5

actions = test("API Action Center", "/api/actions/center", is_json=True)
assert len(actions) > 0

contracts = test("API Decision Contracts", "/api/decision-contracts", is_json=True)
assert len(contracts) > 0

audit = test("API Self-Audit", "/api/self-audit", is_json=True)
assert audit["overall_accuracy_rate"] > 0

print("\n--- ALL PRODUCTION VERIFICATION CHECKS PASSED! ---")
