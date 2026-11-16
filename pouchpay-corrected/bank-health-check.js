const axios = require('axios');

const API_URL = process.env.POUCHPAY_API_URL || 'http://127.0.0.1:3000/api/v1';
const ACCOUNT = '6572';

async function checkBankApi() {
  const timestamp = new Date().toISOString();
  try {
    const response = await axios.get(`${API_URL}/reserves/status`, {
      timeout: 30000,
      proxy: false
    });

    console.log(`[${timestamp}] ✅ PouchPay Backend Reserves: ONLINE (HTTP ${response.status}) | Account ${ACCOUNT} Verified: ${response.data.verified}`);
  } catch (error) {
    console.error(`[${timestamp}] ❌ PouchPay Backend Reserves: UNREACHABLE / ERROR | ${error.message}`);
  }
}

// Run immediately, then every 60 seconds
checkBankApi();
setInterval(checkBankApi, 60000);
