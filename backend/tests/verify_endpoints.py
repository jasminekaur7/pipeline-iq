import urllib.request
import json

def test_ep(name, path, method='GET', data=None):
    url = f'http://127.0.0.1:8000{path}'
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        req.data = json.dumps(data).encode('utf-8')
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] {name} ({resp.status}): OK")
        return res

if __name__ == '__main__':
    dash = test_ep('Dashboard', '/api/dashboard')
    print(f"  Total Debt: {dash['total_decision_debt']} pts | Rev at risk: ${dash['total_revenue_at_risk']:,.0f}")

    acme = test_ep('ACME Detail', '/api/accounts/acc-acme')
    print(f"  ACME Debt: {acme['decision_debt']['score']}/100 | Risk: {acme['risk_analysis']['overall_risk_score']}% | Rev: ${acme['risk_analysis']['revenue_at_risk']:,.0f}")

    graph = test_ep('ACME Graph', '/api/accounts/acc-acme/graph')
    print(f"  Nodes: {len(graph['nodes'])}, Edges: {len(graph['edges'])}\n  Ripple: {graph['ripple_summary'].replace('\u2192', '->')}")

    debt = test_ep('Decision Debt', '/api/decision-debt')
    print(f"  Total Debt Accounts: {len(debt['accounts'])}, Owners: {len(debt['debt_by_owner'])}")

    actions = test_ep('Action Center', '/api/actions/center')
    print(f"  Urgent Action Items: {len(actions)}, Top: {actions[0]['title']}")

    contracts = test_ep('Decision Contracts', '/api/decision-contracts')
    print(f"  Contracts Count: {len(contracts)}")

    audit = test_ep('Self-Audit', '/api/self-audit')
    print(f"  Accuracy: {audit['overall_accuracy_rate']}% | Brier Score: {audit['brier_score']} | Verified: {audit['verified_predictions']}")

    copilot = test_ep('AI Copilot Query', '/api/ai/query', method='POST', data={'query': 'Why is ACME high risk?'})
    print(f"  Copilot Intent: {copilot['intent']}")
    print(f"  Cited Accounts: {[a['name'] for a in copilot['cited_accounts']]}")
    print("ALL API ENDPOINTS VALIDATED SUCCESSFULLY!")
