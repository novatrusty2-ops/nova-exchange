#!/bin/bash

LOG_FILE="ecosystem_test_$(date +%Y%m%d_%H%M%S).log"
PORTS=(3001 3002 3003 22016 33001)

echo "=== Starting Ecosystem Status Tests: $(date) ===" | tee "$LOG_FILE"

for port in "${PORTS[@]}"; do
  echo -e "\n----------------------------------------" | tee -a "$LOG_FILE"
  echo "Testing Port $port..." | tee -a "$LOG_FILE"
  echo "----------------------------------------" | tee -a "$LOG_FILE"
  
  # Curl endpoint and pretty-print JSON into log file
  curl -s -X GET http://localhost:$port/api/v1/ecosystem/status \
       -H "Content-Type: application/json" | python3 -m json.tool | tee -a "$LOG_FILE"
done

echo -e "\n=== Tests Completed. Results saved to $LOG_FILE ===" | tee -a "$LOG_FILE"
