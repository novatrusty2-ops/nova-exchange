require('dotenv').config();

const requiredKeys = [
    'PRIVATE_KEY',
    'RPC_URL',
    'LIQUIDITY_CHAIN_ID',
    'LIQUIDITY_ROUTER',
    'TOKEN_A_ADDRESS',
    'TOKEN_B_ADDRESS'
];

console.log("=== Environment Variable Verification ===");
let missing = false;

requiredKeys.forEach((key) => {
    if (process.env[key]) {
        // Mask private key for security display
        const val = key === 'PRIVATE_KEY' 
            ? `${process.env[key].substring(0, 6)}...[hidden]` 
            : process.env[key];
        console.log(`[PASS] ${key} = ${val}`);
    } else {
        console.log(`[FAIL] ${key} is missing!`);
        missing = true;
    }
});

console.log("========================================");
if (missing) {
    console.error("Some required environment variables are missing.");
    process.exit(1);
} else {
    console.log("All required environment variables are set!");
}
