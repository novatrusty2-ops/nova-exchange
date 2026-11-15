#!/bin/bash

ENDPOINT="http://localhost:3000/alltra/health"
DIR="/home/art-city/nova-apk-builds/pouchpay-corrected"
LOG_FILE="$DIR/alltra-monitor.log"
STATE_FILE="$DIR/alltra-outage.state"

# Replace with your actual Discord or Telegram Webhook URL
DISCORD_WEBHOOK_URL="YOUR_DISCORD_WEBHOOK_URL_HERE"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Perform curl request and capture HTTP status code
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT")

# Helper function to send webhooks
send_webhook() {
    local message="$1"
    if [ -n "$DISCORD_WEBHOOK_URL" ] && [ "$DISCORD_WEBHOOK_URL" != "YOUR_DISCORD_WEBHOOK_URL_HERE" ]; then
        curl -s -H "Content-Type: application/json" \
             -X POST \
             -d "{\"content\": \"$message\"}" \
             "$DISCORD_WEBHOOK_URL" > /dev/null
    fi
}

if [ "$HTTP_STATUS" -eq 200 ]; then
    # If a state file exists, it means we just recovered from an outage!
    if [ -f "$STATE_FILE" ]; then
        MESSAGE="[$TIMESTAMP] RECOVERY: PouchPay Alltra service has been restored (HTTP 200)."
        echo "$MESSAGE" >> "$LOG_FILE"
        send_webhook "🟢 **PouchPay Recovery Notice**: $MESSAGE"
        rm -f "$STATE_FILE" # Clear the outage state
    else
        echo "[$TIMESTAMP] SUCCESS: Alltra health check passed (HTTP 200)" >> "$LOG_FILE"
    fi
else
    # If state file does NOT exist, this is a new outage
    if [ ! -f "$STATE_FILE" ]; then
        touch "$STATE_FILE" # Create state file to mark ongoing outage
        MESSAGE="[$TIMESTAMP] ALERT: PouchPay Alltra health check failed with HTTP status $HTTP_STATUS!"
        echo "$MESSAGE" >> "$LOG_FILE"
        send_webhook "🚨 **PouchPay Monitoring Alert**: $MESSAGE"
    else
        # Outage is ongoing, just log it quietly without re-alerting
        echo "[$TIMESTAMP] ONGOING OUTAGE: HTTP status $HTTP_STATUS" >> "$LOG_FILE"
    fi
fi
