#!/bin/bash

# Exit immediately if any command fails
set -e

echo "=== Starting Graceful PM2 Service Restart ==="

# Navigate to your project directory (adjust path as needed)
cd ~/nova-apk-builds/pouchpay-corrected || exit 1

echo "-> Reloading PM2 services gracefully..."
pm2 reload pouchpay-backend --update-env

echo "-> Saving current PM2 process list..."
pm2 save

echo "=== Restart Complete Successfully ==="
pm2 status
