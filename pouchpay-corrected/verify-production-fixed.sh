#!/usr/bin/env bash
echo "=== 1. CHECKING PM2 PROCESS STATUS ==="
pm2 list

echo -e "\n=== 2. CHECKING PORT 3000 LISTENER ==="
ss -tulpn | grep 3000

echo -e "\n=== 3. TESTING BASE API ROOT & COMMON HEALTH PATHS ==="
curl -I http://localhost:3000/
curl -I http://localhost:3000/api
curl -I http://localhost:3000/api/health

echo -e "\n=== 4. CHECKING RECENT PM2 LOGS FOR pouchpay-backend ==="
pm2 logs pouchpay-backend --lines 30 --nostream
