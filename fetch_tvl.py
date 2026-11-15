import requests
import json

API_URL = "http://localhost:3000/liquidity"

def fetch_live_tvl():
    try:
        print(f"Fetching live TVL metrics from {API_URL}...")
        response = requests.get(API_URL, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        print("\n================================================================")
        print("          NOVA ECOSYSTEM LIVE TVL & VAULT RESERVES              ")
        print("================================================================")
        print(f"Status   : {data.get('status', 'UNKNOWN')}")
        print(f"Terminal : {data.get('terminal', 'N/A')} | Account: {data.get('account', 'N/A')}")
        print("----------------------------------------------------------------")
        
        pools = data.get('pools', [])
        for pool in pools:
            pool_id = pool.get('id', 'Unknown')
            name = pool.get('name', 'Pool')
            asset = pool.get('asset', 'USD')
            tvl = float(pool.get('tvl', 0.0))
            status = pool.get('status', 'active')
            print(f"Pool ID : {pool_id:<15} | Asset: {asset:<5} | TVL: {tvl:20,.2f} | {status}")
            
        print("================================================================")
                
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to API gateway on port 3000. Ensure your PM2 service is running.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    fetch_live_tvl()
