#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=================================================="
echo "  Nova Ecosystem & Crypto Automated Check"
echo "=================================================="

HEALTH=$(curl -s -X GET "$BASE_URL/health" | jq -r '.status')
echo "[1/4] Health Status: $HEALTH"

SWAP_STATUS=$(curl -s -X POST "$BASE_URL/vault/swap" \
  -H "Content-Type: application/json" \
  -d '{"sourceCurrency":"USD","targetCurrency":"EUR","amount":1000000,"terminalId":"TRV-TERMINAL-01"}' | jq -r '.status')
echo "[2/4] Vault Swap Status: $SWAP_STATUS"

CHAIN_X=$(curl -s -X POST "$BASE_URL/rpc/nova-x" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq -r '.result')
echo "[3/4] Nova X Chain ID: $CHAIN_X"

CHAIN_PLUS=$(curl -s -X POST "$BASE_URL/rpc/nova-plus" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":2}' | jq -r '.result')
echo "[4/4] Nova Plus Chain ID: $CHAIN_PLUS"

echo "=================================================="
