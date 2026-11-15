#!/usr/bin/env bash
echo "=== 1. CHECKING PM2 PROCESS STATUS ==="
pm2 list

echo -e "\n=== 2. CHECKING LOCAL BACKEND PROCESS & PORTS ==="
netstat -tulpn | grep LISTEN || ss -tulpn

echo -e "\n=== 3. TESTING LOCAL API HEALTH & 200 OK ENDPOINTS ==="
# Replace 3000 with your actual backend port if different
curl -I http://localhost:3000/health || curl -I http://localhost:5000/health

echo -e "\n=== 4. TESTING ROUTER & LIQUIDITY ENDPOINTS ==="
curl -s http://localhost:3000/api/v1/router/status || echo "Router endpoint check skipped or custom path required."

echo -e "\n=== 5. CHECKING STBL / PRICES / MARKETS API ==="
curl -s http://localhost:3000/api/v1/markets/prices || echo "Markets endpoint check skipped."

echo -e "\n=== 6. CHECKING KYC / SUMSUB INTEGRATION STATUS ==="
curl -s http://localhost:3000/api/v1/kyc/status || echo "KYC endpoint check skipped."

echo -e "\n=== 7. CHECKING RECENT PM2 LOGS FOR ERRORS ==="
pm2 logs pouchpay-corrected --lines 30 --nostream
