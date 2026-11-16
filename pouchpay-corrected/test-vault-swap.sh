#!/bin/bash

ENDPOINT="http://localhost:3000/vault/swap"

echo "=========================================="
echo "Executing Vault Liquidity Swap Test..."
echo "=========================================="

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCurrency": "USD",
    "targetCurrency": "EUR",
    "amount": 1000000,
    "terminalId": "TRV-TERMINAL-01"
  }' | json_pp

echo -e "\n=========================================="
echo "Test Complete."
