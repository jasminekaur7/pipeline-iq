import urllib.request
import json
import datetime

base = "http://127.0.0.1:8000"

def post_json(path, data):
    req = urllib.request.Request(
        base + path,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode("utf-8"))

def get_json(path):
    with urllib.request.urlopen(base + path) as r:
        return json.loads(r.read().decode("utf-8"))

print("--- Testing Decision Contract & Action Center Lifecycle ---")

# 1. Create a Decision Contract
deadline = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=4)).isoformat()
created = post_json("/api/decision-contracts", {
    "account_id": "acc-acme",
    "action": "Executive Security Alignment Review",
    "owner": "Sarah Chen",
    "deadline": deadline,
    "escalation_rule": "Escalate to VP Sales if unconfirmed in 4 days",
    "escalation_target": "VP Sales",
    "expected_impact": "Protect $250k ACME expansion",
    "reason": "Security review stalled 14 days"
})
contract_id = created["id"]
print(f"[OK] Contract Created: {contract_id} (Status: {created['status']})")
assert created["status"] == "PENDING"
assert created["escalation_target"] == "VP Sales"

# 2. Snooze the Decision Contract (+3 days)
snoozed = post_json(f"/api/decision-contracts/{contract_id}/snooze", {"days": 3})
print(f"[OK] Contract Snoozed: {snoozed['status']} (Deadline extended)")
assert snoozed["status"] == "SNOOZED"

# 3. Escalate the Decision Contract
escalated = post_json(f"/api/decision-contracts/{contract_id}/escalate", {"reason": "Executive unavailable on scheduled check-in"})
print(f"[OK] Contract Escalated: {escalated['status']}")
assert escalated["status"] == "ESCALATED"

# 4. Complete the Decision Contract
completed = post_json(f"/api/decision-contracts/{contract_id}/complete", {"notes": "Security review terms signed by CIO David Sterling"})
print(f"[OK] Contract Completed: {completed['status']} (Debt reduced)")
assert completed["status"] == "COMPLETED"

# 5. Check Action Center queue
action_items = get_json("/api/actions/center")
assert len(action_items) > 0
print(f"[OK] Action Center verified with {len(action_items)} priority action items")

# 6. Verify Self-Audit prediction recording
audit = get_json("/api/self-audit")
assert audit["total_predictions"] > 0
if audit["recent_audits"]:
    pred_id = audit["recent_audits"][0]["id"]
    outcome_res = post_json(f"/api/predictions/{pred_id}/outcome", {
        "actual_outcome": "PREVENTED",
        "verification_source": "Automated Lifecycle Test",
        "notes": "Verified churn prevented after contract execution"
    })
    print(f"[OK] Self-Audit Outcome Recorded for {pred_id}: match={outcome_res.get('actual_outcome_match')}")

# 7. Ask Pipeline IQ Copilot
copilot_res = post_json("/api/ai/query", {"query": "Why did ACME score increase?"})
print(f"[OK] Copilot Query: intent={copilot_res['intent']}, cited={len(copilot_res['cited_accounts'])} account(s)")
assert copilot_res["intent"] == "SCORE_INCREASE_EXPLANATION"

print("\n--- ALL LIFECYCLE TESTS COMPLETED SUCCESSFULLY! ---")
