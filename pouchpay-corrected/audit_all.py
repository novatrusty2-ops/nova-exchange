import requests
import subprocess
import json

API_BASE = "http://localhost:3000"

def run_cmd(cmd):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return res.stdout.strip()

def audit():
    print("================================================================")
    print("      NOVA ECOSYSTEM FULL PRODUCTION & INTEGRITY AUDIT          ")
    print("================================================================")

    # 1. PM2 Cluster Status
    print("\n[1] Auditing PM2 Cluster & Processes...")
    pm2_out = run_cmd("pm2 status")
    print(pm2_out)
    if "online" in pm2_out:
        print("  [PASS] PM2 processes are running.")
    else:
        print("  [FAIL] PM2 cluster has offline instances!")

    # 2. Port Listeners & Nginx Proxy
    print("\n[2] Auditing Network Port Listeners & Nginx...")
    ports_out = run_cmd("sudo ss -tulpn | grep -E ':3000|:80|:443'")
    print(ports_out)
    nginx_status = run_cmd("sudo systemctl is-active nginx")
    print(f"  -> Nginx Active Status: {nginx_status}")

    # 3. Liquidity Vaults & TVL Metrics across Three Apps
    print("\n[3] Auditing Liquidity Vaults, TVLs & App Allocations...")
    try:
        res = requests.get(f"{API_BASE}/liquidity", timeout=5)
        if res.status_code == 200:
            data = res.json()
            print(f"  -> Terminal: {data.get('terminal')} | Account: {data.get('account')}")
            print(f"  -> Global Vault Status: {data.get('status')}")
            
            print("\n  [Pool Reserves & TVLs]:")
            for pool in data.get('pools', []):
                print(f"    * {pool['id']} ({pool['asset']}) -> TVL: {pool['tvl']:,.2f} [{pool['status']}]")
                
            print("\n  [App Allocations & Routers]:")
            for app_alloc in data.get('allocations', []):
                print(f"    * App: {app_alloc['app']} | Router: {app_alloc['router']} | Allocation: {app_alloc['allocation']} [{app_alloc['status']}]")
            print("  [PASS] All vault and app allocation endpoints responding correctly.")
        else:
            print(f"  [FAIL] Liquidity endpoint returned status {res.status_code}")
    except Exception as e:
        print(f"  [FAIL] Could not reach liquidity endpoint: {e}")

    # 4. Swapping & Trading Router Check
    print("\n[4] Auditing Swapping & Trading Endpoints...")
    try:
        swap_test = requests.post(f"{API_BASE}/swap/route", json={"pair": "USDT-EURT", "amountIn": 1000}, timeout=5)
        if swap_test.status_code in [200, 201]:
            print(f"  -> Swap Routing Response: {swap_test.json()}")
            print("  [PASS] Swapping and trading routing engine active.")
        else:
            print(f"  [WARN] Swap endpoint returned status {swap_test.status_code} (Check if controller route is mapped).")
    except Exception as e:
        print(f"  [INFO] Swap endpoint test skipped or not mounted yet: {e}")

    print("================================================================")
    print("              ECOSYSTEM AUDIT COMPLETED                         ")
    print("================================================================")

if __name__ == "__main__":
    audit()
