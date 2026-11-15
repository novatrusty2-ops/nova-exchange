#!/bin/bash
set -e

echo "=== Searching for pouchpay-corrected directory ==="
PROJECT_DIR=$(find / -name "pouchpay-corrected" -type d 2>/dev/null | head -n 1)

if [ -z "$PROJECT_DIR" ]; then
    echo "Error: Could not find pouchpay-corrected directory on this server."
    exit 1
fi

echo "Found project directory at: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "=== [1/4] Updating .env with stable RPC URL ==="
if [ -f .env ]; then
    if grep -q "RPC_URL=" .env; then
        sed -i 's|RPC_URL=.*|RPC_URL=https://cloudflare-eth.com|g' .env
    else
        echo "RPC_URL=https://cloudflare-eth.com" >> .env
    fi
else
    echo "PRIVATE_KEY=your_actual_64_character_hex_private_key_here" > .env
    echo "RPC_URL=https://cloudflare-eth.com" >> .env
fi

echo "=== [2/4] Installing Node.js Dependencies ==="
npm install ethers dotenv --save

echo "=== [3/4] Managing PM2 Services ==="
if pm2 list | grep -q "online"; then
    pm2 restart all
else
    pm2 start ecosystem.config.js
fi
pm2 save

echo "=== [4/4] Testing Proxy Routes & Deposit Script ==="
curl -s http://127.0.0.1/alltra/health || echo "Route /alltra/ unreachable"
node deposit-liquidity.js || echo "Note: Update PRIVATE_KEY in .env with your real key when ready."
echo "=== Setup complete! ==="
