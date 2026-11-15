#!/bin/bash
echo "=================================================="
echo " Nova Ecosystem: Local & Live Production Health Check"
echo "=================================================="

# 1. Test Local Proxy and Backend Routes
for route in pouchpay novaplus novax; do
  proxy_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/$route)
  backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/$route)

  echo "Route: /$route"
  if [ "$proxy_status" -eq 200 ]; then
    echo "  [✓] Nginx Proxy (Port 80):    HTTP $proxy_status (OK)"
  else
    echo "  [✗] Nginx Proxy (Port 80):    HTTP $proxy_status (Error)"
  fi

  if [ "$backend_status" -eq 200 ]; then
    echo "  [✓] Direct Backend (Port 30): HTTP $backend_status (OK)"
  else
    echo "  [✗] Direct Backend (Port 30): HTTP $backend_status (Error)"
  fi
  echo "--------------------------------------------------"
done

echo ""
echo "=================================================="
echo " Testing Live Production Domains"
echo "=================================================="

# 2. Test Live Domains
for domain in nova-x.io novatrustee.digital novabank.uk; do
  domain_status=$(curl -s -o /dev/null -w "%{http_code}" -L https://$domain)
  echo "Domain: https://$domain"
  if [ "$domain_status" -eq 200 ]; then
    echo "  [✓] Live Status: HTTP $domain_status (OK)"
  else
    echo "  [✗] Live Status: HTTP $domain_status (Check Cloudflare/DNS/Firewall)"
  fi
  echo "--------------------------------------------------"
done
